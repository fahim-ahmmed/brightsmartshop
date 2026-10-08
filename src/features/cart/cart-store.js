// ব্রাউজারের localStorage-এ কার্ট থাকে; সার্ভার শুধু অর্ডারের সময় দাম ও স্টক আবার যাচাই করে।
const KEY = 'bss-cart-v1';
const EMPTY = { items: [] };
const MAX_QTY = 20;

let state = EMPTY;
let loaded = false;
const listeners = new Set();

function read() {
  try {
    const items = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(items) ? { items } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  state = read();
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) set(read(), false);
  });
}

function set(next, persist = true) {
  state = next;
  if (persist) {
    try {
      localStorage.setItem(KEY, JSON.stringify(next.items));
    } catch {}
  }
  listeners.forEach((l) => l());
}

const limitFor = (stock) => Math.min(MAX_QTY, stock ?? MAX_QTY);

export const cartStore = {
  subscribe(listener) {
    load();
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    load();
    return state;
  },
  getServerSnapshot: () => EMPTY,

  add(product, qty = 1) {
    const items = [...state.items];
    const i = items.findIndex((x) => x.productId === product.id);
    if (i >= 0) {
      items[i] = { ...items[i], stock: product.stock, qty: Math.min(limitFor(product.stock), items[i].qty + qty) };
    } else {
      items.push({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.image,
        pricePaisa: product.pricePaisa,
        pointsX100: product.pointsX100,
        stock: product.stock,
        qty: Math.min(limitFor(product.stock), qty),
      });
    }
    set({ items });
  },
  setQty(productId, qty) {
    const items = state.items
      .map((x) => (x.productId === productId ? { ...x, qty: Math.min(limitFor(x.stock), qty) } : x))
      .filter((x) => x.qty > 0);
    set({ items });
  },
  remove(productId) {
    set({ items: state.items.filter((x) => x.productId !== productId) });
  },
  clear() {
    set({ items: [] });
  },
};
