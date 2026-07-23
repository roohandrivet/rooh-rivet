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
  };
  
  export default function OrderConfirmation({
    customerName,
    orderId,
    total,
  }: OrderConfirmationEmailProps) {
    return (
      <Html>
        <Head />
  
        <Preview>
          Your Rooh & Rivet order has been confirmed.
        </Preview>
  
        <Body
          style={{
            backgroundColor: "#F8F4EF",
            fontFamily:
              "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
            margin: 0,
            padding: "40px 20px",
          }}
        >
          <Container
            style={{
              maxWidth: "640px",
              margin: "0 auto",
              backgroundColor: "#FFFFFF",
              borderRadius: "20px",
              overflow: "hidden",
              border: "1px solid #ECE3DA",
            }}
          >
            <Section
              style={{
                backgroundColor: "#5A2D2D",
                padding: "40px 32px",
                textAlign: "center",
              }}
            >
              <Heading
                as="h1"
                style={{
                  color: "#FFFFFF",
                  fontSize: "34px",
                  margin: 0,
                  fontWeight: 700,
                }}
              >
                Rooh &amp; Rivet
              </Heading>
  
              <Text
                style={{
                  color: "#F4E9E3",
                  marginTop: "12px",
                  fontSize: "16px",
                }}
              >
                Luxury Handcrafted Jewellery
              </Text>
            </Section>
  
            <Section
              style={{
                padding: "40px 32px",
              }}
            >
              <Heading
                as="h2"
                style={{
                  color: "#4B2E2E",
                  fontSize: "28px",
                  marginTop: 0,
                }}
              >
                Order Confirmed ✨
              </Heading>
  
              <Text
                style={{
                  color: "#5E4A45",
                  fontSize: "16px",
                  lineHeight: "28px",
                }}
              >
                Hi {customerName},
              </Text>
  
              <Text
                style={{
                  color: "#5E4A45",
                  fontSize: "16px",
                  lineHeight: "28px",
                }}
              >
                Thank you for choosing Rooh &amp; Rivet.
                Your order has been successfully received
                and our team will begin preparing it with
                the care and craftsmanship every piece
                deserves.
              </Text>
  
              <Hr />
  
              <Text
                style={{
                  fontSize: "15px",
                  color: "#4B2E2E",
                  marginBottom: "8px",
                }}
              >
                <strong>Order Number</strong>
              </Text>
  
              <Text
                style={{
                  marginTop: 0,
                  color: "#8B6B5B",
                }}
              >
                #{orderId}
              </Text>
  
              <Text
                style={{
                  fontSize: "15px",
                  color: "#4B2E2E",
                  marginBottom: "8px",
                }}
              >
                <strong>Order Total</strong>
              </Text>
  
              <Text
                style={{
                  marginTop: 0,
                  color: "#8B6B5B",
                }}
              >
                ₹{total.toLocaleString("en-IN")}
              </Text>
  
              <Hr />
  
              <Heading
                as="h3"
                style={{
                  color: "#4B2E2E",
                  fontSize: "22px",
                }}
              >
                Estimated Timeline
              </Heading>
  
              <Text
                style={{
                  color: "#5E4A45",
                  lineHeight: "28px",
                }}
              >
                • Order Confirmed
              </Text>
  
              <Text
                style={{
                  color: "#5E4A45",
                  lineHeight: "28px",
                }}
              >
                • Packaging
              </Text>
  
              <Text
                style={{
                  color: "#5E4A45",
                  lineHeight: "28px",
                }}
              >
                • Shipped
              </Text>
  
              <Text
                style={{
                  color: "#5E4A45",
                  lineHeight: "28px",
                }}
              >
                • Delivered
              </Text>
  
              <Section
                style={{
                  textAlign: "center",
                  marginTop: "36px",
                }}
              >
                <Button
                  href="https://roohandrivet.com/account/orders"
                  style={{
                    backgroundColor: "#5A2D2D",
                    color: "#FFFFFF",
                    padding: "14px 28px",
                    borderRadius: "10px",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  View My Orders
                </Button>
              </Section>
            </Section>
  
            <Section
              style={{
                borderTop: "1px solid #ECE3DA",
                padding: "28px 32px",
                textAlign: "center",
              }}
            >
              <Text
                style={{
                  color: "#8B6B5B",
                  fontSize: "14px",
                  lineHeight: "24px",
                  margin: 0,
                }}
              >
                Thank you for supporting handcrafted
                luxury.
              </Text>
  
              <Text
                style={{
                  color: "#8B6B5B",
                  fontSize: "13px",
                  marginTop: "12px",
                }}
              >
                © {new Date().getFullYear()} Rooh &amp;
                Rivet. All rights reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    );
  }