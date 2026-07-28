import "server-only";
import { Resend } from "resend";

export async function sendDownloadEmail(params: {
  to: string;
  productTitle: string;
  downloadUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    // Optional integration: the success page already shows the download link,
    // so a missing Resend key should not break the purchase flow.
    console.warn("RESEND_API_KEY not set — skipping confirmation email");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
    to: params.to,
    subject: `Tu descarga: ${params.productTitle}`,
    html: `
      <p>¡Gracias por tu compra!</p>
      <p><strong>${params.productTitle}</strong> ya está lista para descargar.</p>
      <p><a href="${params.downloadUrl}">Descargar ahora</a></p>
      <p style="color:#666;font-size:12px">Este link expira en 1 hora por seguridad. Si expira, escribinos para reenviarlo.</p>
    `,
  });
}
