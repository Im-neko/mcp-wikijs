const mockClient = {
  updatePage: jest.fn(),
  setPublished: jest.fn(),
  getPage: jest.fn()
};

jest.mock('../src/wikijs/client', () => ({ __esModule: true, default: mockClient }));

import { MCPWikiJSServer } from '../src/mcp/server';

type ToolCallback = (args: Record<string, unknown>) => Promise<{ content: Array<{ type: string; text: string }> }>;

function getTool(server: MCPWikiJSServer, name: string): ToolCallback {
  const registered = (server as unknown as {
    server: { _registeredTools: Record<string, { callback: ToolCallback }> };
  }).server._registeredTools;
  return registered[name].callback;
}

describe('MCPWikiJSServer tools', () => {
  let server: MCPWikiJSServer;

  beforeEach(() => {
    jest.clearAllMocks();
    server = new MCPWikiJSServer();
  });

  it('registers a publish tool', () => {
    expect(getTool(server, 'publish')).toBeDefined();
  });

  it('publish defaults to publishing the page', async () => {
    mockClient.setPublished.mockResolvedValue({ id: 7, path: 'p', title: 'T', isPublished: true });

    const result = await getTool(server, 'publish')({ id: '7' });

    expect(mockClient.setPublished).toHaveBeenCalledWith('7', true);
    expect(JSON.parse(result.content[0].text)).toEqual({ id: 7, path: 'p', title: 'T', isPublished: true, success: true });
  });

  it('publish can unpublish a page', async () => {
    mockClient.setPublished.mockResolvedValue({ id: 7, path: 'p', title: 'T', isPublished: false });

    await getTool(server, 'publish')({ id: '7', published: false });

    expect(mockClient.setPublished).toHaveBeenCalledWith('7', false);
  });

  it('publish surfaces the client error message', async () => {
    mockClient.setPublished.mockRejectedValue(new Error('Page not found'));

    await expect(getTool(server, 'publish')({ id: '7' })).rejects.toThrow('Page not found');
  });

  it('update forwards isPublished and tags and reports the resulting published state', async () => {
    mockClient.updatePage.mockResolvedValue({ id: 7, path: 'p', title: 'T', isPublished: true });

    const result = await getTool(server, 'update')({ id: '7', content: 'C', isPublished: true, tags: ['a'] });

    expect(mockClient.updatePage).toHaveBeenCalledWith({
      id: '7',
      content: 'C',
      title: undefined,
      description: undefined,
      isPublished: true,
      tags: ['a']
    });
    expect(JSON.parse(result.content[0].text)).toMatchObject({ id: 7, isPublished: true, success: true });
  });

  it('read includes isPublished, isPrivate and tags', async () => {
    mockClient.getPage.mockResolvedValue({
      id: 7, path: 'p', title: 'T', description: 'D', content: 'C', createdAt: 'c', updatedAt: 'u',
      isPublished: false, isPrivate: false, tags: ['a']
    });

    const result = await getTool(server, 'read')({ id: 7 });

    expect(JSON.parse(result.content[0].text)).toMatchObject({ isPublished: false, isPrivate: false, tags: ['a'] });
    expect(result.content[1].text).toBe('C');
  });
});
