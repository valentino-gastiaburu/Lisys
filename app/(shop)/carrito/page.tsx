import { CartPanel } from "@/components/shop/cart-panel";

export default function CartPage() {
  return (
    <main className="mx-auto w-full max-w-lg px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Tu carrito</h1>
      <div className="mt-6">
        <CartPanel />
      </div>
    </main>
  );
}
