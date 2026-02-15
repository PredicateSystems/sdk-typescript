/**
 * Example: PredicateBrowserAgent minimal demo.
 *
 * Usage:
 *   ts-node examples/agent/predicate-browser-agent-minimal.ts
 *
 * Requires:
 * - PREDICATE_API_KEY or SENTIENCE_API_KEY (SentienceBrowser API key)
 */

import { Page } from 'playwright';
import {
  AgentRuntime,
  PredicateBrowserAgent,
  type PredicateBrowserAgentConfig,
  RuntimeStep,
  StepVerification,
  SentienceBrowser,
  exists,
  urlContains,
} from '../../src';
import { createTracer } from '../../src/tracing/tracer-factory';
import { LLMProvider, type LLMResponse } from '../../src/llm-provider';
import type { Snapshot } from '../../src/types';

function createBrowserAdapter(browser: SentienceBrowser) {
  return {
    snapshot: async (_page: Page, options?: Record<string, any>): Promise<Snapshot> => {
      return await browser.snapshot(options);
    },
  };
}

class FixedActionProvider extends LLMProvider {
  constructor(private action: string) {
    super();
  }
  get modelName(): string {
    return 'fixed-action';
  }
  supportsJsonMode(): boolean {
    return false;
  }
  async generate(
    _systemPrompt: string,
    _userPrompt: string,
    _options: Record<string, any> = {}
  ): Promise<LLMResponse> {
    return { content: this.action, modelName: this.modelName };
  }
}

async function main() {
  const apiKey = (process.env.PREDICATE_API_KEY ||
    process.env.SENTIENCE_API_KEY) as string | undefined;
  if (!apiKey) {
    console.error('Error: PREDICATE_API_KEY or SENTIENCE_API_KEY not set');
    process.exit(1);
  }

  const runId = 'predicate-browser-agent-minimal';
  const tracer = await createTracer({ apiKey, runId, uploadTrace: false });

  const browser = new SentienceBrowser(apiKey, undefined, false);
  await browser.start();
  const page = browser.getPage();

  try {
    await page.goto('https://example.com');
    await page.waitForLoadState('networkidle');

    const runtime = new AgentRuntime(createBrowserAdapter(browser), page, tracer);

    const executor = new FixedActionProvider('FINISH()');
    const config: PredicateBrowserAgentConfig = { historyLastN: 2 };

    const agent = new PredicateBrowserAgent({ runtime, executor, config });

    const steps: RuntimeStep[] = [
      {
        goal: 'Verify Example Domain is loaded',
        verifications: [
          {
            predicate: urlContains('example.com'),
            label: 'url_contains_example',
            required: true,
          } satisfies StepVerification,
          {
            predicate: exists('role=heading'),
            label: 'has_heading',
            required: true,
          } satisfies StepVerification,
        ],
        maxSnapshotAttempts: 2,
        snapshotLimitBase: 60,
      },
    ];

    const ok = await agent.run({ taskGoal: 'Open example.com and verify', steps });
    console.log(`run ok: ${ok}`);
  } finally {
    await tracer.close(true);
    await browser.close();
  }
}

main().catch(console.error);

