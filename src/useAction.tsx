import { useCallback, useState } from "react";
import { useIsComponentMounted } from "./useIsComponentMounted";

export interface UseActionConfig<R> {
  onError?: (e: unknown) => any;
  onSuccess?: (response: Exclude<R, null>) => void;
}

export function useAction<T extends (...args: Array<any>) => Promise<any>>(
  fn: T,
  config: UseActionConfig<Awaited<ReturnType<typeof fn>>> = {}
) {
  const isComponentMounted = useIsComponentMounted();

  const { onError, onSuccess } = config;

  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<any>();

  const action = useCallback(
    async (...args: Parameters<T> | Array<never>): Promise<Awaited<ReturnType<T>> | null> => {
      try {
        setIsLoading(true);
        const response = await fn(...args);
        if (isComponentMounted()) {
          onSuccess?.(response);
        }
        return response;
      } catch (e) {
        if (isComponentMounted()) {
          setError(e);
          onError?.(e);
        }
        return null;
      } finally {
        if (isComponentMounted()) {
          setIsInitialLoading(false);
          setIsLoading(false);
        }
      }
    },
    [isComponentMounted, fn, onError, onSuccess]
  );

  return {
    action,
    isLoading,
    isInitialLoading,
    error,
  };
}
