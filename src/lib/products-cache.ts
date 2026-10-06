import type { Product } from '../types';

let cached: Product[] | null = null;
let inflight: Promise<Product[]> | null = null;
let loadedAt = 0;
const TTL = 5 * 60 * 1000; // 5 minutes

export function peekProducts(): Product[] | null {
  if (!cached) return null;
  if (Date.now() - loadedAt > TTL) return null;
  return cached;
}

export function primeProducts(p: Product[]) {
  cached = p;
  loadedAt = Date.now();
}

export function loadProducts(fetcher: () => Promise<Product[]>): Promise<Product[]> {
  const hit = peekProducts();
  if (hit) return Promise.resolve(hit);
  if (inflight) return inflight;
  inflight = fetcher()
    .then((p) => {
      cached = p;
      loadedAt = Date.now();
      inflight = null;
      return p;
    })
    .catch((e) => {
      inflight = null;
      throw e;
    });
  return inflight;
}