import { useState, useEffect, useMemo } from 'react'
import { Link, ArrowLeft, Package, CheckCircle, Clock, Plus, Edit, Truck, ChefHat, X, Search, Warehouse, Upload, Minus, Save, Calendar } from 'lucide-react'
import { FactoryOrder, Meal, InventoryItem, mockMeals, storage } from '../store'
import LoginGate, { useCurrentUser } from '../components/LoginGate'
import { toast, confirmDialog } from '../components/Toast'

type Tab = 'orders' | 'meals' | 'inventory'

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
  const [activeTab, setActiveTab] = useState<Tab>('orders')
  const [showAddMeal, setShowAddMeal] = useState(false)
  const [inventory, setInventory] = useState<InventoryItem[]>([])

  useEffect(() => {
    setFactoryOrders(storage.getFactoryOrders())
    setMeals([...mockMeals, ...storage.getCustomMeals()])
    setInventory(storage.getInventory())
    const unsubFO = storage.subscribeToFactoryOrderChanges(() => setFactoryOrders(storage.getFactoryOrders()))
    const unsubO = storage.subscribeToOrderChanges(() => setInventory(storage.getInventory()))
    return () => { unsubFO(); unsubO() }
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
    toast.success('菜品已保存')
  }

  const handleDeleteCustomMeal = async (mealId: string) => {
    if (!await confirmDialog('删除菜品', '确定删除此菜品？删除后无法恢复。')) return
    storage.deleteCustomMeal(mealId)
    setMeals(meals.filter(m => m.id !== mealId))
    toast.success('菜品已删除')
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
              <p className="mt-0.5 text-sm text-white/80">{currentUser?.name || ''} &middot; 菜品管理、库存与订单生产</p>
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
            { id: 'orders' as Tab, label: '订单管理', count: pendingOrders.length },
            { id: 'meals' as Tab, label: '菜品管理', count: null },
            { id: 'inventory' as Tab, label: '库存管理', count: null },
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
          <MealsTab
            meals={meals}
            inventory={inventory}
            onAddMeal={() => setShowAddMeal(true)}
            onDeleteCustomMeal={handleDeleteCustomMeal}
          />
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <InventoryTab
            meals={meals}
            inventory={inventory}
            onRefresh={() => setInventory(storage.getInventory())}
          />
        )}
      </main>

      {/* Add Meal Modal */}
      {showAddMeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="animate-scale-in w-full max-w-md rounded-xl border border-slate-100 shadow-xl bg-white px-6 py-5" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
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
  )
}

function MealsTab({ meals, inventory, onAddMeal, onDeleteCustomMeal }: {
  meals: Meal[]
  inventory: InventoryItem[]
  onAddMeal: () => void
  onDeleteCustomMeal: (id: string) => void
}) {
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  const [uploadMeal, setUploadMeal] = useState<Meal | null>(null)
  const [uploadNote, setUploadNote] = useState('')

  const categories = useMemo(() => {
    const cats = new Set(meals.map(m => m.category))
    return ['all', ...Array.from(cats).sort()]
  }, [meals])

  const filtered = useMemo(() => {
    return meals.filter(m => {
      if (categoryFilter !== 'all' && m.category !== categoryFilter) return false
      if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !(m.nameEn || '').toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [meals, categoryFilter, search])

  const getStock = (mealName: string) => {
    return inventory.find(i => i.mealName === mealName)?.stock ?? 0
  }

  const handleSaveEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingMeal) return
    const formData = new FormData(e.currentTarget)
    const updates: Partial<Meal> = {
      name: formData.get('name') as string,
      price: Number(formData.get('price')),
      category: formData.get('category') as string,
    }
    if (editingMeal.id.startsWith('meal-')) {
      storage.updateCustomMeal(editingMeal.id, updates)
    }
    setEditingMeal(null)
    toast.success('菜品已保存')
  }

  const handleUploadNote = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!uploadMeal || !uploadNote.trim()) return
    const customMeals = storage.getCustomMeals()
    const isCustom = customMeals.some(m => m.id === uploadMeal.id)
    if (isCustom) {
      storage.updateCustomMeal(uploadMeal.id, { notes: uploadNote } as any)
    } else {
      storage.saveCustomMeal({ ...uploadMeal, id: `meal-note-${Date.now()}`, notes: uploadNote } as any)
    }
    setUploadMeal(null)
    setUploadNote('')
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2 className="font-bold text-lg font-bold text-foreground">菜品列表</h2>
          <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700">{meals.length}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              className="w-48 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-foreground transition focus:outline-none focus:ring-2"
              placeholder="搜索菜品..."
            />
          </div>
          <button onClick={onAddMeal} className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700">
            <Plus className="h-4 w-4" /> 添加菜品
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              categoryFilter === cat ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat === 'all' ? '全部' : cat}
          </button>
        ))}
      </div>

      {/* Meals grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
        {filtered.map(meal => {
          const stock = getStock(meal.name)
          const isCustom = meal.id.startsWith('meal-')
          return (
            <div key={meal.id + meal.name} className="rounded-xl border border-slate-100 bg-white px-4 py-4">
              <div className="mb-2.5 flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{meal.name}</h3>
                  {meal.nameEn && <p className="text-xs text-muted-foreground truncate">{meal.nameEn}</p>}
                </div>
                <span className="ml-2 text-lg font-bold text-teal-600 flex-shrink-0">${meal.price}</span>
              </div>
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <span className="rounded-md bg-cyan-50 px-2 py-0.5 text-xs font-medium text-cyan-700 border border-cyan-200">{meal.category}</span>
                {meal.dietaryTags?.map(tag => (
                  <span key={tag} className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{tag}</span>
                ))}
                {meal.dayOfWeek && (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{meal.dayOfWeek}</span>
                )}
              </div>
              <div className="mb-3 flex items-center gap-1.5 text-xs">
                <Warehouse className="h-3.5 w-3.5 text-muted-foreground/60" />
                <span className="text-muted-foreground">库存: </span>
                <span className={`font-semibold ${stock > 20 ? 'text-emerald-600' : stock > 0 ? 'text-amber-600' : 'text-red-500'}`}>{stock}</span>
              </div>
              <div className="flex gap-1.5">
                {isCustom && (
                  <button
                    onClick={() => setEditingMeal(meal)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-teal-600 ring-1 ring-inset ring-slate-200"
                  >
                    <Edit className="h-3.5 w-3.5" /> 编辑
                  </button>
                )}
                <button
                  onClick={() => { setUploadMeal(meal); setUploadNote((meal as any).notes || '') }}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-teal-600 ring-1 ring-inset ring-slate-200"
                >
                  <Upload className="h-3.5 w-3.5" /> 资料
                </button>
                {isCustom && (
                  <button
                    onClick={() => onDeleteCustomMeal(meal.id)}
                    className="flex items-center justify-center rounded-lg px-2.5 py-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 ring-1 ring-inset ring-slate-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16">
          <p className="text-sm font-medium text-muted-foreground">无匹配菜品</p>
        </div>
      )}

      {/* Edit Meal Modal */}
      {editingMeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="animate-scale-in w-full max-w-md rounded-xl border border-slate-100 shadow-xl bg-white px-6 py-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-lg font-bold text-foreground">编辑菜品</h3>
              <button onClick={() => setEditingMeal(null)} className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">菜品名称</label>
                <input name="name" type="text" required defaultValue={editingMeal.name} className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-foreground transition focus:outline-none focus:ring-2" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">价格</label>
                <input name="price" type="number" required min="1" defaultValue={editingMeal.price} className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-foreground transition focus:outline-none focus:ring-2" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">分类</label>
                <select name="category" defaultValue={editingMeal.category} className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-foreground transition focus:outline-none focus:ring-2">
                  <option value="荤菜">荤菜</option>
                  <option value="素菜">素菜</option>
                  <option value="面食">面食</option>
                  <option value="汤品">汤品</option>
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditingMeal(null)} className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-slate-50">
                  取消
                </button>
                <button type="submit" className="flex-1 rounded-lg bg-teal-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700">
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Note Modal */}
      {uploadMeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="animate-scale-in w-full max-w-md rounded-xl border border-slate-100 shadow-xl bg-white px-6 py-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-lg font-bold text-foreground">菜品资料 - {uploadMeal.name}</h3>
              <button onClick={() => { setUploadMeal(null); setUploadNote('') }} className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <form onSubmit={handleUploadNote} className="space-y-3.5">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">工厂备注/说明</label>
                <textarea
                  value={uploadNote}
                  onChange={e => setUploadNote(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-foreground transition focus:outline-none focus:ring-2 resize-none"
                  placeholder="输入菜品相关资料、配料说明、过敏原信息等..."
                />
              </div>
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
                <p className="text-xs text-emerald-700">
                  资料提交后将关联到此菜品，方便后续查阅和管理。
                </p>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setUploadMeal(null); setUploadNote('') }} className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-slate-50">
                  取消
                </button>
                <button type="submit" className="flex-1 rounded-lg bg-teal-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700">
                  保存资料
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function InventoryTab({ meals, inventory, onRefresh }: {
  meals: Meal[]
  inventory: InventoryItem[]
  onRefresh: () => void
}) {
  const [search, setSearch] = useState('')
  const [adjusting, setAdjusting] = useState<string | null>(null)
  const [adjustDelta, setAdjustDelta] = useState(0)

  const allMealNames = useMemo(() => {
    return [...new Set(meals.map(m => m.name))].sort()
  }, [meals])

  const inventoryMap = useMemo(() => {
    const map: Record<string, InventoryItem> = {}
    inventory.forEach(i => { map[i.mealName] = i })
    return map
  }, [inventory])

  const filtered = useMemo(() => {
    if (!search) return allMealNames
    return allMealNames.filter(name => name.toLowerCase().includes(search.toLowerCase()))
  }, [allMealNames, search])

  const handleAdjustStock = (mealName: string, delta: number) => {
    storage.updateStock(mealName, delta)
    onRefresh()
    setAdjusting(null)
    setAdjustDelta(0)
  }

  const handleSetStock = (mealName: string) => {
    const current = inventoryMap[mealName]?.stock ?? 0
    const delta = adjustDelta - current
    storage.updateStock(mealName, delta)
    onRefresh()
    setAdjusting(null)
    setAdjustDelta(0)
  }

  const lowStockCount = allMealNames.filter(name => (inventoryMap[name]?.stock ?? 0) <= 5).length

  return (
    <div className="animate-fade-in">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2 className="font-bold text-lg font-bold text-foreground">库存管理</h2>
          <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700">{allMealNames.length} 品项</span>
          {lowStockCount > 0 && (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">{lowStockCount} 低库存</span>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            className="w-56 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-foreground transition focus:outline-none focus:ring-2"
            placeholder="搜索库存品项..."
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50/80 border-slate-100 text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">菜品名称</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">当前库存</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">最后更新</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-12 text-center text-sm text-muted-foreground">暂无数据</td></tr>
              ) : (
                filtered.map(mealName => {
                  const item = inventoryMap[mealName]
                  const stock = item?.stock ?? 0
                  const isAdjusting = adjusting === mealName

                  return (
                    <tr key={mealName} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-5 py-3 font-semibold text-foreground">{mealName}</td>
                      <td className="px-5 py-3">
                        <span className={`text-sm font-bold tabular-nums ${stock > 20 ? 'text-emerald-600' : stock > 5 ? 'text-amber-600' : 'text-red-500'}`}>
                          {stock}
                        </span>
                        {stock <= 5 && <span className="ml-1.5 text-xs text-amber-600">低</span>}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {item?.updatedAt ? new Date(item.updatedAt).toLocaleString('zh-CN') : '-'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {isAdjusting ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <input
                              type="number"
                              value={adjustDelta}
                              onChange={e => setAdjustDelta(parseInt(e.target.value) || 0)}
                              className="w-20 rounded border border-slate-200 px-2 py-1 text-sm text-right"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSetStock(mealName)}
                              className="rounded-lg bg-teal-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-teal-700"
                            >
                              <Save className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => { setAdjusting(null); setAdjustDelta(0) }}
                              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-slate-50"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleAdjustStock(mealName, -1)}
                              className="rounded p-1.5 text-muted-foreground/60 transition-colors hover:bg-red-50 hover:text-red-600"
                              title="减1"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleAdjustStock(mealName, 1)}
                              className="rounded p-1.5 text-muted-foreground/60 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                              title="加1"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => { setAdjusting(mealName); setAdjustDelta(stock) }}
                              className="rounded p-1.5 text-muted-foreground/60 transition-colors hover:bg-blue-50 hover:text-blue-600"
                              title="设定数量"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
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

      <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4">
        <p className="text-sm font-medium text-emerald-800">库存说明</p>
        <p className="mt-1 text-xs text-emerald-700">
          库存数量在分销商接单时自动扣减。可手动调整库存数量以应对盘点或补货。红色标记表示库存不足5份，建议及时补货。
        </p>
      </div>
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
          {order.deliveryDate && (
            <div className="mt-1.5 flex items-center gap-1 text-xs text-teal-600">
              <Calendar className="h-3 w-3" />
              <span className="font-medium">配送日期：{new Date(order.deliveryDate).toLocaleDateString('zh-CN')}</span>
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
