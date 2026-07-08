type SafeSessionStorageRead = {
  isBrowser: boolean;
  value: string | null;
};

const fallbackSessionStorage = new Map<string, string>();

export const safeSessionStorage = {
  getItem: (key: string): SafeSessionStorageRead => {
    if (typeof window === "undefined") {
      return { isBrowser: false, value: null };
    }

    try {
      return {
        isBrowser: true,
        value: window.sessionStorage.getItem(key),
      };
    } catch {
      return {
        isBrowser: true,
        value: fallbackSessionStorage.get(key) ?? null,
      };
    }
  },

  setItem: (key: string, value: string): boolean => {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      window.sessionStorage.setItem(key, value);
      return true;
    } catch {
      fallbackSessionStorage.set(key, value);
      return false;
    }
  },
};
