import { useState, useEffect, useMemo } from 'react'
import { Link, ArrowLeft, Package, CheckCircle, Clock, Plus, Edit, Truck, ChefHat, X } from 'lucide-react'
import { FactoryOrder, Meal, mockMeals, storage } from '../store'
import LoginGate, { useCurrentUser } from '../components/LoginGate'

export default function FactoryPortal() {
  return (
    <LoginGate role="factory" title="工厂端 - 选择身份" gradient="from-emerald-600 via-green-600 to-emerald-500" icon={ChefHat}>
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
    if (fo?.customerOrderIds?.length) {
      fo.customerOrderIds.forEach(orderId => {
        storage.updateOrder(orderId, { status: 'completed', factoryName: fo?.factoryName || currentUser?.name })
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

  const statColors = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6']

  const stats = [
    { label: '待接单', value: pendingOrders.length, icon: Clock, colorIdx: 0 },
    { label: '生产中', value: confirmedOrders.length, icon: Package, colorIdx: 1 },
    { label: '已完成', value: completedOrders.length, icon: CheckCircle, colorIdx: 2 },
    { label: '已送达', value: deliveredOrders.length, icon: Truck, colorIdx: 3 },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'hsl(30 20% 98%)' }}>
      <header className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-500">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-8">
          <Link to="/" className="mb-4 inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium text-white/85 backdrop-blur transition-colors hover:bg-white/20 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> 返回首页
          </Link>
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/12">
              <ChefHat className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-white">工厂端</h1>
              <p className="mt-0.5 text-sm text-white/80">{currentUser?.name || ''} · 菜品管理、订单生产与配送</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-lg bg-white px-5 py-4">
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
        <div className="mb-6 flex gap-1 rounded-lg bg-muted p-1">
          {[
            { id: 'orders' as const, label: '订单管理', count: pendingOrders.length },
            { id: 'meals' as const, label: '菜品管理', count: null },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded px-3.5 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'bg-gray-900 text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${activeTab === tab.id ? 'bg-white/20 text-white' : ''}`}
                  style={activeTab !== tab.id ? { background: 'hsl(140 12% 93%)', color: 'hsl(140 12% 40%)' } : undefined}>
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
                    <button onClick={() => handleConfirm(fo.id)} className="flex w-full items-center justify-center gap-2 rounded bg-gray-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800">
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
                    <button onClick={() => handleComplete(fo.id)} className="flex w-full items-center justify-center gap-2 rounded bg-gray-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800">
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
              <div className="flex flex-col items-center justify-center rounded-lg bg-white py-16">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-md bg-muted">
                  <Package className="h-7 w-7" style={{ color: 'hsl(30 8% 78%)' }} />
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
              <h2 className="font-display text-lg font-bold text-foreground">菜品列表</h2>
              <button onClick={() => setShowAddMeal(true)} className="flex items-center gap-1.5 rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800">
                <Plus className="h-4 w-4" /> 添加菜品
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
              {meals.map(meal => (
                <div key={meal.id} className="rounded-lg bg-white px-4 py-4">
                  <div className="mb-2.5 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{meal.name}</h3>
                      {meal.nameEn && <p className="text-xs text-muted-foreground">{meal.nameEn}</p>}
                    </div>
                    <span className="text-lg font-bold" style={{ color: 'hsl(15 55% 40%)' }}>${meal.price}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-md px-2 py-0.5 text-xs font-medium" style={{ background: 'hsl(140 12% 93%)', color: 'hsl(140 12% 40%)' }}>{meal.category}</span>
                    {meal.dietaryTags?.map(tag => (
                      <span key={tag} className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{tag}</span>
                    ))}
                  </div>
                  <button className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/[0.04] hover:text-primary ring-1 ring-inset" style={{ color: 'hsl(20 6% 48%)', '--tw-ring-color': 'hsl(30 8% 88%)' } as React.CSSProperties}>
                    <Edit className="h-4 w-4" /> 编辑
                  </button>
                </div>
              ))}
            </div>

            {showAddMeal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
                <div className="animate-scale-in w-full max-w-md rounded-lg border bg-white px-6 py-5 shadow-xl" style={{ borderColor: 'hsl(30 8% 90%)' }}>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold text-foreground">添加新菜品</h3>
                    <button onClick={() => setShowAddMeal(false)} className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                      <X className="h-4.5 w-4.5" />
                    </button>
                  </div>
                  <form onSubmit={handleAddMeal} className="space-y-3.5">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground">菜品名称</label>
                      <input name="name" type="text" required className="w-full rounded border px-3.5 py-2.5 text-sm text-foreground transition focus:outline-none focus:ring-2" style={{ borderColor: 'hsl(30 8% 88%)' }} />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground">价格</label>
                      <input name="price" type="number" required min="1" className="w-full rounded border px-3.5 py-2.5 text-sm text-foreground transition focus:outline-none focus:ring-2" style={{ borderColor: 'hsl(30 8% 88%)' }} />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground">分类</label>
                      <select name="category" className="w-full rounded border px-3.5 py-2.5 text-sm text-foreground transition focus:outline-none focus:ring-2" style={{ borderColor: 'hsl(30 8% 88%)' }}>
                        <option value="荤菜">荤菜</option>
                        <option value="素菜">素菜</option>
                        <option value="面食">面食</option>
                        <option value="汤品">汤品</option>
                      </select>
                    </div>
                    <div className="flex gap-3 pt-1">
                      <button type="button" onClick={() => setShowAddMeal(false)} className="flex-1 rounded border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted" style={{ borderColor: 'hsl(30 8% 88%)' }}>
                        取消
                      </button>
                      <button type="submit" className="flex-1 rounded bg-gray-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800">
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
    amber: { bg: 'hsl(30 25% 92%)', text: 'hsl(15 55% 40%)' },
    blue: { bg: '#dbeafe', text: '#2563eb' },
    emerald: { bg: 'hsl(140 12% 93%)', text: 'hsl(140 12% 40%)' },
    slate: { bg: '#f1f5f9', text: '#475569' },
  }
  const c = colorMap[color] || colorMap.slate
  return (
    <section>
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md" style={{ background: c.bg, color: c.text }}>
          <Package className="h-3.5 w-3.5" />
        </div>
        <h2 className="font-display text-base font-bold text-foreground">{title}</h2>
      </div>
      <div className="space-y-3 stagger-children">{children}</div>
    </section>
  )
}

function OrderCard({ order, statusBadge, dimmed, children }: { order: FactoryOrder; statusBadge: string; dimmed?: boolean; children?: React.ReactNode }) {
  const badgeConfig: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: 'hsl(30 25% 92%)', color: 'hsl(15 55% 40%)', label: '待接单' },
    confirmed: { bg: '#dbeafe', color: '#1d4ed8', label: '已确认' },
    completed: { bg: 'hsl(140 12% 93%)', color: 'hsl(140 12% 40%)', label: '已完成' },
    delivered: { bg: '#f1f5f9', color: '#334155', label: '已送达' },
  }
  const badge = badgeConfig[statusBadge] || badgeConfig.pending

  return (
    <div className={`rounded-lg bg-white transition-colors ${dimmed ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between px-5 py-3.5">
        <div>
          <h3 className="font-semibold text-foreground">{order.id}</h3>
          <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString('zh-CN')}</p>
          {(order.serviceName || order.distributorName) && (
            <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground/60">
              {order.serviceName && <span className="rounded bg-violet-50 px-1.5 py-0.5 text-violet-600">{order.serviceName}</span>}
              {order.distributorName && <><span>&rarr;</span><span className="rounded px-1.5 py-0.5" style={{ background: 'hsl(30 25% 93%)', color: 'hsl(15 55% 42%)' }}>{order.distributorName}</span></>}
            </div>
          )}
        </div>
        <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: badge.bg, color: badge.color }}>
          {badge.label}
        </span>
      </div>
      <div className="px-5 py-4">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {order.items.map((item, idx) => (
            <span key={idx} className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {item.mealName} <span style={{ color: 'hsl(15 55% 40%)' }}>x{item.quantity}</span>
            </span>
          ))}
        </div>
        <div className="mb-3 flex items-center justify-between pt-3">
          <span className="text-sm font-medium text-muted-foreground">总计</span>
          <span className="text-lg font-bold" style={{ color: 'hsl(15 55% 40%)' }}>${order.totalAmount}</span>
        </div>
        {children}
      </div>
    </div>
  )
}
