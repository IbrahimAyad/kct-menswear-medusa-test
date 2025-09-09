'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Truck, Mail, Calendar, ArrowRight, Star, Gift, AlertCircle, Phone, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { authorizePayment, completeCart } from '@/services/medusaBackendService';

export default function CheckoutSuccessPage() {
  const [mounted, setMounted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

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

  const completeOrder = async () => {
    try {
      // Get cart_id from URL or localStorage
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const cartIdFromUrl = urlParams?.get('cart_id');
      const cartIdFromStorage = localStorage.getItem('medusa_cart_id');
      const cartId = cartIdFromUrl || cartIdFromStorage;
      
      if (!cartId) {
        console.error('No cart ID found');
        setOrderError('Unable to find your order information. Please contact support.');
        setLoading(false);
        return;
      }

      console.log('Completing order for cart:', cartId);
      
      // Retry logic for authorization
      let authResult = null;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries && !authResult) {
        try {
          // Step 1: Authorize payment with payment_intent_id
          console.log(`Authorizing payment (attempt ${retryCount + 1}/${maxRetries})...`);
          authResult = await authorizePayment(cartId, paymentIntentId || undefined, sessionId || undefined);
          console.log('Payment authorized:', authResult);
          break;
        } catch (authError: any) {
          retryCount++;
          console.error(`Authorization attempt ${retryCount} failed:`, authError);
          
          if (retryCount >= maxRetries) {
            throw authError;
          }
          
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      // Step 2: Complete cart to create order
      console.log('Completing cart...');
      const orderResult = await completeCart(cartId);
      console.log('Order created:', orderResult);

      if (orderResult?.order) {
        // Use real order data
        const order = orderResult.order;
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 7);

        setOrderDetails({
          id: order.id || `ORDER-${Date.now()}`,
          total: order.total ? `$${(order.total / 100).toFixed(2)}` : '$0.00',
          items: order.items?.map((item: any) => ({
            name: item.title || item.variant?.product?.title || 'Product',
            size: item.variant?.title || 'One Size',
            quantity: item.quantity || 1,
            price: `$${((item.unit_price || 0) / 100).toFixed(2)}`
          })) || [],
          estimatedDelivery: deliveryDate,
          email: order.email || localStorage.getItem('checkout_email') || 'customer@example.com'
        });

        // Clear the cart after successful order
        localStorage.removeItem('medusa_cart_id');
        localStorage.removeItem('last_cart_items');
        localStorage.removeItem('checkout_email');
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
      total: total,
      items: items,
      estimatedDelivery: deliveryDate,
      email: localStorage.getItem('checkout_email') || 'customer@example.com'
    });
    
    setLoading(false);
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-charcoal/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-charcoal/20 border-t-charcoal rounded-full animate-spin mx-auto mb-6" />
          <p className="text-xl text-gray-600 font-light">Processing your order...</p>
        </div>
      </div>
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
            
            <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-lg">
              <span className="text-sm text-gray-500">Order Number:</span>
              <span className="font-medium text-charcoal">{orderDetails.id}</span>
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
              <h2 className="text-2xl font-light mb-6 text-charcoal">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                {orderDetails.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">Size: {item.size} • Qty: {item.quantity}</div>
                    </div>
                    <div className="font-medium">{item.price}</div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-xl font-medium">
                  <span>Total</span>
                  <span>{orderDetails.total}</span>
                </div>
              </div>
            </Card>

            {/* Delivery Info */}
            <Card className="p-8">
              <h2 className="text-2xl font-light mb-6 text-charcoal">Delivery Information</h2>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Truck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">Free Standard Delivery</div>
                    <div className="text-sm text-gray-500">
                      Estimated delivery: {orderDetails.estimatedDelivery.toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Mail className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">Order Confirmation</div>
                    <div className="text-sm text-gray-500">
                      Sent to {orderDetails.email}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium">Tracking Updates</div>
                    <div className="text-sm text-gray-500">
                      You'll receive tracking information soon
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center space-y-6"
        >
          <h2 className="text-2xl font-light mb-8 text-charcoal">What's Next?</h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow duration-300">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-gold" />
              </div>
              <h3 className="font-medium mb-2">Order Confirmation</h3>
              <p className="text-sm text-gray-600">
                Check your email for order details and tracking information.
              </p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-lg transition-shadow duration-300">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-medium mb-2">Order Processing</h3>
              <p className="text-sm text-gray-600">
                We'll prepare your items with care and attention to detail.
              </p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-lg transition-shadow duration-300">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-medium mb-2">Premium Delivery</h3>
              <p className="text-sm text-gray-600">
                Your order will arrive in premium packaging within 5-7 business days.
              </p>
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
                View Account
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
