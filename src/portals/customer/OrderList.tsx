import { useState } from 'react'
import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Package } from 'lucide-react'
import { storage } from '../../store'
import { useCurrentUser } from '../../components/LoginGate'
import OrderInvoice from '../../components/OrderInvoice'
import { toast, confirmDialog } from '../../components/Toast'

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

  const handleCancel = async (orderId: string) => {
    if (!await confirmDialog('取消订单', '确定要取消此订单吗？取消后无法恢复。')) return
    const order = orders.find(o => o.id === orderId)
    storage.updateOrder(orderId, { status: 'cancelled', cancelledAt: new Date().toISOString() })
    // 取消订单时释放预占库存
    if (order && order.status === 'pending') {
      order.items.forEach(item => {
        storage.releaseReservedStock(item.mealName, item.quantity)
      })
    }
    setOrders(filterOrders())
    toast.success('订单已取消')
  }

  return (
    <div className="min-h-screen" style={{ background: 'hsl(210 20% 98%)' }}>
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3.5">
          <Link to="/customer" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            返回老人端
          </Link>
          <h1 className="text-base font-bold text-foreground">我的订单</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-white py-20">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-50">
              <Package className="h-7 w-7 text-slate-300" />
            </div>
            <p className="text-base font-medium text-slate-500">暂无订单</p>
            <p className="mt-1 text-sm text-slate-400">浏览菜单或拍照上传即可创建第一个订单</p>
            <button
              onClick={() => navigate('/customer/menu')}
              className="mt-5 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
            >
              去点餐
            </button>
          </div>
        ) : (
          <div className="space-y-5 stagger-children">
            {orders.map(order => (
              <div key={order.id} className="relative">
                <OrderInvoice order={order} collapsed />
                {(order.status === 'pending' || order.status === 'approved') && (
                  <button
                    onClick={() => handleCancel(order.id)}
                    className="absolute right-4 top-4 rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
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
