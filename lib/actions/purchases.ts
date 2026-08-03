"use server";

import { redirect } from "next/navigation";
import { getPaidOrdersForEmail } from "@/lib/db/orders";
import { getProductByIdForAdmin } from "@/lib/db/products";
import { getDeliverables } from "@/lib/delivery";
import { sendDownloadEmail } from "@/lib/email/resend";
import { claimResendSlot } from "@/lib/db/email-resend-log";

/** Re-emails everything an email address has bought — rate-limited to once a day, no accounts/passwords. */
export async function resendPurchasesAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) redirect("/mis-compras");

  // Atomic claim-then-send: doing this before the (slower) deliverables
  // lookup, as a single database operation, means two requests arriving at
  // nearly the same time can't both slip through before either had a
  // chance to record the cooldown.
  const claimed = await claimResendSlot(email);
  if (!claimed) {
    redirect(`/mis-compras?email=${encodeURIComponent(email)}&resend=cooldown`);
  }

  const orders = await getPaidOrdersForEmail(email);
  const seenProductIds = new Set<string>();
  const deliverables = [];

  for (const order of orders) {
    if (seenProductIds.has(order.product_id)) continue;
    seenProductIds.add(order.product_id);

    const product = await getProductByIdForAdmin(order.product_id);
    if (product) deliverables.push(...(await getDeliverables(product)));
  }

  if (deliverables.length > 0) {
    await sendDownloadEmail({ to: email, productTitle: "tus compras en Lisys", items: deliverables });
  }

  redirect(`/mis-compras?email=${encodeURIComponent(email)}&resend=sent`);
}
