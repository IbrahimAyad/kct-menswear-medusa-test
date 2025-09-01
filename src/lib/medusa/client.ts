import Medusa from "@medusajs/js-sdk"

// Medusa client configuration with proper auth setup
// IMPORTANT: Using the new KCT Menswear sales channel publishable key
export const medusa = new Medusa({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://backend-production-7441.up.railway.app",
  maxRetries: 3,
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "pk_58348c0c95bd27ad28bce27481ac65396899a29c70b3b86bc129318bdef8ce14",
  auth: {
    type: "jwt" // Using JWT token authentication
  }
})

// Configuration constants
export const MEDUSA_CONFIG = {
  regionId: process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || "reg_01K3S6NDGAC1DSWH9MCZCWBWWD",
  regionIdEU: process.env.NEXT_PUBLIC_MEDUSA_REGION_ID_EU || "reg_01K3PJN8B4519MH0QRFMB62J42",
  salesChannelId: process.env.NEXT_PUBLIC_SALES_CHANNEL_ID || "sc_01K3S6WP4KCEJX26GNPQKTHTBE",
  currency: "usd",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "pk_58348c0c95bd27ad28bce27481ac65396899a29c70b3b86bc129318bdef8ce14",
}

// Helper to check connection
export async function checkMedusaConnection() {
  try {
    const regions = await medusa.store.region.list()
    return { connected: true, regions }
  } catch (error) {
    console.error("Medusa connection failed:", error)
    return { connected: false, error }
  }
}