type SafeLocalStorageRead = {
  isBrowser: boolean;
  value: string | null;
};

const fallbackLocalStorage = new Map<string, string>();

export const safeLocalStorage = {
  getItem: (key: string): SafeLocalStorageRead => {
    if (typeof window === "undefined") {
      return { isBrowser: false, value: null };
    }

    try {
      return {
        isBrowser: true,
        value: window.localStorage.getItem(key),
      };
    } catch {
      return {
        isBrowser: true,
        value: fallbackLocalStorage.get(key) ?? null,
      };
    }
  },

  setItem: (key: string, value: string): boolean => {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      fallbackLocalStorage.set(key, value);
      return false;
    }
  },
};
