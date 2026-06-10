import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useFeedback, useCreateFeedback, useDeleteFeedback } from '@/hooks/api/useFeedback';
import { apiClient } from '@/lib/apiClient';

vi.mock('@/lib/apiClient', async () => {
  const actual = await vi.importActual('@/lib/apiClient');
  return {
    ...(actual as object),
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    },
  };
});

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);
const mockDelete = vi.mocked(apiClient.delete);

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe('useFeedback', () => {
  it('retorna lista de feedbacks', async () => {
    const feedbacks = [{ id: 'f1', content: 'Ótimo trabalho', from_user_id: 'u1', to_user_id: 'u2' }];
    mockGet.mockResolvedValueOnce({ data: { data: feedbacks } });

    const { result } = renderHook(() => useFeedback(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(feedbacks);
  });
});

describe('useCreateFeedback', () => {
  it('cria feedback com conteúdo e destinatário', async () => {
    const novo = { id: 'f2', content: 'Excelente', to_user_id: 'u3', from_user_id: 'u1', is_anonymous: false };
    mockPost.mockResolvedValueOnce({ data: { data: novo } });

    const { result } = renderHook(() => useCreateFeedback(), { wrapper });
    result.current.mutate({ to_user_id: 'u3', content: 'Excelente' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockPost).toHaveBeenCalledWith('/feedback', { to_user_id: 'u3', content: 'Excelente' });
  });
});

describe('useDeleteFeedback', () => {
  it('faz DELETE no endpoint correto', async () => {
    mockDelete.mockResolvedValueOnce({ data: {} });

    const { result } = renderHook(() => useDeleteFeedback(), { wrapper });
    result.current.mutate('f1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockDelete).toHaveBeenCalledWith('/feedback/f1');
  });
});
