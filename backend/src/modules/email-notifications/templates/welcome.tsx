import React from 'react'
import {
  Body,
  Button,
  Container,
  Column,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components"

interface WelcomeTemplateProps {
  customer: {
    first_name?: string
    last_name?: string
    email: string
  }
}

export const WelcomeTemplate = ({
  customer,
}: WelcomeTemplateProps) => {
  const customerName = customer.first_name || "Valued Customer"

  return (
    <Html>
      <Head />
      <Preview>Welcome to KCT Menswear - Your Premium Menswear Destination</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>KCT MENSWEAR</Heading>
            <Text style={tagline}>Premium Men's Fashion Since 1985</Text>
          </Section>

          {/* Welcome Section */}
          <Section style={content}>
            <Heading style={welcomeHeading}>
              Welcome to KCT Menswear, {customerName}!
            </Heading>

            <Text style={paragraph}>
              Thank you for creating an account with KCT Menswear. We're thrilled to have you join our
              distinguished community of well-dressed gentlemen.
            </Text>

            <Text style={paragraph}>
              As a member of KCT Menswear, you now have access to:
            </Text>

            <Section style={benefitsSection}>
              <Row style={benefitRow}>
                <Column style={benefitIcon}>✓</Column>
                <Column style={benefitText}>
                  <Text style={benefitTitle}>Exclusive Member Pricing</Text>
                  <Text style={benefitDescription}>
                    Enjoy special discounts on our premium collection
                  </Text>
                </Column>
              </Row>

              <Row style={benefitRow}>
                <Column style={benefitIcon}>✓</Column>
                <Column style={benefitText}>
                  <Text style={benefitTitle}>Early Access</Text>
                  <Text style={benefitDescription}>
                    Be the first to shop new arrivals and seasonal collections
                  </Text>
                </Column>
              </Row>

              <Row style={benefitRow}>
                <Column style={benefitIcon}>✓</Column>
                <Column style={benefitText}>
                  <Text style={benefitTitle}>Personal Styling Service</Text>
                  <Text style={benefitDescription}>
                    Get expert advice from our professional stylists
                  </Text>
                </Column>
              </Row>

              <Row style={benefitRow}>
                <Column style={benefitIcon}>✓</Column>
                <Column style={benefitText}>
                  <Text style={benefitTitle}>Order Tracking</Text>
                  <Text style={benefitDescription}>
                    Track your orders and manage your account easily
                  </Text>
                </Column>
              </Row>
            </Section>

            <Section style={ctaSection}>
              <Button
                style={primaryButton}
                href="https://kct-menswear-medusa-test.vercel.app/account"
              >
                Visit Your Account
              </Button>
            </Section>

            <Text style={paragraph}>
              Browse our latest collections and discover premium suits, tuxedos,
              and formal wear that define sophistication.
            </Text>

            <Section style={collectionsSection}>
              <Heading style={sectionHeading}>Featured Collections</Heading>

              <Row>
                <Column style={collectionColumn}>
                  <Link href="https://kct-menswear-medusa-test.vercel.app/categories/suits" style={collectionLink}>
                    <Text style={collectionTitle}>Business Suits</Text>
                    <Text style={collectionDescription}>Professional elegance</Text>
                  </Link>
                </Column>

                <Column style={collectionColumn}>
                  <Link href="https://kct-menswear-medusa-test.vercel.app/categories/tuxedos" style={collectionLink}>
                    <Text style={collectionTitle}>Tuxedos</Text>
                    <Text style={collectionDescription}>Black-tie perfection</Text>
                  </Link>
                </Column>

                <Column style={collectionColumn}>
                  <Link href="https://kct-menswear-medusa-test.vercel.app/categories/wedding" style={collectionLink}>
                    <Text style={collectionTitle}>Wedding</Text>
                    <Text style={collectionDescription}>Your special day</Text>
                  </Link>
                </Column>
              </Row>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Need assistance? Our customer service team is here to help.
            </Text>
            <Link href="mailto:support@kctmenswear.com" style={footerLink}>
              support@kctmenswear.com
            </Link>
            <Text style={footerText}>
              1-800-KCT-SUIT | Mon-Fri 9AM-6PM EST
            </Text>

            <Section style={socialLinks}>
              <Link href="#" style={socialLink}>Instagram</Link>
              <Text style={socialDivider}>|</Text>
              <Link href="#" style={socialLink}>Facebook</Link>
              <Text style={socialDivider}>|</Text>
              <Link href="#" style={socialLink}>Twitter</Link>
            </Section>

            <Text style={copyright}>
              © 2024 KCT Menswear. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default WelcomeTemplate

// Styles
const main = {
  backgroundColor: "#f6f6f6",
  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
}

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  width: "600px",
  maxWidth: "100%",
}

const header = {
  backgroundColor: "#1a1a1a",
  padding: "32px 40px",
  textAlign: "center" as const,
}

const logo = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "300",
  letterSpacing: "4px",
  margin: "0 0 8px",
}

const tagline = {
  color: "#cccccc",
  fontSize: "12px",
  fontWeight: "400",
  letterSpacing: "1px",
  margin: "0",
  textTransform: "uppercase" as const,
}

const content = {
  backgroundColor: "#ffffff",
  padding: "40px",
}

const welcomeHeading = {
  color: "#1a1a1a",
  fontSize: "28px",
  fontWeight: "300",
  lineHeight: "1.3",
  margin: "0 0 24px",
}

const sectionHeading = {
  color: "#1a1a1a",
  fontSize: "20px",
  fontWeight: "400",
  lineHeight: "1.3",
  margin: "32px 0 16px",
}

const paragraph = {
  color: "#555555",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "16px 0",
}

const benefitsSection = {
  margin: "24px 0",
}

const benefitRow = {
  marginBottom: "16px",
}

const benefitIcon = {
  color: "#d4a574",
  fontSize: "20px",
  fontWeight: "bold",
  paddingRight: "12px",
  verticalAlign: "top" as const,
  width: "32px",
}

const benefitText = {
  verticalAlign: "top" as const,
}

const benefitTitle = {
  color: "#1a1a1a",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 4px",
}

const benefitDescription = {
  color: "#777777",
  fontSize: "14px",
  lineHeight: "1.4",
  margin: "0",
}

const ctaSection = {
  margin: "32px 0",
  textAlign: "center" as const,
}

const primaryButton = {
  backgroundColor: "#1a1a1a",
  borderRadius: "4px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: "500",
  letterSpacing: "1px",
  padding: "14px 32px",
  textDecoration: "none",
  textTransform: "uppercase" as const,
}

const collectionsSection = {
  borderTop: "1px solid #eeeeee",
  marginTop: "32px",
  paddingTop: "24px",
}

const collectionColumn = {
  padding: "0 8px",
  textAlign: "center" as const,
  width: "33.333%",
}

const collectionLink = {
  textDecoration: "none",
}

const collectionTitle = {
  color: "#1a1a1a",
  fontSize: "16px",
  fontWeight: "500",
  margin: "0 0 4px",
}

const collectionDescription = {
  color: "#999999",
  fontSize: "13px",
  fontStyle: "italic",
  margin: "0",
}

const footer = {
  backgroundColor: "#f9f9f9",
  padding: "32px 40px",
  textAlign: "center" as const,
}

const footerText = {
  color: "#777777",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "4px 0",
}

const footerLink = {
  color: "#1a1a1a",
  fontSize: "13px",
  textDecoration: "underline",
}

const socialLinks = {
  margin: "16px 0",
}

const socialLink = {
  color: "#1a1a1a",
  fontSize: "13px",
  margin: "0 8px",
  textDecoration: "none",
}

const socialDivider = {
  color: "#cccccc",
  fontSize: "13px",
  margin: "0 4px",
}

const copyright = {
  color: "#999999",
  fontSize: "11px",
  marginTop: "16px",
}