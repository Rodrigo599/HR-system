import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { apiClient, TOKEN_KEY } from '@/lib/apiClient';

vi.mock('@/lib/apiClient', async () => {
  const actual = await vi.importActual('@/lib/apiClient');
  return {
    ...(actual as object),
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    },
  };
});

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);

function TestComponent() {
  const { user, loading, signIn, signOut } = useAuth();
  if (loading) return <div>carregando</div>;
  if (!user) return <button onClick={() => signIn('a@b.com', '123456')}>entrar</button>;
  return (
    <div>
      <span>logado: {user.email}</span>
      <button onClick={signOut}>sair</button>
    </div>
  );
}

function renderWithAuth() {
  return render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('AuthContext', () => {
  it('inicia sem usuário quando não há token', async () => {
    renderWithAuth();
    await waitFor(() => expect(screen.queryByText('carregando')).toBeNull());
    expect(screen.getByText('entrar')).toBeInTheDocument();
  });

  it('restaura sessão via /auth/me quando há token salvo', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok-123');
    mockGet.mockResolvedValueOnce({
      data: { data: { id: '1', email: 'r@t.com', name: 'R', roles: ['admin'], profile: null } },
    });

    renderWithAuth();
    await waitFor(() => expect(screen.getByText('logado: r@t.com')).toBeInTheDocument());
  });

  it('remove token e mostra login quando /auth/me falha', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok-inválido');
    mockGet.mockRejectedValueOnce(new Error('401'));

    renderWithAuth();
    await waitFor(() => expect(screen.getByText('entrar')).toBeInTheDocument());
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('salva token e seta usuário após signIn com sucesso', async () => {
    mockGet.mockRejectedValueOnce(new Error('sem token'));
    mockPost.mockResolvedValueOnce({
      data: { token: 'novo-tok', user: { id: '2', email: 'x@y.com', name: 'X', roles: ['gestor'], profile: null } },
    });

    renderWithAuth();
    await waitFor(() => screen.getByText('entrar'));
    await act(() => userEvent.click(screen.getByText('entrar')));

    await waitFor(() => expect(screen.getByText('logado: x@y.com')).toBeInTheDocument());
    expect(localStorage.getItem(TOKEN_KEY)).toBe('novo-tok');
  });

  it('limpa token e usuário após signOut', async () => {
    // Primeiro: sem token, mock do signIn retorna usuário
    mockPost
      .mockResolvedValueOnce({
        data: { token: 'tok-123', user: { id: '1', email: 'r@t.com', name: 'R', roles: ['admin'], profile: null } },
      })
      .mockResolvedValueOnce({ data: {} }); // logout

    renderWithAuth();
    await waitFor(() => screen.getByText('entrar'));

    await act(() => userEvent.click(screen.getByText('entrar')));
    await waitFor(() => screen.getByText('logado: r@t.com'));

    await act(() => userEvent.click(screen.getByText('sair')));
    await waitFor(() => expect(screen.getByText('entrar')).toBeInTheDocument());
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});
