import { search } from '../src/actions';

describe('search timeout hardening', () => {
  it('returns success when post-goto load-state wait times out', async () => {
    const page = {
      url: jest
        .fn()
        .mockReturnValueOnce('https://example.com')
        .mockReturnValue('https://duckduckgo.com/?q=sentience+sdk'),
      waitForLoadState: jest.fn().mockRejectedValue(new Error('Timeout 30000ms exceeded.')),
    };

    const browser = {
      goto: jest.fn().mockResolvedValue(undefined),
      snapshot: jest.fn(),
      getPage: jest.fn().mockReturnValue(page),
      getContext: jest.fn().mockReturnValue(null),
      getApiKey: jest.fn().mockReturnValue(undefined),
      getApiUrl: jest.fn().mockReturnValue(undefined),
    } as any;

    const result = await search(browser, 'sentience sdk', 'duckduckgo');

    expect(result.success).toBe(true);
    expect(result.outcome).toBe('navigated');
    expect(browser.goto).toHaveBeenCalledWith('https://duckduckgo.com/?q=sentience+sdk');
    expect(page.waitForLoadState).toHaveBeenCalled();
  });
});
