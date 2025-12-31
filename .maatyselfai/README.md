# MA'AT Lyapunov PR Visualizer

## Overview

The MA'AT Lyapunov PR Visualizer is a governance and visualization system that provides insights into Pull Request (PR) convergence dynamics. It computes trajectory metrics for PRs and visualizes their stability state based on constitutional governance principles.

## Features

- **Automated Metrics Computation**: Analyzes PRs using 6 key metrics:
  - Code Churn
  - Review Engagement
  - Conversation Sentiment
  - Test Coverage
  - CI Stability
  - Merge Conflicts

- **Stability Classification**: PRs are classified into:
  - **Stable** (≥0.7): Ready for merge
  - **Unstable** (0.4-0.7): Needs attention
  - **Critical** (<0.4): Requires immediate intervention
  - **In-Flight**: Newly opened, insufficient data

- **Visual Dashboard**: Interactive web-based visualizer with:
  - Real-time PR trajectory display
  - Lyapunov field visualization
  - Detailed metrics breakdown
  - Summary statistics

- **GitHub Actions Integration**: Automated trajectory computation on PR events

## Directory Structure

```
.maatyselfai/
├── lyapunov.yml              # Configuration file
├── constitution.md           # Governance principles
├── trajectory-schema.json    # JSON schema for validation
└── cli/                      # CLI tool
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── index.ts         # Main entry point
        ├── metrics.ts       # Metrics computation
        ├── github.ts        # GitHub API integration
        └── validator.ts     # Schema validation

.github/
└── workflows/
    └── maatyselfai-trajectory.yml  # GitHub Actions workflow

docs/
├── visualizer/
│   ├── index.html           # Visualizer interface
│   ├── lyapunov.js          # Rendering logic
│   └── styles.css           # UI styling
└── data/
    └── trajectories.json    # Generated trajectory data
```

## Setup

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- GitHub repository with Actions enabled

### Installation

1. The CLI dependencies are managed automatically by GitHub Actions
2. For local development:

```bash
cd .maatyselfai/cli
npm install
npm run build
```

### Configuration

Edit `.maatyselfai/lyapunov.yml` to adjust:
- Metric weights
- Stability thresholds
- Visualization settings

See `.maatyselfai/constitution.md` for governance process on changing these values.

## Usage

### Manual Computation

Run locally to compute trajectories:

```bash
cd .maatyselfai/cli
npm run compute
```

This will:
1. Fetch PR data from GitHub
2. Compute metrics for each PR
3. Generate `docs/data/trajectories.json`
4. Validate output against schema

### Validate Trajectory Data

```bash
cd .maatyselfai/cli
npm run validate
```

### View Visualizer

Open `docs/visualizer/index.html` in a web browser, or deploy to GitHub Pages:

1. Enable GitHub Pages on the repository
2. Set source to `gh-pages` branch
3. Access at: `https://<owner>.github.io/<repo>/visualizer/`

### GitHub Actions

The workflow runs automatically on:
- Pull request opened, synchronized, reopened, or closed
- Pull request review submitted, edited, or dismissed
- Pull request review comment created, edited, or deleted
- Manual workflow dispatch

Trajectories are stored on the `gh-pages` branch and available as artifacts.

## Metrics Explanation

### Code Churn (Weight: 0.15)
Measures the ratio of changed lines to total PR size. Lower churn indicates more stable changes.

### Review Engagement (Weight: 0.25)
Evaluates the depth of review interactions. More reviews and comments indicate better scrutiny.

### Conversation Sentiment (Weight: 0.20)
Analyzes the tone of PR discussions. Positive, constructive feedback improves convergence.

### Test Coverage (Weight: 0.15)
Assesses the impact on test coverage. PRs maintaining or improving coverage are more stable.

### CI Stability (Weight: 0.15)
Tracks CI/CD pipeline success rate. Consistent green builds indicate stability.

### Merge Conflicts (Weight: 0.10)
Identifies presence and severity of merge conflicts. Fewer conflicts indicate better synchronization.

## Governance

The system operates under constitutional governance defined in `.maatyselfai/constitution.md`.

### Core Principles
1. **Transparency**: All metrics are publicly visible
2. **Fairness**: Uniform application to all contributions
3. **Continuous Improvement**: Learning from historical data
4. **Community-Driven**: Adjustable through consensus

### Modifying Metrics

To propose changes to metric weights or thresholds:

1. Open a GitHub issue with label `governance:metrics` or `governance:thresholds`
2. Follow the discussion and approval process outlined in the constitution
3. Update `.maatyselfai/lyapunov.yml` after approval

## Development

### Building the CLI

```bash
cd .maatyselfai/cli
npm run build
```

### Running Tests

Currently, the system focuses on schema validation. To validate:

```bash
npm run validate
```

### Extending Metrics

To add new metrics:

1. Update `lyapunov.yml` with new metric definition
2. Add computation logic in `cli/src/metrics.ts`
3. Update schema in `trajectory-schema.json`
4. Update visualizer if needed
5. Document in `constitution.md`

## Troubleshooting

### CLI fails to fetch PRs
- Ensure `GITHUB_TOKEN` is set with appropriate permissions
- Check repository access (public vs private)

### Visualizer shows no data
- Verify `docs/data/trajectories.json` exists
- Check browser console for errors
- Ensure JSON is valid (run `npm run validate`)

### GitHub Actions workflow fails
- Check workflow logs in Actions tab
- Verify `gh-pages` branch exists
- Ensure workflow has write permissions

## License

This implementation follows the same license as the Contributor Covenant project.

## Version

Current Version: 1.0
Last Updated: 2025-12-31
