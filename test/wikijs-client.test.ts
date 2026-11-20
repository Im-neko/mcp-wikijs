const mockSdk = {
  SearchPages: jest.fn(),
  GetPageById: jest.fn(),
  GetPageByPath: jest.fn(),
  CreatePage: jest.fn(),
  UpdatePage: jest.fn(),
  DeletePage: jest.fn(),
  MovePage: jest.fn(),
  ListPages: jest.fn(),
  GetTags: jest.fn(),
  GetPageTree: jest.fn()
};

jest.mock('../src/wikijs/generated/operations', () => ({
  getSdk: () => mockSdk,
  PageTreeMode: { All: 'ALL', Folders: 'FOLDERS', Pages: 'PAGES' }
}));

import { WikiJSClient } from '../src/wikijs/client';

describe('WikiJSClient', () => {
  let client: WikiJSClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new WikiJSClient();
  });

  it('searchPages maps GraphQL results to WikiPage summaries', async () => {
    mockSdk.SearchPages.mockResolvedValue({
      data: {
        pages: {
          search: {
            results: [{ id: '1', title: 'T', description: 'D', path: 'p', locale: 'en' }],
            totalHits: 1,
            suggestions: []
          }
        }
      }
    });

    const result = await client.searchPages('query');

    expect(result.totalCount).toBe(1);
    expect(result.pages[0]).toMatchObject({ id: 1, path: 'p', title: 'T', description: 'D' });
  });

  it('surfaces the underlying GraphQL business error message', async () => {
    mockSdk.SearchPages.mockResolvedValue({ errors: [{ message: 'boom' }] });

    await expect(client.searchPages('query')).rejects.toThrow('boom');
  });

  it('never leaks the raw error object (e.g. request headers) on transport failure', async () => {
    const rawError = Object.assign(new Error('401: unauthorized'), {
      request: { headers: { Authorization: 'Bearer test-token' } }
    });
    mockSdk.SearchPages.mockRejectedValue(rawError);

    await expect(client.searchPages('query')).rejects.toThrow('401: unauthorized');
  });

  it('getPage fetches by numeric id', async () => {
    mockSdk.GetPageById.mockResolvedValue({
      data: {
        pages: {
          single: {
            id: 1, path: 'p', title: 'T', description: 'D', content: 'C', createdAt: 'x', updatedAt: 'y',
            isPublished: false, isPrivate: true, tags: [{ tag: 'a' }, null, { tag: 'b' }]
          }
        }
      }
    });

    const page = await client.getPage(1);

    expect(mockSdk.GetPageById).toHaveBeenCalledWith({ id: 1 });
    expect(page.title).toBe('T');
    expect(page).toMatchObject({ isPublished: false, isPrivate: true, tags: ['a', 'b'] });
  });

  it('getPage fetches by path with the configured default locale', async () => {
    mockSdk.GetPageByPath.mockResolvedValue({
      data: {
        pages: {
          singleByPath: {
            id: 2, path: 'p2', title: 'T2', description: '', content: 'C2', createdAt: 'x', updatedAt: 'y',
            isPublished: true, isPrivate: false, tags: []
          }
        }
      }
    });

    const page = await client.getPage('p2');

    expect(mockSdk.GetPageByPath).toHaveBeenCalledWith({ path: 'p2', locale: 'en' });
    expect(page.id).toBe(2);
  });

  it('getPage throws a clear error when the page is not found', async () => {
    mockSdk.GetPageById.mockResolvedValue({ data: { pages: { single: null } } });

    await expect(client.getPage(999)).rejects.toThrow('Page not found');
  });

  describe('updatePage', () => {
    const currentPage = {
      id: 7,
      path: 'docs/a',
      title: 'Old title',
      description: 'Old description',
      content: 'Old content',
      createdAt: 'c',
      updatedAt: 'u',
      isPublished: true,
      isPrivate: false,
      publishStartDate: '2026-01-01T00:00:00.000Z',
      publishEndDate: '',
      scriptCss: '.a{}',
      scriptJs: '',
      tags: [{ tag: 'x' }, { tag: 'y' }]
    };

    const updateOk = (isPublished: boolean) => ({
      data: {
        pages: {
          update: {
            responseResult: { succeeded: true },
            page: { id: 7, path: 'docs/a', title: 'Old title', isPublished }
          }
        }
      }
    });

    beforeEach(() => {
      mockSdk.GetPageById.mockResolvedValue({ data: { pages: { single: currentPage } } });
    });

    it('carries over the current tags, published state, content and scripts when they are omitted', async () => {
      mockSdk.UpdatePage.mockResolvedValue(updateOk(true));

      const page = await client.updatePage({ id: '7', description: 'New description' });

      expect(mockSdk.GetPageById).toHaveBeenCalledWith({ id: 7 });
      expect(mockSdk.UpdatePage).toHaveBeenCalledWith({
        id: 7,
        content: 'Old content',
        description: 'New description',
        title: 'Old title',
        tags: ['x', 'y'],
        isPublished: true,
        isPrivate: false,
        publishStartDate: '2026-01-01T00:00:00.000Z',
        publishEndDate: undefined,
        scriptCss: '.a{}',
        scriptJs: undefined
      });
      expect(page).toMatchObject({ id: 7, isPublished: true, tags: ['x', 'y'], content: 'Old content', description: 'New description' });
    });

    it('does not republish an unpublished page when isPublished is omitted', async () => {
      mockSdk.GetPageById.mockResolvedValue({
        data: { pages: { single: { ...currentPage, isPublished: false } } }
      });
      mockSdk.UpdatePage.mockResolvedValue(updateOk(false));

      await client.updatePage({ id: 7, content: 'New content' });

      expect(mockSdk.UpdatePage).toHaveBeenCalledWith(expect.objectContaining({ content: 'New content', isPublished: false }));
    });

    it('uses explicitly given values, including an empty tag list and isPublished=false', async () => {
      mockSdk.UpdatePage.mockResolvedValue(updateOk(false));

      await client.updatePage({ id: 7, tags: [], isPublished: false, description: '' });

      expect(mockSdk.UpdatePage).toHaveBeenCalledWith(
        expect.objectContaining({ tags: [], isPublished: false, description: '' })
      );
    });

    it('does not call UpdatePage when the page does not exist', async () => {
      mockSdk.GetPageById.mockResolvedValue({ data: { pages: { single: null } } });

      await expect(client.updatePage({ id: 7, content: 'x' })).rejects.toThrow('Page not found');
      expect(mockSdk.UpdatePage).not.toHaveBeenCalled();
    });

    it('surfaces the WikiJS responseResult message instead of hiding it', async () => {
      mockSdk.UpdatePage.mockResolvedValue({
        data: {
          pages: { update: { responseResult: { succeeded: false, message: "Cannot read properties of undefined (reading 'map')" }, page: null } }
        }
      });

      await expect(client.updatePage({ id: 7, content: 'x' })).rejects.toThrow("Cannot read properties of undefined (reading 'map')");
    });

    it('surfaces GraphQL error messages thrown by graphql-request without the embedded request/response', async () => {
      const clientError = Object.assign(new Error('graphql blob: {"request":{"query":"..."}}'), {
        response: { errors: [{ message: 'boom' }, { message: 'bang' }] }
      });
      mockSdk.UpdatePage.mockRejectedValue(clientError);

      await expect(client.updatePage({ id: 7, content: 'x' })).rejects.toThrow(/^boom, bang$/);
    });

    it('reports a non-array errors payload as a message rather than a TypeError', async () => {
      mockSdk.UpdatePage.mockResolvedValue({ errors: { message: 'single error object' } });

      await expect(client.updatePage({ id: 7, content: 'x' })).rejects.toThrow(/^single error object$/);
    });
  });

  describe('setPublished', () => {
    const current = {
      id: 7, path: 'p', title: 'T', description: 'D', content: 'C', createdAt: 'c', updatedAt: 'u',
      isPublished: false, isPrivate: false, publishStartDate: '', publishEndDate: '', scriptCss: null, scriptJs: null,
      tags: [{ tag: 'x' }]
    };

    it('republishes the page by sending its current content through pages.update', async () => {
      mockSdk.GetPageById.mockResolvedValue({ data: { pages: { single: current } } });
      mockSdk.UpdatePage.mockResolvedValue({
        data: { pages: { update: { responseResult: { succeeded: true }, page: { id: 7, path: 'p', title: 'T', isPublished: true } } } }
      });

      const page = await client.setPublished('7', true);

      expect(mockSdk.UpdatePage).toHaveBeenCalledWith(
        expect.objectContaining({ id: 7, content: 'C', tags: ['x'], isPublished: true })
      );
      expect(page.isPublished).toBe(true);
    });

    it('unpublishes the page when published is false', async () => {
      mockSdk.GetPageById.mockResolvedValue({ data: { pages: { single: { ...current, isPublished: true } } } });
      mockSdk.UpdatePage.mockResolvedValue({
        data: { pages: { update: { responseResult: { succeeded: true }, page: { id: 7, path: 'p', title: 'T', isPublished: false } } } }
      });

      const page = await client.setPublished(7, false);

      expect(mockSdk.UpdatePage).toHaveBeenCalledWith(expect.objectContaining({ isPublished: false }));
      expect(page.isPublished).toBe(false);
    });
  });

  it('deletePage returns true on success', async () => {
    mockSdk.DeletePage.mockResolvedValue({
      data: { pages: { delete: { responseResult: { succeeded: true } } } }
    });

    await expect(client.deletePage('5')).resolves.toBe(true);
    expect(mockSdk.DeletePage).toHaveBeenCalledWith({ id: 5 });
  });

  it('deletePage surfaces the WikiJS responseResult message on failure', async () => {
    mockSdk.DeletePage.mockResolvedValue({
      data: { pages: { delete: { responseResult: { succeeded: false, message: 'not allowed' } } } }
    });

    await expect(client.deletePage('5')).rejects.toThrow('not allowed');
  });

  it('listPages maps GraphQL results to page summaries', async () => {
    mockSdk.ListPages.mockResolvedValue({
      data: {
        pages: {
          list: [{
            id: 1,
            path: 'p',
            title: 'T',
            description: 'D',
            contentType: 'markdown',
            isPublished: true,
            isPrivate: false,
            createdAt: 'c',
            updatedAt: 'u',
            tags: ['a', null, 'b']
          }]
        }
      }
    });

    const pages = await client.listPages({ limit: 10 });

    expect(mockSdk.ListPages).toHaveBeenCalledWith({
      limit: 10,
      tags: undefined,
      locale: 'en',
      orderBy: undefined,
      orderByDirection: undefined
    });
    expect(pages).toEqual([{
      id: 1,
      path: 'p',
      title: 'T',
      description: 'D',
      contentType: 'markdown',
      isPublished: true,
      isPrivate: false,
      createdAt: 'c',
      updatedAt: 'u',
      tags: ['a', 'b']
    }]);
  });

  it('getTags maps GraphQL results to tag summaries', async () => {
    mockSdk.GetTags.mockResolvedValue({
      data: { pages: { tags: [{ id: 1, tag: 'foo', title: 'Foo' }] } }
    });

    await expect(client.getTags()).resolves.toEqual([{ id: 1, tag: 'foo', title: 'Foo' }]);
  });

  it('movePage returns true on success', async () => {
    mockSdk.MovePage.mockResolvedValue({
      data: { pages: { move: { responseResult: { succeeded: true } } } }
    });

    await expect(client.movePage('5', 'new/path')).resolves.toBe(true);
    expect(mockSdk.MovePage).toHaveBeenCalledWith({ id: 5, destinationPath: 'new/path', destinationLocale: 'en' });
  });

  it('movePage surfaces the WikiJS responseResult message on failure', async () => {
    mockSdk.MovePage.mockResolvedValue({
      data: { pages: { move: { responseResult: { succeeded: false, message: 'path taken' } } } }
    });

    await expect(client.movePage('5', 'new/path')).rejects.toThrow('path taken');
  });

  it('getPageTree maps GraphQL results to tree items, filtering out nulls', async () => {
    mockSdk.GetPageTree.mockResolvedValue({
      data: {
        pages: {
          tree: [
            { id: 1, path: 'p', depth: 0, title: 'T', isPrivate: false, isFolder: true, parent: null, pageId: null, locale: 'en' },
            null
          ]
        }
      }
    });

    const items = await client.getPageTree({ path: 'p' });

    expect(mockSdk.GetPageTree).toHaveBeenCalledWith({
      path: 'p',
      parent: undefined,
      mode: 'ALL',
      locale: 'en',
      includeAncestors: undefined
    });
    expect(items).toEqual([{
      id: 1, path: 'p', depth: 0, title: 'T', isPrivate: false, isFolder: true, parent: null, pageId: null, locale: 'en'
    }]);
  });
});
