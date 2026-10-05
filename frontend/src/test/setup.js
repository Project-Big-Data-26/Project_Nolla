import "@testing-library/jest-dom/vitest";

// Node >= 22 exposes an experimental global `localStorage` that shadows
// jsdom's and has no methods unless --localstorage-file is given.
// Replace it with a simple in-memory Storage so tests behave the same on any Node version.
const createStorage = () => {
  let store = new Map();
  return {
    get length() {
      return store.size;
    },
    key: (i) => Array.from(store.keys())[i] ?? null,
    getItem: (k) => (store.has(String(k)) ? store.get(String(k)) : null),
    setItem: (k, v) => void store.set(String(k), String(v)),
    removeItem: (k) => void store.delete(String(k)),
    clear: () => void (store = new Map()),
  };
};

for (const name of ["localStorage", "sessionStorage"]) {
  Object.defineProperty(globalThis, name, {
    value: createStorage(),
    configurable: true,
    writable: true,
  });
}
