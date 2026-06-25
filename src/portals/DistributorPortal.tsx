import { useState, useEffect, useMemo } from 'react'
import { Link, ArrowLeft, Package, Truck, CheckCircle, Users, ClipboardList, BarChart3, Factory, ShoppingBag, DollarSign, TrendingUp, Minus, Plus, ShoppingCart, Calendar, X, AlertTriangle } from 'lucide-react'
import { storage, Order, FactoryOrder, InventoryItem, mockMeals, Meal } from '../store'
import LoginGate, { useCurrentUser } from '../components/LoginGate'
import { toast, confirmDialog } from '../components/Toast'

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
  const [activeTab, setActiveTab] = useState<string>('approved')
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set())
  const [showShortageModal, setShowShortageModal] = useState(false)
  const [shortageItems, setShortageItems] = useState<{ mealName: string; needed: number; inStock: number }[]>([])

  useEffect(() => {
    setOrders(storage.getOrders())
    setFactoryOrders(storage.getFactoryOrders())
    setInventory(storage.getInventory())
    const unsubOrders = storage.subscribeToOrderChanges(() => setOrders(storage.getOrders()))
    const unsubFO = storage.subscribeToFactoryOrderChanges(() => setFactoryOrders(storage.getFactoryOrders()))
    return () => { unsubOrders(); unsubFO() }
  }, [])

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

  const handleRejectSelected = async () => {
    if (selectedOrderIds.size === 0) return
    const confirmed = await confirmDialog('拒绝订单', `确定拒绝 ${selectedOrderIds.size} 个订单？拒绝后老人需重新下单。`)
    if (!confirmed) return
    // 拒绝订单时释放预占库存
    const rejectedOrders = pendingOrders.filter(o => selectedOrderIds.has(o.id))
    rejectedOrders.forEach(order => {
      storage.updateOrder(order.id, { status: 'rejected', rejectedAt: new Date().toISOString() })
      order.items.forEach(item => {
        storage.releaseReservedStock(item.mealName, item.quantity)
      })
    })
    setSelectedOrderIds(new Set())
    setOrders(storage.getOrders())
    setInventory(storage.getInventory())
    toast.warning('已拒绝订单', `已拒绝 ${rejectedOrders.length} 个订单`)
  }

  // ── 接单处理：检查库存 ──
  const handleBatchAccept = () => {
    const selectedOrders = pendingOrders.filter(o => selectedOrderIds.has(o.id))
    if (selectedOrders.length === 0) return

    // 汇总需求
    const demandMap = new Map<string, number>()
    selectedOrders.flatMap(o => o.items).forEach(item => {
      demandMap.set(item.mealName, (demandMap.get(item.mealName) || 0) + item.quantity)
    })

    // 检查可用库存（扣除已预占）
    const shortages: { mealName: string; needed: number; inStock: number }[] = []
    demandMap.forEach((needed, mealName) => {
      const available = storage.getAvailableStock(mealName)
      if (available < needed) {
        shortages.push({ mealName, needed, inStock: available })
      }
    })

    if (shortages.length > 0) {
      setShortageItems(shortages)
      setShowShortageModal(true)
    } else {
      executeAcceptOrders(selectedOrders, demandMap)
    }
  }

  // ── 执行接单（确认预占库存扣减 + 改状态）──
  const executeAcceptOrders = (
    selectedOrders: Order[],
    demandMap: Map<string, number>,
  ) => {
    // 确认预占库存扣减（下单时已预占，现在确认扣减）
    demandMap.forEach((needed, mealName) => {
      storage.confirmReservedStock(mealName, needed)
    })

    // 更新订单状态
    selectedOrders.forEach(order => {
      storage.updateOrder(order.id, {
        status: 'processing',
        approvedAt: new Date().toISOString(),
        distributorId: currentUser?.id,
        distributorName: currentUser?.name,
      })
    })

    setSelectedOrderIds(new Set())
    setOrders(storage.getOrders())
    setInventory(storage.getInventory())
    toast.success('接单成功', `已成功接受 ${selectedOrders.length} 个订单`)
    setShowShortageModal(false)
    setShortageItems([])
  }

  // ── 缺货确认后继续接单 ──
  const handleConfirmShortage = () => {
    const selectedOrders = pendingOrders.filter(o => selectedOrderIds.has(o.id))
    const demandMap = new Map<string, number>()
    selectedOrders.flatMap(o => o.items).forEach(item => {
      demandMap.set(item.mealName, (demandMap.get(item.mealName) || 0) + item.quantity)
    })
    executeAcceptOrders(selectedOrders, demandMap)
  }

  const handleCompleteDelivery = (factoryOrderId: string) => {
    const fo = storage.getFactoryOrders().find(o => o.id === factoryOrderId)
    if (!fo || fo.distributorId !== currentUser?.id) return
    storage.updateFactoryOrder(factoryOrderId, { status: 'delivered' })
    if (fo?.customerOrderIds?.length) {
      fo.customerOrderIds.forEach(orderId => storage.updateOrder(orderId, { status: 'delivered' }))
    }
    setFactoryOrders(storage.getFactoryOrders())
    setOrders(storage.getOrders())
    toast.success('配送已确认')
  }

  const statColors = ['#3b82f6', '#8b5cf6', '#f97316', '#10b981']

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
    { id: 'approved', label: '待接单', count: pendingOrders.length, icon: ClipboardList },
    { id: 'factory-order', label: '向工厂下单', count: null, icon: ShoppingCart },
    { id: 'inventory', label: '库存管理', count: null, icon: Package },
    { id: 'summary', label: '订单统计', count: null, icon: BarChart3 },
    { id: 'factories', label: '工厂订单', count: myFactoryOrders.length, icon: Factory },
    { id: 'delivery', label: '配送管理', count: pendingDeliveryFactoryOrders.length, icon: Truck },
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
              <p className="mt-0.5 text-sm text-white/80">{currentUser?.name || ''} &middot; 接单、向工厂批发下单、配送管理</p>
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
        <div className="mb-6 flex gap-1 bg-slate-100/80 rounded-xl p-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden text-xs">{tab.label}</span>
              {tab.count !== null && tab.count > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${activeTab === tab.id ? 'bg-teal-50 text-teal-700' : 'bg-slate-200/60 text-slate-600'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="animate-fade-in">
          {/* ══ 待接单 Tab ══ */}
          {activeTab === 'approved' && (
            <div>
              {pendingOrders.length > 0 ? (
                <div>
                  <div className="mb-5 rounded-xl border border-slate-100 bg-white px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <label className="flex cursor-pointer items-center gap-2">
                          <input type="checkbox" checked={selectedOrderIds.size === pendingOrders.length && pendingOrders.length > 0} onChange={toggleSelectAll} className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                          <span className="text-sm font-medium text-foreground">全选 ({selectedOrderIds.size}/{pendingOrders.length})</span>
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedOrderIds.size > 0 && (
                          <button onClick={handleRejectSelected} className="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50">
                            拒绝所选 ({selectedOrderIds.size})
                          </button>
                        )}
                        <button onClick={handleBatchAccept} disabled={selectedOrderIds.size === 0} className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed">
                          接单处理 ({selectedOrderIds.size})
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">勾选要接单的订单，接单后自动扣减库存。库存不足时会提示您确认。</p>
                  </div>

                  <div className="space-y-3 stagger-children">
                    {pendingOrders.map(order => {
                      const isSelected = selectedOrderIds.has(order.id)
                      return (
                        <label key={order.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border bg-white px-5 py-4 transition-colors ${isSelected ? 'border-teal-300 bg-teal-50/30' : 'border-slate-100 hover:border-slate-200'}`}>
                          <input type="checkbox" checked={isSelected} onChange={() => toggleOrderSelection(order.id)} className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold text-foreground">{order.id}</h4>
                                <p className="mt-0.5 text-sm text-muted-foreground">{order.customerName} &middot; {order.customerPhone}</p>
                                {order.deliveryDate && (
                                  <p className="mt-0.5 text-xs font-medium text-blue-600">
                                    <Calendar className="inline h-3 w-3 mr-0.5" />
                                    期望配送: {order.deliveryDate}
                                  </p>
                                )}
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

          {/* ══ 缺货确认弹窗 ══ */}
          {showShortageModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
              <div className="animate-scale-in w-full max-w-lg rounded-xl border border-slate-100 bg-white px-6 py-5" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <h3 className="text-lg font-bold text-foreground">库存不足提示</h3>
                </div>
                <p className="text-sm text-muted-foreground">以下餐品库存不足以满足所选订单需求，接单后库存不足的餐品将跳过扣减。请稍后通过"向工厂下单"补充库存。</p>
                <div className="mt-4 space-y-2">
                  {shortageItems.map((item) => (
                    <div key={item.mealName} className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-sm font-semibold text-foreground">{item.mealName}</p>
                      <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                        <span>需求: <b className="text-foreground">{item.needed}</b></span>
                        <span>库存: <b className="text-emerald-600">{item.inStock}</b></span>
                        <span>缺口: <b className="text-red-600">{item.needed - item.inStock}</b></span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button onClick={() => { setShowShortageModal(false); setShortageItems([]) }} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
                    取消接单
                  </button>
                  <button onClick={handleConfirmShortage} className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700">
                    继续接单
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══ 向工厂下单 Tab ══ */}
          {activeTab === 'factory-order' && (
            <FactoryOrderTab
              currentUser={currentUser}
              onOrderCreated={() => {
                setFactoryOrders(storage.getFactoryOrders())
                setActiveTab('factories')
              }}
            />
          )}

          {/* ══ 库存管理 Tab ══ */}
          {activeTab === 'inventory' && (
            <InventoryManagementTab
              allMealNames={allMealNames}
              inventory={inventory}
              onRefresh={() => setInventory(storage.getInventory())}
            />
          )}

          {/* ══ 订单统计 Tab ══ */}
          {activeTab === 'summary' && (
            <SummaryTab myOrders={myOrders} pendingOrders={pendingOrders} processingOrders={processingOrders} pendingDeliveryFactoryOrders={pendingDeliveryFactoryOrders} />
          )}

          {/* ══ 工厂订单 Tab ══ */}
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
                            {fo.deliveryDate && (
                              <p className="mt-0.5 text-xs font-medium text-blue-600">
                                <Calendar className="inline h-3 w-3 mr-0.5" />
                                配送日期: {fo.deliveryDate}
                              </p>
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

          {/* ══ 配送管理 Tab ══ */}
          {activeTab === 'delivery' && (
            <div>
              {pendingDeliveryFactoryOrders.length > 0 ? (
                <div className="space-y-3 stagger-children">
                  {pendingDeliveryFactoryOrders.map(fo => (
                    <div key={fo.id} className="rounded-xl border border-slate-100 bg-white">
                      <div className="flex items-center justify-between px-5 py-3.5">
                        <div>
                          <h3 className="font-semibold text-foreground">{fo.factoryName}</h3>
                          <p className="text-xs text-muted-foreground">{fo.id} &middot; 共 {fo.items.length} 种餐品</p>
                          {fo.deliveryDate && (
                            <p className="mt-0.5 text-xs font-medium text-blue-600">
                              <Calendar className="inline h-3 w-3 mr-0.5" />
                              配送日期: {fo.deliveryDate}
                            </p>
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
        </div>
      </main>
    </div>
  )
}

// ══════════════════════════════════════════════════════
// 向工厂下单 Tab
// ══════════════════════════════════════════════════════
function FactoryOrderTab({ currentUser, onOrderCreated }: { currentUser: any; onOrderCreated: () => void }) {
  const [targetFactoryId, setTargetFactoryId] = useState('')
  const [cart, setCart] = useState<Map<string, { name: string; quantity: number; unitPrice: number }>>(new Map())
  const [deliveryDate, setDeliveryDate] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [search, setSearch] = useState('')

  const factories = useMemo(() => storage.getAccounts<{ id: string; name: string }>('factory'), [])
  const allMeals = useMemo(() => [...mockMeals, ...storage.getCustomMeals()], [])

  const categories = useMemo(() => {
    const cats = new Set(allMeals.map(m => m.category))
    return ['all', ...Array.from(cats).sort()]
  }, [allMeals])

  const filteredMeals = useMemo(() => {
    return allMeals.filter(m => {
      if (categoryFilter !== 'all' && m.category !== categoryFilter) return false
      if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !(m.nameEn || '').toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [allMeals, categoryFilter, search])

  const totalQuantity = useMemo(() => {
    let total = 0
    cart.forEach(item => { total += item.quantity })
    return total
  }, [cart])

  const totalAmount = useMemo(() => {
    let total = 0
    cart.forEach(item => { total += item.unitPrice * item.quantity })
    return total
  }, [cart])

  const addToCart = (meal: Meal) => {
    setCart(prev => {
      const next = new Map(prev)
      const existing = next.get(meal.name)
      if (existing) {
        next.set(meal.name, { ...existing, quantity: existing.quantity + 1 })
      } else {
        next.set(meal.name, { name: meal.name, quantity: 1, unitPrice: meal.price })
      }
      return next
    })
  }

  const updateCartQuantity = (mealName: string, delta: number) => {
    setCart(prev => {
      const next = new Map(prev)
      const existing = next.get(mealName)
      if (!existing) return next
      const newQty = Math.max(0, existing.quantity + delta)
      if (newQty === 0) {
        next.delete(mealName)
      } else {
        next.set(mealName, { ...existing, quantity: newQty })
      }
      return next
    })
  }

  const removeFromCart = (mealName: string) => {
    setCart(prev => {
      const next = new Map(prev)
      next.delete(mealName)
      return next
    })
  }

  // ── 需求汇总：按配送日期聚合已接单的需求 ──
  const demandSummary = useMemo(() => {
    const orders = storage.getOrders().filter(o =>
      o.status === 'processing' && o.distributorId === currentUser?.id && o.deliveryDate
    )
    const byDate = new Map<string, Map<string, number>>()
    orders.forEach(order => {
      const date = order.deliveryDate!
      if (!byDate.has(date)) byDate.set(date, new Map())
      const dateMap = byDate.get(date)!
      order.items.forEach(item => {
        dateMap.set(item.mealName, (dateMap.get(item.mealName) || 0) + item.quantity)
      })
    })
    return byDate
  }, [])

  const allDemandDates = useMemo(() => {
    return Array.from(demandSummary.keys()).sort()
  }, [demandSummary])

  const addDemandToCart = (date: string) => {
    const dateMap = demandSummary.get(date)
    if (!dateMap) return
    setCart(prev => {
      const next = new Map(prev)
      dateMap.forEach((qty, mealName) => {
        const existing = next.get(mealName)
        if (existing) {
          next.set(mealName, { ...existing, quantity: existing.quantity + qty })
        } else {
          const meal = allMeals.find(m => m.name === mealName)
          next.set(mealName, { name: mealName, quantity: qty, unitPrice: meal?.price ?? 25 })
        }
      })
      return next
    })
    setDeliveryDate(date)
    toast.info('已添加到购物车', `已将 ${date} 的需求添加到购物车`)
  }

  const handleSubmitFactoryOrder = () => {
    if (!targetFactoryId) { toast.warning('请选择目标工厂'); return }
    if (cart.size === 0) { toast.warning('请先添加餐品到购物车'); return }
    if (totalQuantity < 10) { toast.warning('批发起订量不足', `最低10份，当前仅${totalQuantity}份`); return }
    if (!deliveryDate) { toast.warning('请选择配送日期'); return }

    const factory = factories.find(f => f.id === targetFactoryId)
    if (!factory) { toast.error('工厂不存在'); return }

    const items = Array.from(cart.entries()).map(([name, item]) => ({
      mealName: name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      days: [],
    }))

    const factoryOrder: FactoryOrder = {
      id: `FO-${Date.now()}`,
      factoryId: factory.id,
      factoryName: factory.name,
      items,
      totalAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      deliveryDate,
      distributorName: currentUser?.name,
      distributorId: currentUser?.id,
    }

    storage.saveFactoryOrder(factoryOrder)
    toast.success('工厂订单已提交')
    setCart(new Map())
    setDeliveryDate('')
    setTargetFactoryId('')
    onOrderCreated()
  }

  return (
    <div className="space-y-6">
      {/* 需求汇总 */}
      {allDemandDates.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-blue-900">客户需求汇总</h3>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">{allDemandDates.length} 个配送日期</span>
          </div>
          <div className="space-y-3">
            {allDemandDates.map(date => {
              const dateMap = demandSummary.get(date)!
              const totalQty = Array.from(dateMap.values()).reduce((s, q) => s + q, 0)
              return (
                <div key={date} className="rounded-lg bg-white px-4 py-3 border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm font-semibold text-blue-900">{new Date(date).toLocaleDateString('zh-CN')}</span>
                      <span className="ml-2 text-xs text-blue-600">{totalQty} 份</span>
                    </div>
                    <button
                      onClick={() => addDemandToCart(date)}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      添加到购物车
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(dateMap.entries()).map(([mealName, qty]) => (
                      <span key={mealName} className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                        {mealName} <span className="font-semibold">x{qty}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-xs text-blue-700">提示：点击"添加到购物车"可将该日期的全部需求添加到批发订单，并自动设置配送日期。</p>
        </div>
      )}

      {/* 工厂选择 + 配送日期 */}
      <div className="rounded-xl border border-slate-100 bg-white px-5 py-4">
        <h3 className="text-sm font-bold text-foreground mb-3">向工厂批发下单</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">选择工厂</label>
            <select
              value={targetFactoryId}
              onChange={e => setTargetFactoryId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2"
            >
              <option value="">请选择工厂...</option>
              {factories.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">配送日期</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={e => setDeliveryDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2"
            />
          </div>
        </div>
      </div>

      {/* 菜单浏览 */}
      <div className="rounded-xl border border-slate-100 bg-white">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-foreground">选择菜品</h3>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              className="w-48 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-2"
              placeholder="搜索菜品..."
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(cat)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${categoryFilter === cat ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {cat === 'all' ? '全部' : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMeals.map(meal => {
              const inCart = cart.get(meal.name)
              return (
                <div key={meal.id + meal.name} className={`rounded-lg border px-3 py-2.5 transition-colors ${inCart ? 'border-teal-300 bg-teal-50/30' : 'border-slate-100'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{meal.name}</p>
                      <p className="text-xs text-muted-foreground">{meal.category} &middot; ${meal.price}</p>
                    </div>
                    {inCart ? (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => updateCartQuantity(meal.name, -1)} className="flex h-6 w-6 items-center justify-center rounded bg-slate-200 transition-colors hover:bg-slate-300">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold tabular-nums text-teal-700">{inCart.quantity}</span>
                        <button onClick={() => updateCartQuantity(meal.name, 1)} className="flex h-6 w-6 items-center justify-center rounded bg-teal-100 text-teal-700 transition-colors hover:bg-teal-200">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => addToCart(meal)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white transition-colors hover:bg-teal-700">
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {filteredMeals.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">无匹配菜品</p>
          )}
        </div>
      </div>

      {/* 购物车汇总 */}
      {cart.size > 0 && (
        <div className="rounded-xl border border-slate-100 bg-white px-5 py-4">
          <h3 className="text-sm font-bold text-foreground mb-3">已选菜品 ({cart.size} 项)</h3>
          <div className="space-y-2 mb-4">
            {Array.from(cart.entries()).map(([name, item]) => (
              <div key={name} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{name}</span>
                  <span className="text-xs text-muted-foreground">&times;{item.quantity}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-teal-600">${item.unitPrice * item.quantity}</span>
                  <button onClick={() => removeFromCart(name)} className="rounded p-1 text-muted-foreground/60 hover:bg-red-50 hover:text-red-600">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <div className="text-sm text-muted-foreground">
              总计: <b className="text-foreground">{totalQuantity} 份</b>
              {totalQuantity < 10 && <span className="ml-2 text-xs text-red-500">(最低起订量10份)</span>}
            </div>
            <span className="text-xl font-bold text-teal-700">${totalAmount}</span>
          </div>
          <button
            onClick={handleSubmitFactoryOrder}
            disabled={totalQuantity < 10 || !targetFactoryId || !deliveryDate}
            className="mt-4 w-full rounded-lg bg-teal-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            提交批发订单
          </button>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════
// 库存管理 Tab
// ══════════════════════════════════════════════════════
function InventoryManagementTab({ allMealNames, inventory, onRefresh }: {
  allMealNames: string[]
  inventory: InventoryItem[]
  onRefresh: () => void
}) {
  return (
    <div className="animate-fade-in">
      <div className="mb-5 rounded-xl border border-slate-100 bg-white px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground">库存管理</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">管理各餐品库存数量，接单时自动扣减，也可手动调整</p>
          </div>
          <button onClick={onRefresh} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
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
            <div key={mealName} className={`rounded-xl border border-slate-100 bg-white px-4 py-3 ${isLow ? 'ring-1 ring-amber-400' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{mealName}</p>
                  {isLow && <p className="mt-0.5 text-xs font-medium text-amber-600">库存偏低</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { storage.updateStock(mealName, -1); onRefresh() }} disabled={stock === 0} className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 transition-colors disabled:opacity-30 hover:bg-slate-200">
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center text-lg font-bold tabular-nums text-foreground">{stock}</span>
                  <button onClick={() => { storage.updateStock(mealName, 1); onRefresh() }} className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 transition-colors hover:bg-slate-200">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (stock / 20) * 100)}%`, background: isLow ? '#f59e0b' : '#0d9488' }} />
                </div>
                <input type="number" min={0} value={stock}
                  onChange={(e) => {
                    const newVal = Math.max(0, parseInt(e.target.value) || 0)
                    const currentInv = storage.getInventory()
                    const idx = currentInv.findIndex(i => i.mealName === mealName)
                    if (idx !== -1) { currentInv[idx].stock = newVal; currentInv[idx].updatedAt = new Date().toISOString() }
                    else { currentInv.push({ mealName, stock: newVal, updatedAt: new Date().toISOString() }) }
                    storage.saveInventory(currentInv)
                    onRefresh()
                  }}
                  className="w-14 rounded border border-slate-200 px-2 py-1 text-center text-xs font-semibold tabular-nums"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════
// 订单统计 Tab
// ══════════════════════════════════════════════════════
function SummaryTab({ myOrders, pendingOrders, processingOrders, pendingDeliveryFactoryOrders }: {
  myOrders: Order[]
  pendingOrders: Order[]
  processingOrders: Order[]
  pendingDeliveryFactoryOrders: FactoryOrder[]
}) {
  const statColors = ['#3b82f6', '#8b5cf6', '#f97316', '#10b981']
  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid gap-4 sm:grid-cols-3 stagger-children">
        {[
          { label: '总订单', value: myOrders.length, icon: ShoppingBag, colorIdx: 0 },
          { label: '总收入', value: `$${myOrders.reduce((sum, o) => sum + o.totalAmount, 0)}`, icon: DollarSign, colorIdx: 2 },
          { label: '均单金额', value: `$${myOrders.length ? Math.round(myOrders.reduce((sum, o) => sum + o.totalAmount, 0) / myOrders.length) : 0}`, icon: TrendingUp, colorIdx: 3 },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-slate-100 bg-white px-5 py-4">
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
      <div className="rounded-xl border border-slate-100 bg-white px-6 py-5">
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
  )
}

// ══════════════════════════════════════════════════════
// 共用组件
// ══════════════════════════════════════════════════════
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
