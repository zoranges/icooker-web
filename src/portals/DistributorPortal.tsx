import { useState, useEffect, useMemo } from 'react'
import { Link, ArrowLeft, Package, Truck, CheckCircle, Users, ClipboardList, BarChart3, Factory, ShoppingBag, DollarSign, TrendingUp } from 'lucide-react'
import { storage, Order, FactoryOrder } from '../store'
import LoginGate, { useCurrentUser } from '../components/LoginGate'

export default function DistributorPortal() {
  return (
    <LoginGate role="distributor" title="分销端 - 选择身份" gradient="from-amber-600 via-orange-600 to-amber-500" icon={Truck}>
      <DistributorPortalContent />
    </LoginGate>
  )
}

function DistributorPortalContent() {
  const { currentUser } = useCurrentUser()
  const [orders, setOrders] = useState<Order[]>([])
  const [factoryOrders, setFactoryOrders] = useState<FactoryOrder[]>([])
  const [activeTab, setActiveTab] = useState<'approved' | 'summary' | 'factories' | 'delivery' | 'delivered'>('approved')

  useEffect(() => {
    setOrders(storage.getOrders())
    setFactoryOrders(storage.getFactoryOrders())
    const unsubOrders = storage.subscribeToOrderChanges(() => setOrders(storage.getOrders()))
    const unsubFO = storage.subscribeToFactoryOrderChanges(() => setFactoryOrders(storage.getFactoryOrders()))
    return () => { unsubOrders(); unsubFO() }
  }, [])

  const myCustomerPhones = useMemo(() => {
    const accounts = storage.getAccounts<{phone:string;distributorId:string}>('customer')
    return new Set(accounts.filter(a => a.distributorId === currentUser?.id).map(a => a.phone))
  }, [currentUser])

  const myOrders = useMemo(() => orders.filter(o => myCustomerPhones.has(o.customerPhone)), [orders, myCustomerPhones])
  const approvedOrders = myOrders.filter(o => o.status === 'approved')
  const processingOrders = myOrders.filter(o => o.status === 'processing')

  const myFactoryOrders = useMemo(
    () => factoryOrders.filter(fo => fo.distributorId === currentUser?.id),
    [factoryOrders, currentUser]
  )
  const pendingDeliveryFactoryOrders = myFactoryOrders.filter(fo => fo.status === 'completed')
  const deliveredFactoryOrders = myFactoryOrders.filter(fo => fo.status === 'delivered')

  const handleBatchCreate = () => {
    if (approvedOrders.length === 0) return
    const factoryAccounts = storage.getAccounts<{id:string;name:string}>('factory')
    if (factoryAccounts.length === 0) { alert('没有可用的工厂账号，请先在管理端添加工厂'); return }

    const previousOrders = storage.getOrders()
    const previousFO = storage.getFactoryOrders()

    try {
      const newFactoryOrders: FactoryOrder[] = factoryAccounts.map((factory, idx) => {
        const assignedOrders = approvedOrders.filter((_, i) => i % factoryAccounts.length === idx)
        const itemMap = new Map<string, { mealName: string; quantity: number; unitPrice: number; days: string[] }>()
        assignedOrders.flatMap(o => o.items).forEach(item => {
          const key = `${item.mealName}|${item.days.join(',')}`
          const existing = itemMap.get(key)
          if (existing) { existing.quantity += item.quantity }
          else { itemMap.set(key, { ...item }) }
        })
        const items = Array.from(itemMap.values())
        const totalAmount = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
        const serviceNames = [...new Set(assignedOrders.map(o => o.serviceName).filter(Boolean))]
        const customerOrderIds = assignedOrders.map(o => o.id)
        return {
          id: `FO-${Date.now()}-${idx}`,
          factoryId: factory.id, factoryName: factory.name,
          items, totalAmount, status: 'pending' as const,
          createdAt: new Date().toISOString(),
          distributorName: currentUser?.name, distributorId: currentUser?.id,
          serviceName: serviceNames.join(', '), customerOrderIds,
        }
      })

      newFactoryOrders.forEach(fo => storage.saveFactoryOrder(fo))
      approvedOrders.forEach(order => {
        storage.updateOrder(order.id, { status: 'processing', distributorId: currentUser?.id, distributorName: currentUser?.name })
      })

      setFactoryOrders(storage.getFactoryOrders())
      setOrders(storage.getOrders())
      setActiveTab('factories')
    } catch (e) {
      console.error('[Distributor] 批量创建失败，回滚', e)
      localStorage.setItem('icooker_orders', JSON.stringify(previousOrders))
      localStorage.setItem('icooker_factory_orders', JSON.stringify(previousFO))
      setFactoryOrders(previousFO); setOrders(previousOrders)
      alert('操作失败，已回滚。请重试。')
    }
  }

  const handleCompleteDelivery = (factoryOrderId: string) => {
    const fo = storage.getFactoryOrders().find(o => o.id === factoryOrderId)
    if (!fo || fo.distributorId !== currentUser?.id) return
    const previousOrders = storage.getOrders(); const previousFO = storage.getFactoryOrders()
    try {
      storage.updateFactoryOrder(factoryOrderId, { status: 'delivered' })
      if (fo?.customerOrderIds?.length) {
        fo.customerOrderIds.forEach(orderId => storage.updateOrder(orderId, { status: 'delivered' }))
      }
      setFactoryOrders(storage.getFactoryOrders()); setOrders(storage.getOrders())
    } catch (e) {
      console.error('[Distributor] 配送完成失败，回滚', e)
      localStorage.setItem('icooker_orders', JSON.stringify(previousOrders))
      localStorage.setItem('icooker_factory_orders', JSON.stringify(previousFO))
      setFactoryOrders(previousFO); setOrders(previousOrders)
    }
  }

  const statColors = ['#3b82f6', '#8b5cf6', '#f97316', '#10b981']

  const stats = [
    { label: '待汇总', value: approvedOrders.length, icon: Package, colorIdx: 0 },
    { label: '工厂订单', value: myFactoryOrders.length, icon: Factory, colorIdx: 1 },
    { label: '待配送', value: pendingDeliveryFactoryOrders.length, icon: Truck, colorIdx: 2 },
    { label: '已完成', value: deliveredFactoryOrders.length, icon: Users, colorIdx: 3 },
  ]

  const tabs = [
    { id: 'approved' as const, label: '待汇总', count: approvedOrders.length, icon: ClipboardList },
    { id: 'summary' as const, label: '订单统计', count: null, icon: BarChart3 },
    { id: 'factories' as const, label: '工厂订单', count: myFactoryOrders.length, icon: Factory },
    { id: 'delivery' as const, label: '配送管理', count: pendingDeliveryFactoryOrders.length, icon: Truck },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'hsl(30 20% 98%)' }}>
      <header className="relative overflow-hidden bg-gradient-to-br from-amber-600 via-orange-600 to-amber-500">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-8">
          <Link to="/" className="mb-4 inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium text-white/85 backdrop-blur transition-colors hover:bg-white/20 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> 返回首页
          </Link>
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/12">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-white">分销端</h1>
              <p className="mt-0.5 text-sm text-white/80">{currentUser?.name || ''} · 汇总订单、向工厂下单、配送管理</p>
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
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded px-3.5 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'bg-gray-900 text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count !== null && tab.count > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${activeTab === tab.id ? 'bg-white/20 text-white' : ''}`}
                  style={activeTab !== tab.id ? { background: 'hsl(30 12% 93%)', color: 'hsl(15 55% 40%)' } : undefined}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="animate-fade-in">
          {activeTab === 'approved' && (
            <div>
              {approvedOrders.length > 0 ? (
                <div>
                  <div className="mb-5 rounded-lg bg-white px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-display text-sm font-bold text-foreground">待汇总订单 ({approvedOrders.length})</h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">以下订单已通过审核，可以汇总并向工厂下单</p>
                      </div>
                      <button onClick={handleBatchCreate} className="rounded-md bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800">
                        批量创建工厂订单
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3 stagger-children">
                    {approvedOrders.map(order => (
                      <div key={order.id} className="rounded-lg bg-white px-5 py-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-foreground">{order.id}</h4>
                            <p className="mt-0.5 text-sm text-muted-foreground">{order.customerName} · {order.customerPhone}</p>
                          </div>
                          <span className="text-lg font-bold" style={{ color: 'hsl(15 55% 40%)' }}>${order.totalAmount}</span>
                        </div>
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {order.items.map((item, idx) => (
                            <span key={idx} className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              {item.mealName} <span style={{ color: 'hsl(15 55% 40%)' }}>x{item.quantity}</span>
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
            <div className="animate-fade-in space-y-6">
              <div className="grid gap-4 sm:grid-cols-3 stagger-children">
                {[
                  { label: '总订单', value: myOrders.length, icon: ShoppingBag, colorIdx: 0 },
                  { label: '总收入', value: `$${myOrders.reduce((sum, o) => sum + o.totalAmount, 0)}`, icon: DollarSign, colorIdx: 2 },
                  { label: '均单金额', value: `$${myOrders.length ? Math.round(myOrders.reduce((sum, o) => sum + o.totalAmount, 0) / myOrders.length) : 0}`, icon: TrendingUp, colorIdx: 3 },
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

              <div className="rounded-lg bg-white px-6 py-5">
                <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">按状态统计</h4>
                <div className="space-y-2.5">
                  {[
                    { label: '待审核', value: myOrders.filter(o => o.status === 'pending').length, bar: '#f97316' },
                    { label: '已审核', value: approvedOrders.length, bar: '#3b82f6' },
                    { label: '生产中', value: processingOrders.length, bar: '#8b5cf6' },
                    { label: '已完成', value: myOrders.filter(o => o.status === 'delivered').length, bar: '#10b981' },
                    { label: '待配送', value: pendingDeliveryFactoryOrders.length, bar: '#f59e0b' },
                  ].map(row => {
                    const max = Math.max(...[myOrders.length, 1])
                    const pct = Math.round((row.value / max) * 100)
                    return (
                      <div key={row.label} className="flex items-center gap-3">
                        <span className="w-14 text-sm text-muted-foreground">{row.label}</span>
                        <div className="flex-1 h-4 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: row.bar }} />
                        </div>
                        <span className="w-8 text-right text-sm font-bold tabular-nums text-foreground">{row.value}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'factories' && (
            <div>
              {myFactoryOrders.length > 0 ? (
                <div className="space-y-3 stagger-children">
                  {myFactoryOrders.map(fo => (
                    <div key={fo.id} className="rounded-lg bg-white">
                      <div className="flex items-center justify-between px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ background: 'hsl(140 12% 94%)' }}>
                            <Factory className="h-4.5 w-4.5" style={{ color: 'hsl(140 12% 40%)' }} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{fo.factoryName}</h3>
                            <p className="text-xs text-muted-foreground">{fo.id}</p>
                            {(fo.serviceName || fo.distributorName) && (
                              <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                                {fo.serviceName && <span className="rounded bg-violet-50 px-1.5 py-0.5 text-violet-600">{fo.serviceName}</span>}
                                {fo.distributorName && <><span>&rarr;</span><span className="rounded px-1.5 py-0.5" style={{ background: 'hsl(30 25% 93%)', color: 'hsl(15 55% 42%)' }}>{fo.distributorName}</span></>}
                              </div>
                            )}
                          </div>
                        </div>
                        <StatusBadge status={fo.status} />
                      </div>
                      <div className="px-5 py-4">
                        <div className="mb-3 flex flex-wrap gap-1.5">
                          {fo.items.map((item, idx) => (
                            <span key={idx} className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              {item.mealName} <span style={{ color: 'hsl(15 55% 40%)' }}>x{item.quantity}</span>
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between pt-3">
                          <span className="text-sm font-medium text-muted-foreground">总计</span>
                          <span className="text-lg font-bold" style={{ color: 'hsl(15 55% 40%)' }}>${fo.totalAmount}</span>
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

          {activeTab === 'delivery' && (
            <div>
              <div className="mb-5 flex gap-2">
                <button onClick={() => setActiveTab('delivery')} className="rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white">
                  待配送 ({pendingDeliveryFactoryOrders.length})
                </button>
                <button onClick={() => setActiveTab('delivered')} className="rounded-md bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted">
                  已送达 ({deliveredFactoryOrders.length})
                </button>
              </div>

              {pendingDeliveryFactoryOrders.length > 0 ? (
                <div className="space-y-3 stagger-children">
                  {pendingDeliveryFactoryOrders.map(fo => (
                    <div key={fo.id} className="rounded-lg bg-white">
                      <div className="flex items-center justify-between px-5 py-3.5">
                        <div>
                          <h3 className="font-semibold text-foreground">{fo.factoryName}</h3>
                          <p className="text-xs text-muted-foreground">{fo.id} · 共 {fo.items.length} 种餐品</p>
                          {(fo.serviceName || fo.distributorName) && (
                            <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                              {fo.serviceName && <span className="rounded bg-violet-50 px-1.5 py-0.5 text-violet-600">{fo.serviceName}</span>}
                              {fo.distributorName && <><span>&rarr;</span><span className="rounded px-1.5 py-0.5" style={{ background: 'hsl(30 25% 93%)', color: 'hsl(15 55% 42%)' }}>{fo.distributorName}</span></>}
                            </div>
                          )}
                        </div>
                        <span className="text-lg font-bold" style={{ color: 'hsl(15 55% 40%)' }}>${fo.totalAmount}</span>
                      </div>
                      <div className="px-5 py-4">
                        <div className="mb-3 flex flex-wrap gap-1.5">
                          {fo.items.map((item, idx) => (
                            <span key={idx} className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              {item.mealName} <span style={{ color: 'hsl(15 55% 40%)' }}>x{item.quantity}</span>
                            </span>
                          ))}
                        </div>
                        <button onClick={() => handleCompleteDelivery(fo.id)} className="flex w-full items-center justify-center gap-2 rounded bg-gray-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800">
                          <CheckCircle className="h-4 w-4" /> 确认送达
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
                <div className="space-y-2.5 stagger-children">
                  {deliveredFactoryOrders.map(fo => (
                    <div key={fo.id} className="rounded-lg bg-white px-5 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{fo.factoryName}</h3>
                          <p className="text-xs text-muted-foreground">{fo.id} · 共 {fo.items.length} 种餐品</p>
                        </div>
                        <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: 'hsl(140 12% 93%)', color: 'hsl(140 12% 40%)' }}>已送达</span>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between pt-2.5">
                        <div className="flex flex-wrap gap-1">
                          {fo.items.slice(0, 3).map((item, idx) => (
                            <span key={idx} className="text-xs text-muted-foreground">{item.mealName}</span>
                          ))}
                          {fo.items.length > 3 && <span className="text-xs text-muted-foreground">+{fo.items.length - 3}</span>}
                        </div>
                        <span className="font-bold" style={{ color: 'hsl(15 55% 40%)' }}>${fo.totalAmount}</span>
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
  const config: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: 'hsl(30 25% 92%)', color: 'hsl(15 55% 40%)', label: '待接单' },
    confirmed: { bg: '#dbeafe', color: '#1d4ed8', label: '已确认' },
    completed: { bg: 'hsl(140 12% 93%)', color: 'hsl(140 12% 40%)', label: '已完成' },
    delivered: { bg: '#f1f5f9', color: '#334155', label: '已送达' },
  }
  const c = config[status] || config.pending
  return (
    <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: c.bg, color: c.color }}>
      {c.label}
    </span>
  )
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-white py-16">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-md bg-muted">
        <Icon className="h-7 w-7" style={{ color: 'hsl(30 8% 78%)' }} />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{text}</p>
    </div>
  )
}
