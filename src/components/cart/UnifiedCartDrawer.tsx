'use client';

import { useState, useEffect } from 'react';
import { useMedusaCart } from '@/hooks/useMedusaCart';
import { useCoreCart } from '@/contexts/CoreCartContext';
import { X, ShoppingCart, Trash2, Plus, Minus, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { useRouter } from 'next/navigation';
import { getCheckoutType } from '@/lib/config/product-routing';

export function UnifiedCartDrawer() {
  const router = useRouter();
  const { cart: medusaCart, removeItem: removeMedusaItem, updateQuantity: updateMedusaQuantity, isLoading: medusaLoading } = useMedusaCart();
  const { items: coreItems, removeItem: removeCoreItem, updateQuantity: updateCoreQuantity, getTotalPrice: getCoreTotalPrice, clearCart: clearCoreCart } = useCoreCart();
  const { isCartOpen, setIsCartOpen } = useUIStore();
  const [dragProgress, setDragProgress] = useState(0);

  // Combine items from both carts
  const medusaItems = medusaCart?.items || [];
  const allItems = [
    ...coreItems.map(item => ({ ...item, type: 'core' as const })),
    ...medusaItems.map(item => ({ ...item, type: 'medusa' as const }))
  ];

  // Calculate totals
  const coreTotal = getCoreTotalPrice();
  const medusaTotal = medusaCart?.total || 0;
  const totalPrice = coreTotal + medusaTotal;
  const itemCount = coreItems.length + medusaItems.length;

  // Determine checkout type
  const checkoutType = getCheckoutType([...coreItems, ...medusaItems]);

  // Haptic feedback
  const triggerHaptic = (pattern: number | number[] = 10) => {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  // Close drawer on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartOpen) {
        setIsCartOpen(false);
      }
    };

    if (isCartOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isCartOpen, setIsCartOpen]);

  const handleDrag = (_: any, info: PanInfo) => {
    const progress = Math.max(0, Math.min(1, info.offset.x / 300));
    setDragProgress(progress);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 150 || info.velocity.x > 500) {
      setIsCartOpen(false);
      triggerHaptic(30);
    }
    setDragProgress(0);
  };

  const handleCheckout = () => {
    if (checkoutType === 'mixed') {
      // Show warning about mixed cart
      alert('You have both core and Medusa products. Please checkout separately.');
      return;
    } else if (checkoutType === 'core') {
      // Use core checkout
      router.push('/checkout/core');
    } else {
      // Use Medusa checkout
      router.push('/checkout-direct-stripe');
    }
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  return (
    <>
      {/* Mobile: Floating Cart Icon */}
      {itemCount > 0 && (
        <motion.button
          onClick={() => {
            setIsCartOpen(true);
            triggerHaptic();
          }}
          className="fixed top-20 right-4 bg-burgundy text-white p-3 rounded-full shadow-xl z-40 md:hidden hover:bg-burgundy-700 transition-all duration-200"
          aria-label={`Open shopping cart with ${itemCount} items`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ShoppingCart size={20} aria-hidden="true" />
          <motion.span 
            className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-medium" 
            aria-hidden="true"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            key={itemCount}
          >
            {itemCount > 99 ? '99+' : itemCount}
          </motion.span>
        </motion.button>
      )}

      {/* Enhanced Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setIsCartOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Drawer */}
            <motion.div 
              className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              style={{ opacity: 1 - dragProgress * 0.3 }}
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-lg font-semibold">Shopping Cart ({itemCount})</h2>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Close cart"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Mixed Cart Warning */}
                {checkoutType === 'mixed' && (
                  <div className="bg-yellow-50 border-b border-yellow-200 p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium">Mixed Cart Items</p>
                        <p className="mt-1">You have both core and Medusa products. These need to be checked out separately.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {allItems.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Your cart is empty</p>
                    </div>
                  ) : (
                    <>
                      {/* Core Products Section */}
                      {coreItems.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-3">Core Products</h3>
                          {coreItems.map((item) => (
                            <div key={`${item.id}-${item.size}`} className="flex gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                              {item.image && (
                                <img 
                                  src={item.image} 
                                  alt={item.name}
                                  className="w-20 h-20 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{item.name}</h4>
                                {item.size && (
                                  <p className="text-xs text-gray-600">Size: {item.size}</p>
                                )}
                                <p className="text-sm font-semibold mt-1">{formatPrice(item.price)}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateCoreQuantity(item.id, item.quantity - 1, item.size)}
                                  className="p-1 hover:bg-gray-200 rounded"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={16} />
                                </button>
                                <span className="w-8 text-center text-sm">{item.quantity}</span>
                                <button
                                  onClick={() => updateCoreQuantity(item.id, item.quantity + 1, item.size)}
                                  className="p-1 hover:bg-gray-200 rounded"
                                  aria-label="Increase quantity"
                                >
                                  <Plus size={16} />
                                </button>
                                <button
                                  onClick={() => removeCoreItem(item.id, item.size)}
                                  className="p-1 hover:bg-red-100 rounded ml-2"
                                  aria-label="Remove item"
                                >
                                  <Trash2 size={16} className="text-red-600" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Medusa Products Section */}
                      {medusaItems.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-3">Shop Products</h3>
                          {medusaItems.map((item: any) => (
                            <div key={item.id} className="flex gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                              {item.thumbnail && (
                                <img 
                                  src={item.thumbnail} 
                                  alt={item.title}
                                  className="w-20 h-20 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{item.title}</h4>
                                {item.variant?.title && (
                                  <p className="text-xs text-gray-600">Size: {item.variant.title}</p>
                                )}
                                <p className="text-sm font-semibold mt-1">{formatPrice(item.total || 0)}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateMedusaQuantity(item.id, item.quantity - 1)}
                                  className="p-1 hover:bg-gray-200 rounded"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={16} />
                                </button>
                                <span className="w-8 text-center text-sm">{item.quantity}</span>
                                <button
                                  onClick={() => updateMedusaQuantity(item.id, item.quantity + 1)}
                                  className="p-1 hover:bg-gray-200 rounded"
                                  aria-label="Increase quantity"
                                >
                                  <Plus size={16} />
                                </button>
                                <button
                                  onClick={() => removeMedusaItem(item.id)}
                                  className="p-1 hover:bg-red-100 rounded ml-2"
                                  aria-label="Remove item"
                                >
                                  <Trash2 size={16} className="text-red-600" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Footer with Checkout */}
                {itemCount > 0 && (
                  <div className="border-t p-4 space-y-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span>{formatPrice(totalPrice)}</span>
                    </div>
                    
                    {checkoutType === 'mixed' ? (
                      <div className="space-y-2">
                        <button
                          onClick={() => router.push('/checkout/core')}
                          className="w-full py-3 bg-burgundy text-white rounded-lg hover:bg-burgundy-700 transition-colors"
                        >
                          Checkout Core Products ({formatPrice(coreTotal)})
                        </button>
                        <button
                          onClick={() => router.push('/checkout-direct-stripe')}
                          className="w-full py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Checkout Shop Products ({formatPrice(medusaTotal)})
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleCheckout}
                        className="w-full py-3 bg-burgundy text-white rounded-lg hover:bg-burgundy-700 transition-colors font-medium"
                      >
                        Proceed to Checkout
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}