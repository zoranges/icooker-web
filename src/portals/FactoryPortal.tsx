import { useState, useEffect, useMemo } from 'react'
import { Link, ArrowLeft, Package, CheckCircle, Clock, Plus, Edit, Truck, ChefHat, X } from 'lucide-react'
import { FactoryOrder, Meal, mockMeals, storage } from '../store'
import LoginGate, { useCurrentUser } from '../components/LoginGate'

export default function FactoryPortal() {
  return (
    <LoginGate role="factory" title="工厂端 - 选择身份" gradient="from-emerald-600 via-teal-600 to-emerald-500" icon={ChefHat}>
      <FactoryPortalContent />
    </LoginGate>
  )
}

function FactoryPortalContent() {
  const { currentUser } = useCurrentUser()
  const [factoryOrders, setFactoryOrders] = useState<FactoryOrder[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [activeTab, setActiveTab] = useState<'orders' | 'meals'>('orders')
  const [showAddMeal, setShowAddMeal] = useState(false)

  useEffect(() => {
    setFactoryOrders(storage.getFactoryOrders())
    setMeals([...mockMeals, ...storage.getCustomMeals()])
    const unsubFO = storage.subscribeToFactoryOrderChanges(() => setFactoryOrders(storage.getFactoryOrders()))
    return () => { unsubFO() }
  }, [])

  const myFactoryOrders = useMemo(
    () => factoryOrders.filter(fo => fo.factoryId === currentUser?.id || (!fo.factoryId && fo.factoryName === currentUser?.name)),
    [factoryOrders, currentUser]
  )

  const pendingOrders = myFactoryOrders.filter(o => o.status === 'pending')
  const confirmedOrders = myFactoryOrders.filter(o => o.status === 'confirmed')
  const completedOrders = myFactoryOrders.filter(o => o.status === 'completed')
  const deliveredOrders = myFactoryOrders.filter(o => o.status === 'delivered')

  const handleConfirm = (orderId: string) => {
    const fo = storage.getFactoryOrders().find(o => o.id === orderId)
    if (!fo || fo.factoryId !== currentUser?.id) return
    storage.updateFactoryOrder(orderId, { status: 'confirmed' })
    setFactoryOrders(storage.getFactoryOrders())
  }

  const handleComplete = (orderId: string) => {
    const fo = storage.getFactoryOrders().find(o => o.id === orderId)
    if (!fo || fo.factoryId !== currentUser?.id) return
    storage.updateFactoryOrder(orderId, { status: 'completed' })
    setFactoryOrders(storage.getFactoryOrders())
    // 只更新客户订单的工厂名称，不改状态（状态由分销商配送时统一更新为 delivered）
    if (fo?.customerOrderIds?.length) {
      fo.customerOrderIds.forEach(custOrderId => {
        storage.updateOrder(custOrderId, { factoryName: fo?.factoryName || currentUser?.name })
      })
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
    storage.saveCustomMeal(newMeal)
    setMeals([...meals, newMeal])
    setShowAddMeal(false)
  }

  const statColors = ['#0d9488', '#3b82f6', '#10b981', '#8b5cf6']

  const stats = [
    { label: '待接单', value: pendingOrders.length, icon: Clock, colorIdx: 0 },
    { label: '生产中', value: confirmedOrders.length, icon: Package, colorIdx: 1 },
    { label: '已完成', value: completedOrders.length, icon: CheckCircle, colorIdx: 2 },
    { label: '已送达', value: deliveredOrders.length, icon: Truck, colorIdx: 3 },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'hsl(210 20% 98%)' }}>
      <header className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-500">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-8">
          <Link to="/" className="mb-4 inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium text-white/85 backdrop-blur-md transition-colors hover:bg-white/20 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> 返回首页
          </Link>
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
              <ChefHat className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-2xl font-bold tracking-tight text-white">工厂端</h1>
              <p className="mt-0.5 text-sm text-white/80">{currentUser?.name || ''} · 菜品管理、订单生产与配送</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-slate-100 bg-white px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[28px] font-bold tabular-nums leading-none text-foreground">{stat.value}</p>
                  <p className="mt-1.5 text-xs font-medium text-muted-foreground">{stat.label}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: statColors[stat.colorIdx] }}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl bg-slate-100/80 p-1">
          {[
            { id: 'orders' as const, label: '订单管理', count: pendingOrders.length },
            { id: 'meals' as const, label: '菜品管理', count: null },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${activeTab === tab.id ? 'bg-teal-100 text-teal-700' : ''}`}
                  style={activeTab !== tab.id ? { background: 'hsl(210 15% 92%)', color: 'hsl(215 10% 50%)' } : undefined}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="animate-fade-in space-y-8">
            {pendingOrders.length > 0 && (
              <OrderSection title="待接单" color="amber">
                {pendingOrders.map(fo => (
                  <OrderCard key={fo.id} order={fo} statusBadge="pending">
                    <button onClick={() => handleConfirm(fo.id)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700">
                      <CheckCircle className="h-4 w-4" /> 确认接单
                    </button>
                  </OrderCard>
                ))}
              </OrderSection>
            )}

            {confirmedOrders.length > 0 && (
              <OrderSection title="生产中" color="blue">
                {confirmedOrders.map(fo => (
                  <OrderCard key={fo.id} order={fo} statusBadge="confirmed">
                    <button onClick={() => handleComplete(fo.id)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700">
                      <CheckCircle className="h-4 w-4" /> 标记完成
                    </button>
                  </OrderCard>
                ))}
              </OrderSection>
            )}

            {completedOrders.length > 0 && (
              <OrderSection title="已完成 (待配送)" color="emerald">
                {completedOrders.map(fo => <OrderCard key={fo.id} order={fo} statusBadge="completed" dimmed />)}
              </OrderSection>
            )}

            {deliveredOrders.length > 0 && (
              <OrderSection title="已送达" color="slate">
                {deliveredOrders.map(fo => <OrderCard key={fo.id} order={fo} statusBadge="delivered" dimmed />)}
              </OrderSection>
            )}

            {myFactoryOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-md bg-muted">
                  <Package className="h-7 w-7 text-slate-300" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">暂无订单</p>
                <p className="mt-1 text-xs text-muted-foreground/60">分销商创建的订单将在此处显示</p>
              </div>
            )}
          </div>
        )}

        {/* Meals Tab */}
        {activeTab === 'meals' && (
          <div className="animate-fade-in">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-bold text-lg font-bold text-foreground">菜品列表</h2>
              <button onClick={() => setShowAddMeal(true)} className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700">
                <Plus className="h-4 w-4" /> 添加菜品
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
              {meals.map(meal => (
                <div key={meal.id} className="rounded-xl border border-slate-100 bg-white px-4 py-4">
                  <div className="mb-2.5 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{meal.name}</h3>
                      {meal.nameEn && <p className="text-xs text-muted-foreground">{meal.nameEn}</p>}
                    </div>
                    <span className="text-lg font-bold text-teal-600">${meal.price}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-md bg-cyan-50 px-2 py-0.5 text-xs font-medium text-cyan-700 border border-cyan-200">{meal.category}</span>
                    {meal.dietaryTags?.map(tag => (
                      <span key={tag} className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{tag}</span>
                    ))}
                  </div>
                  <button className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-teal-600 ring-1 ring-inset ring-slate-200">
                    <Edit className="h-4 w-4" /> 编辑
                  </button>
                </div>
              ))}
            </div>

            {showAddMeal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
                <div className="animate-scale-in w-full max-w-md rounded-xl border border-slate-100 shadow-xl bg-white px-6 py-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-bold text-lg font-bold text-foreground">添加新菜品</h3>
                    <button onClick={() => setShowAddMeal(false)} className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                      <X className="h-4.5 w-4.5" />
                    </button>
                  </div>
                  <form onSubmit={handleAddMeal} className="space-y-3.5">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground">菜品名称</label>
                      <input name="name" type="text" required className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-foreground transition focus:outline-none focus:ring-2" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground">价格</label>
                      <input name="price" type="number" required min="1" className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-foreground transition focus:outline-none focus:ring-2" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground">分类</label>
                      <select name="category" className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-foreground transition focus:outline-none focus:ring-2">
                        <option value="荤菜">荤菜</option>
                        <option value="素菜">素菜</option>
                        <option value="面食">面食</option>
                        <option value="汤品">汤品</option>
                      </select>
                    </div>
                    <div className="flex gap-3 pt-1">
                      <button type="button" onClick={() => setShowAddMeal(false)} className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-slate-50">
                        取消
                      </button>
                      <button type="submit" className="flex-1 rounded-lg bg-teal-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700">
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

function OrderSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    amber: { bg: 'bg-amber-50', text: 'text-amber-700' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    slate: { bg: 'bg-slate-50', text: 'text-slate-700' },
  }
  const c = colorMap[color] || colorMap.slate
  return (
    <section>
      <div className="mb-3 flex items-center gap-2.5">
        <div className={`flex h-7 w-7 items-center justify-center rounded-md ${c.bg} ${c.text}`}>
          <Package className="h-3.5 w-3.5" />
        </div>
        <h2 className="font-bold text-base font-bold text-foreground">{title}</h2>
      </div>
      <div className="space-y-3 stagger-children">{children}</div>
    </section>
  )
}

function OrderCard({ order, statusBadge, dimmed, children }: { order: FactoryOrder; statusBadge: string; dimmed?: boolean; children?: React.ReactNode }) {
  const badgeConfig: Record<string, { bg: string; text: string; border: string; label: string }> = {
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border border-amber-200', label: '待接单' },
    confirmed: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border border-blue-200', label: '已确认' },
    completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border border-emerald-200', label: '已完成' },
    delivered: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border border-slate-200', label: '已送达' },
  }
  const badge = badgeConfig[statusBadge] || badgeConfig.pending

  return (
    <div className={`rounded-xl border border-slate-100 bg-white transition-colors ${dimmed ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between px-5 py-3.5">
        <div>
          <h3 className="font-semibold text-foreground">{order.id}</h3>
          <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString('zh-CN')}</p>
          {(order.serviceName || order.distributorName) && (
            <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground/60">
              {order.serviceName && <span className="rounded bg-violet-50 px-1.5 py-0.5 text-violet-600">{order.serviceName}</span>}
              {order.distributorName && <><span>&rarr;</span><span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">{order.distributorName}</span></>}
            </div>
          )}
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.bg} ${badge.text} ${badge.border}`}>
          {badge.label}
        </span>
      </div>
      <div className="px-5 py-4">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {order.items.map((item, idx) => (
            <span key={idx} className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {item.mealName} <span className="text-teal-600">x{item.quantity}</span>
            </span>
          ))}
        </div>
        <div className="mb-3 flex items-center justify-between pt-3">
          <span className="text-sm font-medium text-muted-foreground">总计</span>
          <span className="text-lg font-bold text-teal-600">${order.totalAmount}</span>
        </div>
        {children}
      </div>
    </div>
  )
}
