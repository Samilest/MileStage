import toast from 'react-hot-toast';
import { PostgrestError } from '@supabase/supabase-js';

export type ErrorType =
  | 'network'
  | 'database'
  | 'auth'
  | 'permission'
  | 'notfound'
  | 'unknown';

export interface HandledError {
  type: ErrorType;
  message: string;
  originalError?: unknown;
}

export function handleError(error: unknown, context?: string): HandledError {
  console.error(`Error in ${context || 'application'}:`, error);

  if (error instanceof TypeError && error.message.includes('fetch')) {
    toast.error('Connection lost. Trying again...');
    return {
      type: 'network',
      message: 'Network connection error',
      originalError: error,
    };
  }

  if (isPostgrestError(error)) {
    if (error.code === 'PGRST116') {
      return {
        type: 'notfound',
        message: 'Resource not found',
        originalError: error,
      };
    }

    if (error.code === '42501') {
      toast.error("You don't have permission to access this");
      return {
        type: 'permission',
        message: 'Permission denied',
        originalError: error,
      };
    }

    toast.error('Something went wrong. Please try again.');
    return {
      type: 'database',
      message: error.message || 'Database error',
      originalError: error,
    };
  }

  if (isAuthError(error)) {
    return {
      type: 'auth',
      message: error.message || 'Authentication error',
      originalError: error,
    };
  }

  toast.error('Something went wrong. Please try again.');
  return {
    type: 'unknown',
    message: 'An unexpected error occurred',
    originalError: error,
  };
}

export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  context?: string
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (isNetworkError(error) && attempt < maxRetries) {
        console.log(`Retry attempt ${attempt}/${maxRetries} for ${context || 'operation'}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'details' in error
  );
}

function isAuthError(error: unknown): error is { message: string; status?: number } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    (error as any).__isAuthError === true
  );
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as any).message === 'string'
  ) {
    const message = (error as any).message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection')
    );
  }

  return false;
}

export function showNetworkError() {
  toast.error('Connection lost. Trying again...', {
    duration: 3000,
  });
}

export function showDatabaseError() {
  toast.error('Something went wrong. Please try again.', {
    duration: 4000,
  });
}

export function showAuthError() {
  toast.error('Please sign in to continue', {
    duration: 4000,
  });
}

export function showPermissionError() {
  toast.error("You don't have permission to access this project", {
    duration: 4000,
  });
}

export function showNotFoundError(resource: string = 'Project') {
  toast.error(`${resource} not found`, {
    duration: 4000,
  });
}

export function showSuccessMessage(message: string) {
  toast.success(message, {
    duration: 3000,
  });
}
