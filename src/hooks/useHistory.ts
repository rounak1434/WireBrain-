import { useState, useCallback, useRef } from 'react';

export interface HistoryManager<T> {
  state: T;
  set: (next: T | ((prev: T) => T), recordHistory?: boolean) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  reset: (initial: T) => void;
}

export function useHistory<T>(initialState: T, maxHistory: number = 50): HistoryManager<T> {
  const [current, setCurrent] = useState<T>(initialState);
  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);
  const [, setVersion] = useState(0);

  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const set = useCallback(
    (next: T | ((prev: T) => T), recordHistory: boolean = true) => {
      setCurrent((prev) => {
        const nextValue = typeof next === 'function' ? (next as (prev: T) => T)(prev) : next;
        if (recordHistory) {
          pastRef.current.push(prev);
          if (pastRef.current.length > maxHistory) {
            pastRef.current.shift();
          }
          futureRef.current = [];
          bump();
        }
        return nextValue;
      });
    },
    [maxHistory, bump]
  );

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    const previous = pastRef.current.pop()!;
    setCurrent((prev) => {
      futureRef.current.unshift(prev);
      return previous;
    });
    bump();
  }, [bump]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current.shift()!;
    setCurrent((prev) => {
      pastRef.current.push(prev);
      return next;
    });
    bump();
  }, [bump]);

  const reset = useCallback((initial: T) => {
    pastRef.current = [];
    futureRef.current = [];
    setCurrent(initial);
  }, []);

  return {
    state: current,
    set,
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
    reset,
  };
}
