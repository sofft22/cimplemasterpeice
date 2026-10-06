const LS_KEY = 'cimmple_my_orders_v1';

export interface LocalOrder {
  token: string;
  orderId: string;
  date: string;
}

export function saveOrderLocally(order: LocalOrder) {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const list: LocalOrder[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((o) => o.token !== order.token);
    filtered.unshift(order);
    localStorage.setItem(LS_KEY, JSON.stringify(filtered.slice(0, 20)));
  } catch {
    // ignore
  }
}

export function getLocalOrders(): LocalOrder[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function clearLocalOrders() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    // ignore
  }
}