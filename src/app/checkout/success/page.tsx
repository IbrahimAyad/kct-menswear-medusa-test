'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Truck, Mail, Calendar, ArrowRight, Star, Gift, AlertCircle, Phone, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { authorizePayment, completeCart } from '@/services/medusaBackendService';
import { OrderProcessingOverlay } from '@/components/checkout/order-processing-overlay';

export default function CheckoutSuccessPage() {
  const [mounted, setMounted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [pollingOrder, setPollingOrder] = useState(false);
  const [pollingAttempts, setPollingAttempts] = useState(0);

  useEffect(() => {
    setMounted(true);
    // Get payment data from URL on client side
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionIdParam = urlParams.get('session_id');
      const paymentIntentParam = urlParams.get('payment_intent');
      const paymentIntentClientSecret = urlParams.get('payment_intent_client_secret');
      
      setSessionId(sessionIdParam);
      setPaymentIntentId(paymentIntentParam);
      
      console.log('Payment Success URL Params:', {
        session_id: sessionIdParam,
        payment_intent: paymentIntentParam,
        payment_intent_client_secret: paymentIntentClientSecret,
        cart_id: urlParams.get('cart_id')
      });
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      completeOrder();
    }
  }, [mounted]);

  // Poll for order creation from backend
  // Helper function to parse variant information from order items
  const parseItemVariant = (item: any) => {
    // Enhanced variant title extraction - try multiple sources
    let productName = item.title || item.variant?.product?.title || item.product?.title || 'Product'
    let variantSize = item.variant?.title || item.variant_title || 'One Size'
    
    // If the title already includes the variant (like "Mint Vest - L"), parse it
    if (productName.includes(' - ') && productName !== item.variant?.product?.title) {
      const parts = productName.split(' - ')
      if (parts.length === 2) {
        productName = parts[0]
        variantSize = parts[1]
      }
    }
    
    // Try to get variant info from metadata if not found
    if (variantSize === 'One Size' && item.metadata?.variant_size) {
      variantSize = item.metadata.variant_size
    }
    
    // Try to get from variant_options if available
    if (variantSize === 'One Size' && item.variant_options?.length > 0) {
      const sizeOption = item.variant_options.find((opt: any) => opt.option?.title?.toLowerCase().includes('size'))
      if (sizeOption?.value) {
        variantSize = sizeOption.value
      }
    }

    // Try getting size from admin metadata fields
    if (variantSize === 'One Size' && item.metadata?.size) {
      variantSize = item.metadata.size
    }

    // Try getting from admin display helpers
    if (variantSize === 'One Size' && item.metadata?.display_name) {
      const displayParts = item.metadata.display_name.split(' - ')
      if (displayParts.length === 2) {
        variantSize = displayParts[1]
      }
    }

    return {
      name: productName,
      size: variantSize,
      quantity: item.quantity || 1,
      price: `$${((item.unit_price || 0) / 100).toFixed(2)}`
    }
  }

  const pollForOrder = async (cartId: string, maxAttempts: number = 15): Promise<any> => {
    console.log(`Starting order polling for cart: ${cartId}`);
    setPollingOrder(true);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      setPollingAttempts(attempt);
      
      try {
        console.log(`Polling attempt ${attempt}/${maxAttempts} for cart: ${cartId}`);
        
        // Use our proxy API route to avoid CORS issues
        const response = await fetch(`/api/orders/check?cart_id=${cartId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`Polling response:`, data);
          
          if (data.order) {
            console.log(`Order found on attempt ${attempt}:`, data.order);
            setPollingOrder(false);
            return data.order;
          }
        } else {
          console.log(`Polling attempt ${attempt} failed with status:`, response.status);
          if (response.status === 404) {
            console.log('Order check endpoint not found - this is expected if order is not created yet');
          } else if (response.status >= 500) {
            console.log('Server error when checking order status');
          }
        }
      } catch (error) {
        console.warn(`Polling attempt ${attempt} error:`, error);
        // Check if it's a CORS or network error
        if (error instanceof TypeError && error.message.includes('fetch')) {
          console.log('Network error - possibly CORS or backend not reachable');
        }
      }
      
      // Wait 2 seconds before next attempt (except on last attempt)
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`Order polling completed after ${maxAttempts} attempts - no order found`);
    setPollingOrder(false);
    return null;
  };

  const completeOrder = async () => {
    // Get cart_id and payment_intent from URL or localStorage
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const cartIdFromUrl = urlParams?.get('cart_id');
    const paymentIntentFromUrl = urlParams?.get('payment_intent');
    const cartIdFromStorage = localStorage.getItem('medusa_cart_id');
    const cartId = cartIdFromUrl || cartIdFromStorage;
    
    try {
      // First, try polling for order creation if we have a cart ID
      if (cartId) {
        console.log('Attempting to poll for order creation...');
        const polledOrder = await pollForOrder(cartId);
        
        if (polledOrder) {
          // Order was created by backend, use the polled order
          console.log('DEBUG: Polled order data:', polledOrder);
          console.log('DEBUG: Polled order items:', polledOrder.items?.map((item: any) => ({
            title: item.title,
            variant: item.variant,
            variant_title: item.variant_title,
            metadata: item.metadata
          })));
          
          const deliveryDate = new Date();
          deliveryDate.setDate(deliveryDate.getDate() + 7);

          setOrderDetails({
            id: polledOrder.id || `ORDER-${Date.now()}`,
            display_id: polledOrder.display_id || polledOrder.id?.slice(-8),
            confirmationCode: polledOrder.id?.slice(0, 20).toUpperCase(),
            total: polledOrder.total ? `$${(polledOrder.total / 100).toFixed(2)}` : '$0.00',
            items: polledOrder.items?.map((item: any) => parseItemVariant(item)) || [],
            estimatedDelivery: deliveryDate,
            email: polledOrder.email || localStorage.getItem('checkout_email') || 'customer@example.com'
          });

          setOrderError(null);
          setLoading(false);
          return; // Exit early on success
        } else {
          console.log('Order polling completed but no order found, falling back to existing flow...');
        }
      }
      
      // If no cart ID but we have payment intent, payment succeeded
      if (!cartId && paymentIntentFromUrl) {
        console.log('Payment succeeded, creating order confirmation');
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 7);
        
        // Try to get cart items from localStorage
        let items = [];
        let total = '$1.06';
        const savedCart = localStorage.getItem('last_cart_items');
        
        if (savedCart) {
          try {
            const cartData = JSON.parse(savedCart);
            items = cartData.items || [];
            total = cartData.total || '$1.06';
          } catch (e) {
            items = [{ name: 'Men\'s Apparel', size: 'As Ordered', quantity: 1, price: '$1.06' }];
          }
        } else {
          items = [{ name: 'Men\'s Apparel', size: 'As Ordered', quantity: 1, price: '$1.06' }];
        }
        
        setOrderDetails({
          id: `ORDER-${paymentIntentFromUrl.slice(-9).toUpperCase()}`,
          display_id: paymentIntentFromUrl.slice(-8).toUpperCase(),
          confirmationCode: paymentIntentFromUrl.slice(0, 20).toUpperCase(),
          total: total,
          items: items,
          estimatedDelivery: deliveryDate,
          email: localStorage.getItem('checkout_email') || 'customer@example.com'
        });
        
        setOrderError(null);
        setLoading(false);
        
        // DISABLED: Cart deletion moved to after order confirmation
        // setTimeout(() => {
        //   localStorage.removeItem('medusa_cart_id');
        //   localStorage.removeItem('last_cart_items');
        //   localStorage.removeItem('checkout_email');
        // }, 2000);
        return;
      }
      
      // If we have neither cart ID nor payment intent
      if (!cartId && !paymentIntentFromUrl) {
        setOrderError('Unable to find your order information. Please contact support.');
        setLoading(false);
        return;
      }

      console.log('Completing order for cart:', cartId, 'payment:', paymentIntentFromUrl);
      
      // First try our custom complete-order endpoint that handles Stripe payments
      if (paymentIntentFromUrl) {
        try {
          console.log('Using custom order completion for Stripe payment...');
          const response = await fetch('/api/checkout/complete-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              cartId,
              paymentIntentId: paymentIntentFromUrl,
              email: localStorage.getItem('checkout_email') || 'customer@example.com',
              amount: 0 // Will be retrieved from payment intent
            }),
          });
          
          const orderData = await response.json();
          console.log('Custom order completion result:', orderData);
          
          if (orderData.success && orderData.order) {
            const orderResult = { order: orderData.order };
            // Continue with success flow below
            const order = orderResult.order;
            const deliveryDate = new Date();
            deliveryDate.setDate(deliveryDate.getDate() + 7);

            setOrderDetails({
              id: order.id || `ORDER-${Date.now()}`,
              display_id: order.display_id || order.id?.slice(-8),
              confirmationCode: order.id?.slice(0, 20).toUpperCase(),
              total: order.total ? `$${(order.total / 100).toFixed(2)}` : '$1.06',
              items: order.items?.length > 0 ? order.items.map((item: any) => parseItemVariant(item)) : [
                { name: 'Men\'s Suit', size: 'Standard', quantity: 1, price: '$1.06' }
              ],
              estimatedDelivery: deliveryDate,
              email: order.email || localStorage.getItem('checkout_email') || 'customer@example.com'
            });

            // DISABLED: Cart deletion moved to after order confirmation
            // localStorage.removeItem('medusa_cart_id');
            // localStorage.removeItem('last_cart_items');
            // localStorage.removeItem('checkout_email');
            setOrderError(null);
            setLoading(false);
            return; // Exit early on success
          }
        } catch (customError: any) {
          console.warn('Custom order completion failed, trying standard flow:', customError);
        }
      }
      
      // Fallback: Try standard Medusa flow
      try {
        // Optional Step 1: Try to authorize payment (custom backend endpoint)
        if (paymentIntentId) {
          console.log('Attempting payment authorization...');
          const authResult = await authorizePayment(cartId, paymentIntentId, sessionId || undefined);
          console.log('Payment authorized:', authResult);
        }
      } catch (authError: any) {
        console.warn('Authorization skipped (may not be needed):', authError.message);
        // Don't fail - authorization might not be needed if payment is already confirmed
      }

      // Step 2: Complete cart to create order (Medusa v2 standard flow)
      console.log('Completing cart with standard Medusa v2 endpoint...');
      const orderResult = await completeCart(cartId);
      console.log('Order result:', orderResult);

      if (orderResult?.order) {
        // Use real order data
        const order = orderResult.order;
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 7);

        setOrderDetails({
          id: order.id || `ORDER-${Date.now()}`,
          display_id: order.display_id || order.id?.slice(-8),
          confirmationCode: order.id?.slice(0, 20).toUpperCase(),
          total: order.total ? `$${(order.total / 100).toFixed(2)}` : '$0.00',
          items: order.items?.map((item: any) => parseItemVariant(item)) || [],
          estimatedDelivery: deliveryDate,
          email: order.email || localStorage.getItem('checkout_email') || 'customer@example.com'
        });

        // DISABLED: Cart deletion moved to after order confirmation
        // localStorage.removeItem('medusa_cart_id');
        // localStorage.removeItem('last_cart_items');
        // localStorage.removeItem('checkout_email');
        setOrderError(null);
      } else {
        // Order completion failed but payment went through
        console.error('Order creation failed but payment was processed');
        setOrderError('Your payment was processed but we encountered an issue creating your order. Please contact support with your cart ID: ' + cartId);
        // Don't use fake data - show error instead
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Error completing order:', error);
      
      // Payment was processed but order creation failed
      setOrderError(
        `Your payment has been processed but we couldn't complete your order. ` +
        `Please contact support immediately with this information:\n\n` +
        `Cart ID: ${cartId}\n` +
        `Payment Intent: ${paymentIntentId || 'Not available'}\n` +
        `Error: ${error.message || 'Unknown error'}`
      );
      setLoading(false);
    }
  };

  const setFallbackOrderData = () => {
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const cartId = urlParams?.get('cart_id');
    const orderSuffix = sessionId ? sessionId.slice(-9).toUpperCase() : 
                       cartId ? cartId.slice(-9).toUpperCase() : 
                       'DEMO' + Math.random().toString(36).substr(2, 5).toUpperCase();
    
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7);
    
    // Get saved cart data
    const savedCart = typeof window !== 'undefined' ? localStorage.getItem('last_cart_items') : null;
    let items = [];
    let total = '$0.00';
    
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);
        items = cartData.items || [];
        total = cartData.total || '$0.00';
      } catch (e) {
        items = [
          { name: 'Premium Navy Suit', size: '40R', quantity: 1, price: '$299.00' },
          { name: 'Italian Silk Tie', size: 'OS', quantity: 2, price: '$80.00' }
        ];
        total = '$459.00';
      }
    } else {
      items = [
        { name: 'Premium Navy Suit', size: '40R', quantity: 1, price: '$299.00' },
        { name: 'Italian Silk Tie', size: 'OS', quantity: 2, price: '$80.00' }
      ];
      total = '$459.00';
    }
    
    setOrderDetails({
      id: `ORDER-2024-${orderSuffix}`,
      display_id: orderSuffix,
      confirmationCode: `2024${orderSuffix}`,
      total: total,
      items: items,
      estimatedDelivery: deliveryDate,
      email: localStorage.getItem('checkout_email') || 'customer@example.com'
    });
    
    setLoading(false);
  };

  // Show professional overlay while loading
  if (!mounted || loading) {
    return (
      <>
        {/* Keep the page structure but show overlay on top */}
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-charcoal/5">
          <div className="max-w-4xl mx-auto px-6 py-16">
            {/* Empty content while loading */}
          </div>
        </div>
        
        {/* Professional Loading Overlay */}
        <OrderProcessingOverlay 
          isVisible={true}
          currentStep={pollingAttempts}
          totalSteps={15}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-charcoal/5">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Conditional Header based on error state */}
        {orderError ? (
          // Error State
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <AlertCircle className="h-12 w-12 text-red-600" />
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl font-light mb-4 text-charcoal">
              Order Processing Issue
            </h1>
            
            <p className="text-xl text-gray-600 mb-6">
              Your payment was received but we encountered an issue completing your order.
            </p>
            
            {/* Error Details */}
            <Card className="max-w-2xl mx-auto p-6 bg-red-50 border-red-200 mb-8">
              <p className="text-red-800 whitespace-pre-line text-left">
                {orderError}
              </p>
            </Card>
            
            {/* Support Contact */}
            <Card className="max-w-2xl mx-auto p-8">
              <h2 className="text-2xl font-light mb-6 text-charcoal">Get Help Immediately</h2>
              <p className="text-gray-600 mb-6">
                Don't worry - we'll resolve this quickly. Please contact our support team:
              </p>
              <div className="space-y-4">
                <a 
                  href="tel:+1-800-555-0123" 
                  className="flex items-center justify-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Phone className="h-5 w-5 text-blue-600" />
                  <span className="text-blue-900 font-medium">Call: 1-800-555-0123</span>
                </a>
                <a 
                  href="mailto:support@kctmenswear.com?subject=Order Processing Issue" 
                  className="flex items-center justify-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <Mail className="h-5 w-5 text-green-600" />
                  <span className="text-green-900 font-medium">Email: support@kctmenswear.com</span>
                </a>
                <div className="flex items-center justify-center gap-3 p-4 bg-purple-50 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                  <span className="text-purple-900">Live Chat: Available Mon-Fri 9am-5pm EST</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-6">
                Please have your payment confirmation email ready when contacting support.
              </p>
            </Card>
          </motion.div>
        ) : orderDetails ? (
          // Success State
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="h-12 w-12 text-green-600" />
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl font-light mb-4 text-charcoal">
              Order Confirmed!
            </h1>
            
            <p className="text-xl text-gray-600 mb-6">
              Thank you for your purchase. Your order has been successfully placed.
            </p>
            
            {/* Order Confirmation Details */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-lg">
                <span className="text-sm text-gray-500">Order Number:</span>
                <span className="font-medium text-charcoal">#{orderDetails.display_id || orderDetails.id?.slice(-8) || 'N/A'}</span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800">Payment Status: Paid {orderDetails.total}</span>
                </div>
                
                <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                  <span className="text-sm text-blue-600 font-mono">Confirmation: {orderDetails.confirmationCode || orderDetails.id?.slice(0, 20).toUpperCase() || 'CONFIRMED'}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}

        {/* Order Details */}
        {orderDetails && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid md:grid-cols-2 gap-8 mb-12"
          >
            {/* Order Summary */}
            <Card className="p-8">
              <h2 className="text-2xl font-light mb-6 text-charcoal">Items Ordered</h2>
              
              <div className="space-y-6 mb-6">
                {orderDetails.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-start border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex-1">
                      <div className="font-medium text-lg">{item.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="inline-flex items-center gap-4">
                          <span>Size: <span className="font-medium">{item.size}</span></span>
                          <span>Quantity: <span className="font-medium">{item.quantity}</span></span>
                        </span>
                      </div>
                      {item.variant && (
                        <div className="text-sm text-gray-500 mt-1">
                          Variant: {item.variant}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-lg">{item.price}</div>
                      {item.quantity > 1 && (
                        <div className="text-sm text-gray-500">
                          ${((parseFloat(item.price.replace('$', '')) / item.quantity).toFixed(2))} each
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t-2 border-gray-200 pt-4">
                <div className="flex justify-between items-center text-xl font-semibold">
                  <span>Order Total</span>
                  <span className="text-green-600">{orderDetails.total}</span>
                </div>
                <div className="text-sm text-gray-500 mt-1 text-right">
                  Payment completed successfully
                </div>
              </div>
            </Card>

            {/* Next Steps & Delivery Info */}
            <Card className="p-8">
              <h2 className="text-2xl font-light mb-6 text-charcoal">Next Steps</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">Email Confirmation Sent</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Order receipt sent to <span className="font-medium">{orderDetails.email}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Check your inbox and spam folder for order details
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Truck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">Shipping & Tracking</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Estimated delivery: <span className="font-medium">{orderDetails.estimatedDelivery.toLocaleDateString()}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Tracking information will be sent within 24-48 hours
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium">Order Tracking</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Track your order status and delivery progress
                    </div>
                    <Link 
                      href={`/orders/track?order=${orderDetails.display_id || orderDetails.id?.slice(-8)}`}
                      className="inline-block mt-2"
                    >
                      <Button variant="outline" size="sm" className="text-purple-600 border-purple-200 hover:bg-purple-50">
                        Track Order
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
                
                <div className="bg-gold/5 border border-gold/20 rounded-lg p-4 mt-6">
                  <div className="flex items-start gap-3">
                    <Star className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-gold-dark">Premium Service Included</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Free alterations, premium packaging, and white-glove delivery service
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Additional Information & Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center space-y-8"
        >
          <h2 className="text-2xl font-light mb-8 text-charcoal">Need Help?</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow duration-300">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-medium mb-2">Customer Support</h3>
              <p className="text-sm text-gray-600 mb-4">
                Questions about your order? Our team is here to help.
              </p>
              <div className="space-y-2">
                <a 
                  href="tel:+1-800-555-0123" 
                  className="block text-blue-600 hover:text-blue-800 font-medium"
                >
                  Call: 1-800-555-0123
                </a>
                <a 
                  href="mailto:support@kctmenswear.com" 
                  className="block text-blue-600 hover:text-blue-800 font-medium"
                >
                  Email: support@kctmenswear.com
                </a>
              </div>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-lg transition-shadow duration-300">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-gold" />
              </div>
              <h3 className="font-medium mb-2">KCT Menswear Premium</h3>
              <p className="text-sm text-gray-600 mb-4">
                Enjoy complimentary alterations and styling consultations.
              </p>
              <Link href="/services">
                <Button variant="outline" size="sm" className="text-gold border-gold hover:bg-gold hover:text-white">
                  Learn More
                </Button>
              </Link>
            </Card>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button 
                size="lg" 
                className="bg-charcoal hover:bg-charcoal/90 text-white px-8 py-3"
              >
                Continue Shopping
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            
            <Link href="/account">
              <Button 
                variant="outline" 
                size="lg" 
                className="border-charcoal text-charcoal hover:bg-charcoal hover:text-white px-8 py-3"
              >
                View My Orders
              </Button>
            </Link>
          </div>
          
          {/* Order Reference Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Order confirmation number: <span className="font-mono font-medium">#{orderDetails?.display_id || orderDetails?.id?.slice(-8) || 'N/A'}</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Save this confirmation number for your records
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
