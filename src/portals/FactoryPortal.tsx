import { useState, useEffect } from 'react'
import { Link, ArrowLeft, Package, CheckCircle, Clock, Plus, Edit, Truck, ChefHat, X } from 'lucide-react'
import { FactoryOrder, Meal, mockMeals, storage } from '../store'

export default function FactoryPortal() {
  const [factoryOrders, setFactoryOrders] = useState<FactoryOrder[]>([])
  const [meals, setMeals] = useState<Meal[]>(mockMeals)
  const [activeTab, setActiveTab] = useState<'orders' | 'meals'>('orders')
  const [showAddMeal, setShowAddMeal] = useState(false)

  useEffect(() => {
    const foData = localStorage.getItem('icooker_factory_orders')
    setFactoryOrders(foData ? JSON.parse(foData) : [])
  }, [])

  const pendingOrders = factoryOrders.filter(o => o.status === 'pending')
  const confirmedOrders = factoryOrders.filter(o => o.status === 'confirmed')
  const completedOrders = factoryOrders.filter(o => o.status === 'completed')
  const deliveredOrders = factoryOrders.filter(o => o.status === 'delivered')

  const handleConfirm = (orderId: string) => {
    const updated = factoryOrders.map(o =>
      o.id === orderId ? { ...o, status: 'confirmed' as const } : o
    )
    localStorage.setItem('icooker_factory_orders', JSON.stringify(updated))
    setFactoryOrders(updated)
  }

  const handleComplete = (orderId: string) => {
    const updated = factoryOrders.map(o =>
      o.id === orderId ? { ...o, status: 'completed' as const } : o
    )
    localStorage.setItem('icooker_factory_orders', JSON.stringify(updated))
    setFactoryOrders(updated)
    const customerOrders = storage.getOrders()
    const relatedOrder = customerOrders.find(o => o.status === 'processing')
    if (relatedOrder) {
      storage.updateOrder(relatedOrder.id, { status: 'completed' })
    }
  }

  const handleAddMeal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const newMeal: Meal = {
      id: `meal-${Date.now()}`,
      name: formData.get('name') as string,
      price: Number(formData.get('price')),
      category: formData.get('category') as string
    }
    setMeals([...meals, newMeal])
    setShowAddMeal(false)
  }

  const stats = [
    { label: '待接单', value: pendingOrders.length, icon: Clock, gradient: 'from-amber-500 to-orange-500' },
    { label: '生产中', value: confirmedOrders.length, icon: Package, gradient: 'from-blue-500 to-cyan-500' },
    { label: '已完成', value: completedOrders.length, icon: CheckCircle, gradient: 'from-emerald-500 to-green-500' },
    { label: '已送达', value: deliveredOrders.length, icon: Truck, gradient: 'from-violet-500 to-purple-500' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-50">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-500">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE1YzMuMzE0IDAgNi0yLjY4NiA2LTZzLTIuNjg2LTYtNi02LTYgMi42ODYtNiA2IDIuNjg2IDYgNiA2em0wIDMwYzMuMzE0IDAgNi0yLjY4NiA2LTZzLTIuNjg2LTYtNi02LTYgMi42ODYtNiA2IDIuNjg2IDYgNiA2eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative mx-auto max-w-7xl px-6 py-8">
          <Link to="/" className="mb-6 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white/90 backdrop-blur transition-colors hover:bg-white/20 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 shadow-lg backdrop-blur">
              <ChefHat className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">工厂端</h1>
              <p className="mt-1 text-white/80">菜品管理、订单生产与配送</p>
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
          {[
            { id: 'orders' as const, label: '订单管理', count: pendingOrders.length },
            { id: 'meals' as const, label: '菜品管理', count: null },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md shadow-emerald-200/50'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  activeTab === tab.id ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="animate-fade-in space-y-10">
            {pendingOrders.length > 0 && (
              <OrderSection title="待接单" color="amber">
                {pendingOrders.map(fo => (
                  <OrderCard key={fo.id} order={fo} statusBadge="pending">
                    <button
                      onClick={() => handleConfirm(fo.id)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-200/50 transition-all hover:shadow-lg"
                    >
                      <CheckCircle className="h-4 w-4" />
                      确认接单
                    </button>
                  </OrderCard>
                ))}
              </OrderSection>
            )}

            {confirmedOrders.length > 0 && (
              <OrderSection title="生产中" color="blue">
                {confirmedOrders.map(fo => (
                  <OrderCard key={fo.id} order={fo} statusBadge="confirmed">
                    <button
                      onClick={() => handleComplete(fo.id)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 py-3 text-sm font-semibold text-white shadow-md shadow-blue-200/50 transition-all hover:shadow-lg"
                    >
                      <CheckCircle className="h-4 w-4" />
                      标记完成
                    </button>
                  </OrderCard>
                ))}
              </OrderSection>
            )}

            {completedOrders.length > 0 && (
              <OrderSection title="已完成 (待配送)" color="emerald">
                {completedOrders.map(fo => (
                  <OrderCard key={fo.id} order={fo} statusBadge="completed" dimmed />
                ))}
              </OrderSection>
            )}

            {deliveredOrders.length > 0 && (
              <OrderSection title="已送达" color="slate">
                {deliveredOrders.map(fo => (
                  <OrderCard key={fo.id} order={fo} statusBadge="delivered" dimmed />
                ))}
              </OrderSection>
            )}

            {factoryOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 py-20 backdrop-blur">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                  <Package className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-lg font-medium text-slate-600">暂无订单</p>
                <p className="mt-1 text-sm text-slate-400">分销商创建的订单将在此处显示</p>
              </div>
            )}
          </div>
        )}

        {/* Meals Tab */}
        {activeTab === 'meals' && (
          <div className="animate-fade-in">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">菜品列表</h2>
              <button
                onClick={() => setShowAddMeal(true)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200/50 transition-all hover:shadow-lg"
              >
                <Plus className="h-4 w-4" />
                添加菜品
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
              {meals.map(meal => (
                <div key={meal.id} className="group rounded-2xl border border-white/60 bg-white/80 p-5 shadow-lg shadow-slate-200/50 backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-xl">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{meal.name}</h3>
                      {meal.nameEn && <p className="text-xs text-slate-400">{meal.nameEn}</p>}
                    </div>
                    <span className="text-xl font-bold text-orange-500">${meal.price}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">{meal.category}</span>
                    {meal.dietaryTags?.map(tag => (
                      <span key={tag} className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{tag}</span>
                    ))}
                  </div>
                  <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-600 transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700">
                    <Edit className="h-4 w-4" />
                    编辑
                  </button>
                </div>
              ))}
            </div>

            {/* Add Meal Modal */}
            {showAddMeal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
                <div className="animate-scale-in w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">添加新菜品</h3>
                    <button onClick={() => setShowAddMeal(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <form onSubmit={handleAddMeal} className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">菜品名称</label>
                      <input name="name" type="text" required className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">价格</label>
                      <input name="price" type="number" required min="1" className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">分类</label>
                      <select name="category" className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100">
                        <option value="荤菜">荤菜</option>
                        <option value="素菜">素菜</option>
                        <option value="面食">面食</option>
                        <option value="汤品">汤品</option>
                      </select>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setShowAddMeal(false)} className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
                        取消
                      </button>
                      <button type="submit" className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200/50 transition-all hover:shadow-lg">
                        添加
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

/* Reusable components */
function OrderSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  const colorMap: Record<string, string> = {
    amber: 'bg-amber-100 text-amber-600',
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    slate: 'bg-slate-100 text-slate-600',
  }
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorMap[color] || colorMap.slate}`}>
          <Package className="h-4 w-4" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      </div>
      <div className="space-y-4 stagger-children">
        {children}
      </div>
    </section>
  )
}

function OrderCard({ order, statusBadge, dimmed, children }: { order: FactoryOrder; statusBadge: string; dimmed?: boolean; children?: React.ReactNode }) {
  const badgeConfig: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: '待接单' },
    confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', label: '已确认' },
    completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: '已完成' },
    delivered: { bg: 'bg-slate-100', text: 'text-slate-700', label: '已送达' },
  }
  const badge = badgeConfig[statusBadge] || badgeConfig.pending

  return (
    <div className={`rounded-2xl border border-white/60 bg-white/80 shadow-lg shadow-slate-200/50 backdrop-blur transition-all ${dimmed ? 'opacity-70' : 'hover:shadow-xl'}`}>
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div>
          <h3 className="font-semibold text-slate-900">{order.id}</h3>
          <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString('zh-CN')}</p>
        </div>
        <span className={`rounded-full ${badge.bg} px-3 py-1 text-xs font-semibold ${badge.text}`}>
          {badge.label}
        </span>
      </div>
      <div className="p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          {order.items.map((item, idx) => (
            <span key={idx} className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
              {item.mealName} <span className="text-orange-500">x{item.quantity}</span>
            </span>
          ))}
        </div>
        <div className="mb-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-sm font-medium text-slate-500">总计</span>
          <span className="text-xl font-bold text-orange-500">${order.totalAmount}</span>
        </div>
        {children}
      </div>
    </div>
  )
}
