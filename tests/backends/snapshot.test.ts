/**
 * Tests for backend snapshot functionality
 */

import {
  CachedSnapshot,
  snapshot,
  ExtensionNotLoadedError,
  SnapshotError,
} from '../../src/backends/snapshot';
import { BrowserBackend } from '../../src/backends/protocol';
import { Snapshot } from '../../src/types';

describe('backends/snapshot', () => {
  let mockBackend: jest.Mocked<BrowserBackend>;

  const createMockSnapshot = (): Snapshot => ({
    status: 'success',
    url: 'https://example.com',
    elements: [
      {
        id: 1,
        role: 'button',
        text: 'Click me',
        importance: 100,
        bbox: { x: 100, y: 100, width: 80, height: 30 },
        visual_cues: {
          is_primary: false,
          background_color_name: 'blue',
          is_clickable: true,
        },
        in_viewport: true,
        is_occluded: false,
        z_index: 1,
      },
    ],
    viewport: { width: 1920, height: 1080 },
  });

  beforeEach(() => {
    mockBackend = {
      refreshPageInfo: jest.fn().mockResolvedValue({
        width: 1920,
        height: 1080,
        scrollX: 0,
        scrollY: 0,
      }),
      eval: jest.fn(),
      call: jest.fn().mockResolvedValue(null),
      getLayoutMetrics: jest.fn().mockResolvedValue({
        viewportX: 0,
        viewportY: 0,
        viewportWidth: 1920,
        viewportHeight: 1080,
        contentWidth: 1920,
        contentHeight: 5000,
        deviceScaleFactor: 1.0,
      }),
      screenshotPng: jest.fn().mockResolvedValue('base64data'),
      mouseMove: jest.fn().mockResolvedValue(undefined),
      mouseClick: jest.fn().mockResolvedValue(undefined),
      wheel: jest.fn().mockResolvedValue(undefined),
      typeText: jest.fn().mockResolvedValue(undefined),
      waitReadyState: jest.fn().mockResolvedValue(undefined),
      getUrl: jest.fn().mockResolvedValue('https://example.com'),
    };
  });

  describe('ExtensionNotLoadedError', () => {
    it('should create error with timeout info', () => {
      const error = ExtensionNotLoadedError.fromTimeout(5000);

      expect(error.message).toContain('5000ms');
      expect(error.message).toContain('--load-extension');
      expect(error.timeoutMs).toBe(5000);
    });

    it('should include diagnostics in message', () => {
      const diagnostics = {
        sentienceDefined: false,
        sentienceSnapshot: false,
        url: 'https://example.com',
      };

      const error = ExtensionNotLoadedError.fromTimeout(5000, diagnostics);

      expect(error.message).toContain('sentienceDefined');
      expect(error.diagnostics).toEqual(diagnostics);
    });
  });

  describe('SnapshotError', () => {
    it('should create error for null result', () => {
      const error = SnapshotError.fromNullResult('https://example.com');

      expect(error.message).toContain('returned null');
      expect(error.message).toContain('https://example.com');
      expect(error.url).toBe('https://example.com');
    });

    it('should work without URL', () => {
      const error = SnapshotError.fromNullResult();

      expect(error.message).toContain('returned null');
      expect(error.url).toBeUndefined();
    });
  });

  describe('CachedSnapshot', () => {
    it('should take fresh snapshot on first call', async () => {
      // Mock extension ready check
      mockBackend.eval
        .mockResolvedValueOnce(true) // Extension ready check
        .mockResolvedValueOnce(createMockSnapshot()); // Snapshot call

      const cache = new CachedSnapshot(mockBackend, 2000);
      const snap = await cache.get();

      expect(snap.elements).toHaveLength(1);
      expect(cache.isCached).toBe(true);
    });

    it('should return cached snapshot if fresh', async () => {
      // Mock extension ready check and snapshot
      mockBackend.eval.mockResolvedValueOnce(true).mockResolvedValueOnce(createMockSnapshot());

      const cache = new CachedSnapshot(mockBackend, 5000);

      const snap1 = await cache.get();
      const snap2 = await cache.get();

      // eval should only be called twice (once for ready check, once for snapshot)
      expect(mockBackend.eval).toHaveBeenCalledTimes(2);
      expect(snap1).toBe(snap2);
    });

    it('should take fresh snapshot when cache is stale', async () => {
      mockBackend.eval
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(createMockSnapshot())
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(createMockSnapshot());

      const cache = new CachedSnapshot(mockBackend, 10); // 10ms max age

      await cache.get();

      // Wait for cache to become stale
      await new Promise(resolve => setTimeout(resolve, 20));

      await cache.get();

      // Should have taken two snapshots
      expect(mockBackend.eval).toHaveBeenCalledTimes(4);
    });

    it('should take fresh snapshot when invalidated', async () => {
      mockBackend.eval
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(createMockSnapshot())
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(createMockSnapshot());

      const cache = new CachedSnapshot(mockBackend, 60000);

      await cache.get();
      cache.invalidate();
      await cache.get();

      // Should have taken two snapshots
      expect(mockBackend.eval).toHaveBeenCalledTimes(4);
      expect(cache.isCached).toBe(true);
    });

    it('should force refresh when requested', async () => {
      mockBackend.eval
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(createMockSnapshot())
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(createMockSnapshot());

      const cache = new CachedSnapshot(mockBackend, 60000);

      await cache.get();
      await cache.get(undefined, true); // Force refresh

      expect(mockBackend.eval).toHaveBeenCalledTimes(4);
    });

    it('should report age correctly', async () => {
      mockBackend.eval.mockResolvedValueOnce(true).mockResolvedValueOnce(createMockSnapshot());

      const cache = new CachedSnapshot(mockBackend, 5000);

      // Before any snapshot
      expect(cache.ageMs).toBe(Infinity);

      await cache.get();

      // After snapshot
      expect(cache.ageMs).toBeLessThan(100);
    });
  });

  describe('snapshot', () => {
    it('should throw ExtensionNotLoadedError when extension not ready', async () => {
      // Always return false for extension check
      mockBackend.eval.mockResolvedValue(false);

      await expect(snapshot(mockBackend)).rejects.toThrow(ExtensionNotLoadedError);
    }, 10000);

    it('should throw SnapshotError when snapshot returns null', async () => {
      mockBackend.eval
        .mockResolvedValueOnce(true) // Extension ready
        .mockResolvedValueOnce(null) // Snapshot returns null
        .mockResolvedValueOnce('https://example.com'); // URL for error

      await expect(snapshot(mockBackend)).rejects.toThrow(SnapshotError);
    });

    it('should return snapshot when extension is ready', async () => {
      const mockSnap = createMockSnapshot();
      mockBackend.eval
        .mockResolvedValueOnce(true) // Extension ready
        .mockResolvedValueOnce(mockSnap); // Snapshot result

      const result = await snapshot(mockBackend);

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
    });

    it('should pass options to extension', async () => {
      const mockSnap = createMockSnapshot();
      mockBackend.eval.mockResolvedValueOnce(true).mockResolvedValueOnce(mockSnap);

      await snapshot(mockBackend, {
        limit: 100,
        screenshot: true,
      });

      // Second call should include options
      const evalCall = mockBackend.eval.mock.calls[1][0];
      expect(evalCall).toContain('limit');
      expect(evalCall).toContain('screenshot');
    });
  });
});
