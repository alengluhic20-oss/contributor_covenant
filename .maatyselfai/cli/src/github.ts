import { Octokit } from '@octokit/rest';

export interface PullRequest {
  number: number;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  user: {
    login: string;
  } | null;
  additions: number;
  deletions: number;
  changed_files: number;
}

export async function fetchPullRequests(
  octokit: Octokit,
  owner: string,
  repo: string,
  maxPRs: number = 20
): Promise<PullRequest[]> {
  try {
    const { data } = await octokit.pulls.list({
      owner,
      repo,
      state: 'all',
      per_page: 100,
      sort: 'updated',
      direction: 'desc'
    });

    const detailedPRs = await Promise.all(
      data.slice(0, maxPRs).map(async (pr) => {
        try {
          const { data: details } = await octokit.pulls.get({
            owner,
            repo,
            pull_number: pr.number
          });

          return {
            number: details.number,
            title: details.title,
            state: details.state,
            created_at: details.created_at,
            updated_at: details.updated_at,
            merged_at: details.merged_at,
            user: details.user,
            additions: details.additions || 0,
            deletions: details.deletions || 0,
            changed_files: details.changed_files || 0
          };
        } catch (error) {
          console.warn(`Warning: Could not fetch details for PR #${pr.number}`);
          return {
            number: pr.number,
            title: pr.title,
            state: pr.state,
            created_at: pr.created_at,
            updated_at: pr.updated_at,
            merged_at: pr.merged_at,
            user: pr.user,
            additions: 0,
            deletions: 0,
            changed_files: 0
          };
        }
      })
    );

    return detailedPRs;
  } catch (error) {
    console.error('Error fetching pull requests:', error);
    return [];
  }
}

export async function fetchReviews(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number
): Promise<number> {
  try {
    const { data } = await octokit.pulls.listReviews({
      owner,
      repo,
      pull_number: prNumber
    });
    return data.length;
  } catch (error) {
    return 0;
  }
}

export async function fetchComments(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number
): Promise<number> {
  try {
    const [reviews, issueComments] = await Promise.all([
      octokit.pulls.listReviewComments({
        owner,
        repo,
        pull_number: prNumber
      }),
      octokit.issues.listComments({
        owner,
        repo,
        issue_number: prNumber
      })
    ]);

    return reviews.data.length + issueComments.data.length;
  } catch (error) {
    return 0;
  }
}

export async function fetchCommits(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number
): Promise<number> {
  try {
    const { data } = await octokit.pulls.listCommits({
      owner,
      repo,
      pull_number: prNumber
    });
    return data.length;
  } catch (error) {
    return 0;
  }
}

export async function fetchCheckRuns(
  octokit: Octokit,
  owner: string,
  repo: string,
  ref: string
): Promise<{ total: number; successful: number }> {
  try {
    const { data } = await octokit.checks.listForRef({
      owner,
      repo,
      ref
    });

    const total = data.total_count;
    const successful = data.check_runs.filter(
      run => run.conclusion === 'success'
    ).length;

    return { total, successful };
  } catch (error) {
    return { total: 0, successful: 0 };
  }
}
