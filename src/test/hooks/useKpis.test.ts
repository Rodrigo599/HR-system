import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useKpis, useKpiResults, useUpsertKpiResult } from '@/hooks/api/useKpis';
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

describe('useKpis', () => {
  it('retorna lista de KPIs', async () => {
    const kpis = [{ id: 'k1', name: 'NPS', target_value: 80, unit: 'percentual' }];
    mockGet.mockResolvedValueOnce({ data: { data: kpis } });

    const { result } = renderHook(() => useKpis(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(kpis);
  });
});

describe('useKpiResults', () => {
  it('filtra resultados por mês e ano', async () => {
    const results = [{ id: 'r1', kpi_id: 'k1', score: '92.00', month: 6, year: 2026 }];
    mockGet.mockResolvedValueOnce({ data: { data: results } });

    const { result } = renderHook(() => useKpiResults({ month: 6, year: 2026 }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledWith('/kpi-results', { params: { month: 6, year: 2026 } });
    expect(result.current.data).toEqual(results);
  });
});

describe('useUpsertKpiResult', () => {
  it('faz POST em /kpi-results com o payload correto', async () => {
    const resultado = { id: 'r2', kpi_id: 'k1', score: '95.00', month: 6, year: 2026 };
    mockPost.mockResolvedValueOnce({ data: { data: resultado } });

    const { result } = renderHook(() => useUpsertKpiResult(), { wrapper });
    result.current.mutate({ kpi_id: 'k1', score: 95, month: 6, year: 2026 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockPost).toHaveBeenCalledWith('/kpi-results', { kpi_id: 'k1', score: 95, month: 6, year: 2026 });
  });
});
