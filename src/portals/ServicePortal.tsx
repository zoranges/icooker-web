import { useState, useEffect } from 'react'
import { Link, ArrowLeft, CheckCircle, XCircle, Clock, DollarSign, ShieldCheck, FileText } from 'lucide-react'
import { storage, Order } from '../store'

export default function ServicePortal() {
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    setOrders(storage.getOrders())
  }, [])

  const pendingOrders = orders.filter(o => o.status === 'pending')
  const reviewedOrders = orders.filter(o => ['approved', 'rejected'].includes(o.status))

  const handleApprove = (orderId: string) => {
    storage.updateOrder(orderId, { status: 'approved', approvedAt: new Date().toISOString() })
    setOrders(storage.getOrders())
  }

  const handleReject = (orderId: string) => {
    storage.updateOrder(orderId, { status: 'rejected' })
    setOrders(storage.getOrders())
  }

  const stats = [
    { label: '待审核', value: pendingOrders.length, icon: Clock, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-600' },
    { label: '已通过', value: reviewedOrders.filter(o => o.status === 'approved').length, icon: CheckCircle, color: 'from-emerald-500 to-green-500', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: '已拒绝', value: reviewedOrders.filter(o => o.status === 'rejected').length, icon: XCircle, color: 'from-red-500 to-rose-500', bg: 'bg-red-50', text: 'text-red-600' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/20 to-slate-50">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-violet-500">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE1YzMuMzE0IDAgNi0yLjY4NiA2LTZzLTIuNjg2LTYtNi02LTYgMi42ODYtNiA2IDIuNjg2IDYgNiA2em0wIDMwYzMuMzE0IDAgNi0yLjY4NiA2LTZzLTIuNjg2LTYtNi02LTYgMi42ODYtNiA2IDIuNjg2IDYgNiA2eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative mx-auto max-w-7xl px-6 py-8">
          <Link to="/" className="mb-6 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white/90 backdrop-blur transition-colors hover:bg-white/20 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 shadow-lg backdrop-blur">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">服务机构端</h1>
              <p className="mt-1 text-white/80">审核老人订单费用，管理资金流转</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats */}
        <div className="mb-8 grid gap-5 sm:grid-cols-3 stagger-children">
          {stats.map((stat) => (
            <div key={stat.label} className="group rounded-2xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-slate-200/50 backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-md`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <span className={`text-3xl font-bold tabular-nums ${stat.text}`}>{stat.value}</span>
              </div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Pending Orders */}
        {pendingOrders.length > 0 && (
          <section className="mb-10">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">待审核订单</h2>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">{pendingOrders.length}</span>
            </div>
            <div className="space-y-4 stagger-children">
              {pendingOrders.map(order => (
                <div key={order.id} className="group overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-lg shadow-slate-200/50 backdrop-blur transition-all hover:shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-slate-400" />
                      <div>
                        <h3 className="font-semibold text-slate-900">{order.id}</h3>
                        <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString('zh-CN')}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      待审核
                    </span>
                  </div>

                  <div className="grid gap-6 p-6 md:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">客户信息</p>
                      <p className="font-medium text-slate-900">{order.customerName}</p>
                      <p className="text-sm text-slate-500">{order.customerPhone}</p>
                      <p className="text-sm text-slate-500">{order.customerAddress}</p>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">订单金额</p>
                      <p className="text-3xl font-bold text-orange-500">${order.totalAmount}</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 px-6 py-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">订单项</p>
                    <div className="flex flex-wrap gap-2">
                      {order.items.map((item, idx) => (
                        <span key={idx} className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
                          {item.mealName} <span className="text-orange-500">x{item.quantity}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                    <button
                      onClick={() => handleApprove(order.id)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200/50 transition-all hover:shadow-lg hover:shadow-emerald-200/70"
                    >
                      <CheckCircle className="h-4 w-4" />
                      审核通过
                    </button>
                    <button
                      onClick={() => handleReject(order.id)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-red-200 bg-white py-2.5 text-sm font-semibold text-red-500 transition-all hover:border-red-300 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4" />
                      拒绝
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Reviewed Orders */}
        {reviewedOrders.length > 0 && (
          <section>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                <FileText className="h-4 w-4 text-slate-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">已审核订单</h2>
            </div>
            <div className="space-y-3">
              {reviewedOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/60 px-6 py-4 backdrop-blur transition-all hover:bg-white/80">
                  <div className="flex items-center gap-3">
                    {order.status === 'approved' ? (
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <h3 className="font-semibold text-slate-900">{order.id}</h3>
                      <p className="text-sm text-slate-500">{order.customerName} · ${order.totalAmount}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    order.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {order.status === 'approved' ? '已通过' : '已拒绝'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {orders.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 py-20 backdrop-blur">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <DollarSign className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-lg font-medium text-slate-600">暂无订单需要审核</p>
            <p className="mt-1 text-sm text-slate-400">老人提交的订单将在此处显示</p>
          </div>
        )}
      </main>
    </div>
  )
}
