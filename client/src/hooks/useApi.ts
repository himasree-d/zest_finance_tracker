import { useState, useCallback, useRef, useEffect } from 'react';

export function useApi<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const execute = useCallback(async (...args: Args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fnRef.current(...args);
      setData(result);
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as any)?.response?.data?.error || 'An error occurred';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, execute };
}
