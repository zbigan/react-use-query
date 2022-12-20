import { useCallback, useEffect, useState } from "react";
import { useAction, UseActionConfig } from "../UseAction/useAction";
import { useIsComponentMounted } from "../UseIsComponentMounted/useIsComponentMounted";

export interface UseQueryConfig<U extends (...args: any) => any>
  extends UseActionConfig<Awaited<ReturnType<U>>> {
  args?: Parameters<U>;
}

export function useQuery<T extends (...args: Array<any>) => Promise<any>>(
  fn: T,
  config: UseQueryConfig<typeof fn> = {}
) {
  const { args = [], onError, onSuccess } = config;

  const isComponentMounted = useIsComponentMounted();

  const { action, isLoading, isInitialLoading, error } = useAction(fn, {
    onError,
    onSuccess,
  });

  const [data, setData] = useState<Awaited<ReturnType<typeof fn>> | null>(null);

  const refetch = useCallback(
    async function (...newArgs: Parameters<typeof fn> | Array<never>) {
      const finalArgs = newArgs.length ? newArgs : args;
      const data = await action(...finalArgs);
      if (isComponentMounted()) setData(data as Awaited<ReturnType<T>>);
    },
    [action]
  );

  useEffect(() => {
    refetch(...args);
  }, [action, ...args]);

  return {
    refetch,
    data,
    isLoading,
    isInitialLoading,
    error,
  };
}
