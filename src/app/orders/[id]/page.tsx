"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { LoadingState } from "@/components/ui/states/LoadingState";
import { EmptyState } from "@/components/ui/states/ErrorState";
import { formatPrice } from "@/lib/utils/format";
import { ArrowLeft, Package, MapPin, CreditCard, Clock, CheckCircle, Truck } from "lucide-react";
import Link from "next/link";

interface OrderItem {
  id: string;
  title: string;
  thumbnail: string | null;
  quantity: number;
  unit_price: number;
  metadata: {
    size?: string;
  };
}

interface OrderDetail {
  id: string;
  display_id: number;
  created_at: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  total: number;
  items: OrderItem[];
  shipping_address: {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2?: string;
    city: string;
    province: string;
    postal_code: string;
    country_code: string;
  } | null;
}

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const { customer } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const orderId = params.id as string;

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!customer?.email || !orderId) {
          setOrder(null);
          return;
        }

        // Extract display ID from order ID (format: ORD-17)
        const displayId = orderId.replace('ORD-', '');

        // Fetch specific order from Medusa backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/orders?display_id=${displayId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const { orders } = await response.json();
          if (orders && orders.length > 0) {
            const orderData = orders[0];
            
            const transformedOrder: OrderDetail = {
              id: orderData.id,
              display_id: orderData.display_id,
              created_at: orderData.created_at,
              status: orderData.status,
              payment_status: orderData.payment_status,
              fulfillment_status: orderData.fulfillment_status,
              total: orderData.summary?.current_order_total || orderData.total || 0,
              items: orderData.items?.map((item: any) => ({
                id: item.id,
                title: item.title,
                thumbnail: item.thumbnail,
                quantity: item.quantity,
                unit_price: item.unit_price,
                metadata: item.metadata || {},
              })) || [],
              shipping_address: orderData.shipping_address,
            };
            
            setOrder(transformedOrder);
          } else {
            setOrder(null);
          }
        } else {
          setOrder(null);
        }
      } catch (error) {
        console.error('Failed to fetch order:', error);
        setOrder(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (customer) {
      fetchOrder();
    }
  }, [customer, orderId]);

  if (isLoading) {
    return <LoadingState text="Loading order details..." />;
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <EmptyState
            title="Order not found"
            message="The order you're looking for doesn't exist or you don't have permission to view it."
            action={{
              label: "View All Orders",
              onClick: () => router.push("/account/orders"),
            }}
          />
        </div>
      </div>
    );
  }

  const getOrderStatus = () => {
    if (order.fulfillment_status === "fulfilled") {
      return { label: "Delivered", color: "text-green-600", icon: CheckCircle };
    } else if (order.fulfillment_status === "shipped" || order.fulfillment_status === "partially_shipped") {
      return { label: "Shipped", color: "text-blue-600", icon: Truck };
    } else if (order.payment_status === "captured") {
      return { label: "Processing", color: "text-yellow-600", icon: Package };
    } else {
      return { label: "Pending", color: "text-gray-600", icon: Clock };
    }
  };

  const statusInfo = getOrderStatus();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href="/account/orders"
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-semibold text-gray-900">
                Order #{order.display_id}
              </h1>
              <div className={`flex items-center ${statusInfo.color}`}>
                <StatusIcon className="h-5 w-5 mr-2" />
                <span className="font-medium">{statusInfo.label}</span>
              </div>
            </div>
            
            <p className="text-gray-600">
              Placed on {new Date(order.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long", 
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
              
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-start space-x-4 pb-4 border-b border-gray-200 last:border-b-0">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      {item.thumbnail ? (
                        <img 
                          src={item.thumbnail} 
                          alt={item.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.title}</h3>
                      {item.metadata.size && (
                        <p className="text-sm text-gray-600">Size: {item.metadata.size}</p>
                      )}
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatPrice(item.unit_price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-gray-900">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Shipping Address */}
            {order.shipping_address && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Shipping Address
                </h3>
                
                <div className="text-gray-600 space-y-1">
                  <p>{order.shipping_address.first_name} {order.shipping_address.last_name}</p>
                  <p>{order.shipping_address.address_1}</p>
                  {order.shipping_address.address_2 && (
                    <p>{order.shipping_address.address_2}</p>
                  )}
                  <p>
                    {order.shipping_address.city}, {order.shipping_address.province} {order.shipping_address.postal_code}
                  </p>
                  <p>{order.shipping_address.country_code.toUpperCase()}</p>
                </div>
              </div>
            )}

            {/* Payment Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Payment
              </h3>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${
                    order.payment_status === 'captured' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {order.payment_status === 'captured' ? 'Paid' : 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-4"></div>
                  <div>
                    <p className="font-medium text-gray-900">Order Placed</p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {order.payment_status === 'captured' && (
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-4"></div>
                    <div>
                      <p className="font-medium text-gray-900">Payment Confirmed</p>
                      <p className="text-sm text-gray-600">Payment processed successfully</p>
                    </div>
                  </div>
                )}
                
                {(order.fulfillment_status === 'shipped' || order.fulfillment_status === 'partially_shipped') && (
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-500 rounded-full mr-4"></div>
                    <div>
                      <p className="font-medium text-gray-900">Shipped</p>
                      <p className="text-sm text-gray-600">Your order is on its way</p>
                    </div>
                  </div>
                )}
                
                {order.fulfillment_status === 'fulfilled' && (
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-4"></div>
                    <div>
                      <p className="font-medium text-gray-900">Delivered</p>
                      <p className="text-sm text-gray-600">Order has been delivered</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}