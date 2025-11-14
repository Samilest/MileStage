import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleError, retryOperation, ErrorType } from '../lib/errorHandling';

export function useErrorHandler() {
  const navigate = useNavigate();
  const [error, setError] = useState<{ type: ErrorType; message: string } | null>(null);

  const handleErrorWithFallback = useCallback(
    (err: unknown, context?: string) => {
      const handledError = handleError(err, context);
      setError({ type: handledError.type, message: handledError.message });

      if (handledError.type === 'auth') {
        setTimeout(() => {
          navigate('/login', {
            state: { message: 'Please sign in to continue' },
          });
        }, 1500);
      }

      return handledError;
    },
    [navigate]
  );

  const executeWithRetry = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      context?: string,
      maxRetries: number = 3
    ): Promise<T | null> => {
      try {
        return await retryOperation(operation, maxRetries, context);
      } catch (err) {
        handleErrorWithFallback(err, context);
        return null;
      }
    },
    [handleErrorWithFallback]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError: handleErrorWithFallback,
    executeWithRetry,
    clearError,
  };
}
