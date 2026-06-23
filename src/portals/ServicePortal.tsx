import { useState, useMemo, useEffect } from 'react'
import { Link, ArrowLeft, Users, TrendingUp, DollarSign, ShoppingBag, ChevronRight, Search, Filter, Calendar, Clock, CheckCircle, XCircle, ShieldCheck, BarChart3, FileText, User, Truck } from 'lucide-react'
import { storage, Order } from '../store'
import LoginGate, { useCurrentUser } from '../components/LoginGate'

type Tab = 'dashboard' | 'customers' | 'cost' | 'review'
type Period = 'thisWeek' | 'thisMonth' | 'last3Months' | 'all'

export default function ServicePortal() {
  return (
    <LoginGate role="service" title="服务机构 - 选择身份" gradient="from-violet-600 via-purple-600 to-violet-500" icon={ShieldCheck}>
      <ServicePortalContent />
    </LoginGate>
  )
}

function ServicePortalContent() {
  const { currentUser } = useCurrentUser()
  const [orders, setOrders] = useState<Order[]>(() => storage.getOrders())
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [period, setPeriod] = useState<Period>('all')
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const refreshOrders = () => setOrders(storage.getOrders())

  useEffect(() => {
    return storage.subscribeToOrderChanges(() => setOrders(storage.getOrders()))
  }, [])

  const now = new Date()

  const periodFilter = (order: Order): boolean => {
    const d = new Date(order.createdAt)
    switch (period) {
      case 'thisWeek': {
        const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0,0,0,0)
        return d >= startOfWeek
      }
      case 'thisMonth': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        return d >= startOfMonth
      }
      case 'last3Months': {
        const threeMonthsAgo = new Date(now); threeMonthsAgo.setMonth(now.getMonth() - 3)
        return d >= threeMonthsAgo
      }
      default: return true
    }
  }

  const myCustomerPhones = useMemo(() => {
    const accounts = storage.getAccounts<{phone:string;serviceId:string}>('customer')
    return new Set(accounts.filter(a => a.serviceId === currentUser?.id).map(a => a.phone))
  }, [currentUser])

  const allCustomers = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; address: string; orders: Order[] }>()
    const accounts = storage.getAccounts<{ name: string; phone: string; address: string; serviceId: string }>('customer')
    accounts.forEach(a => {
      if (a.serviceId !== currentUser?.id) return
      const key = a.phone || a.name
      if (!map.has(key)) {
        map.set(key, { name: a.name, phone: a.phone, address: a.address || '', orders: [] })
      }
    })
    orders.forEach(o => {
      if (!myCustomerPhones.has(o.customerPhone)) return
      const key = o.customerPhone || o.customerName
      const existing = map.get(key)
      if (existing) {
        existing.orders.push(o)
      } else {
        map.set(key, { name: o.customerName, phone: o.customerPhone, address: o.customerAddress, orders: [o] })
      }
    })
    return Array.from(map.values()).sort((a, b) => b.orders.length - a.orders.length)
  }, [orders, myCustomerPhones, currentUser])

  const filteredOrders = useMemo(() => orders.filter(o => myCustomerPhones.has(o.customerPhone) && periodFilter(o)), [orders, period, myCustomerPhones])
  const myOrders = useMemo(() => orders.filter(o => myCustomerPhones.has(o.customerPhone)), [orders, myCustomerPhones])
  const pendingOrders = myOrders.filter(o => o.status === 'pending')
  const approvedOrders = myOrders.filter(o => o.status === 'approved')
  const processingOrders = myOrders.filter(o => o.status === 'processing')
  const completedOrders = myOrders.filter(o => o.status === 'completed')
  const deliveredOrders = myOrders.filter(o => o.status === 'delivered')
  const rejectedOrders = myOrders.filter(o => o.status === 'rejected')

  const stats = useMemo(() => {
    const filtered = filteredOrders
    const totalRevenue = filtered.reduce((s, o) => s + o.totalAmount, 0)
    const totalItems = filtered.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.quantity, 0), 0)
    return {
      totalCustomers: allCustomers.length,
      totalOrders: filtered.length,
      totalRevenue,
      totalItems,
      avgOrderValue: filtered.length ? Math.round(totalRevenue / filtered.length) : 0,
      avgPerCustomer: allCustomers.length ? Math.round(totalRevenue / allCustomers.length) : 0,
    }
  }, [filteredOrders, allCustomers])

  const customerSpending = useMemo(() => {
    return allCustomers.map(c => ({
      name: c.name,
      phone: c.phone,
      address: c.address,
      orderCount: c.orders.filter(periodFilter).length,
      totalSpent: c.orders.filter(periodFilter).reduce((s, o) => s + o.totalAmount, 0),
      avgPerOrder: 0,
      allOrders: c.orders,
    })).filter(c => c.orderCount > 0).sort((a, b) => b.totalSpent - a.totalSpent).map(c => ({
      ...c,
      avgPerOrder: c.orderCount ? Math.round(c.totalSpent / c.orderCount) : 0,
    }))
  }, [allCustomers, period, orders])

  const weeklyTrend = useMemo(() => {
    const weeks: Record<string, { revenue: number; orders: number }> = {}
    orders.forEach(o => {
      const d = new Date(o.createdAt)
      const weekStart = new Date(d); weekStart.setDate(d.getDate() - d.getDay()); weekStart.setHours(0,0,0,0)
      const key = weekStart.toISOString().split('T')[0]
      if (!weeks[key]) weeks[key] = { revenue: 0, orders: 0 }
      weeks[key].revenue += o.totalAmount
      weeks[key].orders += 1
    })
    return Object.entries(weeks).sort(([a], [b]) => a.localeCompare(b)).slice(-8)
  }, [orders])

  const maxWeekRevenue = Math.max(...weeklyTrend.map(([, v]) => v.revenue), 1)

  const categorySpending = useMemo(() => {
    const cats: Record<string, number> = {}
    filteredOrders.forEach(o => {
      o.items.forEach(item => {
        const cat = (item as any).subCategory || (item as any).category || '未分类'
        const simple = cat.includes('Regular') ? '常规主餐' : cat.includes('Easy') ? '易咀嚼主餐' : cat.includes('Vegetarian') || cat.includes('素食') ? '素食' : cat.includes('Farmdoor') || cat.includes('Main Meal') ? 'Farmdoor主餐' : cat.includes('Sweet') || cat.includes('甜点') ? '甜点' : cat.includes('Fruit') || cat.includes('Dairy') ? '水果/乳制品' : '其他'
        cats[simple] = (cats[simple] || 0) + item.quantity
      })
    })
    return Object.entries(cats).sort(([, a], [, b]) => b - a)
  }, [filteredOrders])

  const maxCatQty = Math.max(...categorySpending.map(([, q]) => q), 1)

  const handleApprove = (orderId: string) => {
    const order = storage.getOrders().find(o => o.id === orderId)
    if (!order || !myCustomerPhones.has(order.customerPhone)) { return }
    storage.updateOrder(orderId, { status: 'approved', approvedAt: new Date().toISOString() })
    refreshOrders()
  }
  const handleReject = (orderId: string) => {
    const order = storage.getOrders().find(o => o.id === orderId)
    if (!order || !myCustomerPhones.has(order.customerPhone)) { return }
    storage.updateOrder(orderId, { status: 'rejected' })
    refreshOrders()
  }

  const selectedCustomerData = selectedCustomer
    ? customerSpending.find(c => c.phone === selectedCustomer) || customerSpending.find(c => c.name === selectedCustomer)
    : null

  const periodLabel: Record<Period, string> = { thisWeek: '本周', thisMonth: '本月', last3Months: '近3月', all: '全部' }

  const statColors = ['#3b82f6', '#f97316', '#10b981', '#8b5cf6']

  return (
    <div className="min-h-screen" style={{ background: 'hsl(30 20% 98%)' }}>
      {/* Header */}
      <header className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #6d28d9, #7c3aed, #8b5cf6)' }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-8">
          <Link to="/" className="mb-4 inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium text-white/85 backdrop-blur transition-colors hover:bg-white/20 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/12">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-white">服务机构端</h1>
              <p className="mt-0.5 text-sm text-white/80">{currentUser?.name || ''} · 多客户管理 · 费用分析 · 订单审核</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur" style={{ boxShadow: '0 1px 0 hsl(30 8% 92%)' }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex gap-0.5 py-1.5">
            {[
              { id: 'dashboard' as Tab, label: '总览', icon: BarChart3, badge: null },
              { id: 'customers' as Tab, label: '客户管理', icon: Users, badge: allCustomers.length },
              { id: 'cost' as Tab, label: '费用分析', icon: TrendingUp, badge: null },
              { id: 'review' as Tab, label: '订单审核', icon: FileText, badge: pendingOrders.length || null },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedCustomer(null) }}
                className={`flex items-center gap-1.5 rounded px-3.5 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary/12 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.badge && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    activeTab === tab.id ? 'bg-primary/20 text-primary' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {/* ── DASHBOARD ── */}
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in space-y-8">
            {/* Key metrics */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
              {[
                { label: '总客户数', value: stats.totalCustomers, icon: Users, colorIdx: 0 },
                { label: '总订单', value: stats.totalOrders, icon: ShoppingBag, colorIdx: 1 },
                { label: '总收入', value: `$${stats.totalRevenue}`, icon: DollarSign, colorIdx: 2 },
                { label: `人均消费 (${periodLabel[period]})`, value: `$${stats.avgPerCustomer}`, icon: TrendingUp, colorIdx: 3 },
              ].map((m) => (
                <div key={m.label} className="rounded-lg bg-white px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[28px] font-bold tabular-nums leading-none text-foreground">{m.value}</p>
                      <p className="mt-1.5 text-xs font-medium text-muted-foreground">{m.label}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: statColors[m.colorIdx] }}>
                      <m.icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-foreground">数据分析</h3>
                <div className="flex items-center gap-1 rounded bg-muted p-0.5">
                  {(['thisWeek', 'thisMonth', 'last3Months', 'all'] as Period[]).map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                        period === p ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {periodLabel[p]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
              {/* Weekly trend */}
              <div className="rounded-lg bg-white px-5 py-5">
                <h3 className="font-display mb-0.5 text-sm font-bold text-foreground">周收入趋势</h3>
                <p className="mb-5 text-xs text-muted-foreground">最近 {weeklyTrend.length} 周</p>
                {weeklyTrend.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">暂无数据</p>
                ) : (
                  <div className="flex items-end gap-2" style={{ height: 140 }}>
                    {weeklyTrend.map(([week, data]) => {
                      const h = (data.revenue / maxWeekRevenue) * 120
                      return (
                        <div key={week} className="group flex flex-1 flex-col items-center gap-1">
                          <span className="text-xs font-semibold text-muted-foreground tabular-nums">${data.revenue}</span>
                          <div
                            className="w-full rounded-t transition-all"
                            style={{
                              height: Math.max(h, 4),
                              background: 'linear-gradient(to top, hsl(15 55% 40%), hsl(32 35% 45%))',
                            }}
                          />
                          <span className="text-[10px] text-muted-foreground/60">{week.slice(5)}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Category breakdown */}
              <div className="rounded-lg bg-white px-5 py-5">
                <h3 className="font-display mb-0.5 text-sm font-bold text-foreground">餐品类别分布</h3>
                <p className="mb-5 text-xs text-muted-foreground">{periodLabel[period]} 各品类点单量</p>
                {categorySpending.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">暂无数据</p>
                ) : (
                  <div className="space-y-2.5">
                    {categorySpending.map(([cat, qty]) => (
                      <div key={cat} className="flex items-center gap-3">
                        <span className="w-20 flex-shrink-0 text-xs font-medium text-muted-foreground">{cat}</span>
                        <div className="flex-1 h-4 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(qty / maxCatQty) * 100}%`,
                              background: 'linear-gradient(to right, hsl(15 55% 40%), hsl(32 35% 45%))',
                            }}
                          />
                        </div>
                        <span className="w-6 text-right text-xs font-semibold tabular-nums text-muted-foreground">{qty}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            </div>

            {/* Top customers preview */}
            {customerSpending.length > 0 && (
              <div className="rounded-lg bg-white">
                <div className="flex items-center justify-between px-5 py-3.5">
                  <h3 className="font-display text-sm font-bold text-foreground">消费排行 TOP {Math.min(5, customerSpending.length)}</h3>
                  <button onClick={() => setActiveTab('customers')} className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80">
                    查看全部 <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div>
                  {customerSpending.slice(0, 5).map((c, idx) => (
                    <div key={c.phone} className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-muted">
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/12 text-xs font-bold text-primary">{idx + 1}</span>
                        <div>
                          <p className="text-sm font-medium text-foreground">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.phone}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">${c.totalSpent}</p>
                        <p className="text-xs text-muted-foreground">{c.orderCount} 单</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CUSTOMER MANAGEMENT ── */}
        {activeTab === 'customers' && (
          <div className="animate-fade-in">
            {selectedCustomerData ? (
              <div className="space-y-5">
                <button onClick={() => setSelectedCustomer(null)} className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80">
                  <ChevronRight className="h-4 w-4 rotate-180" /> 返回客户列表
                </button>

                <div className="rounded-lg bg-white px-5 py-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-display text-lg font-bold text-foreground">{selectedCustomerData.name}</h2>
                      <p className="mt-0.5 text-sm text-muted-foreground">{selectedCustomerData.phone}</p>
                      <p className="text-sm text-muted-foreground/60">{selectedCustomerData.address}</p>
                    </div>
                    <div className="flex gap-5 text-center">
                      <div>
                        <div className="text-xl font-bold text-primary">${selectedCustomerData.totalSpent}</div>
                        <div className="text-xs text-muted-foreground">总消费</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-foreground">{selectedCustomerData.orderCount}</div>
                        <div className="text-xs text-muted-foreground">订单数</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-foreground">${selectedCustomerData.avgPerOrder}</div>
                        <div className="text-xs text-muted-foreground">均单金额</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-white">
                  <div className="px-5 py-3.5">
                    <h3 className="font-display text-sm font-bold text-foreground">订单历史</h3>
                  </div>
                  <div>
                    {selectedCustomerData.allOrders.filter(periodFilter).length === 0 ? (
                      <p className="px-5 py-10 text-center text-sm text-muted-foreground">该时间段内无订单</p>
                    ) : (
                      selectedCustomerData.allOrders.filter(periodFilter).map(order => (
                        <div key={order.id} className="px-5 py-3.5 transition-colors hover:bg-muted">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground">{order.id}</span>
                              <span className={`badge ${order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : order.status === 'approved' ? 'bg-blue-100 text-blue-700' : order.status === 'pending' ? 'bg-amber-100 text-amber-700' : order.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground'}`}>
                                {order.status === 'pending' ? '待审核' : order.status === 'approved' ? '已通过' : order.status === 'rejected' ? '已拒绝' : order.status === 'processing' ? '生产中' : order.status === 'completed' ? '配送中' : '已送达'}
                              </span>
                            </div>
                            <span className="text-sm font-bold" style={{ color: 'hsl(15 55% 40%)' }}>${order.totalAmount}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {order.items.map((item, idx) => (
                              <span key={idx} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                {item.mealName} x{item.quantity}
                              </span>
                            ))}
                          </div>
                          {(order.serviceName || order.distributorName || order.factoryName) && (
                            <div className="mb-1 flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground/60">
                              {order.serviceName && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">{order.serviceName}</span>}
                              {order.serviceName && (order.distributorName || order.factoryName) && <span>&rarr;</span>}
                              {order.distributorName && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-600">{order.distributorName}</span>}
                              {order.distributorName && order.factoryName && <span>&rarr;</span>}
                              {order.factoryName && <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-600">{order.factoryName}</span>}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground/60">{new Date(order.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full rounded py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/12 ring-1 ring-inset"
                      style={{ '--tw-ring-color': 'hsl(30 8% 88%)' } as React.CSSProperties}
                      placeholder="搜索客户姓名/电话..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground/60" />
                    {(['all', 'thisMonth', 'last3Months'] as Period[]).map(p => (
                      <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                          period === p ? 'bg-primary/12 text-primary' : 'text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {periodLabel[p]}
                      </button>
                    ))}
                  </div>
                </div>

                {customerSpending.filter(c => {
                  if (!searchQuery) return true
                  const q = searchQuery.toLowerCase()
                  return c.name.toLowerCase().includes(q) || c.phone.includes(q)
                }).length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg bg-white py-20">
                    <Users className="mb-3 h-9 w-9 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-muted-foreground">暂无客户数据</p>
                    <p className="mt-1 text-xs text-muted-foreground/60">老人下单后，客户信息将在此处汇总</p>
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 stagger-children">
                    {customerSpending.filter(c => {
                      if (!searchQuery) return true
                      const q = searchQuery.toLowerCase()
                      return c.name.toLowerCase().includes(q) || c.phone.includes(q)
                    }).map(c => (
                      <button
                        key={c.phone}
                        onClick={() => setSelectedCustomer(c.phone)}
                        className="rounded-lg bg-white px-4 py-4 text-left transition-colors hover:ring-1 hover:ring-primary/20"
                        style={{ borderColor: 'hsl(30 8% 90%)' }}
                      >
                        <div className="mb-2.5 flex items-start justify-between">
                          <div>
                            <h3 className="font-display text-sm font-bold text-foreground">{c.name}</h3>
                            <p className="text-xs text-muted-foreground">{c.phone}</p>
                          </div>
                          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                            <User className="h-3.5 w-3.5 text-primary" />
                          </div>
                        </div>
                        {c.address && <p className="mb-2.5 truncate text-xs text-muted-foreground/60">{c.address}</p>}
                        <div className="flex items-center justify-between pt-2.5">
                          <div className="text-center">
                            <div className="text-base font-bold text-primary">${c.totalSpent}</div>
                            <div className="text-[10px] text-muted-foreground">总消费</div>
                          </div>
                          <div className="text-center">
                            <div className="text-base font-bold text-foreground">{c.orderCount}</div>
                            <div className="text-[10px] text-muted-foreground">订单</div>
                          </div>
                          <div className="text-center">
                            <div className="text-base font-bold text-foreground">${c.avgPerOrder}</div>
                            <div className="text-[10px] text-muted-foreground">均单</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── COST ANALYSIS ── */}
        {activeTab === 'cost' && (
          <div className="animate-fade-in space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground/60" />
                {(['thisWeek', 'thisMonth', 'last3Months', 'all'] as Period[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                      period === p ? 'bg-primary/12 text-primary' : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {periodLabel[p]}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>总订单: <strong className="text-foreground">{stats.totalOrders}</strong></span>
                <span>总收入: <strong className="text-primary">${stats.totalRevenue}</strong></span>
                <span>人均: <strong className="text-foreground">${stats.avgPerCustomer}</strong></span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 stagger-children">
              {[
                { label: '总收入', value: `$${stats.totalRevenue}`, sub: `${periodLabel[period]}累计`, icon: DollarSign, colorIdx: 2 },
                { label: '服务客户', value: customerSpending.length, sub: `${stats.totalOrders} 笔订单`, icon: Users, colorIdx: 0 },
                { label: '均单金额', value: `$${stats.avgOrderValue}`, sub: `${stats.totalItems} 个餐品`, icon: ShoppingBag, colorIdx: 3 },
              ].map(m => (
                <div key={m.label} className="rounded-lg bg-white px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[28px] font-bold tabular-nums leading-none text-foreground">{m.value}</p>
                      <p className="mt-1.5 text-xs font-medium text-muted-foreground">{m.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{m.sub}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: statColors[m.colorIdx] }}>
                      <m.icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-white overflow-hidden">
              <div className="px-5 py-3.5">
                <h3 className="font-display text-sm font-bold text-foreground">客户消费明细</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{periodLabel[period]} · 点击客户查看订单详情</p>
              </div>
              {customerSpending.length === 0 ? (
                <p className="px-5 py-14 text-center text-sm text-muted-foreground">该时间段内无消费记录</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted text-left" style={{ borderColor: 'hsl(30 8% 90%)' }}>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">客户</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">电话</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">订单数</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">均单金额</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">总消费</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">占比</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'hsl(30 8% 90%)' }}>
                      {customerSpending.map(c => (
                        <tr
                          key={c.phone}
                          onClick={() => { setSelectedCustomer(c.phone); setActiveTab('customers') }}
                          className="cursor-pointer transition-colors hover:bg-primary/[0.03]"
                        >
                          <td className="px-5 py-3"><span className="font-medium text-foreground">{c.name}</span></td>
                          <td className="px-5 py-3 text-muted-foreground">{c.phone}</td>
                          <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">{c.orderCount}</td>
                          <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">${c.avgPerOrder}</td>
                          <td className="px-5 py-3 text-right tabular-nums"><span className="font-semibold text-primary">${c.totalSpent}</span></td>
                          <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">{stats.totalRevenue ? Math.round((c.totalSpent / stats.totalRevenue) * 100) : 0}%</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 bg-muted font-semibold" style={{ borderColor: 'hsl(30 8% 90%)' }}>
                        <td className="px-5 py-3 text-foreground">合计</td>
                        <td className="px-5 py-3 text-muted-foreground">{customerSpending.length} 人</td>
                        <td className="px-5 py-3 text-right tabular-nums text-foreground">{stats.totalOrders}</td>
                        <td className="px-5 py-3 text-right tabular-nums text-foreground">${stats.avgOrderValue}</td>
                        <td className="px-5 py-3 text-right tabular-nums text-primary">${stats.totalRevenue}</td>
                        <td className="px-5 py-3 text-right tabular-nums text-foreground">100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ORDER REVIEW ── */}
        {activeTab === 'review' && (
          <div className="animate-fade-in space-y-8">
            {pendingOrders.length > 0 && (
              <section>
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100">
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <h2 className="font-display text-base font-bold text-foreground">待审核订单 ({pendingOrders.length})</h2>
                </div>
                <div className="space-y-3 stagger-children">
                  {pendingOrders.map(order => (
                    <div key={order.id} className="overflow-hidden rounded-lg bg-white">
                      <div className="flex items-start justify-between gap-4 px-5 py-4">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1.5 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground/60" />
                            <span className="text-sm font-bold text-foreground">{order.id}</span>
                            <span className="badge bg-amber-100 text-amber-700">待审核</span>
                          </div>
                          <div className="mb-2.5 grid gap-1.5 sm:grid-cols-2">
                            <div><span className="text-xs text-muted-foreground">客户: </span><span className="text-sm font-medium text-foreground">{order.customerName}</span></div>
                            <div><span className="text-xs text-muted-foreground">电话: </span><span className="text-sm text-muted-foreground">{order.customerPhone}</span></div>
                            <div><span className="text-xs text-muted-foreground">时间: </span><span className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleString('zh-CN')}</span></div>
                            <div><span className="text-xs text-muted-foreground">地址: </span><span className="text-sm text-muted-foreground truncate">{order.customerAddress}</span></div>
                          </div>
                          {(order.serviceName || order.distributorName || order.factoryName) && (
                            <div className="mb-2.5 flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground/60">
                              <span className="text-muted-foreground/60">流转:</span>
                              <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">老人:{order.customerName}</span>
                              {order.serviceName && <><span>&rarr;</span><span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">{order.serviceName}</span></>}
                              {order.distributorName && <><span>&rarr;</span><span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-600">{order.distributorName}</span></>}
                              {order.factoryName && <><span>&rarr;</span><span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-600">{order.factoryName}</span></>}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-1 mb-2.5">
                            {order.items.map((item, idx) => (
                              <span key={idx} className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                                {item.mealName} <span className="font-medium" style={{ color: 'hsl(15 55% 40%)' }}>x{item.quantity}</span>
                              </span>
                            ))}
                          </div>
                          <div className="text-lg font-bold" style={{ color: 'hsl(15 55% 40%)' }}>${order.totalAmount}</div>
                        </div>
                      </div>
                      <div className="flex gap-3 px-5 py-3">
                        <button
                          onClick={() => handleApprove(order.id)}
                          className="flex flex-1 items-center justify-center gap-2 rounded bg-emerald-500 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                        >
                          <CheckCircle className="h-4 w-4" /> 审核通过
                        </button>
                        <button
                          onClick={() => handleReject(order.id)}
                          className="flex flex-1 items-center justify-center gap-2 rounded ring-1 ring-red-200 bg-white py-2 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4" /> 拒绝
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {approvedOrders.length > 0 && <OrderStatusSection title="已审核 (待分销汇总)" orders={approvedOrders} icon={CheckCircle} iconBg="bg-blue-100" iconColor="text-blue-600" badgeLabel="已通过" badgeClass="bg-blue-100 text-blue-700" />}
            {processingOrders.length > 0 && <OrderStatusSection title="生产中" orders={processingOrders} icon={Clock} iconBg="bg-primary/12" iconColor="text-primary" badgeLabel="生产中" badgeClass="bg-primary/12 text-primary" />}
            {completedOrders.length > 0 && <OrderStatusSection title="已完成 (待配送)" orders={completedOrders} icon={Truck} iconBg="bg-emerald-100" iconColor="text-emerald-600" badgeLabel="已完成" badgeClass="bg-emerald-100 text-emerald-700" />}
            {deliveredOrders.length > 0 && <OrderStatusSection title="已送达" orders={deliveredOrders} icon={CheckCircle} iconBg="bg-muted" iconColor="text-muted-foreground" badgeLabel="已送达" badgeClass="bg-muted text-muted-foreground" />}
            {rejectedOrders.length > 0 && <OrderStatusSection title="已拒绝" orders={rejectedOrders} icon={XCircle} iconBg="bg-red-100" iconColor="text-red-600" badgeLabel="已拒绝" badgeClass="bg-red-100 text-red-700" />}

            {myOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-lg bg-white py-20">
                <FileText className="mb-3 h-9 w-9 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">暂无订单需要审核</p>
                <p className="mt-1 text-xs text-muted-foreground/60">老人提交的订单将在此处显示</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function OrderStatusSection({ title, orders, icon: Icon, iconBg, iconColor, badgeLabel, badgeClass }: {
  title: string
  orders: Order[]
  icon: React.ElementType
  iconBg: string
  iconColor: string
  badgeLabel: string
  badgeClass: string
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2.5">
        <div className={`flex h-7 w-7 items-center justify-center rounded-md ${iconBg}`}>
          <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
        </div>
        <h2 className="font-display text-base font-bold text-foreground">{title} ({orders.length})</h2>
      </div>
      <div className="space-y-1.5">
        {orders.map(order => (
          <div key={order.id} className="flex items-center justify-between rounded bg-white px-4 py-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon className={`h-4.5 w-4.5 flex-shrink-0 ${iconColor}`} />
              <div className="min-w-0">
                <span className="text-sm font-semibold text-foreground">{order.id}</span>
                <span className="ml-2 text-xs text-muted-foreground truncate">{order.customerName} · {order.customerPhone}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {(order.serviceName || order.distributorName || order.factoryName) && (
                <div className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground/60">
                  {order.serviceName && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">{order.serviceName}</span>}
                  {order.distributorName && <><span>&rarr;</span><span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-600">{order.distributorName}</span></>}
                  {order.factoryName && <><span>&rarr;</span><span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-600">{order.factoryName}</span></>}
                </div>
              )}
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}>{badgeLabel}</span>
              <span className="text-sm font-bold text-foreground w-16 text-right">${order.totalAmount}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
