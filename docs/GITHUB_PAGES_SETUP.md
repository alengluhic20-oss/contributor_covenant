# GitHub Pages Setup for MA'AT Visualizer

This guide explains how to set up GitHub Pages to host the MA'AT Lyapunov PR Visualizer.

## Prerequisites

- Repository with GitHub Actions enabled
- Write access to the repository
- GitHub Pages enabled on the repository

## Setup Steps

### 1. Create the `gh-pages` Branch

The workflow automatically updates trajectory data on the `gh-pages` branch. You need to create this branch first:

```bash
# From your local repository
git checkout --orphan gh-pages
git rm -rf .
echo "# MA'AT Visualizer Data" > README.md
git add README.md
git commit -m "Initialize gh-pages branch"
git push origin gh-pages
```

### 2. Copy Visualizer Files to `gh-pages`

After creating the `gh-pages` branch, copy the visualizer files:

```bash
# Still on gh-pages branch
git checkout main -- docs/
git commit -m "Add visualizer files"
git push origin gh-pages
```

### 3. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select:
   - **Branch**: `gh-pages`
   - **Folder**: `/` (root)
4. Click **Save**

GitHub will build and deploy your site within a few minutes.

### 4. Access the Visualizer

Once deployed, your visualizer will be available at:

```
https://<username>.github.io/<repository>/visualizer/
```

For example:
```
https://alengluhic20-oss.github.io/contributor_covenant/visualizer/
```

## Workflow Behavior

The GitHub Actions workflow (`.github/workflows/maatyselfai-trajectory.yml`) automatically:

1. Runs on PR events (opened, synchronized, closed, etc.)
2. Checks out the `gh-pages` branch
3. Copies the latest CLI and configuration from the main branch
4. Computes trajectory data
5. Commits updated `trajectories.json` to the `gh-pages` branch
6. Uploads trajectory data as an artifact (retained for 30 days)

## Verifying Setup

### Check Workflow Runs

1. Go to **Actions** tab in your repository
2. Look for "MA'AT Lyapunov Trajectory Computation" workflows
3. Check that they complete successfully
4. Download artifacts to verify trajectory data

### Test Locally

Before deploying, you can test the visualizer locally:

```bash
cd docs
python3 -m http.server 8000
# Open http://localhost:8000/visualizer/ in your browser
```

### Check Data Updates

1. Navigate to the `gh-pages` branch on GitHub
2. Check `docs/data/trajectories.json` for recent commits
3. Verify the timestamp in the JSON file is recent

## Customization

### Update Configuration

Edit `.maatyselfai/lyapunov.yml` to adjust:
- Metric weights
- Stability thresholds
- Visualization colors

Changes to the configuration require following the governance process outlined in `.maatyselfai/constitution.md`.

### Modify Visualizer

To update the visualizer interface:

1. Edit files in `docs/visualizer/`:
   - `index.html` - Structure
   - `styles.css` - Styling
   - `lyapunov.js` - Logic

2. Commit changes to the main branch

3. Merge to `gh-pages`:
   ```bash
   git checkout gh-pages
   git checkout main -- docs/visualizer/
   git commit -m "Update visualizer"
   git push origin gh-pages
   ```

## Troubleshooting

### Workflow Fails

**Symptom**: GitHub Actions workflow fails to run

**Solutions**:
- Verify `gh-pages` branch exists
- Check workflow permissions in Settings → Actions → General
- Ensure "Read and write permissions" is enabled for workflows

### No Data Displayed

**Symptom**: Visualizer shows "Loading..." indefinitely

**Solutions**:
- Check browser console for errors (F12)
- Verify `docs/data/trajectories.json` exists on `gh-pages` branch
- Ensure JSON file is valid (run `npm run validate` in CLI)
- Check that GitHub Pages is serving files correctly

### Old Data Displayed

**Symptom**: Visualizer shows outdated trajectory data

**Solutions**:
- Check recent workflow runs completed successfully
- Verify commits to `gh-pages` branch show recent timestamps
- Clear browser cache and refresh
- Check the "Last Updated" timestamp in the visualizer footer

### Rate Limiting

**Symptom**: Workflow fails with "rate limit exceeded" error

**Solutions**:
- The workflow uses `GITHUB_TOKEN` by default
- For private repos or high-frequency updates, create a personal access token:
  1. Go to Settings → Developer settings → Personal access tokens
  2. Generate token with `repo` and `workflow` scopes
  3. Add as repository secret named `GITHUB_TOKEN`

## Manual Deployment

If you need to manually update trajectory data:

```bash
# From the repository root
cd .maatyselfai/cli
npm install
npm run compute

# Commit to gh-pages
git checkout gh-pages
cp ../../docs/data/trajectories.json docs/data/
git add docs/data/trajectories.json
git commit -m "Manual trajectory update"
git push origin gh-pages
```

## Security Considerations

### Data Privacy

The trajectory data includes:
- PR numbers and titles
- Computed metrics (normalized scores)
- Repository metadata

It does NOT include:
- Code content or diffs
- Personal contact information
- Private repository data
- Detailed review comments

### Access Control

- The `gh-pages` branch is public by default
- All trajectory data is publicly accessible
- Ensure your repository's visibility settings match your needs

## Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [MA'AT System README](.maatyselfai/README.md)
- [Constitutional Governance](.maatyselfai/constitution.md)

## Support

For issues or questions:
1. Check existing GitHub Issues
2. Review the troubleshooting section above
3. Open a new issue with the `maatyselfai` label
4. Include workflow logs and error messages
