/**
 * v0 BrowserBackend Protocol - Minimal interface for browser-use integration.
 *
 * This protocol defines the minimal interface required to:
 * - Take Sentience snapshots (DOM/geometry via extension)
 * - Compute viewport-coord clicks
 * - Scroll + re-snapshot + click
 * - Stabilize after action
 *
 * No navigation API required (browser-use already handles navigation).
 *
 * Design principle: Keep it so small that nothing can break.
 */

/**
 * Viewport and scroll position information.
 */
export interface ViewportInfo {
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
  contentWidth?: number;
  contentHeight?: number;
}

/**
 * Page layout metrics from CDP Page.getLayoutMetrics.
 */
export interface LayoutMetrics {
  // Viewport dimensions
  viewportX: number;
  viewportY: number;
  viewportWidth: number;
  viewportHeight: number;

  // Content dimensions (scrollable area)
  contentWidth: number;
  contentHeight: number;

  // Device scale factor
  deviceScaleFactor: number;
}

/**
 * Mouse button type for click operations.
 */
export type MouseButton = 'left' | 'right' | 'middle';

/**
 * Document ready state for wait operations.
 */
export type ReadyState = 'interactive' | 'complete';

/**
 * Minimal backend protocol for v0 proof-of-concept.
 *
 * This is enough to:
 * - Take Sentience snapshots (DOM/geometry via extension)
 * - Execute JavaScript for element interaction
 * - Perform mouse operations (move, click, scroll)
 * - Wait for page stability
 *
 * Implementers:
 * - CDPBackend: For browser-use integration via CDP
 * - PlaywrightBackend: Wrapper around existing SentienceBrowser (future)
 */
export interface BrowserBackend {
  /**
   * Cache viewport + scroll offsets + url; cheap & safe to call often.
   *
   * @returns ViewportInfo with current viewport state
   */
  refreshPageInfo(): Promise<ViewportInfo>;

  /**
   * Evaluate JavaScript expression in page context.
   *
   * Uses CDP Runtime.evaluate with returnByValue=True.
   *
   * @param expression - JavaScript expression to evaluate
   * @returns Result value (JSON-serializable)
   */
  eval(expression: string): Promise<unknown>;

  /**
   * Call a JavaScript function with arguments.
   *
   * Uses CDP Runtime.callFunctionOn for safe argument passing.
   * Safer than eval() for passing complex arguments.
   *
   * @param functionDeclaration - JavaScript function body, e.g., "(x, y) => x + y"
   * @param args - Arguments to pass to the function
   * @returns Result value (JSON-serializable)
   */
  call(functionDeclaration: string, args?: unknown[]): Promise<unknown>;

  /**
   * Get page layout metrics.
   *
   * Uses CDP Page.getLayoutMetrics to get viewport and content dimensions.
   *
   * @returns LayoutMetrics with viewport and content size info
   */
  getLayoutMetrics(): Promise<LayoutMetrics>;

  /**
   * Capture viewport screenshot as PNG bytes.
   *
   * Uses CDP Page.captureScreenshot.
   *
   * @returns PNG image as base64 string
   */
  screenshotPng(): Promise<string>;

  /**
   * Move mouse to viewport coordinates.
   *
   * Uses CDP Input.dispatchMouseEvent with type="mouseMoved".
   *
   * @param x - X coordinate in viewport
   * @param y - Y coordinate in viewport
   */
  mouseMove(x: number, y: number): Promise<void>;

  /**
   * Click at viewport coordinates.
   *
   * Uses CDP Input.dispatchMouseEvent with mousePressed + mouseReleased.
   *
   * @param x - X coordinate in viewport
   * @param y - Y coordinate in viewport
   * @param button - Mouse button to click (default: 'left')
   * @param clickCount - Number of clicks (1 for single, 2 for double)
   */
  mouseClick(x: number, y: number, button?: MouseButton, clickCount?: number): Promise<void>;

  /**
   * Scroll using mouse wheel.
   *
   * Uses CDP Input.dispatchMouseEvent with type="mouseWheel".
   *
   * @param deltaY - Scroll amount (positive = down, negative = up)
   * @param x - X coordinate for scroll (default: viewport center)
   * @param y - Y coordinate for scroll (default: viewport center)
   */
  wheel(deltaY: number, x?: number, y?: number): Promise<void>;

  /**
   * Type text using keyboard input.
   *
   * Uses CDP Input.dispatchKeyEvent for each character.
   *
   * @param text - Text to type
   */
  typeText(text: string): Promise<void>;

  /**
   * Wait for document.readyState to reach target state.
   *
   * Uses polling instead of CDP events (no leak from unregistered listeners).
   *
   * @param state - Target state ("interactive" or "complete")
   * @param timeoutMs - Maximum time to wait in milliseconds
   * @throws TimeoutError if state not reached within timeout
   */
  waitReadyState(state?: ReadyState, timeoutMs?: number): Promise<void>;

  /**
   * Get current page URL.
   *
   * @returns Current page URL (window.location.href)
   */
  getUrl(): Promise<string>;
}
