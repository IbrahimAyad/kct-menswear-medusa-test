'use client';

import { useRouter } from 'next/navigation';
import { useMedusaCart } from '@/hooks/useMedusaCart';

export function MedusaCheckoutButton() {
  const router = useRouter();
  const { medusaCart, isLoading } = useMedusaCart();
  
  const handleCheckout = () => {
    // Redirect to the new Stripe checkout page
    router.push('/checkout-stripe');
  };

  const total = (medusaCart?.total || 0) / 100;
  const itemCount = medusaCart?.items?.length || 0;

  return (
    <div className="space-y-2">
      <button
        onClick={handleCheckout}
        disabled={isLoading || itemCount === 0}
        className="w-full bg-black text-white py-4 px-6 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        Checkout - ${total.toFixed(2)}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Secure checkout powered by Stripe
      </p>
    </div>
  );
}