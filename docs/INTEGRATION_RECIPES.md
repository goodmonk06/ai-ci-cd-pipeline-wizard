# Integration Recipes

This document provides practical examples of integrating the AI CI/CD Pipeline Wizard with other services and systems.

## Table of Contents

1. [Authentication Integration](#authentication-integration)
2. [Notification Services](#notification-services)
3. [Cloud Storage](#cloud-storage)
4. [GitHub Integration](#github-integration)
5. [Monitoring & Observability](#monitoring--observability)
6. [Custom Generators](#custom-generators)

---

## Authentication Integration

### JWT-based Authentication

```typescript
// backend/lib/auth.ts
import jwt from 'jsonwebtoken';
import { FastifyRequest } from 'fastify';

export async function authenticateRequest(request: FastifyRequest) {
  const token = request.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    throw new Error('No token provided');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!);
  return decoded;
}

// In routes:
server.addHook('onRequest', async (request) => {
  const user = await authenticateRequest(request);
  (request as any).user = user;
});
```

### OAuth with GitHub

```typescript
// backend/routes/auth.ts
server.get('/auth/github/callback', async (request, reply) => {
  const { code } = request.query as { code: string };

  // Exchange code for access token
  const tokenResponse = await fetch(
    'https://github.com/login/oauth/access_token',
    {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    }
  );

  const { access_token } = await tokenResponse.json();

  // Get user info
  const userResponse = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const user = await userResponse.json();

  // Create session token
  const sessionToken = jwt.sign({ githubId: user.id }, process.env.JWT_SECRET!);

  return { token: sessionToken, user };
});
```

---

## Notification Services

### Slack Notifications

```typescript
// backend/lib/adapters/slack-notification.adapter.ts
import { INotificationAdapter, NotificationPayload } from './notification.adapter';

export class SlackNotificationAdapter implements INotificationAdapter {
  constructor(private webhookUrl: string) {}

  async send(payload: NotificationPayload): Promise<void> {
    const color = {
      info: '#36a64f',
      warning: '#ffaa00',
      error: '#ff0000',
      success: '#00ff00',
    }[payload.level];

    await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [
          {
            color,
            title: payload.title,
            text: payload.message,
            fields: payload.metadata
              ? Object.entries(payload.metadata).map(([key, value]) => ({
                  title: key,
                  value: String(value),
                  short: true,
                }))
              : [],
          },
        ],
      }),
    });
  }

  async sendToUser(userId: string, payload: NotificationPayload): Promise<void> {
    // Slack requires user ID to DM mapping
    // This is simplified - in reality you'd need to map user IDs
    await this.send(payload);
  }
}

// Usage:
// export const notificationAdapter = new SlackNotificationAdapter(process.env.SLACK_WEBHOOK_URL!);
```

### Email Notifications (SendGrid)

```typescript
// backend/lib/adapters/email-notification.adapter.ts
import sgMail from '@sendgrid/mail';

export class EmailNotificationAdapter implements INotificationAdapter {
  constructor(apiKey: string, fromEmail: string) {
    sgMail.setApiKey(apiKey);
    this.fromEmail = fromEmail;
  }

  private fromEmail: string;
  private userEmails = new Map<string, string>(); // userId -> email mapping

  async send(payload: NotificationPayload): Promise<void> {
    // Broadcast notifications would need a list of recipients
    console.log('Broadcast email not implemented');
  }

  async sendToUser(userId: string, payload: NotificationPayload): Promise<void> {
    const email = this.userEmails.get(userId);
    if (!email) {
      console.warn(`No email found for user ${userId}`);
      return;
    }

    const msg = {
      to: email,
      from: this.fromEmail,
      subject: payload.title,
      text: payload.message,
      html: `<strong>${payload.title}</strong><p>${payload.message}</p>`,
    };

    await sgMail.send(msg);
  }
}
```

---

## Cloud Storage

### AWS S3 Storage Adapter

```typescript
// backend/lib/adapters/s3-storage.adapter.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { IStorageAdapter } from './storage.adapter';

export class S3StorageAdapter implements IStorageAdapter {
  private client: S3Client;

  constructor(
    private bucket: string,
    region: string = 'us-east-1'
  ) {
    this.client = new S3Client({ region });
  }

  async save(key: string, content: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: content,
        ContentType: 'text/plain',
      })
    );
  }

  async read(key: string): Promise<string> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );

    return await response.Body!.transformToString();
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
      return true;
    } catch {
      return false;
    }
  }

  async delete(key: string): Promise<void> {
    // Implementation
  }

  async list(prefix: string): Promise<string[]> {
    // Implementation
  }
}
```

---

## GitHub Integration

### Create PR with Generated Configs

```typescript
// backend/services/github-integration.ts
import { Octokit } from '@octokit/rest';

export class GitHubIntegration {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  async createPRWithConfigs(
    owner: string,
    repo: string,
    files: Array<{ path: string; content: string }>,
    branchName: string = `cicd-wizard-${Date.now()}`
  ) {
    // Get default branch
    const { data: repository } = await this.octokit.repos.get({ owner, repo });
    const defaultBranch = repository.default_branch;

    // Get latest commit SHA
    const { data: ref } = await this.octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${defaultBranch}`,
    });
    const latestCommitSha = ref.object.sha;

    // Create new branch
    await this.octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: latestCommitSha,
    });

    // Create blobs and tree entries for each file
    const tree = await Promise.all(
      files.map(async (file) => {
        const { data: blob } = await this.octokit.git.createBlob({
          owner,
          repo,
          content: Buffer.from(file.content).toString('base64'),
          encoding: 'base64',
        });

        return {
          path: file.path,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: blob.sha,
        };
      })
    );

    // Create tree
    const { data: newTree } = await this.octokit.git.createTree({
      owner,
      repo,
      tree,
      base_tree: latestCommitSha,
    });

    // Create commit
    const { data: newCommit } = await this.octokit.git.createCommit({
      owner,
      repo,
      message: 'Add CI/CD pipeline configurations\n\nGenerated by AI CI/CD Pipeline Wizard',
      tree: newTree.sha,
      parents: [latestCommitSha],
    });

    // Update branch reference
    await this.octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${branchName}`,
      sha: newCommit.sha,
    });

    // Create pull request
    const { data: pr } = await this.octokit.pulls.create({
      owner,
      repo,
      title: 'Add CI/CD Pipeline Configurations',
      head: branchName,
      base: defaultBranch,
      body: `This PR adds CI/CD pipeline configurations generated by the AI CI/CD Pipeline Wizard.

## Generated Files

${files.map((f) => `- \`${f.path}\``).join('\n')}

Please review the configurations and merge when ready.`,
    });

    return {
      prUrl: pr.html_url,
      prNumber: pr.number,
      branch: branchName,
    };
  }
}

// Usage in generation route:
if (data.createPR && data.githubToken) {
  const github = new GitHubIntegration(data.githubToken);
  const prInfo = await github.createPRWithConfigs(
    owner,
    repo,
    files,
  );
  // Include prInfo in response
}
```

---

## Monitoring & Observability

### Prometheus Metrics

```typescript
// backend/lib/metrics-prometheus.ts
import promClient from 'prom-client';

export class PrometheusMetrics {
  private register: promClient.Registry;
  private counters = new Map<string, promClient.Counter>();
  private gauges = new Map<string, promClient.Gauge>();
  private histograms = new Map<string, promClient.Histogram>();

  constructor() {
    this.register = new promClient.Registry();
    promClient.collectDefaultMetrics({ register: this.register });
  }

  recordCounter(name: string, value: number = 1, labels?: Record<string, string>) {
    let counter = this.counters.get(name);
    if (!counter) {
      counter = new promClient.Counter({
        name,
        help: `Counter for ${name}`,
        labelNames: labels ? Object.keys(labels) : [],
        registers: [this.register],
      });
      this.counters.set(name, counter);
    }

    if (labels) {
      counter.inc(labels, value);
    } else {
      counter.inc(value);
    }
  }

  async getMetrics(): Promise<string> {
    return await this.register.metrics();
  }
}

// In server.ts:
import { PrometheusMetrics } from './lib/metrics-prometheus';

const promMetrics = new PrometheusMetrics();

server.get('/metrics', async () => {
  const metrics = await promMetrics.getMetrics();
  return metrics; // Return as text/plain
});
```

### Sentry Error Tracking

```typescript
// backend/lib/sentry.ts
import * as Sentry from '@sentry/node';

export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
  });
}

// In error handler:
export function errorHandler(error, request, reply) {
  Sentry.captureException(error, {
    extra: {
      url: request.url,
      method: request.method,
      body: request.body,
    },
  });

  // ... rest of error handling
}
```

---

## Custom Generators

### Adding a Custom Platform Generator

```typescript
// backend/services/generators/gitlab-ci-generator.ts
import { IGeneratorProvider, GenerationConfig, GeneratedFile } from './types';

export class GitLabCIGenerator implements IGeneratorProvider {
  name = 'gitlab-ci';

  supports(framework: string): boolean {
    return true; // Supports all frameworks
  }

  async generate(config: GenerationConfig): Promise<GeneratedFile[]> {
    const gitlabYaml = this.generateGitLabCI(config);

    return [
      {
        path: '.gitlab-ci.yml',
        content: gitlabYaml,
      },
    ];
  }

  private generateGitLabCI(config: GenerationConfig): string {
    return `
stages:
  - build
  - test
  - deploy

variables:
  NODE_VERSION: "20"

build:
  stage: build
  image: node:\${NODE_VERSION}
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
      - .next/

test:
  stage: test
  image: node:\${NODE_VERSION}
  script:
    - npm ci
    - npm test

deploy:
  stage: deploy
  only:
    - main
  script:
    - echo "Deploy to production"
`.trim();
  }
}

// Register in LLMGenerator:
import { GitLabCIGenerator } from './generators/gitlab-ci-generator';

const customGenerators = [
  new GitLabCIGenerator(),
];

// Use in generatePipelines method
```

---

## Event-Driven Architecture

### Subscribing to Domain Events

```typescript
// backend/services/notification-handler.ts
import { eventBus } from '../lib/events';
import { notificationAdapter } from '../lib/adapters/notification.adapter';

// Subscribe to events
eventBus.on('generation.completed', async (event) => {
  if (event.type === 'generation.completed') {
    await notificationAdapter.send({
      title: 'Pipeline Generated',
      message: `Pipeline for job ${event.payload.id} completed successfully`,
      level: 'success',
      metadata: {
        jobId: event.payload.id,
        profileId: event.payload.repoProfileId,
      },
    });
  }
});

eventBus.on('generation.failed', async (event) => {
  if (event.type === 'generation.failed') {
    await notificationAdapter.send({
      title: 'Pipeline Generation Failed',
      message: `Failed to generate pipeline: ${event.payload.error}`,
      level: 'error',
      metadata: {
        profileId: event.payload.profileId,
      },
    });
  }
});
```

---

## Best Practices

1. **Use Environment Variables** for all configuration
2. **Implement Circuit Breakers** for external services
3. **Add Retry Logic** with exponential backoff
4. **Log All Integration Attempts** for debugging
5. **Monitor Integration Health** via metrics
6. **Use Adapters** for all external dependencies
7. **Test Integrations** with mocks in CI/CD
8. **Document Integration Requirements** clearly

---

**Version:** 1.0
**Last Updated:** 2025-01-18
