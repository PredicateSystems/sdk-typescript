/**
 * Tests for backends protocol types
 */

import {
  BrowserBackend,
  ViewportInfo,
  LayoutMetrics,
  MouseButton,
  ReadyState,
} from '../../src/backends/protocol';

describe('backends/protocol types', () => {
  describe('ViewportInfo', () => {
    it('should define required viewport properties', () => {
      const viewport: ViewportInfo = {
        width: 1920,
        height: 1080,
        scrollX: 0,
        scrollY: 100,
      };

      expect(viewport.width).toBe(1920);
      expect(viewport.height).toBe(1080);
      expect(viewport.scrollX).toBe(0);
      expect(viewport.scrollY).toBe(100);
    });

    it('should allow optional content dimensions', () => {
      const viewport: ViewportInfo = {
        width: 1920,
        height: 1080,
        scrollX: 0,
        scrollY: 0,
        contentWidth: 1920,
        contentHeight: 5000,
      };

      expect(viewport.contentWidth).toBe(1920);
      expect(viewport.contentHeight).toBe(5000);
    });
  });

  describe('LayoutMetrics', () => {
    it('should define layout metric properties', () => {
      const metrics: LayoutMetrics = {
        viewportX: 0,
        viewportY: 0,
        viewportWidth: 1920,
        viewportHeight: 1080,
        contentWidth: 1920,
        contentHeight: 5000,
        deviceScaleFactor: 2.0,
      };

      expect(metrics.viewportWidth).toBe(1920);
      expect(metrics.viewportHeight).toBe(1080);
      expect(metrics.deviceScaleFactor).toBe(2.0);
    });
  });

  describe('MouseButton type', () => {
    it('should accept valid mouse button values', () => {
      const left: MouseButton = 'left';
      const right: MouseButton = 'right';
      const middle: MouseButton = 'middle';

      expect(left).toBe('left');
      expect(right).toBe('right');
      expect(middle).toBe('middle');
    });
  });

  describe('ReadyState type', () => {
    it('should accept valid ready state values', () => {
      const interactive: ReadyState = 'interactive';
      const complete: ReadyState = 'complete';

      expect(interactive).toBe('interactive');
      expect(complete).toBe('complete');
    });
  });

  describe('BrowserBackend interface', () => {
    it('should be implementable with required methods', () => {
      // Create a mock implementation to verify interface is correctly defined
      const mockBackend: BrowserBackend = {
        refreshPageInfo: jest.fn().mockResolvedValue({
          width: 1920,
          height: 1080,
          scrollX: 0,
          scrollY: 0,
        }),
        eval: jest.fn().mockResolvedValue('result'),
        call: jest.fn().mockResolvedValue('call result'),
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

      expect(mockBackend.refreshPageInfo).toBeDefined();
      expect(mockBackend.eval).toBeDefined();
      expect(mockBackend.call).toBeDefined();
      expect(mockBackend.getLayoutMetrics).toBeDefined();
      expect(mockBackend.screenshotPng).toBeDefined();
      expect(mockBackend.mouseMove).toBeDefined();
      expect(mockBackend.mouseClick).toBeDefined();
      expect(mockBackend.wheel).toBeDefined();
      expect(mockBackend.typeText).toBeDefined();
      expect(mockBackend.waitReadyState).toBeDefined();
      expect(mockBackend.getUrl).toBeDefined();
    });
  });
});
