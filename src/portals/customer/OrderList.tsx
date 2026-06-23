import { useState } from 'react'
import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Package } from 'lucide-react'
import { storage } from '../../store'
import { useCurrentUser } from '../../components/LoginGate'
import OrderInvoice from '../../components/OrderInvoice'

export function OrderList() {
  const navigate = useNavigate()
  const { currentUser } = useCurrentUser()
  const filterOrders = () => storage.getOrders().filter(o => o.customerPhone === currentUser?.phone)
  const [orders, setOrders] = useState(filterOrders)

  React.useEffect(() => {
    const unsubscribe = storage.subscribeToOrderChanges(() => {
      setOrders(filterOrders())
    })
    return unsubscribe
  }, [])

  const handleCancel = (orderId: string) => {
    if (!window.confirm('确定要取消此订单吗？取消后无法恢复。')) return
    storage.updateOrder(orderId, { status: 'cancelled' })
    setOrders(filterOrders())
  }

  return (
    <div className="min-h-screen" style={{ background: 'hsl(30 20% 98%)' }}>
      <header className="border-b bg-white/95 backdrop-blur" style={{ borderColor: 'hsl(30 8% 90%)' }}>
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3.5">
          <Link to="/customer" className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-foreground" style={{ color: 'hsl(20 6% 48%)' }}>
            <ArrowLeft className="h-4 w-4" />
            返回老人端
          </Link>
          <h1 className="font-display text-base font-bold text-foreground">我的订单</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg bg-white py-20">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-md bg-muted">
              <Package className="h-7 w-7" style={{ color: 'hsl(30 8% 78%)' }} />
            </div>
            <p className="text-base font-medium" style={{ color: 'hsl(20 6% 50%)' }}>暂无订单</p>
            <p className="mt-1 text-sm" style={{ color: 'hsl(20 6% 56%)' }}>浏览菜单或拍照上传即可创建第一个订单</p>
            <button
              onClick={() => navigate('/customer/menu')}
              className="mt-5 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              去点餐
            </button>
          </div>
        ) : (
          <div className="space-y-5 stagger-children">
            {orders.map(order => (
              <div key={order.id} className="relative">
                <OrderInvoice order={order} collapsed />
                {order.status === 'pending' && (
                  <button
                    onClick={() => handleCancel(order.id)}
                    className="absolute right-4 top-4 rounded border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                  >
                    取消订单
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
