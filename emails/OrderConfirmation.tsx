import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export type OrderConfirmationEmailProps = {
  customerName: string;
  orderId: string;
  total: number;
  subtotal?: number;
  shipping?: number;
  couponCode?: string | null;
  discountAmount?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  orderStatus?: string;
};

function toSafeAmount(
  value: number | undefined
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return 0;
  }

  return Math.max(
    0,
    value
  );
}

function formatCurrency(
  amount: number
): string {
  const safeAmount =
    toSafeAmount(amount);

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      minimumFractionDigits:
        Number.isInteger(
          safeAmount
        )
          ? 0
          : 2,
      maximumFractionDigits: 2,
    }
  )
    .format(
      safeAmount
    )
    .replace(
      /\u00a0/g,
      " "
    );
}

function normaliseText(
  value: string | undefined,
  fallback: string
): string {
  const trimmedValue =
    value?.trim();

  return trimmedValue
    ? trimmedValue
    : fallback;
}

export default function OrderConfirmation({
  customerName,
  orderId,
  total,
  subtotal,
  shipping = 0,
  couponCode = null,
  discountAmount = 0,
  paymentMethod = "Not specified",
  paymentStatus = "Pending",
  orderStatus = "Pending",
}: OrderConfirmationEmailProps) {
  const safeTotal =
    toSafeAmount(total);

  const safeShipping =
    toSafeAmount(shipping);

  const safeDiscount =
    toSafeAmount(
      discountAmount
    );

  const safeSubtotal =
    typeof subtotal ===
      "number" &&
    Number.isFinite(
      subtotal
    )
      ? Math.max(
          0,
          subtotal
        )
      : Math.max(
          0,
          safeTotal +
            safeDiscount -
            safeShipping
        );

  const safeCustomerName =
    normaliseText(
      customerName,
      "Customer"
    );

  const safeOrderId =
    normaliseText(
      orderId,
      "Order"
    );

  const safePaymentMethod =
    normaliseText(
      paymentMethod,
      "Not specified"
    );

  const safePaymentStatus =
    normaliseText(
      paymentStatus,
      "Pending"
    );

  const safeOrderStatus =
    normaliseText(
      orderStatus,
      "Pending"
    );

  const normalisedCouponCode =
    couponCode
      ?.trim()
      .toUpperCase() ??
    "";

  const hasCoupon =
    Boolean(
      normalisedCouponCode
    ) &&
    safeDiscount > 0;

  const siteUrl =
    (
      process.env
        .NEXT_PUBLIC_SITE_URL ??
      "https://roohandrivet.com"
    ).replace(
      /\/+$/,
      ""
    );

  const orderUrl =
    `${siteUrl}/account/orders/${encodeURIComponent(
      safeOrderId
    )}`;

  return (
    <Html lang="en">
      <Head />

      <Preview>
        Your Rooh &amp; Rivet order
        {" "}
        #{safeOrderId}
        {" "}
        has been confirmed.
      </Preview>

      <Body
        style={{
          backgroundColor:
            "#F8F4EF",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          margin: 0,
          padding:
            "40px 20px",
        }}
      >
        <Container
          style={{
            maxWidth:
              "640px",
            margin:
              "0 auto",
            backgroundColor:
              "#FFFFFF",
            borderRadius:
              "24px",
            overflow:
              "hidden",
            border:
              "1px solid #E8DDD3",
          }}
        >
          <Section
            style={{
              backgroundColor:
                "#5A2D2D",
              padding:
                "42px 32px",
              textAlign:
                "center",
            }}
          >
            <Heading
              as="h1"
              style={{
                color:
                  "#FFFFFF",
                fontSize:
                  "34px",
                lineHeight:
                  "42px",
                margin: 0,
                fontWeight:
                  700,
              }}
            >
              Rooh &amp; Rivet
            </Heading>

            <Text
              style={{
                color:
                  "#F4E9E3",
                margin:
                  "12px 0 0",
                fontSize:
                  "14px",
                letterSpacing:
                  "2px",
                textTransform:
                  "uppercase",
              }}
            >
              Luxury Handcrafted
              Jewellery
            </Text>
          </Section>

          <Section
            style={{
              padding:
                "40px 32px",
            }}
          >
            <Text
              style={{
                color:
                  "#8B6B5B",
                fontSize:
                  "12px",
                fontWeight:
                  600,
                letterSpacing:
                  "3px",
                margin:
                  "0 0 12px",
                textTransform:
                  "uppercase",
              }}
            >
              Thank You
            </Text>

            <Heading
              as="h2"
              style={{
                color:
                  "#4B2E2E",
                fontSize:
                  "30px",
                lineHeight:
                  "38px",
                margin:
                  "0 0 24px",
              }}
            >
              Order Confirmed
            </Heading>

            <Text
              style={{
                color:
                  "#5E4A45",
                fontSize:
                  "16px",
                lineHeight:
                  "28px",
                margin:
                  "0 0 16px",
              }}
            >
              Hi {safeCustomerName},
            </Text>

            <Text
              style={{
                color:
                  "#5E4A45",
                fontSize:
                  "16px",
                lineHeight:
                  "28px",
                margin:
                  "0 0 28px",
              }}
            >
              Thank you for choosing
              Rooh &amp; Rivet. Your
              order has been received
              successfully and will be
              prepared with the care
              and craftsmanship every
              piece deserves.
            </Text>

            <Section
              style={{
                backgroundColor:
                  "#F8F4EF",
                border:
                  "1px solid #E8DDD3",
                borderRadius:
                  "16px",
                padding:
                  "24px",
              }}
            >
              <Text
                style={{
                  color:
                    "#8B6B5B",
                  fontSize:
                    "12px",
                  fontWeight:
                    600,
                  letterSpacing:
                    "2px",
                  margin:
                    "0 0 8px",
                  textTransform:
                    "uppercase",
                }}
              >
                Order Number
              </Text>

              <Text
                style={{
                  color:
                    "#4B2E2E",
                  fontSize:
                    "18px",
                  fontWeight:
                    700,
                  margin:
                    "0 0 22px",
                  wordBreak:
                    "break-all",
                }}
              >
                #{safeOrderId}
              </Text>

              <Hr
                style={{
                  borderColor:
                    "#E8DDD3",
                  margin:
                    "0 0 22px",
                }}
              />

              <Text
                style={{
                  color:
                    "#4B2E2E",
                  fontSize:
                    "15px",
                  lineHeight:
                    "24px",
                  margin:
                    "0 0 8px",
                }}
              >
                <strong>
                  Order Status:
                </strong>
                {" "}
                {safeOrderStatus}
              </Text>

              <Text
                style={{
                  color:
                    "#4B2E2E",
                  fontSize:
                    "15px",
                  lineHeight:
                    "24px",
                  margin:
                    "0 0 8px",
                }}
              >
                <strong>
                  Payment Method:
                </strong>
                {" "}
                {safePaymentMethod}
              </Text>

              <Text
                style={{
                  color:
                    "#4B2E2E",
                  fontSize:
                    "15px",
                  lineHeight:
                    "24px",
                  margin: 0,
                }}
              >
                <strong>
                  Payment Status:
                </strong>
                {" "}
                {safePaymentStatus}
              </Text>
            </Section>

            <Heading
              as="h3"
              style={{
                color:
                  "#4B2E2E",
                fontSize:
                  "22px",
                lineHeight:
                  "30px",
                margin:
                  "34px 0 20px",
              }}
            >
              Payment Summary
            </Heading>

            <Section
              style={{
                border:
                  "1px solid #E8DDD3",
                borderRadius:
                  "16px",
                padding:
                  "22px 24px",
              }}
            >
              <Text
                style={{
                  color:
                    "#7A6464",
                  fontSize:
                    "15px",
                  lineHeight:
                    "24px",
                  margin:
                    "0 0 12px",
                }}
              >
                Subtotal
                <span
                  style={{
                    float:
                      "right",
                    color:
                      "#4B2E2E",
                  }}
                >
                  {formatCurrency(
                    safeSubtotal
                  )}
                </span>
              </Text>

              <Text
                style={{
                  color:
                    "#7A6464",
                  fontSize:
                    "15px",
                  lineHeight:
                    "24px",
                  margin:
                    hasCoupon
                      ? "0 0 12px"
                      : 0,
                }}
              >
                Shipping
                <span
                  style={{
                    float:
                      "right",
                    color:
                      safeShipping ===
                      0
                        ? "#16794C"
                        : "#4B2E2E",
                    fontWeight:
                      safeShipping ===
                      0
                        ? 600
                        : 400,
                  }}
                >
                  {safeShipping ===
                  0
                    ? "Free"
                    : formatCurrency(
                        safeShipping
                      )}
                </span>
              </Text>

              {hasCoupon ? (
                <Text
                  style={{
                    color:
                      "#16794C",
                    fontSize:
                      "15px",
                    lineHeight:
                      "24px",
                    margin: 0,
                  }}
                >
                  Coupon
                  {" "}
                  {normalisedCouponCode}
                  <span
                    style={{
                      float:
                        "right",
                    }}
                  >
                    -
                    {formatCurrency(
                      safeDiscount
                    )}
                  </span>
                </Text>
              ) : null}

              <Hr
                style={{
                  borderColor:
                    "#E8DDD3",
                  margin:
                    "18px 0",
                }}
              />

              <Text
                style={{
                  color:
                    "#4B2E2E",
                  fontSize:
                    "19px",
                  fontWeight:
                    700,
                  lineHeight:
                    "28px",
                  margin: 0,
                }}
              >
                Total
                <span
                  style={{
                    float:
                      "right",
                  }}
                >
                  {formatCurrency(
                    safeTotal
                  )}
                </span>
              </Text>

              <Text
                style={{
                  color:
                    "#8B6B5B",
                  fontSize:
                    "12px",
                  lineHeight:
                    "20px",
                  margin:
                    "14px 0 0",
                  textAlign:
                    "right",
                }}
              >
                All amounts are in INR.
              </Text>
            </Section>

            <Heading
              as="h3"
              style={{
                color:
                  "#4B2E2E",
                fontSize:
                  "22px",
                lineHeight:
                  "30px",
                margin:
                  "34px 0 18px",
              }}
            >
              Estimated Timeline
            </Heading>

            <Section
              style={{
                backgroundColor:
                  "#FCFAF8",
                borderRadius:
                  "16px",
                padding:
                  "20px 24px",
              }}
            >
              <Text
                style={{
                  color:
                    "#5E4A45",
                  fontSize:
                    "15px",
                  lineHeight:
                    "26px",
                  margin:
                    "0 0 10px",
                }}
              >
                ✓ Order Confirmed
              </Text>

              <Text
                style={{
                  color:
                    "#5E4A45",
                  fontSize:
                    "15px",
                  lineHeight:
                    "26px",
                  margin:
                    "0 0 10px",
                }}
              >
                • Packaging
              </Text>

              <Text
                style={{
                  color:
                    "#5E4A45",
                  fontSize:
                    "15px",
                  lineHeight:
                    "26px",
                  margin:
                    "0 0 10px",
                }}
              >
                • Shipped
              </Text>

              <Text
                style={{
                  color:
                    "#5E4A45",
                  fontSize:
                    "15px",
                  lineHeight:
                    "26px",
                  margin: 0,
                }}
              >
                • Delivered
              </Text>
            </Section>

            <Section
              style={{
                textAlign:
                  "center",
                marginTop:
                  "36px",
              }}
            >
              <Button
                href={orderUrl}
                style={{
                  backgroundColor:
                    "#5A2D2D",
                  color:
                    "#FFFFFF",
                  padding:
                    "15px 30px",
                  borderRadius:
                    "999px",
                  textDecoration:
                    "none",
                  fontSize:
                    "15px",
                  fontWeight:
                    600,
                }}
              >
                View Your Order
              </Button>
            </Section>

            <Text
              style={{
                color:
                  "#8B6B5B",
                fontSize:
                  "13px",
                lineHeight:
                  "22px",
                margin:
                  "28px 0 0",
                textAlign:
                  "center",
              }}
            >
              You will receive another
              email when your order has
              been shipped.
            </Text>
          </Section>

          <Section
            style={{
              backgroundColor:
                "#FCFAF8",
              borderTop:
                "1px solid #E8DDD3",
              padding:
                "28px 32px",
              textAlign:
                "center",
            }}
          >
            <Text
              style={{
                color:
                  "#8B6B5B",
                fontSize:
                  "14px",
                lineHeight:
                  "24px",
                margin: 0,
              }}
            >
              Thank you for supporting
              handcrafted luxury.
            </Text>

            <Text
              style={{
                color:
                  "#8B6B5B",
                fontSize:
                  "13px",
                lineHeight:
                  "22px",
                margin:
                  "12px 0 0",
              }}
            >
              ©
              {" "}
              {new Date().getFullYear()}
              {" "}
              Rooh &amp; Rivet. All
              rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}