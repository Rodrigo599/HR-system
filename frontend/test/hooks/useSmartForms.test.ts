import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useSmartForms, useSubmitSmartFormResponse } from '@/hooks/api/useSmartForms';
import { apiClient } from '@/lib/apiClient';

vi.mock('@/lib/apiClient', async () => {
  const actual = await vi.importActual('@/lib/apiClient');
  return {
    ...(actual as object),
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    },
  };
});

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe('useSmartForms', () => {
  it('retorna apenas forms ativos por padrão', async () => {
    const forms = [{ id: 'sf1', name: 'Clima', slug: 'clima', status: 'active', category: 'survey' }];
    mockGet.mockResolvedValueOnce({ data: { data: forms } });

    const { result } = renderHook(() => useSmartForms(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(forms);
  });

  it('filtra por categoria quando passada', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } });

    renderHook(() => useSmartForms({ category: 'evaluation' }), { wrapper });
    await waitFor(() => expect(mockGet).toHaveBeenCalledWith('/smart-forms', { params: { category: 'evaluation' } }));
  });
});

describe('useSubmitSmartFormResponse', () => {
  it('envia respostas para o endpoint do form', async () => {
    const resp = { id: 'r1', status: 'completed', responses: { q1: 8 } };
    mockPost.mockResolvedValueOnce({ data: { data: resp } });

    const { result } = renderHook(() => useSubmitSmartFormResponse('sf1'), { wrapper });
    result.current.mutate({ q1: 8 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockPost).toHaveBeenCalledWith('/smart-forms/sf1/responses', { responses: { q1: 8 } });
  });
});
