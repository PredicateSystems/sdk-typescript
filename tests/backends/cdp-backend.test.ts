/**
 * Tests for CDP backend implementation
 */

import { CDPBackend, CDPTransport } from '../../src/backends/cdp-backend';

describe('CDPBackend', () => {
  let mockTransport: jest.Mocked<CDPTransport>;
  let backend: CDPBackend;

  beforeEach(() => {
    mockTransport = {
      send: jest.fn(),
    };
    backend = new CDPBackend(mockTransport);
  });

  describe('refreshPageInfo', () => {
    it('should return viewport info from JavaScript evaluation', async () => {
      mockTransport.send.mockResolvedValue({
        result: {
          type: 'object',
          value: {
            width: 1920,
            height: 1080,
            scrollX: 0,
            scrollY: 100,
            contentWidth: 1920,
            contentHeight: 5000,
          },
        },
      });

      const viewport = await backend.refreshPageInfo();

      expect(viewport.width).toBe(1920);
      expect(viewport.height).toBe(1080);
      expect(viewport.scrollX).toBe(0);
      expect(viewport.scrollY).toBe(100);
      expect(viewport.contentWidth).toBe(1920);
      expect(viewport.contentHeight).toBe(5000);
    });
  });

  describe('eval', () => {
    it('should evaluate JavaScript expression', async () => {
      mockTransport.send.mockResolvedValue({
        result: {
          type: 'number',
          value: 42,
        },
      });

      const result = await backend.eval('1 + 41');

      expect(mockTransport.send).toHaveBeenCalledWith('Runtime.evaluate', {
        expression: '1 + 41',
        returnByValue: true,
        awaitPromise: true,
      });
      expect(result).toBe(42);
    });

    it('should return null for undefined result', async () => {
      mockTransport.send.mockResolvedValue({
        result: {
          type: 'undefined',
        },
      });

      const result = await backend.eval('undefined');

      expect(result).toBeNull();
    });

    it('should throw on JavaScript exceptions', async () => {
      mockTransport.send.mockResolvedValue({
        exceptionDetails: {
          text: 'ReferenceError: foo is not defined',
        },
      });

      await expect(backend.eval('foo')).rejects.toThrow('JavaScript evaluation failed');
    });
  });

  describe('call', () => {
    it('should call function with arguments', async () => {
      // Mock globalThis lookup
      mockTransport.send.mockResolvedValueOnce({
        result: {
          type: 'object',
          objectId: 'global-object-id',
        },
      });

      // Mock callFunctionOn
      mockTransport.send.mockResolvedValueOnce({
        result: {
          type: 'number',
          value: 15,
        },
      });

      const result = await backend.call('(x, y) => x + y', [5, 10]);

      expect(mockTransport.send).toHaveBeenCalledWith('Runtime.callFunctionOn', {
        functionDeclaration: '(x, y) => x + y',
        objectId: 'global-object-id',
        arguments: [{ value: 5 }, { value: 10 }],
        returnByValue: true,
        awaitPromise: true,
      });
      expect(result).toBe(15);
    });

    it('should fallback to eval when no objectId available', async () => {
      // Mock globalThis lookup without objectId
      mockTransport.send.mockResolvedValueOnce({
        result: {
          type: 'object',
        },
      });

      // Mock fallback eval
      mockTransport.send.mockResolvedValueOnce({
        result: {
          type: 'number',
          value: 15,
        },
      });

      const result = await backend.call('(x, y) => x + y', [5, 10]);

      expect(result).toBe(15);
    });
  });

  describe('getLayoutMetrics', () => {
    it('should return layout metrics from CDP', async () => {
      mockTransport.send.mockResolvedValue({
        layoutViewport: {
          clientWidth: 1920,
          clientHeight: 1080,
        },
        contentSize: {
          width: 1920,
          height: 5000,
        },
        visualViewport: {
          pageX: 0,
          pageY: 100,
          clientWidth: 1920,
          clientHeight: 1080,
          scale: 1.5,
        },
      });

      const metrics = await backend.getLayoutMetrics();

      expect(mockTransport.send).toHaveBeenCalledWith('Page.getLayoutMetrics');
      expect(metrics.viewportX).toBe(0);
      expect(metrics.viewportY).toBe(100);
      expect(metrics.viewportWidth).toBe(1920);
      expect(metrics.viewportHeight).toBe(1080);
      expect(metrics.contentWidth).toBe(1920);
      expect(metrics.contentHeight).toBe(5000);
      expect(metrics.deviceScaleFactor).toBe(1.5);
    });
  });

  describe('screenshotPng', () => {
    it('should capture and return screenshot data', async () => {
      mockTransport.send.mockResolvedValue({
        data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      });

      const screenshot = await backend.screenshotPng();

      expect(mockTransport.send).toHaveBeenCalledWith('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: false,
      });
      expect(screenshot).toContain('iVBORw0KGgo');
    });
  });

  describe('mouseMove', () => {
    it('should dispatch mouse move event', async () => {
      mockTransport.send.mockResolvedValue({});

      await backend.mouseMove(100, 200);

      expect(mockTransport.send).toHaveBeenCalledWith('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: 100,
        y: 200,
      });
    });
  });

  describe('mouseClick', () => {
    it('should dispatch mouse press and release events', async () => {
      mockTransport.send.mockResolvedValue({});

      await backend.mouseClick(100, 200, 'left', 1);

      expect(mockTransport.send).toHaveBeenCalledWith('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x: 100,
        y: 200,
        button: 'left',
        clickCount: 1,
      });

      expect(mockTransport.send).toHaveBeenCalledWith('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: 100,
        y: 200,
        button: 'left',
        clickCount: 1,
      });
    });

    it('should support double-click', async () => {
      mockTransport.send.mockResolvedValue({});

      await backend.mouseClick(100, 200, 'left', 2);

      expect(mockTransport.send).toHaveBeenCalledWith(
        'Input.dispatchMouseEvent',
        expect.objectContaining({
          clickCount: 2,
        })
      );
    });

    it('should support right-click', async () => {
      mockTransport.send.mockResolvedValue({});

      await backend.mouseClick(100, 200, 'right', 1);

      expect(mockTransport.send).toHaveBeenCalledWith(
        'Input.dispatchMouseEvent',
        expect.objectContaining({
          button: 'right',
        })
      );
    });
  });

  describe('wheel', () => {
    it('should dispatch wheel event with coordinates', async () => {
      mockTransport.send.mockResolvedValue({});

      await backend.wheel(300, 500, 400);

      expect(mockTransport.send).toHaveBeenCalledWith('Input.dispatchMouseEvent', {
        type: 'mouseWheel',
        x: 500,
        y: 400,
        deltaX: 0,
        deltaY: 300,
      });
    });

    it('should use viewport center when coordinates not provided', async () => {
      // First call for refreshPageInfo
      mockTransport.send.mockResolvedValueOnce({
        result: {
          type: 'object',
          value: {
            width: 1000,
            height: 800,
            scrollX: 0,
            scrollY: 0,
          },
        },
      });

      // Second call for wheel
      mockTransport.send.mockResolvedValueOnce({});

      await backend.wheel(300);

      expect(mockTransport.send).toHaveBeenLastCalledWith('Input.dispatchMouseEvent', {
        type: 'mouseWheel',
        x: 500, // width / 2
        y: 400, // height / 2
        deltaX: 0,
        deltaY: 300,
      });
    });
  });

  describe('typeText', () => {
    it('should dispatch key events for each character', async () => {
      mockTransport.send.mockResolvedValue({});

      await backend.typeText('Hi');

      // Should have 3 events per character: keyDown, char, keyUp
      expect(mockTransport.send).toHaveBeenCalledTimes(6);

      // Check first character 'H'
      expect(mockTransport.send).toHaveBeenCalledWith('Input.dispatchKeyEvent', {
        type: 'keyDown',
        text: 'H',
      });
      expect(mockTransport.send).toHaveBeenCalledWith('Input.dispatchKeyEvent', {
        type: 'char',
        text: 'H',
      });
      expect(mockTransport.send).toHaveBeenCalledWith('Input.dispatchKeyEvent', {
        type: 'keyUp',
        text: 'H',
      });
    });
  });

  describe('waitReadyState', () => {
    it('should return immediately when already in target state', async () => {
      mockTransport.send.mockResolvedValue({
        result: {
          type: 'string',
          value: 'complete',
        },
      });

      await backend.waitReadyState('complete', 5000);

      expect(mockTransport.send).toHaveBeenCalledWith('Runtime.evaluate', {
        expression: 'document.readyState',
        returnByValue: true,
        awaitPromise: true,
      });
    });

    it('should accept interactive when waiting for interactive', async () => {
      mockTransport.send.mockResolvedValue({
        result: {
          type: 'string',
          value: 'interactive',
        },
      });

      await backend.waitReadyState('interactive', 5000);

      // Should succeed
    });

    it('should timeout when state not reached', async () => {
      mockTransport.send.mockResolvedValue({
        result: {
          type: 'string',
          value: 'loading',
        },
      });

      await expect(backend.waitReadyState('complete', 200)).rejects.toThrow(
        'Timed out waiting for document.readyState'
      );
    }, 10000);
  });

  describe('getUrl', () => {
    it('should return current page URL', async () => {
      mockTransport.send.mockResolvedValue({
        result: {
          type: 'string',
          value: 'https://example.com/page',
        },
      });

      const url = await backend.getUrl();

      expect(url).toBe('https://example.com/page');
    });
  });
});
