import type { Ref } from 'vue'

interface PersistedState<T> {
  data: T;
  timestamp: number;
}

/**
 * A reactive and persistent state that automatically invalidates after a given period.
 *
 * @param identifier A unique key for the localStorage item.
 * @param defaultOptions The default value if nothing is stored or the data is expired.
 * @param periodInMs The duration in milliseconds after which the state is considered stale. Defaults to Infinity.
 * @returns A reactive Ref.
 */
export const usePersistedState = <T>(
  identifier: string,
  defaultOptions: T,
  periodInMs: number = Infinity
): Ref<T> => {
  
  const persistedObject = useState<T>(identifier, (): T => {
    if (typeof window === 'undefined') {
      return defaultOptions;
    }

    const item = localStorage.getItem(identifier);
    if (!item || item === "undefined") {
      return defaultOptions;
    }

    try {
      const state: PersistedState<T> = JSON.parse(item);
      const isStale = Date.now() - state.timestamp > periodInMs;

      if (isStale) {
        localStorage.removeItem(identifier);
        return defaultOptions;
      }

      return state.data ?? defaultOptions;
    } catch {
      return defaultOptions;
    }
  });

  if (typeof window !== 'undefined') {
    watch(persistedObject, (newData) => {
      if (newData === null || newData === undefined) {
        localStorage.removeItem(identifier);
      } else {
        const stateToStore: PersistedState<T> = {
          data: newData,
          timestamp: Date.now(),
        };
        localStorage.setItem(identifier, JSON.stringify(stateToStore));
      }
    }, { deep: true });
  }

  return persistedObject;
};
