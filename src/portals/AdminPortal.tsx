import { useState, useMemo, useEffect } from 'react'
import { Link, ArrowLeft, Lock, Eye, EyeOff, Users, Building2, Truck, Factory, Settings, BarChart3, ShoppingBag, DollarSign, Plus, Edit, Trash2, X, Search, ChevronRight } from 'lucide-react'
import { storage, Order, CustomerAccount, ServiceAccount, DistributorAccount, FactoryAccount, SpendingLimit } from '../store'

type Tab = 'dashboard' | 'customers' | 'services' | 'distributors' | 'factories' | 'orders' | 'limits'

const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || 'admin123'

export default function AdminPortal() {
  const [authenticated, setAuthenticated] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === ADMIN_PIN) { setAuthenticated(true); setPinError(false) }
    else { setPinError(true); setPin('') }
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'hsl(210 20% 98%)' }}>
        <div className="w-full max-w-sm rounded-xl border border-slate-100 bg-white px-7 py-8">
          <div className="mb-5 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-teal-600">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <h2 className="font-bold text-lg font-bold text-foreground">管理端登录</h2>
            <p className="mt-1 text-sm text-muted-foreground">请输入管理密码以继续</p>
          </div>
          <form onSubmit={handlePinSubmit} className="space-y-3.5">
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={e => { setPin(e.target.value); setPinError(false) }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-foreground transition focus:outline-none focus:ring-2"
                placeholder="请输入管理密码"
                autoFocus
              />
              <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 transition-colors hover:text-foreground">
                {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {pinError && <p className="text-center text-sm text-red-500">密码错误，请重试</p>}
            <button type="submit" className="w-full rounded-lg bg-teal-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700">登录</button>
            <Link to="/" className="block text-center text-xs text-muted-foreground transition-colors hover:text-foreground">返回首页</Link>
          </form>
        </div>
      </div>
    )
  }

  return <AdminDashboard activeTab={activeTab} setActiveTab={setActiveTab} />
}

function AdminDashboard({ activeTab, setActiveTab }: { activeTab: Tab; setActiveTab: (t: Tab) => void }) {
  const [orders, setOrders] = useState<Order[]>(() => storage.getOrders())
  const [customers, setCustomers] = useState<CustomerAccount[]>(() => storage.getAccounts('customer'))
  const [services, setServices] = useState<ServiceAccount[]>(() => storage.getAccounts('service'))
  const [distributors, setDistributors] = useState<DistributorAccount[]>(() => storage.getAccounts('distributor'))
  const [factories, setFactories] = useState<FactoryAccount[]>(() => storage.getAccounts('factory'))

  const refresh = () => {
    setOrders(storage.getOrders())
    setCustomers(storage.getAccounts('customer'))
    setServices(storage.getAccounts('service'))
    setDistributors(storage.getAccounts('distributor'))
    setFactories(storage.getAccounts('factory'))
  }

  useEffect(() => {
    const unsubOrders = storage.subscribeToOrderChanges(() => setOrders(storage.getOrders()))
    const unsubFO = storage.subscribeToFactoryOrderChanges(() => {})
    return () => { unsubOrders(); unsubFO() }
  }, [])

  const tabs: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'dashboard', label: '总览', icon: BarChart3 },
    { id: 'customers', label: '老人账号', icon: Users, count: customers.length },
    { id: 'services', label: '服务机构', icon: Building2, count: services.length },
    { id: 'distributors', label: '分销商', icon: Truck, count: distributors.length },
    { id: 'factories', label: '工厂', icon: Factory, count: factories.length },
    { id: 'orders', label: '全局订单', icon: ShoppingBag, count: orders.length },
    { id: 'limits', label: '费用限额', icon: DollarSign },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'hsl(210 20% 98%)' }}>
      <header className="relative overflow-hidden bg-gradient-to-br from-slate-700 via-slate-800 to-slate-600">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-8">
          <Link to="/" className="mb-4 inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium text-white/85 backdrop-blur-md transition-colors hover:bg-white/20 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> 返回首页
          </Link>
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-2xl font-bold tracking-tight text-white">管理端</h1>
              <p className="mt-0.5 text-sm text-white/80">账号管理 · 全局订单监控 · 数据统计</p>
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
                  activeTab === tab.id ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    activeTab === tab.id ? 'bg-teal-100 text-teal-700' : 'text-muted-foreground'
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
        {activeTab === 'dashboard' && <DashboardTab orders={orders} customers={customers} services={services} distributors={distributors} factories={factories} />}
        {activeTab === 'customers' && <AccountTab role="customer" accounts={customers} onRefresh={refresh} />}
        {activeTab === 'services' && <AccountTab role="service" accounts={services} onRefresh={refresh} />}
        {activeTab === 'distributors' && <AccountTab role="distributor" accounts={distributors} onRefresh={refresh} />}
        {activeTab === 'factories' && <AccountTab role="factory" accounts={factories} onRefresh={refresh} />}
        {activeTab === 'orders' && <OrdersTab orders={orders} />}
        {activeTab === 'limits' && <LimitsTab customers={customers} />}
      </main>
    </div>
  )
}

function DashboardTab({ orders, customers, services: _services, distributors: _distributors, factories }: {
  orders: Order[]
  customers: CustomerAccount[]
  services: ServiceAccount[]
  distributors: DistributorAccount[]
  factories: FactoryAccount[]
}) {
  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0)
  const statusCounts = useMemo(() => {
    const m: Record<string, number> = {}
    orders.forEach(o => { m[o.status] = (m[o.status] || 0) + 1 })
    return m
  }, [orders])

  const factoryOrderCounts = useMemo(() => {
    const fos = storage.getFactoryOrders()
    const m: Record<string, number> = {}
    fos.forEach((fo) => { m[fo.factoryName] = (m[fo.factoryName] || 0) + 1 })
    return m
  }, [orders.length])

  const statColors = ['#3b82f6', '#10b981', '#8b5cf6', '#0d9488']

  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
        {[
          { label: '总订单', value: orders.length, icon: ShoppingBag, colorIdx: 0 },
          { label: '总收入', value: `$${totalRevenue}`, icon: DollarSign, colorIdx: 1 },
          { label: '注册老人', value: customers.length, icon: Users, colorIdx: 2 },
          { label: '工厂', value: factories.length, icon: Factory, colorIdx: 3 },
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

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-100 bg-white px-5 py-5">
          <h3 className="font-bold mb-4 text-sm font-bold text-foreground">订单状态分布</h3>
          <div className="space-y-2.5">
            {[
              { status: 'pending', label: '待处理', bg: 'bg-amber-50 text-amber-700 border border-amber-200', bar: 'bg-amber-400' },
              { status: 'approved', label: '已提交', bg: 'bg-blue-50 text-blue-700 border border-blue-200', bar: 'bg-blue-400' },
              { status: 'processing', label: '处理中', bg: 'bg-violet-50 text-violet-700 border border-violet-200', bar: 'bg-violet-400' },
              { status: 'completed', label: '已完成', bg: 'bg-emerald-50 text-emerald-700 border border-emerald-200', bar: 'bg-emerald-400' },
              { status: 'delivered', label: '已送达', bg: 'bg-slate-50 text-slate-700 border border-slate-200', bar: 'bg-slate-400' },
              { status: 'rejected', label: '已拒绝', bg: 'bg-red-50 text-red-700 border border-red-200', bar: 'bg-red-400' },
              { status: 'cancelled', label: '已取消', bg: 'bg-red-50 text-red-700 border border-red-200', bar: 'bg-red-400' },
            ].map(s => {
              const count = statusCounts[s.status] || 0
              const max = Math.max(...Object.values(statusCounts), 1)
              return (
                <div key={s.status} className="flex items-center gap-3">
                  <span className={`w-16 flex-shrink-0 rounded-full px-2 py-1 text-center text-xs font-semibold ${s.bg}`}>{s.label}</span>
                  <div className="flex-1 h-4 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${s.bar} transition-all`} style={{ width: `${(count / max) * 100}%` }} />
                  </div>
                  <span className="w-8 text-right text-sm font-bold tabular-nums text-foreground">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white px-5 py-5">
          <h3 className="font-bold mb-4 text-sm font-bold text-foreground">工厂订单分布</h3>
          <div className="space-y-2.5">
            {Object.keys(factoryOrderCounts).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">暂无工厂订单数据</p>
            ) : (
              Object.entries(factoryOrderCounts).map(([name, count], idx) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-50 text-xs font-bold text-teal-700">{idx + 1}</span>
                  <span className="flex-1 text-sm font-medium text-foreground">{name}</span>
                  <span className="text-lg font-bold tabular-nums text-foreground">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white">
        <div className="px-5 py-3.5">
          <h3 className="font-bold text-sm font-bold text-foreground">最近订单 ({Math.min(10, orders.length)})</h3>
        </div>
        <div>
          {orders.slice().reverse().slice(0, 10).map(order => (
            <div key={order.id} className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-slate-50/60">
              <div>
                <span className="text-sm font-semibold text-foreground">{order.id}</span>
                <span className="ml-2 text-xs text-muted-foreground">{order.customerName} · {order.customerPhone}</span>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={order.status} />
                <span className="text-sm font-bold text-teal-600">${order.totalAmount}</span>
              </div>
            </div>
          ))}
          {orders.length === 0 && <p className="px-5 py-10 text-center text-sm text-muted-foreground">暂无订单</p>}
        </div>
      </div>
    </div>
  )
}

type AccountLike = { id: string; name: string; phone: string }

function AccountTab({ role, accounts, onRefresh }: { role: string; accounts: AccountLike[]; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const getFields = () => {
    switch (role) {
      case 'customer': return [
        { key: 'name', label: '姓名', type: 'text', required: true },
        { key: 'phone', label: '电话', type: 'text', required: true },
        { key: 'address', label: '地址', type: 'text', required: false },
        { key: 'notes', label: '备注', type: 'text', required: false },
        { key: 'serviceId', label: '所属机构', type: 'select', required: true, options: () => storage.getAccounts<{id:string;name:string}>('service').map(s => ({ value: s.id, label: s.name })) },
        { key: 'distributorId', label: '所属分销商', type: 'select', required: true, options: () => storage.getAccounts<{id:string;name:string;region:string}>('distributor').map(d => ({ value: d.id, label: `${d.name} (${d.region})` })) },
      ]
      case 'service': return [
        { key: 'name', label: '名称', type: 'text', required: true },
        { key: 'phone', label: '电话', type: 'text', required: true },
      ]
      case 'distributor': return [
        { key: 'name', label: '名称', type: 'text', required: true },
        { key: 'phone', label: '电话', type: 'text', required: true },
        { key: 'region', label: '区域', type: 'text', required: false },
      ]
      case 'factory': return [
        { key: 'name', label: '名称', type: 'text', required: true },
        { key: 'phone', label: '电话', type: 'text', required: true },
        { key: 'address', label: '地址', type: 'text', required: false },
      ]
      default: return []
    }
  }

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data: any = {}
    getFields().forEach(f => { data[f.key] = formData.get(f.key) || '' })
    if (editingId) {
      storage.updateAccount(role, editingId, data)
    } else {
      storage.addAccount(role, { id: `${role}-${Date.now()}`, ...data, createdAt: new Date().toISOString() })
    }
    setShowForm(false); setEditingId(null); onRefresh()
  }

  const handleDelete = (id: string) => {
    let confirmMsg = '确定删除此账号？'
    if (role === 'customer') {
      const orderCount = storage.getOrdersByCustomerPhone(accounts.find(a => a.id === id)?.phone || '').length
      if (orderCount > 0) confirmMsg = `该客户有 ${orderCount} 个订单。删除账号将同时删除其所有订单。确定继续？`
    } else if (role === 'service') {
      const count = storage.getAccounts<CustomerAccount>('customer').filter(c => c.serviceId === id).length
      if (count > 0) confirmMsg = `有 ${count} 个客户关联到此服务机构。删除后将清除这些关联。确定继续？`
    } else if (role === 'distributor') {
      const count = storage.getAccounts<CustomerAccount>('customer').filter(c => c.distributorId === id).length
      if (count > 0) confirmMsg = `有 ${count} 个客户关联到此分销商。删除后将清除这些关联。确定继续？`
    } else if (role === 'factory') {
      const count = storage.getFactoryOrders().filter(fo => fo.factoryId === id).length
      if (count > 0) confirmMsg = `有 ${count} 个工厂订单关联到此工厂。删除后将标记为"已删除的工厂"。确定继续？`
    }
    if (!window.confirm(confirmMsg)) return
    if (role === 'customer') {
      const phone = accounts.find(a => a.id === id)?.phone
      if (phone) storage.deleteOrdersByCustomerPhone(phone)
    } else {
      storage.cleanupAccountRefs(role, id)
    }
    storage.deleteAccount(role, id); onRefresh()
  }

  const handleEdit = (acc: any) => { setEditingId(acc.id); setShowForm(true) }

  const filtered = accounts.filter(a => {
    if (!search) return true
    const q = search.toLowerCase()
    return (a.name || '').toLowerCase().includes(q) || (a.phone || '').includes(q)
  })

  const roleLabels: Record<string, string> = { customer: '老人', service: '服务机构', distributor: '分销商', factory: '工厂' }
  const fields = getFields()

  return (
    <div className="animate-fade-in">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2 className="font-bold text-lg font-bold text-foreground">{roleLabels[role]}账号管理</h2>
          <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700">{accounts.length}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              className="w-48 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-foreground transition focus:outline-none focus:ring-2"
              placeholder="搜索..."
            />
          </div>
          <button onClick={() => { setEditingId(null); setShowForm(true) }} className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700">
            <Plus className="h-4 w-4" /> 添加{roleLabels[role]}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50/80 border-slate-100 text-left">
                {fields.map(f => (
                  <th key={f.key} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{f.label}</th>
                ))}
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={fields.length + 1} className="px-5 py-12 text-center text-sm text-muted-foreground">暂无数据</td></tr>
              ) : (
                filtered.map(acc => (
                  <tr key={acc.id} className="transition-colors hover:bg-slate-50/60">
                    {fields.map(f => {
                      let val = (acc as any)[f.key] || '-'
                      if (f.key === 'serviceId' && val !== '-') {
                        const svc = storage.getAccounts<{id:string;name:string}>('service').find(s => s.id === val)
                        if (svc) val = svc.name
                      }
                      if (f.key === 'distributorId' && val !== '-') {
                        const dist = storage.getAccounts<{id:string;name:string}>('distributor').find(s => s.id === val)
                        if (dist) val = dist.name
                      }
                      return <td key={f.key} className="px-5 py-3 text-foreground">{val}</td>
                    })}
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <button onClick={() => handleEdit(acc)} className="rounded p-1.5 text-muted-foreground/60 transition-colors hover:bg-blue-50 hover:text-blue-600">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(acc.id)} className="rounded p-1.5 text-muted-foreground/60 transition-colors hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="animate-scale-in w-full max-w-md rounded-xl border border-slate-100 shadow-xl bg-white px-6 py-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-lg font-bold text-foreground">{editingId ? '编辑' : '添加'}{roleLabels[role]}</h3>
              <button onClick={() => { setShowForm(false); setEditingId(null) }} className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3.5">
              {fields.map(f => {
                const defVal = editingId ? (accounts.find(a => a.id === editingId) as any)?.[f.key] || '' : ''
                return (
                <div key={f.key}>
                  <label className="mb-1 block text-sm font-medium text-foreground">{f.label}</label>
                  {f.type === 'select' ? (
                    <select name={f.key} required={f.required} defaultValue={defVal}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-foreground transition focus:outline-none focus:ring-2">
                      <option value="">选择机构...</option>
                      {(f as any).options().map((opt: {value:string;label:string}) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name={f.key} type={f.type} required={f.required} defaultValue={defVal}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-foreground transition focus:outline-none focus:ring-2"
                    />
                  )}
                </div>
              )})}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null) }} className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-slate-50">
                  取消
                </button>
                <button type="submit" className="flex-1 rounded-lg bg-teal-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700">
                  {editingId ? '保存' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function OrdersTab({ orders }: { orders: Order[] }) {
  const [filter, setFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const exportCSV = () => {
    const headers = ['订单ID', '客户姓名', '电话', '地址', '餐品', '数量', '总金额', '状态', '服务机构', '分销商', '工厂', '创建时间']
    const rows = filtered.map(o => [
      o.id, o.customerName, o.customerPhone, o.customerAddress,
      o.items.map(i => `${i.mealName}(${i.days.join('/')}) x${i.quantity}`).join('; '),
      o.items.reduce((s, i) => s + i.quantity, 0), o.totalAmount, o.status,
      o.serviceName || '', o.distributorName || '', o.factoryName || '', o.createdAt,
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-bold text-lg font-bold text-foreground">全局订单</h2>
        <div className="flex items-center gap-3">
          <button onClick={exportCSV} className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
            导出 CSV
          </button>
          <div className="flex gap-0.5 rounded-lg bg-slate-100/80 p-1">
            {['all', 'pending', 'processing', 'delivered', 'cancelled', 'rejected'].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === s ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {s === 'all' ? '全部' : statusLabel(s)}
              </button>
            ))}
          </div>
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
            <div key={order.id} className="overflow-hidden rounded-xl border border-slate-100 bg-white">
              <button
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-slate-50/60"
              >
                <div className="flex items-center gap-3">
                  <ChevronRight className={`h-4 w-4 text-muted-foreground/60 transition-transform ${expandedId === order.id ? 'rotate-90' : ''}`} />
                  <div>
                    <span className="text-sm font-semibold text-foreground">{order.id}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{order.customerName} · {order.customerPhone}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.status} />
                  <span className="text-sm font-bold text-teal-600">${order.totalAmount}</span>
                </div>
              </button>
              {expandedId === order.id && (
                <div className="px-5 py-4 bg-slate-50/60">
                  <div className="mb-2.5 grid gap-1.5 sm:grid-cols-2">
                    <div><span className="text-xs text-muted-foreground">客户: </span><span className="text-sm text-foreground">{order.customerName}</span></div>
                    <div><span className="text-xs text-muted-foreground">电话: </span><span className="text-sm text-muted-foreground">{order.customerPhone}</span></div>
                    <div><span className="text-xs text-muted-foreground">地址: </span><span className="text-sm text-muted-foreground">{order.customerAddress}</span></div>
                    <div><span className="text-xs text-muted-foreground">时间: </span><span className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleString('zh-CN')}</span></div>
                  </div>
                  <div className="mb-2.5 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="font-medium text-muted-foreground">流转链:</span>
                    <span className="rounded bg-muted px-2 py-0.5 text-foreground">{order.customerName}</span>
                    {order.serviceName ? <><span className="text-muted-foreground/50">&rarr;</span><span className="rounded bg-violet-50 px-2 py-0.5 font-medium text-violet-700">{order.serviceName}</span></> : <><span className="text-muted-foreground/50">&rarr;</span><span className="rounded bg-muted px-2 py-0.5 text-muted-foreground">待分配</span></>}
                    {order.distributorName ? <><span className="text-muted-foreground/50">&rarr;</span><span className="rounded bg-amber-50 px-2 py-0.5 font-medium text-amber-700">{order.distributorName}</span></> : <><span className="text-muted-foreground/50">&rarr;</span><span className="rounded bg-muted px-2 py-0.5 text-muted-foreground">待分配</span></>}
                    {order.factoryName ? <><span className="text-muted-foreground/50">&rarr;</span><span className="rounded bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">{order.factoryName}</span></> : <><span className="text-muted-foreground/50">&rarr;</span><span className="rounded bg-muted px-2 py-0.5 text-muted-foreground">待分配</span></>}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {order.items.map((item, idx) => (
                      <span key={idx} className="rounded bg-white border border-slate-200 px-2 py-0.5 text-xs font-medium text-foreground">
                        {item.mealName} <span className="text-teal-600">x{item.quantity}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
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

  const handleClear = (phone: string) => {
    if (!window.confirm('确定清除此客户的费用限额？清除后该客户将不再受消费限制。')) return
    const updated = limits.filter(l => l.customerPhone !== phone)
    storage.saveSpendingLimits(updated)
    setLimits(updated)
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg font-bold text-foreground">费用限额管理</h2>
          <p className="mt-1 text-sm text-muted-foreground">为每位老人设置每日、每周、每月的消费上限，超出限额的订单将被拦截</p>
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
                <tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">暂无老人账号</td></tr>
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
                            <button onClick={() => handleSave(c)} className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-700">保存</button>
                            <button onClick={() => setEditingPhone(null)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-slate-50">取消</button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {saved === c.phone && <span className="text-xs font-medium text-emerald-600">已保存</span>}
                            <button onClick={() => startEdit(c)} className="rounded p-1.5 text-muted-foreground/60 transition-colors hover:bg-blue-50 hover:text-blue-600">
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

      <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-5 py-4">
        <p className="text-sm font-medium text-amber-800">限额说明</p>
        <p className="mt-1 text-xs text-amber-700">
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
