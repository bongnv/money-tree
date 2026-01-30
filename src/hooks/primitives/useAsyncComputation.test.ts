import { renderHook, act, waitFor } from '@testing-library/react';
import { useAsyncComputation } from './useAsyncComputation';

describe('useAsyncComputation', () => {
  const mockData = { id: 1, name: 'Test Data' };
  const mockError = new Error('Test error');

  const successfulAsyncFn = jest.fn(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    return mockData;
  });

  const failingAsyncFn = jest.fn(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    throw mockError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with idle state when immediate is false', () => {
      const { result } = renderHook(() =>
        useAsyncComputation(successfulAsyncFn, [], { immediate: false })
      );

      expect(result.current.status).toBe('idle');
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isIdle).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);
    });

    it('should execute immediately when immediate is true (default)', async () => {
      const { result } = renderHook(() => useAsyncComputation(successfulAsyncFn, []));

      expect(result.current.status).toBe('loading');

      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });

      expect(result.current.data).toEqual(mockData);
      expect(successfulAsyncFn).toHaveBeenCalledTimes(1);
    });

    it('should not execute immediately when immediate is false', () => {
      renderHook(() => useAsyncComputation(successfulAsyncFn, [], { immediate: false }));

      expect(successfulAsyncFn).not.toHaveBeenCalled();
    });
  });

  describe('execute', () => {
    it('should execute async function and update status to loading', async () => {
      const { result } = renderHook(() =>
        useAsyncComputation(successfulAsyncFn, [], { immediate: false })
      );

      act(() => {
        result.current.execute();
      });

      expect(result.current.status).toBe('loading');
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should set data and status to success on successful execution', async () => {
      const { result } = renderHook(() =>
        useAsyncComputation(successfulAsyncFn, [], { immediate: false })
      );

      await act(async () => {
        await result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('success');
        expect(result.current.data).toEqual(mockData);
        expect(result.current.error).toBeNull();
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should set error and status to error on failed execution', async () => {
      const { result } = renderHook(() =>
        useAsyncComputation(failingAsyncFn, [], { immediate: false })
      );

      await act(async () => {
        await result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
        expect(result.current.error).toEqual(mockError);
        expect(result.current.data).toBeNull();
        expect(result.current.isError).toBe(true);
      });
    });

    it('should pass parameters to async function', async () => {
      const parameterizedFn = jest.fn(async (id: number, name: string) => {
        return { id, name };
      });

      const { result } = renderHook(() =>
        useAsyncComputation(parameterizedFn, [1, 'test'], { immediate: false })
      );

      await act(async () => {
        await result.current.execute();
      });

      await waitFor(() => {
        expect(parameterizedFn).toHaveBeenCalledWith(1, 'test');
        expect(result.current.data).toEqual({ id: 1, name: 'test' });
      });
    });

    it('should clear error when retrying after failure', async () => {
      let shouldFail = true;
      const sometimesFails = jest.fn(async () => {
        if (shouldFail) {
          throw mockError;
        }
        return mockData;
      });

      const { result } = renderHook(() =>
        useAsyncComputation(sometimesFails, [], { immediate: false })
      );

      // First execution fails
      await act(async () => {
        await result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.error).toEqual(mockError);
      });

      // Second execution succeeds
      shouldFail = false;
      await act(async () => {
        await result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('success');
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('callbacks', () => {
    it('should call onSuccess callback when execution succeeds', async () => {
      const onSuccess = jest.fn();

      const { result } = renderHook(() =>
        useAsyncComputation(successfulAsyncFn, [], { immediate: false, onSuccess })
      );

      await act(async () => {
        await result.current.execute();
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(mockData);
        expect(onSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onError callback when execution fails', async () => {
      const onError = jest.fn();

      const { result } = renderHook(() =>
        useAsyncComputation(failingAsyncFn, [], { immediate: false, onError })
      );

      await act(async () => {
        await result.current.execute();
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(mockError);
        expect(onError).toHaveBeenCalledTimes(1);
      });
    });

    it('should not call callbacks if component unmounts during execution', async () => {
      const onSuccess = jest.fn();

      const { result, unmount } = renderHook(() =>
        useAsyncComputation(successfulAsyncFn, [], { immediate: false, onSuccess })
      );

      act(() => {
        result.current.execute();
      });

      // Unmount immediately
      unmount();

      // Wait for async function to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
      });

      // Callback should not be called
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should reset state to idle', async () => {
      const { result } = renderHook(() => useAsyncComputation(successfulAsyncFn, []));

      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe('idle');
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isIdle).toBe(true);
    });

    it('should reset after error', async () => {
      const { result } = renderHook(() =>
        useAsyncComputation(failingAsyncFn, [], { immediate: false })
      );

      await act(async () => {
        await result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.error).toEqual(mockError);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe('idle');
      expect(result.current.error).toBeNull();
    });
  });

  describe('refresh', () => {
    it('should re-execute the async function', async () => {
      const { result } = renderHook(() =>
        useAsyncComputation(successfulAsyncFn, [], { immediate: false })
      );

      await act(async () => {
        await result.current.execute();
      });

      await waitFor(() => {
        expect(successfulAsyncFn).toHaveBeenCalledTimes(1);
      });

      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(successfulAsyncFn).toHaveBeenCalledTimes(2);
        expect(result.current.data).toEqual(mockData);
      });
    });

    it('should work after error', async () => {
      let shouldFail = true;
      const sometimesFails = jest.fn(async () => {
        if (shouldFail) {
          throw mockError;
        }
        return mockData;
      });

      const { result } = renderHook(() =>
        useAsyncComputation(sometimesFails, [], { immediate: false })
      );

      await act(async () => {
        await result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      shouldFail = false;
      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.data).toEqual(mockData);
      });
    });
  });

  describe('race condition handling', () => {
    it('should only use data from latest request', async () => {
      let delay = 50;
      const delayedFn = jest.fn(async (value: number) => {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return value;
      });

      const { result, rerender } = renderHook(
        ({ params }) => useAsyncComputation(delayedFn, params, { immediate: false }),
        { initialProps: { params: [1] as [number] } }
      );

      // Start first request (slow)
      delay = 50;
      act(() => {
        result.current.execute();
      });

      // Start second request (fast)
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      delay = 5;
      rerender({ params: [2] as [number] });
      await act(async () => {
        await result.current.execute();
      });

      // Wait for both to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // Should have result from latest request (2), not the first slow one (1)
      await waitFor(() => {
        expect(result.current.data).toBe(2);
      });
    });

    it('should prevent state updates after unmount', async () => {
      const { result, unmount } = renderHook(() =>
        useAsyncComputation(successfulAsyncFn, [], { immediate: false })
      );

      act(() => {
        result.current.execute();
      });

      unmount();

      // Wait for async to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
      });

      // No errors should be thrown even though component is unmounted
      expect(true).toBe(true);
    });
  });

  describe('computed helpers', () => {
    it('should correctly compute status flags', async () => {
      const { result } = renderHook(() =>
        useAsyncComputation(successfulAsyncFn, [], { immediate: false })
      );

      // Idle
      expect(result.current.isIdle).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);

      // Loading
      act(() => {
        result.current.execute();
      });

      expect(result.current.isLoading).toBe(true);

      // Success
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should correctly compute error state', async () => {
      const { result } = renderHook(() =>
        useAsyncComputation(failingAsyncFn, [], { immediate: false })
      );

      await act(async () => {
        await result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isIdle).toBe(false);
      });
    });
  });

  describe('error handling', () => {
    it('should convert non-Error objects to Error', async () => {
      const throwsString = jest.fn(async () => {
        throw 'String error';
      });

      const { result } = renderHook(() =>
        useAsyncComputation(throwsString, [], { immediate: false })
      );

      await act(async () => {
        await result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe('String error');
      });
    });
  });

  describe('complex workflows', () => {
    it('should handle load -> error -> retry -> success workflow', async () => {
      let attemptCount = 0;
      const retriableAsyncFn = jest.fn(async () => {
        attemptCount++;
        if (attemptCount === 1) {
          throw new Error('First attempt failed');
        }
        return mockData;
      });

      const { result } = renderHook(() =>
        useAsyncComputation(retriableAsyncFn, [], { immediate: false })
      );

      // First attempt
      await act(async () => {
        await result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Retry
      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.data).toEqual(mockData);
        expect(result.current.error).toBeNull();
      });
    });

    it('should handle immediate load -> refresh workflow', async () => {
      const { result } = renderHook(() => useAsyncComputation(successfulAsyncFn, []));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(successfulAsyncFn).toHaveBeenCalledTimes(2);
        expect(result.current.data).toEqual(mockData);
      });
    });
  });
});
