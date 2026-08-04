import "server-only";

import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import Razorpay from "razorpay";

let razorpayClient: Razorpay | null = null;

function getRazorpayCredentials(): {
  keyId: string;
  keySecret: string;
} {
  const keyId =
    process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret =
    process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId) {
    throw new Error(
      "Missing RAZORPAY_KEY_ID environment variable."
    );
  }

  if (!keySecret) {
    throw new Error(
      "Missing RAZORPAY_KEY_SECRET environment variable."
    );
  }

  return {
    keyId,
    keySecret,
  };
}

export function getRazorpayKeyId(): string {
  return getRazorpayCredentials().keyId;
}

export function getRazorpayClient(): Razorpay {
  if (razorpayClient) {
    return razorpayClient;
  }

  const {
    keyId,
    keySecret,
  } = getRazorpayCredentials();

  razorpayClient = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  return razorpayClient;
}

export function verifyRazorpaySignature(
  serverOrderId: string,
  paymentId: string,
  receivedSignature: string
): boolean {
  const {
    keySecret,
  } = getRazorpayCredentials();

  const normalizedSignature =
    receivedSignature.trim();

  if (
    !/^[a-f0-9]{64}$/i.test(
      normalizedSignature
    )
  ) {
    return false;
  }

  const expectedSignature = createHmac(
    "sha256",
    keySecret
  )
    .update(
      `${serverOrderId}|${paymentId}`
    )
    .digest("hex");

  const expectedBuffer = Buffer.from(
    expectedSignature,
    "hex"
  );
  const receivedBuffer = Buffer.from(
    normalizedSignature,
    "hex"
  );

  return (
    expectedBuffer.length ===
      receivedBuffer.length &&
    timingSafeEqual(
      expectedBuffer,
      receivedBuffer
    )
  );
}