import { useState, useEffect, useMemo } from 'react'
import { Building2, Users, ShoppingBag, DollarSign, Edit, Trash2 } from 'lucide-react'
import { storage, Order, CustomerAccount, SpendingLimit } from '../store'
import LoginGate, { useCurrentUser } from '../components/LoginGate'
import { confirmDialog } from '../components/Toast'

type Tab = 'dashboard' | 'customers' | 'limits' | 'orders'

export default function ServicePortal() {
  return (
    <LoginGate role="service" title="服务机构端 - 选择身份" gradient="from-violet-600 via-purple-600 to-violet-500" icon={Building2}>
      <ServicePortalContent />
    </LoginGate>
  )
}

function ServicePortalContent() {
  const { currentUser } = useCurrentUser()
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<CustomerAccount[]>([])

  useEffect(() => {
    setOrders(storage.getOrders())
    setCustomers(storage.getAccounts<CustomerAccount>('customer'))
    const unsub = storage.subscribeToOrderChanges(() => setOrders(storage.getOrders()))
    return () => { unsub() }
  }, [])

  const myCustomers = useMemo(
    () => customers.filter(c => c.serviceId === currentUser?.id),
    [customers, currentUser]
  )

  const myCustomerPhones = useMemo(
    () => new Set(myCustomers.map(c => c.phone)),
    [myCustomers]
  )

  const myOrders = useMemo(
    () => orders.filter(o => myCustomerPhones.has(o.customerPhone)),
    [orders, myCustomerPhones]
  )

  const todayOrders = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return myOrders.filter(o => new Date(o.createdAt) >= today)
  }, [myOrders])

  const monthlySpending = useMemo(() => {
    return myCustomers.reduce((sum, c) => sum + storage.getSpentInPeriod(c.phone, 'monthly'), 0)
  }, [myCustomers, orders])

  const limits = useMemo(() => storage.getSpendingLimits(), [orders])
  const coveredCount = myCustomers.filter(c => {
    const l = limits.find(l => l.customerPhone === c.phone)
    return l && (l.dailyLimit > 0 || l.weeklyLimit > 0 || l.monthlyLimit > 0)
  }).length

  const tabs: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'dashboard', label: '总览', icon: Building2 },
    { id: 'customers', label: '管理老人', icon: Users, count: myCustomers.length },
    { id: 'limits', label: '费用限额', icon: DollarSign },
    { id: 'orders', label: '订单记录', icon: ShoppingBag, count: myOrders.length },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'hsl(210 20% 98%)' }}>
      <header className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-violet-500">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-8">
          <a href="/" className="mb-4 inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium text-white/85 backdrop-blur-md transition-colors hover:bg-white/20 hover:text-white">
            &larr; 返回首页
          </a>
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-2xl font-bold tracking-tight text-white">服务机构端</h1>
              <p className="mt-0.5 text-sm text-white/80">{currentUser?.name} &middot; 老人补助管理 &middot; 消费额度控制</p>
            </div>
          </div>
        </div>
      </header>

      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex gap-0.5 overflow-x-auto py-1.5">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id ? 'bg-violet-50 text-violet-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    activeTab === tab.id ? 'bg-violet-100 text-violet-700' : 'text-muted-foreground'
                  }`} style={activeTab !== tab.id ? { background: 'hsl(210 15% 92%)' } : undefined}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {activeTab === 'dashboard' && (
          <DashboardTab
            myCustomers={myCustomers}
            todayOrders={todayOrders}
            monthlySpending={monthlySpending}
            coveredCount={coveredCount}
            myOrders={myOrders}
          />
        )}
        {activeTab === 'customers' && <CustomersTab customers={myCustomers} />}
        {activeTab === 'limits' && <LimitsTab customers={myCustomers} />}
        {activeTab === 'orders' && <OrdersTab orders={myOrders} />}
      </main>
    </div>
  )
}

function DashboardTab({ myCustomers, todayOrders, monthlySpending, coveredCount, myOrders }: {
  myCustomers: CustomerAccount[]
  todayOrders: Order[]
  monthlySpending: number
  coveredCount: number
  myOrders: Order[]
}) {
  const statColors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b']

  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
        {[
          { label: '管理老人', value: myCustomers.length, icon: Users, colorIdx: 0 },
          { label: '今日订单', value: todayOrders.length, icon: ShoppingBag, colorIdx: 1 },
          { label: '本月消费', value: `¥${monthlySpending.toFixed(0)}`, icon: DollarSign, colorIdx: 2 },
          { label: '限额覆盖率', value: myCustomers.length > 0 ? `${Math.round((coveredCount / myCustomers.length) * 100)}%` : '0%', icon: DollarSign, colorIdx: 3 },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-100 bg-white px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[28px] font-bold tabular-nums leading-none text-foreground">{s.value}</p>
                <p className="mt-1.5 text-xs font-medium text-muted-foreground">{s.label}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: statColors[s.colorIdx] }}>
                <s.icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-100 bg-white">
        <div className="px-5 py-3.5">
          <h3 className="font-bold text-sm font-bold text-foreground">最近订单 ({Math.min(10, myOrders.length)})</h3>
        </div>
        <div>
          {myOrders.slice().reverse().slice(0, 10).map(order => (
            <div key={order.id} className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-slate-50/60">
              <div>
                <span className="text-sm font-semibold text-foreground">{order.id}</span>
                <span className="ml-2 text-xs text-muted-foreground">{order.customerName} &middot; {order.customerPhone}</span>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={order.status} />
                <span className="text-sm font-bold text-violet-600">¥{order.totalAmount}</span>
              </div>
            </div>
          ))}
          {myOrders.length === 0 && <p className="px-5 py-10 text-center text-sm text-muted-foreground">暂无订单</p>}
        </div>
      </div>
    </div>
  )
}

function CustomersTab({ customers }: { customers: CustomerAccount[] }) {
  return (
    <div className="animate-fade-in">
      <div className="mb-5 flex items-center gap-2.5">
        <h2 className="font-bold text-lg font-bold text-foreground">管理老人</h2>
        <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700">{customers.length}</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50/80 border-slate-100 text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">姓名</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">电话</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">地址</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">备注</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-12 text-center text-sm text-muted-foreground">暂无关联老人</td></tr>
              ) : (
                customers.map(c => (
                  <tr key={c.id} className="transition-colors hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-semibold text-foreground">{c.name}</td>
                    <td className="px-5 py-3 text-foreground">{c.phone}</td>
                    <td className="px-5 py-3 text-muted-foreground">{c.address || '-'}</td>
                    <td className="px-5 py-3 text-muted-foreground">{c.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function LimitsTab({ customers }: { customers: CustomerAccount[] }) {
  const [limits, setLimits] = useState<SpendingLimit[]>(() => storage.getSpendingLimits())
  const [editingPhone, setEditingPhone] = useState<string | null>(null)
  const [draftDaily, setDraftDaily] = useState(0)
  const [draftWeekly, setDraftWeekly] = useState(0)
  const [draftMonthly, setDraftMonthly] = useState(0)
  const [saved, setSaved] = useState<string | null>(null)

  const getLimit = (phone: string) => limits.find(l => l.customerPhone === phone)

  const startEdit = (customer: CustomerAccount) => {
    const l = getLimit(customer.phone)
    setEditingPhone(customer.phone)
    setDraftDaily(l?.dailyLimit ?? 0)
    setDraftWeekly(l?.weeklyLimit ?? 0)
    setDraftMonthly(l?.monthlyLimit ?? 0)
  }

  const handleSave = (customer: CustomerAccount) => {
    storage.setSpendingLimit(customer.id, customer.phone, draftDaily, draftWeekly, draftMonthly)
    setLimits(storage.getSpendingLimits())
    setEditingPhone(null)
    setSaved(customer.phone)
    setTimeout(() => setSaved(null), 2000)
  }

  const handleClear = async (phone: string) => {
    if (!await confirmDialog('清除限额', '确定清除此老人的费用限额？清除后该老人将不再受消费限制。')) return
    const updated = limits.filter(l => l.customerPhone !== phone)
    storage.saveSpendingLimits(updated)
    setLimits(updated)
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg font-bold text-foreground">费用限额管理</h2>
          <p className="mt-1 text-sm text-muted-foreground">为本机构老人设置每日、每周、每月的消费上限，超出限额的订单将被拦截</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50/80 border-slate-100 text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">老人</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">每日限额</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">每周限额</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">每月限额</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">今日消费</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">本周消费</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">本月消费</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">暂无关联老人</td></tr>
              ) : (
                customers.map(c => {
                  const l = getLimit(c.phone)
                  const isEditing = editingPhone === c.phone
                  const dailySpent = storage.getSpentInPeriod(c.phone, 'daily')
                  const weeklySpent = storage.getSpentInPeriod(c.phone, 'weekly')
                  const monthlySpent = storage.getSpentInPeriod(c.phone, 'monthly')
                  const hasLimit = l && (l.dailyLimit > 0 || l.weeklyLimit > 0 || l.monthlyLimit > 0)

                  return (
                    <tr key={c.id} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <div>
                          <p className="font-semibold text-foreground">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.phone}</p>
                        </div>
                      </td>
                      {isEditing ? (
                        <>
                          <td className="px-5 py-3">
                            <input type="number" min={0} value={draftDaily} onChange={e => setDraftDaily(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-24 rounded border border-slate-200 px-2 py-1 text-sm" placeholder="0=不限" />
                          </td>
                          <td className="px-5 py-3">
                            <input type="number" min={0} value={draftWeekly} onChange={e => setDraftWeekly(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-24 rounded border border-slate-200 px-2 py-1 text-sm" placeholder="0=不限" />
                          </td>
                          <td className="px-5 py-3">
                            <input type="number" min={0} value={draftMonthly} onChange={e => setDraftMonthly(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-24 rounded border border-slate-200 px-2 py-1 text-sm" placeholder="0=不限" />
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-5 py-3 text-foreground">{l?.dailyLimit ? `¥${l.dailyLimit}` : <span className="text-muted-foreground/50">不限</span>}</td>
                          <td className="px-5 py-3 text-foreground">{l?.weeklyLimit ? `¥${l.weeklyLimit}` : <span className="text-muted-foreground/50">不限</span>}</td>
                          <td className="px-5 py-3 text-foreground">{l?.monthlyLimit ? `¥${l.monthlyLimit}` : <span className="text-muted-foreground/50">不限</span>}</td>
                        </>
                      )}
                      <td className="px-5 py-3">
                        <SpentCell spent={dailySpent} limit={l?.dailyLimit ?? 0} />
                      </td>
                      <td className="px-5 py-3">
                        <SpentCell spent={weeklySpent} limit={l?.weeklyLimit ?? 0} />
                      </td>
                      <td className="px-5 py-3">
                        <SpentCell spent={monthlySpent} limit={l?.monthlyLimit ?? 0} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => handleSave(c)} className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-700">保存</button>
                            <button onClick={() => setEditingPhone(null)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-slate-50">取消</button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {saved === c.phone && <span className="text-xs font-medium text-emerald-600">已保存</span>}
                            <button onClick={() => startEdit(c)} className="rounded p-1.5 text-muted-foreground/60 transition-colors hover:bg-violet-50 hover:text-violet-600">
                              <Edit className="h-4 w-4" />
                            </button>
                            {hasLimit && (
                              <button onClick={() => handleClear(c.phone)} className="rounded p-1.5 text-muted-foreground/60 transition-colors hover:bg-red-50 hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-violet-50 border border-violet-200 px-5 py-4">
        <p className="text-sm font-medium text-violet-800">限额说明</p>
        <p className="mt-1 text-xs text-violet-700">
          设置为 0 表示该周期不限制消费。当老人提交订单金额超过任一生效周期的剩余额度时，系统将阻止订单提交并提示具体超限信息。
        </p>
      </div>
    </div>
  )
}

function SpentCell({ spent, limit }: { spent: number; limit: number }) {
  const isOver = limit > 0 && spent >= limit
  const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0
  return (
    <div>
      <span className={`text-sm font-semibold tabular-nums ${isOver ? 'text-red-600' : 'text-foreground'}`}>
        ¥{spent.toFixed(0)}
      </span>
      {limit > 0 && (
        <div className="mt-1 flex items-center gap-1.5">
          <div className="h-1 w-12 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: isOver ? '#ef4444' : pct > 70 ? '#f59e0b' : '#10b981' }} />
          </div>
          <span className="text-[10px] text-muted-foreground">{pct}%</span>
        </div>
      )}
    </div>
  )
}

function OrdersTab({ orders }: { orders: Order[] }) {
  const [filter, setFilter] = useState<string>('all')
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  return (
    <div className="animate-fade-in">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-bold text-lg font-bold text-foreground">订单记录</h2>
        <div className="flex gap-0.5 rounded-lg bg-slate-100/80 p-1">
          {['all', 'pending', 'processing', 'delivered', 'cancelled', 'rejected'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === s ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {s === 'all' ? '全部' : statusLabel(s)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-20">
          <ShoppingBag className="mb-3 h-9 w-9 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">暂无订单</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.slice().reverse().map(order => (
            <div key={order.id} className="rounded-xl border border-slate-100 bg-white px-5 py-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-foreground">{order.id}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{order.customerName} &middot; {order.customerPhone}</span>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {order.items.map(i => `${i.mealName} x${i.quantity}`).join('、')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.status} />
                  <span className="text-sm font-bold text-violet-600">¥{order.totalAmount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; border: string; label: string }> = {
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border border-amber-200', label: '待处理' },
    approved: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border border-cyan-200', label: '已提交' },
    processing: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border border-violet-200', label: '处理中' },
    completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border border-emerald-200', label: '已完成' },
    delivered: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border border-slate-200', label: '已送达' },
    rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border border-red-200', label: '已拒绝' },
    cancelled: { bg: 'bg-red-50', text: 'text-red-700', border: 'border border-red-200', label: '已取消' },
  }
  const c = config[status] || config.pending
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.bg} ${c.text} ${c.border}`}>{c.label}</span>
}

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    pending: '待处理', approved: '已提交', processing: '处理中', completed: '已完成', delivered: '已送达', rejected: '已拒绝', cancelled: '已取消',
  }
  return map[s] || s
}
