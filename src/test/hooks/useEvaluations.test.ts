import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useEvaluations, useCreateEvaluation } from '@/hooks/api/useEvaluations';
import { apiClient } from '@/lib/apiClient';

vi.mock('@/lib/apiClient', async () => {
  const actual = await vi.importActual('@/lib/apiClient');
  return {
    ...(actual as object),
    apiClient: { get: vi.fn(), post: vi.fn(), interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } },
  };
});

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe('useEvaluations', () => {
  it('retorna lista de avaliações', async () => {
    const evaluations = [{ id: 'e1', type: 'self', status: 'pending' }];
    mockGet.mockResolvedValueOnce({ data: { data: evaluations } });

    const { result } = renderHook(() => useEvaluations(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(evaluations);
  });

  it('expõe erro quando a requisição falha', async () => {
    mockGet.mockRejectedValueOnce(new Error('500'));

    const { result } = renderHook(() => useEvaluations(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCreateEvaluation', () => {
  it('cria avaliação e retorna o recurso criado', async () => {
    const nova = { id: 'e2', type: 'manager', status: 'pending' };
    mockPost.mockResolvedValueOnce({ data: { data: nova } });

    const { result } = renderHook(() => useCreateEvaluation(), { wrapper });
    result.current.mutate({ type: 'manager', period: '2026-S1', assigned_to: 'u1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(nova);
  });
});
