import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSupabaseQuery } from './useSupabaseQuery';

describe('useSupabaseQuery', () => {
  it('returns loading=true initially, then data', async () => {
    const queryFn = vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null });

    const { result } = renderHook(() => useSupabaseQuery(queryFn, []));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual([{ id: 1 }]);
    expect(result.current.error).toBeNull();
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it('sets error when query returns error', async () => {
    const queryFn = vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } });

    const { result } = renderHook(() => useSupabaseQuery(queryFn, []));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toEqual({ message: 'boom' });
    expect(result.current.data).toBeNull();
  });

  it('skips query when enabled=false', async () => {
    const queryFn = vi.fn().mockResolvedValue({ data: 'x', error: null });

    const { result } = renderHook(() =>
      useSupabaseQuery(queryFn, [], { enabled: false }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(queryFn).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
  });

  it('refetches when deps change', async () => {
    let counter = 0;
    const queryFn = vi.fn().mockImplementation(async () => ({
      data: ++counter,
      error: null,
    }));

    const { result, rerender } = renderHook(
      ({ dep }) => useSupabaseQuery(queryFn, [dep]),
      { initialProps: { dep: 'a' } },
    );

    await waitFor(() => expect(result.current.data).toBe(1));

    rerender({ dep: 'b' });

    await waitFor(() => expect(result.current.data).toBe(2));
    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it('refetch() re-runs the query', async () => {
    let counter = 0;
    const queryFn = vi.fn().mockImplementation(async () => ({
      data: ++counter,
      error: null,
    }));

    const { result } = renderHook(() => useSupabaseQuery(queryFn, []));

    await waitFor(() => expect(result.current.data).toBe(1));

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.data).toBe(2);
    expect(queryFn).toHaveBeenCalledTimes(2);
  });
});
