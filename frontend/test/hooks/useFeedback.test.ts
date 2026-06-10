import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useFeedbackReceived, useFeedbackSent, useCreateFeedback, useDeleteFeedback } from '@/hooks/api/useFeedback';
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

describe('useFeedbackReceived', () => {
  it('retorna lista de feedbacks recebidos', async () => {
    const feedbacks = [{ id: 'f1', type: 'kudos', content: 'Ótimo trabalho', from_user_id: 'u1', to_user_id: 'u2', visibility: 'with_manager', created_at: '2026-01-01' }];
    mockGet.mockResolvedValueOnce({ data: { data: feedbacks } });

    const { result } = renderHook(() => useFeedbackReceived(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(feedbacks);
    expect(mockGet).toHaveBeenCalledWith('/feedback/received');
  });
});

describe('useFeedbackSent', () => {
  it('retorna lista de feedbacks enviados', async () => {
    const feedbacks = [{ id: 'f2', type: 'adjustment', content: 'Melhore X', from_user_id: 'u1', to_user_id: 'u3', visibility: 'private', created_at: '2026-01-02' }];
    mockGet.mockResolvedValueOnce({ data: { data: feedbacks } });

    const { result } = renderHook(() => useFeedbackSent(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(feedbacks);
    expect(mockGet).toHaveBeenCalledWith('/feedback/sent');
  });
});

describe('useCreateFeedback', () => {
  it('envia payload com type e visibility corretos', async () => {
    const novo = { id: 'f3', type: 'kudos', content: 'Excelente', to_user_id: 'u3', from_user_id: 'u1', visibility: 'with_manager', created_at: '2026-01-01' };
    mockPost.mockResolvedValueOnce({ data: { data: novo } });

    const { result } = renderHook(() => useCreateFeedback(), { wrapper });
    result.current.mutate({ to_user_id: 'u3', type: 'kudos', content: 'Excelente', visibility: 'with_manager' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockPost).toHaveBeenCalledWith('/feedback', { to_user_id: 'u3', type: 'kudos', content: 'Excelente', visibility: 'with_manager' });
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
