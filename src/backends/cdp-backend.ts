/**
 * CDP Backend implementation for browser-use integration.
 *
 * This module provides CDPBackend, which implements BrowserBackend protocol
 * using Chrome DevTools Protocol (CDP) commands.
 *
 * Usage with browser-use:
 *   import { CDPBackend, CDPTransport } from './backends/cdp-backend';
 *
 *   // Create transport from browser-use CDP client
 *   const transport: CDPTransport = {
 *     send: async (method, params) => {
 *       // Call browser-use's CDP client
 *       return await cdpClient.send[domain][method](params, sessionId);
 *     }
 *   };
 *
 *   const backend = new CDPBackend(transport);
 *
 *   // Now use backend for Sentience operations
 *   const viewport = await backend.refreshPageInfo();
 *   await backend.mouseClick(100, 200);
 */

import { BrowserBackend, LayoutMetrics, MouseButton, ReadyState, ViewportInfo } from './protocol';

/**
 * Protocol for CDP transport layer.
 *
 * This abstracts the actual CDP communication, allowing different
 * implementations (browser-use, Playwright CDP, raw WebSocket).
 */
export interface CDPTransport {
  /**
   * Send a CDP command and return the result.
   *
   * @param method - CDP method name, e.g., "Runtime.evaluate"
   * @param params - Method parameters
   * @returns CDP response dict
   */
  send(method: string, params?: Record<string, unknown>): Promise<Record<string, unknown>>;
}

/**
 * CDP-based implementation of BrowserBackend.
 *
 * This backend uses CDP commands to interact with the browser,
 * making it compatible with browser-use's CDP client.
 */
export class CDPBackend implements BrowserBackend {
  private transport: CDPTransport;
  private cachedViewport: ViewportInfo | null = null;
  private executionContextId: number | null = null;

  constructor(transport: CDPTransport) {
    this.transport = transport;
  }

  private async getExecutionContext(): Promise<number> {
    if (this.executionContextId !== null) {
      return this.executionContextId;
    }

    // Enable Runtime domain if not already enabled
    try {
      await this.transport.send('Runtime.enable');
    } catch {
      // May already be enabled
    }

    // Get the main frame's execution context
    const result = await this.transport.send('Runtime.evaluate', {
      expression: '1',
      returnByValue: true,
    });

    // Extract context ID from the result
    if ('executionContextId' in result) {
      this.executionContextId = result.executionContextId as number;
    } else {
      // Fallback: use context ID 1 (main frame)
      this.executionContextId = 1;
    }

    return this.executionContextId;
  }

  async refreshPageInfo(): Promise<ViewportInfo> {
    const result = (await this.eval(`(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      contentWidth: document.documentElement.scrollWidth,
      contentHeight: document.documentElement.scrollHeight
    }))()`)) as Record<string, unknown>;

    this.cachedViewport = {
      width: (result.width as number) || 0,
      height: (result.height as number) || 0,
      scrollX: (result.scrollX as number) || 0,
      scrollY: (result.scrollY as number) || 0,
      contentWidth: result.contentWidth as number | undefined,
      contentHeight: result.contentHeight as number | undefined,
    };
    return this.cachedViewport;
  }

  async eval(expression: string): Promise<unknown> {
    const result = await this.transport.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });

    // Check for exceptions
    if ('exceptionDetails' in result) {
      const exc = result.exceptionDetails as Record<string, unknown>;
      const text = (exc.text as string) || 'Unknown error';
      throw new Error(`JavaScript evaluation failed: ${text}`);
    }

    // Extract value from result
    if ('result' in result) {
      const res = result.result as Record<string, unknown>;
      if (res.type === 'undefined') {
        return null;
      }
      return res.value;
    }

    return null;
  }

  async call(functionDeclaration: string, args?: unknown[]): Promise<unknown> {
    // Build call arguments
    const callArgs: Array<{ value: unknown }> = [];
    if (args) {
      for (const arg of args) {
        callArgs.push({ value: arg });
      }
    }

    // We need an object ID to call function on
    // Use globalThis (window) as the target
    const globalResult = await this.transport.send('Runtime.evaluate', {
      expression: 'globalThis',
      returnByValue: false,
    });

    const resultObj = globalResult.result as Record<string, unknown> | undefined;
    const objectId = resultObj?.objectId as string | undefined;

    if (!objectId) {
      // Fallback: evaluate the function directly
      if (args && args.length > 0) {
        const argsJson = args
          .map(a => (typeof a === 'string' ? JSON.stringify(a) : String(a)))
          .join(', ');
        const expression = `(${functionDeclaration})(${argsJson})`;
        return await this.eval(expression);
      } else {
        const expression = `(${functionDeclaration})()`;
        return await this.eval(expression);
      }
    }

    const result = await this.transport.send('Runtime.callFunctionOn', {
      functionDeclaration,
      objectId,
      arguments: callArgs,
      returnByValue: true,
      awaitPromise: true,
    });

    // Check for exceptions
    if ('exceptionDetails' in result) {
      const exc = result.exceptionDetails as Record<string, unknown>;
      const text = (exc.text as string) || 'Unknown error';
      throw new Error(`JavaScript call failed: ${text}`);
    }

    // Extract value from result
    if ('result' in result) {
      const res = result.result as Record<string, unknown>;
      if (res.type === 'undefined') {
        return null;
      }
      return res.value;
    }

    return null;
  }

  async getLayoutMetrics(): Promise<LayoutMetrics> {
    const result = await this.transport.send('Page.getLayoutMetrics');

    // Extract metrics from result
    const layoutViewport = (result.layoutViewport as Record<string, unknown>) || {};
    const contentSize = (result.contentSize as Record<string, unknown>) || {};
    const visualViewport = (result.visualViewport as Record<string, unknown>) || {};

    return {
      viewportX: (visualViewport.pageX as number) || 0,
      viewportY: (visualViewport.pageY as number) || 0,
      viewportWidth:
        (visualViewport.clientWidth as number) || (layoutViewport.clientWidth as number) || 0,
      viewportHeight:
        (visualViewport.clientHeight as number) || (layoutViewport.clientHeight as number) || 0,
      contentWidth: (contentSize.width as number) || 0,
      contentHeight: (contentSize.height as number) || 0,
      deviceScaleFactor: (visualViewport.scale as number) || 1.0,
    };
  }

  async screenshotPng(): Promise<string> {
    const result = await this.transport.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });

    return (result.data as string) || '';
  }

  async mouseMove(x: number, y: number): Promise<void> {
    await this.transport.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x,
      y,
    });
  }

  async mouseClick(
    x: number,
    y: number,
    button: MouseButton = 'left',
    clickCount: number = 1
  ): Promise<void> {
    // Mouse down
    await this.transport.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x,
      y,
      button,
      clickCount,
    });

    // Small delay between press and release
    await this.sleep(50);

    // Mouse up
    await this.transport.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x,
      y,
      button,
      clickCount,
    });
  }

  async wheel(deltaY: number, x?: number, y?: number): Promise<void> {
    // Get viewport center if coordinates not provided
    if (x === undefined || y === undefined) {
      if (this.cachedViewport === null) {
        await this.refreshPageInfo();
      }
      x = x ?? (this.cachedViewport?.width ?? 0) / 2;
      y = y ?? (this.cachedViewport?.height ?? 0) / 2;
    }

    await this.transport.send('Input.dispatchMouseEvent', {
      type: 'mouseWheel',
      x,
      y,
      deltaX: 0,
      deltaY,
    });
  }

  async typeText(text: string): Promise<void> {
    for (const char of text) {
      // Key down
      await this.transport.send('Input.dispatchKeyEvent', {
        type: 'keyDown',
        text: char,
      });

      // Char event (for text input)
      await this.transport.send('Input.dispatchKeyEvent', {
        type: 'char',
        text: char,
      });

      // Key up
      await this.transport.send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        text: char,
      });

      // Small delay between characters
      await this.sleep(10);
    }
  }

  async waitReadyState(
    state: ReadyState = 'interactive',
    timeoutMs: number = 15000
  ): Promise<void> {
    const startTime = Date.now();

    // Map state to acceptable states
    const acceptableStates: Set<string> =
      state === 'complete' ? new Set(['complete']) : new Set(['interactive', 'complete']);

    while (true) {
      const elapsed = Date.now() - startTime;
      if (elapsed >= timeoutMs) {
        throw new Error(
          `Timed out waiting for document.readyState='${state}' after ${timeoutMs}ms`
        );
      }

      const currentState = (await this.eval('document.readyState')) as string;
      if (acceptableStates.has(currentState)) {
        return;
      }

      // Poll every 100ms
      await this.sleep(100);
    }
  }

  async getUrl(): Promise<string> {
    const result = await this.eval('window.location.href');
    return (result as string) || '';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
