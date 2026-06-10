import { useToast } from '@/hooks/use-toast';

interface MutationOptions<T> {
  successMsg: string;
  errorMsg?: string;
  onSuccess?: (data: T) => void;
  onSettled?: () => void;
}

/**
 * Encapsula o padrão try/catch + toast repetido em todas as páginas.
 * Retorna um executor que recebe uma Promise (mutateAsync) e trata o ciclo completo.
 */
export function useMutationHandler() {
  const { toast } = useToast();

  async function run<T>(
    promise: Promise<T>,
    { successMsg, errorMsg = 'Ocorreu um erro. Tente novamente.', onSuccess, onSettled }: MutationOptions<T>,
  ): Promise<boolean> {
    try {
      const data = await promise;
      toast({ title: successMsg });
      onSuccess?.(data);
      return true;
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : errorMsg;
      toast({ title: message, variant: 'destructive' });
      return false;
    } finally {
      onSettled?.();
    }
  }

  return { run };
}
