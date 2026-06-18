import { useState, useEffect } from 'react'
import { Link, ArrowLeft, Package, Truck, CheckCircle, TrendingUp, Users, ClipboardList, BarChart3, Factory } from 'lucide-react'
import { storage, Order, FactoryOrder, mockFactories } from '../store'

export default function DistributorPortal() {
  const [orders, setOrders] = useState<Order[]>([])
  const [factoryOrders, setFactoryOrders] = useState<FactoryOrder[]>([])
  const [activeTab, setActiveTab] = useState<'pending' | 'summary' | 'factories' | 'deliveries' | 'delivered'>('pending')

  useEffect(() => {
    setOrders(storage.getOrders())
    const foData = localStorage.getItem('icooker_factory_orders')
    setFactoryOrders(foData ? JSON.parse(foData) : [])
  }, [])

  const approvedOrders = orders.filter(o => o.status === 'approved')
  const processingOrders = orders.filter(o => o.status === 'processing')
  const pendingDeliveryFactoryOrders = factoryOrders.filter(fo => fo.status === 'completed')
  const deliveredFactoryOrders = factoryOrders.filter(fo => fo.status === 'delivered')

  const handleBatchCreate = () => {
    if (approvedOrders.length === 0) return
    const newFactoryOrders: FactoryOrder[] = mockFactories.map((factory, idx) => {
      const assignedOrders = approvedOrders.filter((_, i) => i % mockFactories.length === idx)
      const items = assignedOrders.flatMap(o => o.items)
      const totalAmount = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
      return {
        id: `FO-${Date.now()}-${idx}`,
        factoryName: factory.name,
        items,
        totalAmount,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    })
    const updatedFo = [...factoryOrders, ...newFactoryOrders]
    localStorage.setItem('icooker_factory_orders', JSON.stringify(updatedFo))
    setFactoryOrders(updatedFo)
    approvedOrders.forEach(order => {
      storage.updateOrder(order.id, { status: 'processing' })
    })
    setOrders(storage.getOrders())
    setActiveTab('factories')
  }

  const handleCompleteDelivery = (factoryOrderId: string) => {
    const updatedFo: FactoryOrder[] = factoryOrders.map(fo =>
      fo.id === factoryOrderId ? { ...fo, status: 'delivered' as const } : fo
    )
    localStorage.setItem('icooker_factory_orders', JSON.stringify(updatedFo))
    setFactoryOrders(updatedFo)
    const relatedCustomerOrders = orders.filter(o => o.status === 'completed')
    if (relatedCustomerOrders.length > 0) {
      relatedCustomerOrders.forEach(order => {
        storage.updateOrder(order.id, { status: 'delivered' })
      })
      setOrders(storage.getOrders())
    }
  }

  const stats = [
    { label: '待汇总', value: approvedOrders.length, icon: Package, gradient: 'from-blue-500 to-cyan-500' },
    { label: '工厂订单', value: factoryOrders.length, icon: Factory, gradient: 'from-violet-500 to-purple-500' },
    { label: '待配送', value: pendingDeliveryFactoryOrders.length, icon: Truck, gradient: 'from-amber-500 to-orange-500' },
    { label: '已完成', value: deliveredFactoryOrders.length, icon: Users, gradient: 'from-emerald-500 to-green-500' },
  ]

  const tabs = [
    { id: 'pending' as const, label: '待汇总', count: approvedOrders.length, icon: ClipboardList },
    { id: 'summary' as const, label: '订单统计', count: null, icon: BarChart3 },
    { id: 'factories' as const, label: '工厂订单', count: factoryOrders.length, icon: Factory },
    { id: 'deliveries' as const, label: '配送管理', count: pendingDeliveryFactoryOrders.length, icon: Truck },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/20 to-slate-50">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE1YzMuMzE0IDAgNi0yLjY4NiA2LTZzLTIuNjg2LTYtNi02LTYgMi42ODYtNiA2IDIuNjg2IDYgNiA2em0wIDMwYzMuMzE0IDAgNi0yLjY4NiA2LTZzLTIuNjg2LTYtNi02LTYgMi42ODYtNiA2IDIuNjg2IDYgNiA2eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative mx-auto max-w-7xl px-6 py-8">
          <Link to="/" className="mb-6 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white/90 backdrop-blur transition-colors hover:bg-white/20 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 shadow-lg backdrop-blur">
              <Truck className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">分销端</h1>
              <p className="mt-1 text-white/80">汇总订单、向工厂下单、配送管理</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-lg shadow-slate-200/50 backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-xl">
              <div className="mb-2 flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} shadow-md`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-bold tabular-nums text-slate-900">{stat.value}</span>
              </div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-1 rounded-xl border border-slate-200 bg-white/60 p-1.5 shadow-sm backdrop-blur">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-200/50'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count !== null && tab.count > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  activeTab === tab.id ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {activeTab === 'pending' && (
            <div>
              {approvedOrders.length > 0 ? (
                <div>
                  <div className="mb-6 overflow-hidden rounded-2xl border border-amber-200/50 bg-gradient-to-r from-amber-50 to-orange-50 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">待汇总订单 ({approvedOrders.length})</h3>
                        <p className="mt-1 text-sm text-slate-600">以下订单已通过审核，可以汇总并向工厂下单</p>
                      </div>
                      <button
                        onClick={handleBatchCreate}
                        className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-200/50 transition-all hover:shadow-xl hover:shadow-amber-200/70"
                      >
                        批量创建工厂订单
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 stagger-children">
                    {approvedOrders.map(order => (
                      <div key={order.id} className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-slate-200/50 backdrop-blur transition-all hover:shadow-xl">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-slate-900">{order.id}</h4>
                            <p className="mt-1 text-sm text-slate-500">{order.customerName} · {order.customerPhone}</p>
                          </div>
                          <span className="text-xl font-bold text-orange-500">${order.totalAmount}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {order.items.map((item, idx) => (
                            <span key={idx} className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                              {item.mealName} <span className="text-orange-500">x{item.quantity}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState icon={Package} text="暂无待汇总订单" />
              )}
            </div>
          )}

          {activeTab === 'summary' && (
            <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-slate-200/50 backdrop-blur">
              <h3 className="mb-6 text-lg font-bold text-slate-900">订单统计</h3>
              <div className="grid gap-8 md:grid-cols-2">
                <div>
                  <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">按状态统计</h4>
                  <div className="space-y-3">
                    {[
                      { label: '总订单数', value: orders.length, color: 'text-slate-900' },
                      { label: '待审核', value: orders.filter(o => o.status === 'pending').length, color: 'text-amber-600' },
                      { label: '已审核', value: approvedOrders.length, color: 'text-blue-600' },
                      { label: '生产中', value: processingOrders.length, color: 'text-violet-600' },
                      { label: '已完成', value: orders.filter(o => o.status === 'delivered').length, color: 'text-emerald-600' },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                        <span className="text-sm text-slate-600">{row.label}</span>
                        <span className={`text-lg font-bold tabular-nums ${row.color}`}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">收入统计</h4>
                  <div className="space-y-3">
                    <div className="rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 p-4">
                      <span className="text-sm text-slate-600">总金额</span>
                      <p className="mt-1 text-3xl font-bold text-orange-500">
                        ${orders.reduce((sum, o) => sum + o.totalAmount, 0)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4">
                      <span className="text-sm text-slate-600">平均订单金额</span>
                      <p className="mt-1 text-2xl font-bold text-slate-900">
                        ${orders.length ? Math.round(orders.reduce((sum, o) => sum + o.totalAmount, 0) / orders.length) : 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'factories' && (
            <div>
              {factoryOrders.length > 0 ? (
                <div className="space-y-4 stagger-children">
                  {factoryOrders.map(fo => (
                    <div key={fo.id} className="rounded-2xl border border-white/60 bg-white/80 shadow-lg shadow-slate-200/50 backdrop-blur transition-all hover:shadow-xl">
                      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                            <Factory className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{fo.factoryName}</h3>
                            <p className="text-xs text-slate-500">{fo.id}</p>
                          </div>
                        </div>
                        <StatusBadge status={fo.status} />
                      </div>
                      <div className="p-6">
                        <div className="mb-4 flex flex-wrap gap-2">
                          {fo.items.map((item, idx) => (
                            <span key={idx} className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                              {item.mealName} <span className="text-orange-500">x{item.quantity}</span>
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                          <span className="text-sm font-medium text-slate-500">总计</span>
                          <span className="text-xl font-bold text-orange-500">${fo.totalAmount}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Package} text="暂无工厂订单" />
              )}
            </div>
          )}

          {activeTab === 'deliveries' && (
            <div>
              <div className="mb-6 flex gap-2">
                <button onClick={() => setActiveTab('deliveries')} className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-200/50">
                  待配送 ({pendingDeliveryFactoryOrders.length})
                </button>
                <button onClick={() => setActiveTab('delivered')} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50">
                  已送达 ({deliveredFactoryOrders.length})
                </button>
              </div>

              {pendingDeliveryFactoryOrders.length > 0 ? (
                <div className="space-y-4 stagger-children">
                  {pendingDeliveryFactoryOrders.map(fo => (
                    <div key={fo.id} className="rounded-2xl border border-white/60 bg-white/80 shadow-lg shadow-slate-200/50 backdrop-blur transition-all hover:shadow-xl">
                      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                        <div>
                          <h3 className="font-semibold text-slate-900">{fo.factoryName}</h3>
                          <p className="text-xs text-slate-500">{fo.id} · 共 {fo.items.length} 种餐品</p>
                        </div>
                        <span className="text-lg font-bold text-orange-500">${fo.totalAmount}</span>
                      </div>
                      <div className="p-6">
                        <div className="mb-4 flex flex-wrap gap-2">
                          {fo.items.map((item, idx) => (
                            <span key={idx} className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                              {item.mealName} <span className="text-orange-500">x{item.quantity}</span>
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={() => handleCompleteDelivery(fo.id)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-200/50 transition-all hover:shadow-lg"
                        >
                          <CheckCircle className="h-4 w-4" />
                          确认送达
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Truck} text="暂无待配送订单" />
              )}
            </div>
          )}

          {activeTab === 'delivered' && (
            <div>
              {deliveredFactoryOrders.length > 0 ? (
                <div className="space-y-4 stagger-children">
                  {deliveredFactoryOrders.map(fo => (
                    <div key={fo.id} className="rounded-2xl border border-slate-100 bg-white/60 p-6 backdrop-blur">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-900">{fo.factoryName}</h3>
                          <p className="text-xs text-slate-500">{fo.id} · 共 {fo.items.length} 种餐品</p>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">已送达</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                        <div className="flex flex-wrap gap-1.5">
                          {fo.items.slice(0, 3).map((item, idx) => (
                            <span key={idx} className="text-xs text-slate-400">{item.mealName}</span>
                          ))}
                          {fo.items.length > 3 && <span className="text-xs text-slate-400">+{fo.items.length - 3}</span>}
                        </div>
                        <span className="font-bold text-orange-500">${fo.totalAmount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={CheckCircle} text="暂无已送达订单" />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: '待接单' },
    confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', label: '已确认' },
    completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: '已完成' },
    delivered: { bg: 'bg-slate-100', text: 'text-slate-700', label: '已送达' },
  }
  const c = config[status] || config.pending
  return <span className={`rounded-full ${c.bg} px-3 py-1 text-xs font-semibold ${c.text}`}>{c.label}</span>
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 py-20 backdrop-blur">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <Icon className="h-8 w-8 text-slate-400" />
      </div>
      <p className="text-lg font-medium text-slate-600">{text}</p>
    </div>
  )
}
