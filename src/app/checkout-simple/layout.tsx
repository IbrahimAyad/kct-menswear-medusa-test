import { MedusaAuthProvider } from '@/contexts/MedusaAuthContext'
import { MedusaCartProvider } from '@/contexts/MedusaCartContext'

export default function CheckoutSimpleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MedusaAuthProvider>
      <MedusaCartProvider>
        {children}
      </MedusaCartProvider>
    </MedusaAuthProvider>
  )
}