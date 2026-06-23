import { useState, useEffect, useMemo } from 'react'
import { Link, ArrowLeft, Package, Truck, CheckCircle, Users, ClipboardList, BarChart3, Factory, ShoppingBag, DollarSign, TrendingUp, Minus, Plus } from 'lucide-react'
import { storage, Order, FactoryOrder, InventoryItem, mockMeals } from '../store'
import LoginGate, { useCurrentUser } from '../components/LoginGate'

export default function DistributorPortal() {
  return (
    <LoginGate role="distributor" title="分销端 - 选择身份" gradient="from-sky-600 via-cyan-600 to-sky-500" icon={Truck}>
      <DistributorPortalContent />
    </LoginGate>
  )
}

function DistributorPortalContent() {
  const { currentUser } = useCurrentUser()
  const [orders, setOrders] = useState<Order[]>([])
  const [factoryOrders, setFactoryOrders] = useState<FactoryOrder[]>([])
  const [activeTab, setActiveTab] = useState<'approved' | 'summary' | 'factories' | 'delivery' | 'delivered' | 'inventory'>('approved')
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [batchResult, setBatchResult] = useState<{ fromStock: number; toFactory: number } | null>(null)
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set())
  const [showShortageModal, setShowShortageModal] = useState(false)
  const [shortageData, setShortageData] = useState<{
    mealName: string; needed: number; inStock: number; shortfall: number
    decision: 'factory' | 'skip'
  }[]>([])

  useEffect(() => {
    setOrders(storage.getOrders())
    setFactoryOrders(storage.getFactoryOrders())
    setInventory(storage.getInventory())
    const unsubOrders = storage.subscribeToOrderChanges(() => setOrders(storage.getOrders()))
    const unsubFO = storage.subscribeToFactoryOrderChanges(() => setFactoryOrders(storage.getFactoryOrders()))
    return () => { unsubOrders(); unsubFO() }
  }, [])

  // 所有餐品名（用于库存管理）— 只从 mockMeals 取，确保与订单餐品名一致
  const allMealNames = useMemo(() => {
    return [...new Set(mockMeals.map(m => m.name))].sort()
  }, [])

  const myCustomerPhones = useMemo(() => {
    const accounts = storage.getAccounts<{phone:string;distributorId:string}>('customer')
    return new Set(accounts.filter(a => a.distributorId === currentUser?.id).map(a => a.phone))
  }, [currentUser])

  const myOrders = useMemo(() => orders.filter(o => myCustomerPhones.has(o.customerPhone)), [orders, myCustomerPhones])
  const pendingOrders = myOrders.filter(o => o.status === 'pending')
  const processingOrders = myOrders.filter(o => o.status === 'processing')

  const myFactoryOrders = useMemo(
    () => factoryOrders.filter(fo => fo.distributorId === currentUser?.id),
    [factoryOrders, currentUser]
  )
  const pendingDeliveryFactoryOrders = myFactoryOrders.filter(fo => fo.status === 'completed')
  const deliveredFactoryOrders = myFactoryOrders.filter(fo => fo.status === 'delivered')

  // ── 订单选择 ──
  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds(prev => {
      const next = new Set(prev)
      if (next.has(orderId)) next.delete(orderId)
      else next.add(orderId)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedOrderIds.size === pendingOrders.length) {
      setSelectedOrderIds(new Set())
    } else {
      setSelectedOrderIds(new Set(pendingOrders.map(o => o.id)))
    }
  }

  // ── 拒绝所选订单 ──
  const handleRejectSelected = () => {
    if (selectedOrderIds.size === 0) return
    if (!window.confirm(`确定拒绝 ${selectedOrderIds.size} 个订单？拒绝后老人需重新下单。`)) return
    selectedOrderIds.forEach(id => {
      storage.updateOrder(id, { status: 'rejected', rejectedAt: new Date().toISOString() })
    })
    setSelectedOrderIds(new Set())
    setOrders(storage.getOrders())
  }

  // ── 接单处理：检查库存并决定处理方式 ──
  const handleBatchCreate = () => {
    const selectedOrders = pendingOrders.filter(o => selectedOrderIds.has(o.id))
    if (selectedOrders.length === 0) return

    // 汇总所有选中订单的餐品需求
    const demandMap = new Map<string, { mealName: string; quantity: number; unitPrice: number; days: string[] }>()
    selectedOrders.flatMap(o => o.items).forEach(item => {
      const key = item.mealName
      const existing = demandMap.get(key)
      if (existing) { existing.quantity += item.quantity }
      else { demandMap.set(key, { ...item }) }
    })

    const currentInventory = storage.getInventory()
    const invMap = new Map(currentInventory.map(i => [i.mealName, i.stock]))

    // 检查是否有缺货项
    const shortages: typeof shortageData = []
    demandMap.forEach((item, mealName) => {
      const stock = invMap.get(mealName) || 0
      if (stock < item.quantity) {
        shortages.push({
          mealName, needed: item.quantity, inStock: stock,
          shortfall: item.quantity - stock, decision: 'factory',
        })
      }
    })

    if (shortages.length > 0) {
      // 有缺货 → 弹窗让分销商决定
      setShortageData(shortages)
      setShowShortageModal(true)
    } else {
      // 全部有库存 → 直接执行
      executeBatchProcessing(selectedOrders, demandMap, invMap, [])
    }
  }

  // ── 执行批量处理（根据缺货决策）──
  const executeBatchProcessing = (
    selectedOrders: Order[],
    demandMap: Map<string, { mealName: string; quantity: number; unitPrice: number; days: string[] }>,
    invMap: Map<string, number>,
    decisions: typeof shortageData,
  ) => {
    const previousOrders = storage.getOrders()
    const previousFO = storage.getFactoryOrders()
    const previousInventory = storage.getInventory()

    try {
      // 构建缺货决策映射
      const decisionMap = new Map(decisions.map(d => [d.mealName, d]))

      const toFactoryItems: { mealName: string; quantity: number; unitPrice: number; days: string[] }[] = []
      let fromStockCount = 0
      let toFactoryCount = 0

      demandMap.forEach((item, mealName) => {
        const stock = invMap.get(mealName) || 0
        const decision = decisionMap.get(mealName)

        if (decision && decision.decision === 'skip') {
          // 跳过此餐品，不扣库存也不转工厂
          return
        }

        if (stock >= item.quantity) {
          // 库存充足，全部扣减
          storage.updateStock(mealName, -item.quantity)
          fromStockCount++
        } else if (decision) {
          // 有缺货决策 → factory: 用尽库存 + 差额转工厂
          if (stock > 0) {
            storage.updateStock(mealName, -stock)
            fromStockCount++
          }
          toFactoryItems.push({ ...item, quantity: decision.shortfall })
          toFactoryCount++
        }
      })

      // 创建工厂订单（如果有）
      if (toFactoryItems.length > 0) {
        const factoryAccounts = storage.getAccounts<{id:string;name:string}>('factory')
        if (factoryAccounts.length === 0) {
          alert('需要转工厂生产，但没有可用的工厂账号。请先在管理端添加工厂。')
          return
        }

        const serviceNames = [...new Set(selectedOrders.map(o => o.serviceName).filter(Boolean))]
        const customerOrderIds = selectedOrders.map(o => o.id)
        const totalAmount = toFactoryItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)

        const factoryOrder: FactoryOrder = {
          id: `FO-${Date.now()}`,
          factoryId: factoryAccounts[0].id,
          factoryName: factoryAccounts[0].name,
          items: toFactoryItems,
          totalAmount,
          status: 'pending',
          createdAt: new Date().toISOString(),
          distributorName: currentUser?.name,
          distributorId: currentUser?.id,
          serviceName: serviceNames.join(', '),
          customerOrderIds,
        }
        storage.saveFactoryOrder(factoryOrder)
      }

      // 更新所有选中订单状态为处理中
      selectedOrders.forEach(order => {
        storage.updateOrder(order.id, {
          status: 'processing',
          approvedAt: new Date().toISOString(),
          distributorId: currentUser?.id,
          distributorName: currentUser?.name,
        })
      })

      setSelectedOrderIds(new Set())
      setBatchResult({ fromStock: fromStockCount, toFactory: toFactoryCount })
      setFactoryOrders(storage.getFactoryOrders())
      setOrders(storage.getOrders())
      setInventory(storage.getInventory())
      setShowShortageModal(false)

      setTimeout(() => setBatchResult(null), 5000)

      if (toFactoryCount === 0) {
        setActiveTab('approved')
      } else {
        setActiveTab('factories')
      }
    } catch (e) {
      console.error('[Distributor] 批量处理失败，回滚', e)
      localStorage.setItem('icooker_orders', JSON.stringify(previousOrders))
      localStorage.setItem('icooker_factory_orders', JSON.stringify(previousFO))
      localStorage.setItem('icooker_inventory', JSON.stringify(previousInventory))
      setFactoryOrders(previousFO); setOrders(previousOrders); setInventory(previousInventory)
      alert('操作失败，已回滚。请重试。')
    }
  }

  // ── 缺货弹窗确认 → 执行 ──
  const handleConfirmShortage = () => {
    const selectedOrders = pendingOrders.filter(o => selectedOrderIds.has(o.id))

    // 重新计算 demandMap
    const demandMap = new Map<string, { mealName: string; quantity: number; unitPrice: number; days: string[] }>()
    selectedOrders.flatMap(o => o.items).forEach(item => {
      const key = item.mealName
      const existing = demandMap.get(key)
      if (existing) { existing.quantity += item.quantity }
      else { demandMap.set(key, { ...item }) }
    })

    const currentInventory = storage.getInventory()
    const invMap = new Map(currentInventory.map(i => [i.mealName, i.stock]))

    executeBatchProcessing(selectedOrders, demandMap, invMap, shortageData)
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

  // 库存充足率计算
  const inventorySufficiency = useMemo(() => {
    if (allMealNames.length === 0) return 0
    const stocked = allMealNames.filter(name => {
      const inv = inventory.find(i => i.mealName === name)
      return inv && inv.stock >= 5
    }).length
    return Math.round((stocked / allMealNames.length) * 100)
  }, [allMealNames, inventory])

  const stats = [
    { label: '待接单', value: pendingOrders.length, icon: Package, colorIdx: 0 },
    { label: '工厂订单', value: myFactoryOrders.length, icon: Factory, colorIdx: 1 },
    { label: '待配送', value: pendingDeliveryFactoryOrders.length, icon: Truck, colorIdx: 2 },
    { label: '库存充足率', value: `${inventorySufficiency}%`, icon: Users, colorIdx: 3 },
  ]

  const tabs = [
    { id: 'approved' as const, label: '待接单', count: pendingOrders.length, icon: ClipboardList },
    { id: 'inventory' as const, label: '库存管理', count: null, icon: Package },
    { id: 'summary' as const, label: '订单统计', count: null, icon: BarChart3 },
    { id: 'factories' as const, label: '工厂订单', count: myFactoryOrders.length, icon: Factory },
    { id: 'delivery' as const, label: '配送管理', count: pendingDeliveryFactoryOrders.length, icon: Truck },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'hsl(210 20% 98%)' }}>
      <header className="relative overflow-hidden bg-gradient-to-br from-sky-600 via-cyan-600 to-sky-500">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-8">
          <Link to="/" className="mb-4 inline-flex items-center gap-1.5 rounded-lg bg-white/15 backdrop-blur-md px-3 py-1.5 text-sm font-medium text-white/85 transition-colors hover:bg-white/20 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> 返回首页
          </Link>
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/12">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">分销端</h1>
              <p className="mt-0.5 text-sm text-white/80">{currentUser?.name || ''} · 汇总订单、向工厂下单、配送管理</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-slate-100 bg-white px-5 py-4 ">
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
        <div className="mb-6 flex gap-1 bg-slate-100/80 rounded-xl p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count !== null && tab.count > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${activeTab === tab.id ? 'bg-teal-50 text-teal-700' : 'bg-slate-200/60 text-slate-600'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="animate-fade-in">
          {activeTab === 'approved' && (
            <div>
              {pendingOrders.length > 0 ? (
                <div>
                  {/* 顶部操作栏 */}
                  <div className="mb-5 rounded-xl border border-slate-100 bg-white px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedOrderIds.size === pendingOrders.length && pendingOrders.length > 0}
                            onChange={toggleSelectAll}
                            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span className="text-sm font-medium text-foreground">
                            全选 ({selectedOrderIds.size}/{pendingOrders.length})
                          </span>
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedOrderIds.size > 0 && (
                          <button onClick={handleRejectSelected} className="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50">
                            拒绝所选 ({selectedOrderIds.size})
                          </button>
                        )}
                        <button
                          onClick={handleBatchCreate}
                          disabled={selectedOrderIds.size === 0}
                          className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          接单处理 ({selectedOrderIds.size})
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">勾选要处理的订单，接单后自动扣减库存；库存不足时会提示您逐项决定处理方式</p>
                  </div>
                  {/* 订单列表 */}
                  <div className="space-y-3 stagger-children">
                    {pendingOrders.map(order => {
                      const isSelected = selectedOrderIds.has(order.id)
                      return (
                        <label
                          key={order.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border bg-white px-5 py-4 transition-colors ${isSelected ? 'border-teal-300 bg-teal-50/30' : 'border-slate-100 hover:border-slate-200'}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleOrderSelection(order.id)}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold text-foreground">{order.id}</h4>
                                <p className="mt-0.5 text-sm text-muted-foreground">{order.customerName} · {order.customerPhone}</p>
                              </div>
                              <span className="text-lg font-bold text-teal-700">${order.totalAmount}</span>
                            </div>
                            <div className="mt-2.5 flex flex-wrap gap-1.5">
                              {order.items.map((item, idx) => (
                                <span key={idx} className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                  {item.mealName} <span className="text-teal-600">x{item.quantity}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <EmptyState icon={Package} text="暂无待接单订单" />
              )}
            </div>
          )}

          {/* 缺货确认弹窗 */}
          {showShortageModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
              <div className="animate-scale-in w-full max-w-lg rounded-xl border border-slate-100 bg-white px-6 py-5" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                <h3 className="text-lg font-bold text-foreground">库存不足确认</h3>
                <p className="mt-1 text-sm text-muted-foreground">以下餐品库存不足，请逐项选择处理方式：</p>
                <div className="mt-4 space-y-4">
                  {shortageData.map((item, idx) => (
                    <div key={item.mealName} className="rounded-lg border border-slate-100 bg-slate-50/60 px-4 py-3">
                      <p className="text-sm font-semibold text-foreground">{item.mealName}</p>
                      <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                        <span>需求: <b className="text-foreground">{item.needed}</b></span>
                        <span>库存: <b className="text-emerald-600">{item.inStock}</b></span>
                        <span>缺口: <b className="text-red-600">{item.shortfall}</b></span>
                      </div>
                      <div className="mt-2.5 space-y-1.5">
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                          <input
                            type="radio" name={`shortage-${idx}`} checked={item.decision === 'factory'}
                            onChange={() => setShortageData(prev => prev.map((d, i) => i === idx ? { ...d, decision: 'factory' } : d))}
                            className="text-teal-600 focus:ring-teal-500"
                          />
                          <span className="text-foreground">
                            {item.inStock > 0 ? `用尽库存(${item.inStock}) + 差额(${item.shortfall})转工厂生产` : `差额(${item.shortfall})全部转工厂生产`}
                          </span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                          <input
                            type="radio" name={`shortage-${idx}`} checked={item.decision === 'skip'}
                            onChange={() => setShortageData(prev => prev.map((d, i) => i === idx ? { ...d, decision: 'skip' } : d))}
                            className="text-teal-600 focus:ring-teal-500"
                          />
                          <span className="text-foreground">本批次不包含此餐品（库存保留不动）</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button onClick={() => setShowShortageModal(false)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
                    取消
                  </button>
                  <button onClick={handleConfirmShortage} className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700">
                    确认执行
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 批量处理结果通知 */}
          {batchResult && (
            <div className="mb-5 rounded-xl border-l-4 bg-white px-5 py-4 shadow-sm" style={{ borderLeftColor: batchResult.toFactory === 0 ? '#0d9488' : '#f59e0b' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-foreground">
                    {batchResult.toFactory === 0 ? '全部从库存出货' : '智能分流完成'}
                  </h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {batchResult.fromStock > 0 && <span className="mr-3 text-emerald-600">库存出货: {batchResult.fromStock} 项</span>}
                    {batchResult.toFactory > 0 && <span className="text-amber-600">工厂下单: {batchResult.toFactory} 项</span>}
                  </p>
                </div>
                <button onClick={() => setBatchResult(null)} className="text-sm text-muted-foreground hover:text-foreground">关闭</button>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="animate-fade-in">
              <div className="mb-5 rounded-xl border border-slate-100 bg-white px-5 py-4 ">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">库存管理</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">管理各餐品库存数量，库存充足时可直接出货无需向工厂下单</p>
                  </div>
                  <button
                    onClick={() => setInventory(storage.getInventory())}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    刷新
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
                {allMealNames.map(mealName => {
                  const inv = inventory.find(i => i.mealName === mealName)
                  const stock = inv?.stock ?? 0
                  const isLow = stock < 5
                  return (
                    <div key={mealName} className={`rounded-xl border border-slate-100 bg-white px-4 py-3  ${isLow ? 'ring-1 ring-amber-400' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">{mealName}</p>
                          {isLow && <p className="mt-0.5 text-xs font-medium text-amber-600">库存偏低</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              storage.updateStock(mealName, -1)
                              setInventory(storage.getInventory())
                            }}
                            disabled={stock === 0}
                            className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 transition-colors disabled:opacity-30 hover:bg-slate-200"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-8 text-center text-lg font-bold tabular-nums text-foreground">{stock}</span>
                          <button
                            onClick={() => {
                              storage.updateStock(mealName, 1)
                              setInventory(storage.getInventory())
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 transition-colors hover:bg-slate-200"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, (stock / 20) * 100)}%`,
                              background: isLow ? '#f59e0b' : '#0d9488',
                            }}
                          />
                        </div>
                        <input
                          type="number"
                          min={0}
                          value={stock}
                          onChange={(e) => {
                            const newVal = Math.max(0, parseInt(e.target.value) || 0)
                            const currentInv = storage.getInventory()
                            const idx = currentInv.findIndex(i => i.mealName === mealName)
                            if (idx !== -1) {
                              currentInv[idx].stock = newVal
                              currentInv[idx].updatedAt = new Date().toISOString()
                            } else {
                              currentInv.push({ mealName, stock: newVal, updatedAt: new Date().toISOString() })
                            }
                            storage.saveInventory(currentInv)
                            setInventory(storage.getInventory())
                          }}
                          className="w-14 rounded border border-slate-200 px-2 py-1 text-center text-xs font-semibold tabular-nums"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
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
                  <div key={m.label} className="rounded-xl border border-slate-100 bg-white px-5 py-4 ">
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

              <div className="rounded-xl border border-slate-100 bg-white px-6 py-5 ">
                <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">按状态统计</h4>
                <div className="space-y-2.5">
                  {[
                    { label: '待接单', value: pendingOrders.length, bar: '#f97316' },
                    { label: '处理中', value: processingOrders.length, bar: '#8b5cf6' },
                    { label: '已完成', value: myOrders.filter(o => o.status === 'delivered').length, bar: '#0d9488' },
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
                    <div key={fo.id} className="rounded-xl border border-slate-100 bg-white">
                      <div className="flex items-center justify-between px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100">
                            <Factory className="h-4.5 w-4.5 text-slate-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{fo.factoryName}</h3>
                            <p className="text-xs text-muted-foreground">{fo.id}</p>
                            {(fo.serviceName || fo.distributorName) && (
                              <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                                {fo.serviceName && <span className="rounded bg-violet-50 px-1.5 py-0.5 text-violet-600">{fo.serviceName}</span>}
                                {fo.distributorName && <><span>&rarr;</span><span className="rounded bg-cyan-50 px-1.5 py-0.5 text-cyan-700">{fo.distributorName}</span></>}
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
                              {item.mealName} <span className="text-teal-600">x{item.quantity}</span>
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between pt-3">
                          <span className="text-sm font-medium text-muted-foreground">总计</span>
                          <span className="text-lg font-bold text-teal-700">${fo.totalAmount}</span>
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
                <button onClick={() => setActiveTab('delivery')} className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700">
                  待配送 ({pendingDeliveryFactoryOrders.length})
                </button>
                <button onClick={() => setActiveTab('delivered')} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
                  已送达 ({deliveredFactoryOrders.length})
                </button>
              </div>

              {pendingDeliveryFactoryOrders.length > 0 ? (
                <div className="space-y-3 stagger-children">
                  {pendingDeliveryFactoryOrders.map(fo => (
                    <div key={fo.id} className="rounded-xl border border-slate-100 bg-white">
                      <div className="flex items-center justify-between px-5 py-3.5">
                        <div>
                          <h3 className="font-semibold text-foreground">{fo.factoryName}</h3>
                          <p className="text-xs text-muted-foreground">{fo.id} · 共 {fo.items.length} 种餐品</p>
                          {(fo.serviceName || fo.distributorName) && (
                            <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                              {fo.serviceName && <span className="rounded bg-violet-50 px-1.5 py-0.5 text-violet-600">{fo.serviceName}</span>}
                              {fo.distributorName && <><span>&rarr;</span><span className="rounded bg-cyan-50 px-1.5 py-0.5 text-cyan-700">{fo.distributorName}</span></>}
                            </div>
                          )}
                        </div>
                        <span className="text-lg font-bold text-teal-700">${fo.totalAmount}</span>
                      </div>
                      <div className="px-5 py-4">
                        <div className="mb-3 flex flex-wrap gap-1.5">
                          {fo.items.map((item, idx) => (
                            <span key={idx} className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              {item.mealName} <span className="text-teal-600">x{item.quantity}</span>
                            </span>
                          ))}
                        </div>
                        <button onClick={() => handleCompleteDelivery(fo.id)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700">
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
                    <div key={fo.id} className="rounded-xl border border-slate-100 bg-white px-5 py-4 ">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{fo.factoryName}</h3>
                          <p className="text-xs text-muted-foreground">{fo.id} · 共 {fo.items.length} 种餐品</p>
                        </div>
                        <span className="rounded-full bg-slate-50 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">已送达</span>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between pt-2.5">
                        <div className="flex flex-wrap gap-1">
                          {fo.items.slice(0, 3).map((item, idx) => (
                            <span key={idx} className="text-xs text-muted-foreground">{item.mealName}</span>
                          ))}
                          {fo.items.length > 3 && <span className="text-xs text-muted-foreground">+{fo.items.length - 3}</span>}
                        </div>
                        <span className="font-bold text-teal-700">${fo.totalAmount}</span>
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
  const config: Record<string, { className: string; label: string }> = {
    pending: { className: 'bg-amber-50 text-amber-700 border border-amber-200', label: '待接单' },
    confirmed: { className: 'bg-blue-50 text-blue-700 border border-blue-200', label: '已确认' },
    completed: { className: 'bg-emerald-50 text-emerald-700 border border-emerald-200', label: '已完成' },
    delivered: { className: 'bg-slate-50 text-slate-700 border border-slate-200', label: '已送达' },
  }
  const c = config[status] || config.pending
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.className}`}>
      {c.label}
    </span>
  )
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100">
        <Icon className="h-7 w-7 text-slate-400" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{text}</p>
    </div>
  )
}
