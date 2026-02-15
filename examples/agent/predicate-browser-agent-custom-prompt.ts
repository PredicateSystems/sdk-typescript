/**
 * Example: PredicateBrowserAgent with compact prompt customization.
 *
 * Usage:
 *   ts-node examples/agent/predicate-browser-agent-custom-prompt.ts
 */

import { Page } from 'playwright';
import {
  AgentRuntime,
  PredicateBrowserAgent,
  type PredicateBrowserAgentConfig,
  RuntimeStep,
  SentienceBrowser,
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

class RecordingProvider extends LLMProvider {
  public lastSystem: string | null = null;
  public lastUser: string | null = null;

  constructor(private action: string = 'FINISH()') {
    super();
  }

  get modelName(): string {
    return 'recording-provider';
  }
  supportsJsonMode(): boolean {
    return false;
  }
  async generate(
    systemPrompt: string,
    userPrompt: string,
    _options: Record<string, any> = {}
  ): Promise<LLMResponse> {
    this.lastSystem = systemPrompt;
    this.lastUser = userPrompt;
    return { content: this.action, modelName: this.modelName };
  }
}

const config: PredicateBrowserAgentConfig = {
  historyLastN: 2,
  compactPromptBuilder: (
    taskGoal: string,
    stepGoal: string,
    domContext: string,
    _snap: Snapshot,
    historySummary: string
  ) => {
    const systemPrompt =
      'You are a web automation executor. Return ONLY ONE action: CLICK(id) | TYPE(id,"text") | PRESS("key") | FINISH(). No prose.';
    const userPrompt =
      `TASK GOAL:\n${taskGoal}\n\n` +
      (historySummary ? `RECENT STEPS:\n${historySummary}\n\n` : '') +
      `STEP GOAL:\n${stepGoal}\n\n` +
      `DOM CONTEXT:\n${domContext.slice(0, 4000)}\n`;
    return { systemPrompt, userPrompt };
  },
};

async function main() {
  const apiKey = (process.env.PREDICATE_API_KEY ||
    process.env.SENTIENCE_API_KEY) as string | undefined;
  if (!apiKey) {
    console.error('Error: PREDICATE_API_KEY or SENTIENCE_API_KEY not set');
    process.exit(1);
  }

  const runId = 'predicate-browser-agent-custom-prompt';
  const tracer = await createTracer({ apiKey, runId, uploadTrace: false });

  const browser = new SentienceBrowser(apiKey, undefined, false);
  await browser.start();
  const page = browser.getPage();

  try {
    await page.goto('https://example.com');
    await page.waitForLoadState('networkidle');

    const runtime = new AgentRuntime(createBrowserAdapter(browser), page, tracer);
    const executor = new RecordingProvider('FINISH()');

    const agent = new PredicateBrowserAgent({ runtime, executor, config });

    const out = await agent.step({
      taskGoal: 'Open example.com',
      step: { goal: 'Take no action; just finish' } satisfies RuntimeStep,
    });

    console.log(`step ok: ${out.ok}`);
    console.log('--- prompt preview (system) ---');
    console.log((executor.lastSystem || '').slice(0, 300));
    console.log('--- prompt preview (user) ---');
    console.log((executor.lastUser || '').slice(0, 300));
  } finally {
    await tracer.close(true);
    await browser.close();
  }
}

main().catch(console.error);

