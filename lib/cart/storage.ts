// Cart persistence lives entirely in the browser and stores only product
// ids — never prices or titles — so what gets charged always comes fresh
// from the server at checkout time, never from something a user could edit
// in devtools.

const STORAGE_KEY = "lisys_cart";
const CART_EVENT = "lisys-cart-updated";

function readIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  // `storage` only fires in other tabs — this notifies listeners in the
  // current tab (e.g. the header's cart count) right away.
  window.dispatchEvent(new Event(CART_EVENT));
}

export function getCartIds(): string[] {
  return readIds();
}

export function addToCart(productId: string): string[] {
  const ids = readIds();
  if (!ids.includes(productId)) ids.push(productId);
  writeIds(ids);
  return ids;
}

export function removeFromCart(productId: string): string[] {
  const ids = readIds().filter((id) => id !== productId);
  writeIds(ids);
  return ids;
}

export function setCartIds(ids: string[]): void {
  writeIds(ids);
}

export function clearCart(): void {
  writeIds([]);
}

export function subscribeToCart(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(CART_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CART_EVENT, callback);
  };
}
