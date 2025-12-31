import { Octokit } from '@octokit/rest';
import { PullRequest, fetchReviews, fetchComments, fetchCommits, fetchCheckRuns } from './github';

// Constants for metric calculations
const NEUTRAL_SCORE = 0.5;
const DEFAULT_METRIC_VALUE = 0.5;
const MAX_CHURN_LINES = 500; // Lines of code change considered high churn
const MAX_CONFLICT_FILES = 20; // Number of files where conflict probability reaches max

interface Config {
  metrics: Record<string, { weight: number; description: string }>;
  thresholds: {
    stable: number;
    unstable: number;
    critical: number;
  };
}

interface MetricDetails {
  code_churn: number;
  review_engagement: number;
  conversation_sentiment: number;
  test_coverage: number;
  ci_stability: number;
  merge_conflicts: number;
}

interface MetricResult {
  score: number | null;
  details: MetricDetails;
}

function normalize(value: number, min: number = 0, max: number = 1): number {
  if (max === min) return 0;
  const normalized = (value - min) / (max - min);
  return Math.max(0, Math.min(1, normalized));
}

function calculateCodeChurn(pr: PullRequest): number {
  const totalChanges = pr.additions + pr.deletions;
  if (totalChanges === 0) return 0;
  
  // Lower churn is better (more stable)
  // Normalize: smaller changes relative to size = better
  const churnRatio = Math.min(totalChanges / MAX_CHURN_LINES, 1);
  return 1 - churnRatio;
}

function calculateReviewEngagement(reviewCount: number, commentCount: number): number {
  // More engagement is better
  // Expected baseline: 1 review, 2 comments
  const expectedReviews = 1;
  const expectedComments = 2;
  
  const reviewScore = Math.min(reviewCount / expectedReviews, 1) * 0.6;
  const commentScore = Math.min(commentCount / expectedComments, 1) * 0.4;
  
  return reviewScore + commentScore;
}

function calculateSentiment(commentCount: number): number {
  // Simple heuristic: more comments generally indicates engagement
  // This is a placeholder for actual sentiment analysis
  if (commentCount === 0) return NEUTRAL_SCORE; // Neutral
  if (commentCount < 3) return 0.6; // Slight positive
  if (commentCount < 10) return 0.7; // Positive
  return 0.8; // Very positive
}

function calculateTestCoverage(pr: PullRequest): number {
  // Heuristic: if changed_files includes test files, assume coverage maintained
  // This is a placeholder for actual coverage analysis
  if (pr.changed_files === 0) return NEUTRAL_SCORE;
  
  // Assume some test files present based on file count
  const estimatedTestFiles = Math.floor(pr.changed_files * 0.3);
  return normalize(estimatedTestFiles, 0, Math.max(pr.changed_files * 0.5, 1));
}

function calculateCIStability(checkRuns: { total: number; successful: number }): number {
  if (checkRuns.total === 0) return NEUTRAL_SCORE; // No CI, neutral
  return checkRuns.successful / checkRuns.total;
}

function calculateMergeConflicts(pr: PullRequest): number {
  // Heuristic: PRs with many changed files more likely to have conflicts
  // This is a placeholder for actual conflict detection
  if (pr.state === 'closed' || pr.merged_at) return 1; // No conflicts
  
  const conflictProbability = Math.min(pr.changed_files / MAX_CONFLICT_FILES, 1);
  return 1 - (conflictProbability * 0.3); // Assume 30% max conflict impact
}

export async function computeMetrics(
  octokit: Octokit,
  owner: string,
  repo: string,
  pr: PullRequest,
  config: Config
): Promise<MetricResult> {
  try {
    // Fetch additional data
    const [reviewCount, commentCount, commitCount, checkRuns] = await Promise.all([
      fetchReviews(octokit, owner, repo, pr.number),
      fetchComments(octokit, owner, repo, pr.number),
      fetchCommits(octokit, owner, repo, pr.number),
      pr.state === 'open' 
        ? fetchCheckRuns(octokit, owner, repo, `pull/${pr.number}/head`)
        : Promise.resolve({ total: 0, successful: 0 })
    ]);

    // Calculate individual metrics
    const codeChurn = calculateCodeChurn(pr);
    const reviewEngagement = calculateReviewEngagement(reviewCount, commentCount);
    const conversationSentiment = calculateSentiment(commentCount);
    const testCoverage = calculateTestCoverage(pr);
    const ciStability = calculateCIStability(checkRuns);
    const mergeConflicts = calculateMergeConflicts(pr);

    const details: MetricDetails = {
      code_churn: codeChurn,
      review_engagement: reviewEngagement,
      conversation_sentiment: conversationSentiment,
      test_coverage: testCoverage,
      ci_stability: ciStability,
      merge_conflicts: mergeConflicts
    };

    // Calculate weighted score
    if (pr.state === 'closed' || pr.merged_at) {
      return { score: null, details };
    }

    const weights = config.metrics;
    const score =
      codeChurn * weights.code_churn.weight +
      reviewEngagement * weights.review_engagement.weight +
      conversationSentiment * weights.conversation_sentiment.weight +
      testCoverage * weights.test_coverage.weight +
      ciStability * weights.ci_stability.weight +
      mergeConflicts * weights.merge_conflicts.weight;

    return { score, details };
  } catch (error) {
    console.error(`Error computing metrics for PR #${pr.number}:`, error);
    
    // Return default metrics on error
    const defaultDetails: MetricDetails = {
      code_churn: DEFAULT_METRIC_VALUE,
      review_engagement: DEFAULT_METRIC_VALUE,
      conversation_sentiment: DEFAULT_METRIC_VALUE,
      test_coverage: DEFAULT_METRIC_VALUE,
      ci_stability: DEFAULT_METRIC_VALUE,
      merge_conflicts: DEFAULT_METRIC_VALUE
    };
    
    return { score: null, details: defaultDetails };
  }
}
