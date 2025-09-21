'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Package, ChevronRight, Calendar, Truck, CheckCircle, Clock, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/lib/store/authStore'
import { medusa } from '@/lib/medusa/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Order {
  id: string
  display_id?: string
  created_at: string
  status?: string
  fulfillment_status?: string
  payment_status?: string
  total: number
  currency_code: string
  items?: Array<{
    id: string
    title: string
    quantity: number
    unit_price: number
    thumbnail?: string
    variant_title?: string
  }>
  metadata?: any
}

export default function OrderHistoryPage() {
  const router = useRouter()
  const { customer, isAuthenticated, checkAuth } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const verifyAuthAndFetchOrders = async () => {
      await checkAuth()
      if (!isAuthenticated) {
        router.push('/auth/login?redirectTo=/account/orders')
        return
      }

      await fetchOrders()
    }

    verifyAuthAndFetchOrders()
  }, [])

  const fetchOrders = async () => {
    if (!customer?.id) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)

      // Use Medusa SDK to fetch customer orders
      const response = await medusa.store.order.list({
        fields: 'id,display_id,created_at,status,fulfillment_status,payment_status,total,currency_code,items,metadata'
      } as any)

      if (response?.orders) {
        setOrders(response.orders as Order[])
      } else {
        setOrders([])
      }
    } catch (error: any) {
      console.error('Failed to fetch orders:', error)
      setError('Unable to load orders. Please try again later.')
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatPrice = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount / 100) // Medusa stores amounts in cents
  }

  const getStatusBadge = (order: Order) => {
    const paymentStatus = order.payment_status || order.metadata?.payment_status
    const fulfillmentStatus = order.fulfillment_status

    if (paymentStatus === 'captured' || order.metadata?.payment_captured) {
      if (fulfillmentStatus === 'shipped') {
        return <Badge className="bg-blue-500">Shipped</Badge>
      } else if (fulfillmentStatus === 'fulfilled') {
        return <Badge className="bg-green-500">Delivered</Badge>
      } else {
        return <Badge className="bg-yellow-500">Processing</Badge>
      }
    } else {
      return <Badge variant="secondary">Pending Payment</Badge>
    }
  }

  const getStatusIcon = (order: Order) => {
    const fulfillmentStatus = order.fulfillment_status

    if (fulfillmentStatus === 'shipped') {
      return <Truck className="h-5 w-5 text-blue-500" />
    } else if (fulfillmentStatus === 'fulfilled') {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    } else {
      return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-charcoal" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/account" className="hover:text-charcoal">
            Account
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-charcoal">Order History</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-charcoal mb-2">Order History</h1>
          <p className="text-gray-600">Track and manage your KCT Menswear orders</p>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="py-4">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Orders List */}
        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600 mb-6">
                When you place your first order, it will appear here
              </p>
              <Link href="/products">
                <Button className="bg-charcoal hover:bg-charcoal/90">
                  Start Shopping
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(order)}
                        <div>
                          <CardTitle className="text-lg">
                            Order #{order.display_id || order.id.slice(-8).toUpperCase()}
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            <Calendar className="inline-block h-3 w-3 mr-1" />
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(order)}
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Order Items Preview */}
                    {order.items && order.items.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 overflow-x-auto pb-2">
                          {order.items.slice(0, 3).map((item) => (
                            <div
                              key={item.id}
                              className="flex-shrink-0 text-sm text-gray-600"
                            >
                              {item.thumbnail && (
                                <img
                                  src={item.thumbnail}
                                  alt={item.title}
                                  className="w-12 h-12 object-cover rounded border border-gray-200 mb-1"
                                />
                              )}
                              <p className="truncate max-w-[100px]">{item.title}</p>
                              {item.variant_title && (
                                <p className="text-xs text-gray-500">{item.variant_title}</p>
                              )}
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <div className="flex-shrink-0 text-sm text-gray-500">
                              +{order.items.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Total</p>
                          <p className="text-lg font-medium text-charcoal">
                            {formatPrice(order.total, order.currency_code)}
                          </p>
                        </div>
                        {order.items && (
                          <div>
                            <p className="text-sm text-gray-600">Items</p>
                            <p className="text-lg font-medium text-charcoal">
                              {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                            </p>
                          </div>
                        )}
                      </div>

                      <Link href={`/account/orders/${order.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
