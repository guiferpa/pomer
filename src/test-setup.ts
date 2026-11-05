// Newer Node versions (CI uses `lts/*`) have their own global `localStorage`,
// which shadows jsdom's and is undefined without `--localstorage-file`.
const { window: jsdomWindow } = (globalThis as any).jsdom;

for (const storage of ["localStorage", "sessionStorage"]) {
  Object.defineProperty(globalThis, storage, {
    configurable: true,
    value: jsdomWindow[storage],
    writable: true,
  });
}
