/**
 * Tests for BrowserUseAdapter
 */

import { BrowserUseAdapter, BrowserUseCDPTransport } from '../../src/backends/browser-use-adapter';

describe('BrowserUseCDPTransport', () => {
  it('should send CDP commands correctly', async () => {
    const mockMethod = jest.fn().mockResolvedValue({ result: 'success' });
    const mockCdpClient = {
      send: {
        Runtime: {
          evaluate: mockMethod,
        },
      },
    };

    const transport = new BrowserUseCDPTransport(mockCdpClient, 'session-123');

    const result = await transport.send('Runtime.evaluate', {
      expression: '1 + 1',
    });

    expect(mockMethod).toHaveBeenCalledWith({
      params: { expression: '1 + 1' },
      session_id: 'session-123',
    });
    expect(result).toEqual({ result: 'success' });
  });

  it('should throw on invalid method format', async () => {
    const mockCdpClient = {
      send: {},
    };

    const transport = new BrowserUseCDPTransport(mockCdpClient, 'session-123');

    await expect(transport.send('InvalidFormat')).rejects.toThrow('Invalid CDP method format');
  });

  it('should throw on unknown domain', async () => {
    const mockCdpClient = {
      send: {
        Runtime: {},
      },
    };

    const transport = new BrowserUseCDPTransport(mockCdpClient, 'session-123');

    await expect(transport.send('Unknown.method')).rejects.toThrow('Unknown CDP domain');
  });

  it('should throw on unknown method', async () => {
    const mockCdpClient = {
      send: {
        Runtime: {},
      },
    };

    const transport = new BrowserUseCDPTransport(mockCdpClient, 'session-123');

    await expect(transport.send('Runtime.unknownMethod')).rejects.toThrow('Unknown CDP method');
  });

  it('should return empty object when method returns null', async () => {
    const mockMethod = jest.fn().mockResolvedValue(null);
    const mockCdpClient = {
      send: {
        Page: {
          reload: mockMethod,
        },
      },
    };

    const transport = new BrowserUseCDPTransport(mockCdpClient, 'session-123');

    const result = await transport.send('Page.reload');

    expect(result).toEqual({});
  });
});

describe('BrowserUseAdapter', () => {
  describe('page access', () => {
    it('should access page directly when available', () => {
      const mockPage = { goto: jest.fn() };
      const mockSession = { page: mockPage };

      const adapter = new BrowserUseAdapter(mockSession);

      expect(adapter.page).toBe(mockPage);
    });

    it('should access _page when page not available', () => {
      const mockPage = { goto: jest.fn() };
      const mockSession = { _page: mockPage };

      const adapter = new BrowserUseAdapter(mockSession);

      expect(adapter.page).toBe(mockPage);
    });

    it('should throw when only async method available', () => {
      const mockSession = {
        getCurrentPage: jest.fn(),
      };

      const adapter = new BrowserUseAdapter(mockSession);

      expect(() => adapter.page).toThrow('Use await adapter.getPageAsync()');
    });

    it('should throw when page not found', () => {
      const mockSession = {};

      const adapter = new BrowserUseAdapter(mockSession);

      expect(() => adapter.page).toThrow('Could not find page');
    });
  });

  describe('getPageAsync', () => {
    it('should call getCurrentPage when available', async () => {
      const mockPage = { goto: jest.fn() };
      const mockSession = {
        getCurrentPage: jest.fn().mockResolvedValue(mockPage),
      };

      const adapter = new BrowserUseAdapter(mockSession);
      const page = await adapter.getPageAsync();

      expect(mockSession.getCurrentPage).toHaveBeenCalled();
      expect(page).toBe(mockPage);
    });

    it('should fallback to sync page access', async () => {
      const mockPage = { goto: jest.fn() };
      const mockSession = { page: mockPage };

      const adapter = new BrowserUseAdapter(mockSession);
      const page = await adapter.getPageAsync();

      expect(page).toBe(mockPage);
    });
  });

  describe('apiKey and apiUrl', () => {
    it('should return null for apiKey', () => {
      const adapter = new BrowserUseAdapter({});
      expect(adapter.apiKey).toBeNull();
    });

    it('should return null for apiUrl', () => {
      const adapter = new BrowserUseAdapter({});
      expect(adapter.apiUrl).toBeNull();
    });
  });

  describe('createBackend', () => {
    it('should create backend from session', async () => {
      const mockCdpClient = {
        send: {
          Runtime: {
            evaluate: jest.fn().mockResolvedValue({ result: { value: 1 } }),
          },
        },
      };
      const mockCdpSession = {
        cdpClient: mockCdpClient,
        sessionId: 'session-123',
      };
      const mockSession = {
        getOrCreateCdpSession: jest.fn().mockResolvedValue(mockCdpSession),
      };

      const adapter = new BrowserUseAdapter(mockSession);
      const backend = await adapter.createBackend();

      expect(mockSession.getOrCreateCdpSession).toHaveBeenCalled();
      expect(backend).toBeDefined();
    });

    it('should return cached backend on subsequent calls', async () => {
      const mockCdpClient = {
        send: {
          Runtime: {
            evaluate: jest.fn().mockResolvedValue({ result: { value: 1 } }),
          },
        },
      };
      const mockCdpSession = {
        cdpClient: mockCdpClient,
        sessionId: 'session-123',
      };
      const mockSession = {
        getOrCreateCdpSession: jest.fn().mockResolvedValue(mockCdpSession),
      };

      const adapter = new BrowserUseAdapter(mockSession);
      const backend1 = await adapter.createBackend();
      const backend2 = await adapter.createBackend();

      expect(backend1).toBe(backend2);
      expect(mockSession.getOrCreateCdpSession).toHaveBeenCalledTimes(1);
    });

    it('should throw when getOrCreateCdpSession not available', async () => {
      const mockSession = {};

      const adapter = new BrowserUseAdapter(mockSession);

      await expect(adapter.createBackend()).rejects.toThrow('does not have getOrCreateCdpSession');
    });
  });

  describe('getTransport', () => {
    it('should return transport after creating backend', async () => {
      const mockCdpClient = {
        send: {
          Runtime: {
            evaluate: jest.fn().mockResolvedValue({ result: { value: 1 } }),
          },
        },
      };
      const mockCdpSession = {
        cdpClient: mockCdpClient,
        sessionId: 'session-123',
      };
      const mockSession = {
        getOrCreateCdpSession: jest.fn().mockResolvedValue(mockCdpSession),
      };

      const adapter = new BrowserUseAdapter(mockSession);
      const transport = await adapter.getTransport();

      expect(transport).toBeInstanceOf(BrowserUseCDPTransport);
    });
  });
});
