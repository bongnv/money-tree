import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Status of async computation
 */
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Generic async computation hook
 * Handles loading state, error handling, and data management for async operations
 * Automatically cancels stale requests and provides refresh capability
 * 
 * @template TData - The type of data returned by the async function
 * @template TParams - The type of parameters passed to the async function
 * @param asyncFn - The async function to execute
 * @param params - Parameters to pass to the async function
 * @param options - Configuration options
 * @returns Async computation state and handlers
 */
export function useAsyncComputation<TData, TParams extends any[] = []>(
  asyncFn: (...params: TParams) => Promise<TData>,
  params: TParams,
  options: {
    /** Whether to execute immediately on mount */
    immediate?: boolean;
    /** Callback when computation succeeds */
    onSuccess?: (data: TData) => void;
    /** Callback when computation fails */
    onError?: (error: Error) => void;
  } = {}
) {
  const { immediate = true, onSuccess, onError } = options;

  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  // Track latest request ID to handle race conditions
  const requestIdRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Execute the async function
   */
  const execute = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;

    setStatus('loading');
    setError(null);

    try {
      const result = await asyncFn(...params);

      // Only update if this is the latest request and component is still mounted
      if (currentRequestId === requestIdRef.current && isMountedRef.current) {
        setData(result);
        setStatus('success');
        onSuccess?.(result);
      }
    } catch (err) {
      // Only update if this is the latest request and component is still mounted
      if (currentRequestId === requestIdRef.current && isMountedRef.current) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setStatus('error');
        onError?.(error);
      }
    }
  }, [asyncFn, ...params, onSuccess, onError]);

  /**
   * Reset computation to idle state
   */
  const reset = useCallback(() => {
    setStatus('idle');
    setData(null);
    setError(null);
  }, []);

  /**
   * Refresh by re-executing the async function
   */
  const refresh = useCallback(() => {
    return execute();
  }, [execute]);

  // Execute on mount if immediate is true
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    // State
    status,
    data,
    error,
    
    // Computed helpers
    isIdle: status === 'idle',
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    
    // Actions
    execute,
    refresh,
    reset,
  };
}
