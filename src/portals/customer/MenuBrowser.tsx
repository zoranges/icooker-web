import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, X, Package, User } from 'lucide-react'
import { storage, mockMeals, Order, OrderItem } from '../../store'
import WeekMenuTable from '../../components/WeekMenuTable'


export function MenuBrowser() {
  const navigate = useNavigate()
  const [cart, setCart] = useState<{ mealId: string; quantity: number }[]>([])
  const [selectedWeek, setSelectedWeek] = useState(4)
  const [submitted, setSubmitted] = useState(false)
  const [contactForm, setContactForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
  })

  React.useEffect(() => {
    const currentUser = storage.getCurrentUser()
    if (currentUser && currentUser.role === 'customer') {
      const accounts = storage.getAccounts<{name:string;phone:string;address:string}>('customer')
      const account = accounts.find(a => a.phone === currentUser.phone)
      if (account) {
        setContactForm({
          customerName: account.name || '',
          customerPhone: account.phone || '',
          customerAddress: account.address || '',
        })
        return
      }
    }
    const saved = storage.getCustomerInfo()
    if (saved) {
      setContactForm({
        customerName: saved.customerName || '',
        customerPhone: saved.phone || '',
        customerAddress: saved.address || '',
      })
    }
  }, [])

  const addToCart = (mealId: string) => {
    const meal = mockMeals.find(m => m.id === mealId)
    if (!meal) return
    const existing = cart.find(item => item.mealId === mealId)
    if (existing) {
      setCart(cart.map(item =>
        item.mealId === mealId ? { ...item, quantity: item.quantity + 1 } : item
      ))
    } else {
      setCart([...cart, { mealId, quantity: 1 }])
    }
  }

  const removeFromCart = (mealId: string) => {
    const item = cart.find(i => i.mealId === mealId)
    if (item && item.quantity > 1) {
      setCart(cart.map(i =>
        i.mealId === mealId ? { ...i, quantity: i.quantity - 1 } : i
      ))
    } else {
      setCart(cart.filter(i => i.mealId !== mealId))
    }
  }

  const clearFromCart = (mealId: string) => {
    setCart(cart.filter(i => i.mealId !== mealId))
  }

  const getCartTotal = () => {
    return cart.reduce((sum, item) => {
      const meal = mockMeals.find(m => m.id === item.mealId)
      return sum + (meal?.price || 0) * item.quantity
    }, 0)
  }

  const cartByDay = () => {
    const grouped: Record<string, typeof cart> = {}
    const dayOrder = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    cart.forEach(item => {
      const meal = mockMeals.find(m => m.id === item.mealId)
      const day = meal?.dayOfWeek || '未知'
      if (!grouped[day]) grouped[day] = []
      grouped[day].push(item)
    })
    return dayOrder.filter(d => grouped[d]).map(d => ({
      day: d,
      items: grouped[d],
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) return

    storage.saveCustomerInfo({
      customerName: contactForm.customerName,
      phone: contactForm.customerPhone,
      address: contactForm.customerAddress,
    })

    const items: OrderItem[] = cart.map(item => {
      const meal = mockMeals.find(m => m.id === item.mealId)!
      return {
        mealName: meal.name,
        quantity: item.quantity,
        unitPrice: meal.price,
        days: meal.dayOfWeek ? [meal.dayOfWeek] : [],
      }
    })

    const custAccounts = storage.getAccounts<{phone:string;serviceId:string}>('customer')
    const cust = custAccounts.find(c => c.phone === contactForm.customerPhone)
    let serviceName = ''
    let serviceId = ''
    if (cust?.serviceId) {
      const svcAccounts = storage.getAccounts<{id:string;name:string}>('service')
      const svc = svcAccounts.find(s => s.id === cust.serviceId)
      if (svc) { serviceId = svc.id; serviceName = svc.name }
    }

    const order: Order = {
      id: `ORD-${Date.now()}`,
      customerName: contactForm.customerName,
      customerPhone: contactForm.customerPhone,
      customerAddress: contactForm.customerAddress,
      items,
      totalAmount: getCartTotal(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      serviceId,
      serviceName,
    }

    const today = new Date().toISOString().slice(0, 10)
    const duplicate = storage.getOrders().find(o =>
      o.customerPhone === contactForm.customerPhone &&
      (o.status === 'pending' || o.status === 'approved') &&
      o.createdAt.startsWith(today)
    )
    if (duplicate && !window.confirm(`您今天已有一个已提交订单 (${duplicate.id})。确定再提交一个吗？`)) return

    // 检查费用限额
    const budgetCheck = storage.checkBudget(contactForm.customerPhone, getCartTotal())
    if (!budgetCheck.allowed) {
      alert(`订单金额超出消费限额\n\n${budgetCheck.message}\n\n请联系管理员调整限额设置。`)
      return
    }

    storage.saveOrder(order)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen" style={{ background: 'hsl(210 20% 98%)' }}>
        <div className="mx-auto max-w-2xl px-6 pt-20">
          <div className="rounded-xl border border-slate-100 bg-white px-8 py-12 text-center ">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-teal-500" />
            <h2 className="mb-1.5 text-2xl font-bold text-foreground">订单提交成功！</h2>
            <p className="mb-1 text-slate-500">分销商将尽快处理您的订单</p>
            <p className="mb-6 text-sm text-slate-400">
              共 {cart.length} 个餐品，合计 ${getCartTotal()}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/customer/orders')}
                className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
              >
                查看订单
              </button>
              <button
                onClick={() => navigate('/customer')}
                className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'hsl(210 20% 98%)' }}>
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-3.5">
          <Link to="/customer" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            返回老人端
          </Link>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {cart.length > 0 && (
              <span className="rounded-full bg-teal-600 px-2.5 py-0.5 text-xs font-bold text-white">
                {cart.length} 个餐品
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-6">
        {/* Week selector */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm font-medium text-slate-500">选择周次:</span>
          {[1, 2, 3, 4].map(w => (
            <button
              key={w}
              onClick={() => { setSelectedWeek(w); setCart([]) }}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                selectedWeek === w
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              Week {w}
            </button>
          ))}
        </div>

        {/* Menu info */}
        <div className="mb-5 rounded-xl border border-slate-100 bg-white px-5 py-4 ">
          <h2 className="text-xl font-bold text-foreground mb-1.5">CCA冬季菜单 - Week {selectedWeek}</h2>
          <p className="text-sm mb-3 text-slate-500">Hot-Chilled Winter Menu 2026 CHSP</p>
          <div className="grid gap-2 text-xs md:grid-cols-2">
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-green-50 px-1.5 py-0.5 font-mono text-green-700">(LSF)</span>
              <span>LOW SATURATED FAT 低脂肪 &lt; 1.5g per 100g</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-blue-50 px-1.5 py-0.5 font-mono text-blue-700">(DBF)</span>
              <span>DIABETIC FRIENDLY 适合糖尿病患者 &lt; 15g sugar per 100g</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-purple-50 px-1.5 py-0.5 font-mono text-purple-700">(LS)</span>
              <span>LOWER SODIUM 低钠 &lt; 150mg per 100g</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-cyan-50 px-1.5 py-0.5 font-mono text-cyan-700 border border-cyan-200">(GF)</span>
              <span>GLUTEN FREE 无麸质</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-red-50 px-1.5 py-0.5 font-mono text-red-700">(DF)</span>
              <span>DAIRY FREE 无乳制品</span>
            </div>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* Left: menu table */}
          <div>
            <WeekMenuTable
              weekNumber={selectedWeek}
              cart={cart}
              addToCart={addToCart}
              removeFromCart={removeFromCart}
            />
            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-sm text-blue-800">
              使用方法：点击餐品添加到订单，再次点击增加数量。右侧面板可调整数量或删除。
            </div>
          </div>

          {/* Right: order panel */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-white py-14 text-center ">
                <Package className="mb-2.5 h-9 w-9 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">尚未选择餐品</p>
                <p className="mt-1 text-xs text-slate-400">点击左侧菜单中的餐品开始点餐</p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-100 bg-white">
                {/* Cart header */}
                <div className="px-4 py-3.5">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Package className="h-4.5 w-4.5 text-teal-600" />
                    已选餐品
                    <span className="rounded-full bg-teal-600 px-2 py-0.5 text-xs font-bold text-white">
                      {cart.reduce((s, i) => s + i.quantity, 0)}
                    </span>
                  </h3>
                </div>

                <div className="max-h-[320px] space-y-3 overflow-y-auto p-4">
                  {cartByDay().map(group => (
                    <div key={group.day}>
                      <p className="mb-1.5 text-xs font-semibold text-teal-600">{group.day}</p>
                      <div className="space-y-1.5">
                        {group.items.map(item => {
                          const meal = mockMeals.find(m => m.id === item.mealId)!
                          return (
                            <div key={item.mealId} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                              <div className="min-w-0 flex-1 pr-2">
                                <p className="truncate text-sm font-medium text-foreground">{meal.name}</p>
                                <p className="text-xs text-slate-500">${meal.price} x {item.quantity}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => removeFromCart(item.mealId)}
                                  className="flex h-5.5 w-5.5 items-center justify-center rounded border border-slate-200 bg-white text-xs text-slate-500 transition-colors hover:bg-slate-50"
                                >
                                  -
                                </button>
                                <span className="w-4 text-center text-xs font-semibold text-foreground">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => addToCart(item.mealId)}
                                  className="flex h-5.5 w-5.5 items-center justify-center rounded border border-teal-300/50 bg-teal-50 text-xs text-teal-600 transition-colors"
                                >
                                  +
                                </button>
                                <button
                                  type="button"
                                  onClick={() => clearFromCart(item.mealId)}
                                  className="ml-0.5 flex h-5.5 w-5.5 items-center justify-center rounded text-xs text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                  title="删除"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">合计</span>
                    <span className="text-lg font-bold text-teal-600">${getCartTotal()}</span>
                  </div>
                </div>

                {/* Contact + submit */}
                <form onSubmit={handleSubmit} className="px-4 py-4">
                  <h4 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <User className="h-4 w-4 text-teal-600" />
                    联系信息
                  </h4>
                  <div className="space-y-2.5">
                    <input
                      type="text"
                      required
                      value={contactForm.customerName}
                      onChange={e => setContactForm({ ...contactForm, customerName: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-foreground transition focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      placeholder="姓名 *"
                    />
                    <input
                      type="tel"
                      required
                      value={contactForm.customerPhone}
                      onChange={e => setContactForm({ ...contactForm, customerPhone: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-foreground transition focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      placeholder="电话 *"
                    />
                    <textarea
                      required
                      value={contactForm.customerAddress}
                      onChange={e => setContactForm({ ...contactForm, customerAddress: e.target.value })}
                      className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-foreground transition focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      rows={3}
                      placeholder="配送地址 *"
                    />
                  </div>
                  <button
                    type="submit"
                    className="mt-3.5 w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
                  >
                    提交订单
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
