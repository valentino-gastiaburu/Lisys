import "server-only";
import { Resend } from "resend";

export async function sendDownloadEmail(params: {
  to: string;
  productTitle: string;
  items: { label: string; url: string }[];
}) {
  if (!process.env.RESEND_API_KEY) {
    // Optional integration: the success page already shows the download link(s),
    // so a missing Resend key should not break the purchase flow.
    console.warn("RESEND_API_KEY not set — skipping confirmation email");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const linksHtml = params.items
    .map((item) => `<p><a href="${item.url}">${item.label}</a></p>`)
    .join("");

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
    to: params.to,
    subject: `Tu descarga: ${params.productTitle}`,
    html: `
      <p>¡Gracias por tu compra!</p>
      <p><strong>${params.productTitle}</strong> ya está lista.</p>
      ${linksHtml}
      <p style="color:#666;font-size:12px">Si algún link no funciona o expiró, escribinos para reenviarlo.</p>
    `,
  });
}
