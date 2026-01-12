/**
 * Browser-use adapter for Sentience SDK.
 *
 * This module provides BrowserUseAdapter which wraps browser-use's BrowserSession
 * and provides a CDPBackend for Sentience operations.
 *
 * Usage:
 *   import { BrowserUseAdapter, BrowserUseCDPTransport } from './backends/browser-use-adapter';
 *
 *   // Create adapter with browser-use session
 *   const adapter = new BrowserUseAdapter(session);
 *   const backend = await adapter.createBackend();
 *
 *   // Use backend for Sentience operations
 *   const viewport = await backend.refreshPageInfo();
 *   await backend.mouseClick(100, 200);
 */

import { CDPBackend, CDPTransport } from './cdp-backend';

/**
 * CDP transport implementation for browser-use.
 *
 * Wraps browser-use's CDP client to provide the CDPTransport interface.
 * Uses cdp-use library pattern: cdpClient.send.Domain.method(params={}, sessionId=)
 */
export class BrowserUseCDPTransport implements CDPTransport {
  private client: unknown;
  private sessionId: string;

  /**
   * Initialize transport with browser-use CDP client.
   *
   * @param cdpClient - browser-use's CDP client (from cdpSession.cdpClient)
   * @param sessionId - CDP session ID (from cdpSession.sessionId)
   */
  constructor(cdpClient: unknown, sessionId: string) {
    this.client = cdpClient;
    this.sessionId = sessionId;
  }

  /**
   * Send CDP command using browser-use's cdp-use client.
   *
   * Translates method name like "Runtime.evaluate" to
   * cdpClient.send.Runtime.evaluate(params={...}, sessionId=...).
   *
   * @param method - CDP method name, e.g., "Runtime.evaluate"
   * @param params - Method parameters
   * @returns CDP response dict
   */
  async send(method: string, params?: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Split method into domain and method name
    // e.g., "Runtime.evaluate" -> ("Runtime", "evaluate")
    const parts = method.split('.', 2);
    if (parts.length !== 2) {
      throw new Error(`Invalid CDP method format: ${method}`);
    }

    const [domainName, methodName] = parts;

    // Get the domain object from cdpClient.send
    const clientAny = this.client as Record<string, unknown>;
    const send = clientAny.send as Record<string, unknown> | undefined;
    if (!send) {
      throw new Error('CDP client does not have a send property');
    }

    const domain = send[domainName] as Record<string, unknown> | undefined;
    if (!domain) {
      throw new Error(`Unknown CDP domain: ${domainName}`);
    }

    // Get the method from the domain
    const methodFunc = domain[methodName] as
      | ((options: { params: Record<string, unknown>; session_id: string }) => Promise<unknown>)
      | undefined;
    if (!methodFunc || typeof methodFunc !== 'function') {
      throw new Error(`Unknown CDP method: ${method}`);
    }

    // Call the method with params and session_id
    const result = await methodFunc({
      params: params || {},
      session_id: this.sessionId,
    });

    // cdp-use returns the result directly or null
    return (result as Record<string, unknown>) ?? {};
  }
}

/**
 * Adapter to use Sentience with browser-use's BrowserSession.
 *
 * This adapter:
 * 1. Wraps browser-use's CDP client with BrowserUseCDPTransport
 * 2. Creates CDPBackend for Sentience operations
 * 3. Provides access to the underlying page for extension calls
 *
 * Example:
 *   import { BrowserSession, BrowserProfile } from 'browser-use';
 *   import { getExtensionDir } from 'sentience';
 *   import { BrowserUseAdapter } from './backends/browser-use-adapter';
 *
 *   // Setup browser-use with Sentience extension
 *   const profile = new BrowserProfile({ args: [`--load-extension=${getExtensionDir()}`] });
 *   const session = new BrowserSession({ browserProfile: profile });
 *   await session.start();
 *
 *   // Create adapter and backend
 *   const adapter = new BrowserUseAdapter(session);
 *   const backend = await adapter.createBackend();
 *
 *   // Navigate (using browser-use)
 *   const page = await session.getCurrentPage();
 *   await page.goto('https://example.com');
 *
 *   // Use backend for precise clicking
 *   await backend.mouseClick(100, 200);
 */
export class BrowserUseAdapter {
  private session: unknown;
  private backend: CDPBackend | null = null;
  private transport: BrowserUseCDPTransport | null = null;

  /**
   * Initialize adapter with browser-use BrowserSession.
   *
   * @param session - browser-use BrowserSession instance
   */
  constructor(session: unknown) {
    this.session = session;
  }

  /**
   * Get the current Playwright page from browser-use.
   *
   * This is needed for Sentience snapshot() which calls window.sentience.snapshot().
   *
   * @returns Playwright Page object
   */
  get page(): unknown {
    const sessionAny = this.session as Record<string, unknown>;

    // browser-use stores page in session
    // Access pattern may vary by browser-use version
    if ('page' in sessionAny) {
      return sessionAny.page;
    }
    if ('_page' in sessionAny) {
      return sessionAny._page;
    }
    if ('getCurrentPage' in sessionAny) {
      // This is async, but we need sync access for property
      // Caller should use getPageAsync() instead
      throw new Error('Use await adapter.getPageAsync() to get the page');
    }
    throw new Error('Could not find page in browser-use session');
  }

  /**
   * Get the current Playwright page (async).
   *
   * @returns Playwright Page object
   */
  async getPageAsync(): Promise<unknown> {
    const sessionAny = this.session as Record<string, unknown>;

    if ('getCurrentPage' in sessionAny && typeof sessionAny.getCurrentPage === 'function') {
      return await sessionAny.getCurrentPage();
    }
    return this.page;
  }

  /**
   * API key for Sentience API (for snapshot compatibility).
   *
   * Returns null since browser-use users pass apiKey via SnapshotOptions.
   */
  get apiKey(): string | null {
    return null;
  }

  /**
   * API URL for Sentience API (for snapshot compatibility).
   *
   * Returns null to use default.
   */
  get apiUrl(): string | null {
    return null;
  }

  /**
   * Create CDP backend for Sentience operations.
   *
   * This method:
   * 1. Gets or creates a CDP session from browser-use
   * 2. Creates BrowserUseCDPTransport to wrap the CDP client
   * 3. Creates CDPBackend with the transport
   *
   * @returns CDPBackend instance ready for use
   * @throws Error if CDP session cannot be created
   */
  async createBackend(): Promise<CDPBackend> {
    if (this.backend !== null) {
      return this.backend;
    }

    const sessionAny = this.session as Record<string, unknown>;

    // Get CDP session from browser-use
    // browser-use uses: cdpSession = await session.getOrCreateCdpSession()
    if (
      !('getOrCreateCdpSession' in sessionAny) ||
      typeof sessionAny.getOrCreateCdpSession !== 'function'
    ) {
      throw new Error(
        'browser-use session does not have getOrCreateCdpSession method. ' +
          "Make sure you're using a compatible version of browser-use."
      );
    }

    const cdpSession = (await sessionAny.getOrCreateCdpSession()) as Record<string, unknown>;

    // Extract CDP client and session ID
    const cdpClient = cdpSession.cdpClient;
    const sessionId = cdpSession.sessionId as string;

    // Create transport and backend
    this.transport = new BrowserUseCDPTransport(cdpClient, sessionId);
    this.backend = new CDPBackend(this.transport);

    return this.backend;
  }

  /**
   * Get the CDP transport (creates backend if needed).
   *
   * @returns BrowserUseCDPTransport instance
   */
  async getTransport(): Promise<BrowserUseCDPTransport> {
    if (this.transport === null) {
      await this.createBackend();
    }
    return this.transport!;
  }
}
