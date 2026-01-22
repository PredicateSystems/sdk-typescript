/**
 * Vision executor primitives (shared parsing/execution helpers).
 *
 * This is used by higher-level agents when falling back to a vision model to propose
 * coordinate-based actions.
 */

export type VisionExecutorActionKind = 'click_xy' | 'click_rect' | 'press' | 'type' | 'finish';

export interface VisionExecutorAction {
  kind: VisionExecutorActionKind;
  args: Record<string, any>;
}

export function parseVisionExecutorAction(text: string): VisionExecutorAction {
  const t = String(text || '')
    .replace(/```[\w]*\n?/g, '')
    .trim();

  if (/^FINISH\s*\(\s*\)\s*$/i.test(t)) return { kind: 'finish', args: {} };

  let m = t.match(/^PRESS\s*\(\s*["']([^"']+)["']\s*\)\s*$/i);
  if (m) return { kind: 'press', args: { key: m[1] } };

  m = t.match(/^TYPE\s*\(\s*["']([\s\S]*?)["']\s*\)\s*$/i);
  if (m) return { kind: 'type', args: { text: m[1] } };

  m = t.match(/^CLICK_XY\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)\s*$/i);
  if (m) return { kind: 'click_xy', args: { x: Number(m[1]), y: Number(m[2]) } };

  m = t.match(
    /^CLICK_RECT\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)\s*$/i
  );
  if (m)
    return {
      kind: 'click_rect',
      args: { x: Number(m[1]), y: Number(m[2]), w: Number(m[3]), h: Number(m[4]) },
    };

  throw new Error(`unrecognized vision action: ${t.slice(0, 200)}`);
}

export async function executeVisionExecutorAction(params: {
  backend: any;
  page?: any;
  action: VisionExecutorAction;
}): Promise<void> {
  const { backend, page, action } = params;

  if (action.kind === 'click_xy') {
    await backend.mouse_click(Number(action.args.x), Number(action.args.y));
    return;
  }

  if (action.kind === 'click_rect') {
    const cx = Number(action.args.x) + Number(action.args.w) / 2;
    const cy = Number(action.args.y) + Number(action.args.h) / 2;
    await backend.mouse_click(cx, cy);
    return;
  }

  if (action.kind === 'press') {
    if (!page) throw new Error('PRESS requires a Playwright page');
    await page.keyboard.press(String(action.args.key));
    return;
  }

  if (action.kind === 'type') {
    await backend.type_text(String(action.args.text));
    return;
  }

  if (action.kind === 'finish') return;

  throw new Error(`unknown vision action kind: ${(action as any).kind}`);
}
