/** Sane upper bound on how many line items a single checkout/cart-items request can carry — cheap guard against someone submitting an absurdly large product_id list. */
export const MAX_CART_ITEMS = 30;
