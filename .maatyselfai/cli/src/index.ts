#!/usr/bin/env node

import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { computeMetrics } from './metrics';
import { fetchPullRequests } from './github';
import { validateTrajectory } from './validator';

interface Config {
  metrics: Record<string, { weight: number; description: string }>;
  thresholds: {
    stable: number;
    unstable: number;
    critical: number;
  };
}

interface Trajectory {
  version: string;
  timestamp: string;
  repository: {
    owner: string;
    name: string;
    full_name: string;
  };
  trajectories: any[];
  summary?: {
    total_prs: number;
    stable_count: number;
    unstable_count: number;
    critical_count: number;
    in_flight_count: number;
    average_score: number;
  };
}

async function loadConfig(): Promise<Config> {
  const configPath = path.join(process.cwd(), '.maatyselfai', 'lyapunov.yml');
  const configFile = fs.readFileSync(configPath, 'utf8');
  return yaml.load(configFile) as Config;
}

async function computeTrajectories(): Promise<void> {
  console.log('🔍 MA\'AT Lyapunov PR Trajectory Computation');
  console.log('==========================================\n');

  // Load configuration
  const config = await loadConfig();
  console.log('✓ Configuration loaded');

  // Get repository info from environment or fail with error
  const repoOwner = process.env.GITHUB_REPOSITORY_OWNER;
  const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
  
  if (!repoOwner || !repoName) {
    console.error('❌ GITHUB_REPOSITORY_OWNER and GITHUB_REPOSITORY must be set');
    console.error('   Example: GITHUB_REPOSITORY=owner/repo GITHUB_REPOSITORY_OWNER=owner');
    process.exit(1);
  }
  
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    console.warn('⚠ GITHUB_TOKEN not set, using public API (rate limited)');
  }

  // Initialize GitHub client
  const octokit = new Octokit({ auth: token });
  console.log(`✓ GitHub client initialized for ${repoOwner}/${repoName}`);

  // Fetch pull requests (limit configurable via environment)
  const maxPRs = parseInt(process.env.MAX_PRS || '20', 10);
  const pullRequests = await fetchPullRequests(octokit, repoOwner, repoName, maxPRs);
  console.log(`✓ Fetched ${pullRequests.length} pull requests`);

  // Compute metrics and trajectories
  const trajectories = [];
  let stableCount = 0;
  let unstableCount = 0;
  let criticalCount = 0;
  let inFlightCount = 0;
  let totalScore = 0;

  for (const pr of pullRequests) {
    const metrics = await computeMetrics(octokit, repoOwner, repoName, pr, config);
    const score = metrics.score;
    
    let state: string;
    if (pr.merged_at) {
      state = 'merged';
    } else if (pr.state === 'closed') {
      state = 'closed';
    } else if (score === null) {
      state = 'in_flight';
      inFlightCount++;
    } else if (score >= config.thresholds.stable) {
      state = 'stable';
      stableCount++;
    } else if (score >= config.thresholds.unstable) {
      state = 'unstable';
      unstableCount++;
    } else {
      state = 'critical';
      criticalCount++;
    }

    if (score !== null) {
      totalScore += score;
    }

    trajectories.push({
      pr_number: pr.number,
      title: pr.title,
      state,
      created_at: pr.created_at,
      updated_at: pr.updated_at,
      author: pr.user?.login || 'unknown',
      points: [{
        timestamp: new Date().toISOString(),
        score: score || 0,
        metrics: metrics.details,
        velocity: { x: 0, y: 0 }
      }],
      current_score: score || 0,
      trend: 'stable'
    });
  }

  const validPRsCount = pullRequests.filter(pr => !pr.merged_at && pr.state !== 'closed').length;
  const averageScore = validPRsCount > 0 ? totalScore / validPRsCount : 0;

  // Build output
  const output: Trajectory = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    repository: {
      owner: repoOwner,
      name: repoName,
      full_name: `${repoOwner}/${repoName}`
    },
    trajectories,
    summary: {
      total_prs: pullRequests.length,
      stable_count: stableCount,
      unstable_count: unstableCount,
      critical_count: criticalCount,
      in_flight_count: inFlightCount,
      average_score: averageScore
    }
  };

  console.log(`\n📊 Summary:`);
  console.log(`   Total PRs: ${output.summary?.total_prs || 0}`);
  console.log(`   Stable: ${stableCount}`);
  console.log(`   Unstable: ${unstableCount}`);
  console.log(`   Critical: ${criticalCount}`);
  console.log(`   In-flight: ${inFlightCount}`);
  console.log(`   Average Score: ${averageScore.toFixed(3)}`);

  // Validate output
  const validation = validateTrajectory(output);
  if (!validation.valid) {
    console.error('\n❌ Validation failed:', validation.errors);
    process.exit(1);
  }
  console.log('✓ Output validated');

  // Write output
  const outputDir = path.join(process.cwd(), 'docs', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputPath = path.join(outputDir, 'trajectories.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`✓ Trajectories written to ${outputPath}`);

  console.log('\n✅ Computation complete!');
}

async function validateCommand(): Promise<void> {
  console.log('🔍 Validating trajectory data...\n');

  const dataPath = path.join(process.cwd(), 'docs', 'data', 'trajectories.json');
  
  if (!fs.existsSync(dataPath)) {
    console.error('❌ No trajectory data found at', dataPath);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const validation = validateTrajectory(data);

  if (validation.valid) {
    console.log('✅ Trajectory data is valid!');
  } else {
    console.error('❌ Validation errors:', validation.errors);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const command = process.argv[2] || 'compute';

  try {
    switch (command) {
      case 'compute':
        await computeTrajectories();
        break;
      case 'validate':
        await validateCommand();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.log('Usage: maatyselfai [compute|validate]');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
