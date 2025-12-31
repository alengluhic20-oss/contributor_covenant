# MA'AT Constitutional Governance

## Preamble

This constitution defines the governance principles and metrics for evaluating Pull Request (PR) convergence dynamics within the repository. The MA'AT system provides visibility into the stability and health of contributions through Lyapunov trajectory analysis.

## Core Principles

### 1. Transparency
All PR metrics and trajectories shall be computed transparently and made available for public inspection through the visualizer interface.

### 2. Fairness
Metrics shall be applied uniformly to all contributions, regardless of contributor status or affiliation.

### 3. Continuous Improvement
The system shall learn from historical data to improve prediction accuracy and provide actionable insights.

### 4. Community-Driven
Metric weights and thresholds may be adjusted through community consensus via governance proposals.

## Metric Definitions

### Code Churn (Weight: 0.15)
Measures the ratio of changed lines to total PR size. Higher churn may indicate unstable or exploratory changes.

**Formula**: `code_churn = lines_changed / (lines_added + lines_deleted + 1)`

### Review Engagement (Weight: 0.25)
Evaluates the depth and quality of review interactions. More engaged reviews correlate with better code quality.

**Formula**: `review_engagement = (review_comments * 0.4 + approvals * 0.6) / expected_reviews`

### Conversation Sentiment (Weight: 0.20)
Analyzes the tone and sentiment of PR discussions. Positive, constructive feedback improves convergence.

**Formula**: `sentiment_score = (positive_comments - negative_comments) / total_comments`

### Test Coverage (Weight: 0.15)
Assesses the impact of the PR on test coverage. PRs that maintain or improve coverage are more stable.

**Formula**: `coverage_delta = (new_coverage - base_coverage) / 100`

### CI Stability (Weight: 0.15)
Tracks the consistency of CI/CD pipeline results. Flaky or failing tests indicate instability.

**Formula**: `ci_stability = successful_runs / total_runs`

### Merge Conflicts (Weight: 0.10)
Identifies the presence and severity of merge conflicts. Conflicts indicate divergence from the base branch.

**Formula**: `conflict_score = 1 - (conflicted_files / total_files)`

## Stability Classifications

### Stable (Score ≥ 0.7)
PRs in this category are ready for merge. They demonstrate:
- Strong review engagement
- Positive sentiment
- Passing CI checks
- Minimal conflicts

### Unstable (0.4 ≤ Score < 0.7)
PRs requiring attention. May need:
- Additional reviews
- Test improvements
- Conflict resolution
- Discussion clarification

### Critical (Score < 0.4)
PRs requiring immediate intervention. Likely issues:
- Failing tests
- Poor review engagement
- High conflict rate
- Negative sentiment

### In-Flight (No Score)
Newly opened PRs without sufficient data for scoring.

## Governance Process

### Metric Weight Adjustments
1. Proposals must be submitted via GitHub issue with the label `governance:metrics`
2. Discussion period: 14 days minimum
3. Approval requires: 
   - 2/3 majority vote from core maintainers
   - No vetoes from project leadership
4. Changes take effect after next release

### Threshold Modifications
1. Proposals via GitHub issue with label `governance:thresholds`
2. Discussion period: 7 days minimum
3. Approval requires simple majority from core maintainers
4. Changes take effect immediately upon approval

## Data Privacy

### Collected Data
- PR metadata (number, title, state)
- Review comments count (not content)
- CI status results
- Commit timestamps and counts

### Not Collected
- Personal identifiable information
- Private repository data
- Email addresses or contact info
- Code content or diffs

## Amendments

This constitution may be amended through the governance process outlined above. All amendments must maintain the core principles of transparency, fairness, continuous improvement, and community-driven decision making.

---

**Version**: 1.0  
**Effective Date**: 2025-01-01  
**Last Updated**: 2025-12-31
