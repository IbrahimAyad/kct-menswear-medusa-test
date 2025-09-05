import Medusa from "@medusajs/medusa-js"

// Create Medusa client with proper configuration
const medusaClient = new Medusa({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://backend-production-7441.up.railway.app",
  maxRetries: 3,
  publishableApiKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "pk_58348c0c95bd27ad28bce27481ac65396899a29c70b3b86bc129318bdef8ce14",
})

export default medusaClient

// Export the region ID for consistency
export const MEDUSA_REGION_ID = "reg_01K3S6NDGAC1DSWH9MCZCWBWWD" // US Region