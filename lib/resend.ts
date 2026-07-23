import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  throw new Error(
    "Missing RESEND_API_KEY. Add it to your .env.local file."
  );
}

export const resend = new Resend(apiKey);

export const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "Rooh & Rivet <onboarding@resend.dev>";