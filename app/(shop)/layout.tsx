import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartProvider } from "@/components/shop/cart-context";
import { CartModal } from "@/components/shop/cart-modal";
import { FloatingCartButton } from "@/components/shop/floating-cart-button";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </div>
      <FloatingCartButton />
      <CartModal />
    </CartProvider>
  );
}
