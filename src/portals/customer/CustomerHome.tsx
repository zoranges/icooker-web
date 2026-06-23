import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, Camera, Clock, List, DollarSign } from 'lucide-react'
import { storage } from '../../store'
import { useCurrentUser } from '../../components/LoginGate'

export function CustomerHome() {
  const navigate = useNavigate()
  const { currentUser } = useCurrentUser()
  const allOrders = storage.getOrders().filter(o => o.customerPhone === currentUser?.phone)
  const myOrders = allOrders.filter(o => o.status !== 'delivered')
  const pendingCount = allOrders.filter(o => o.status === 'pending').length

  const quickActions = [
    { label: '浏览周菜单', desc: '在线选菜，直接下单', icon: BookOpen, color: 'bg-teal-500', path: '/customer/menu' },
    { label: '拍照上传', desc: 'OCR 智能识别手写菜单', icon: Camera, color: 'bg-cyan-500', path: '/customer/upload' },
    { label: '我的订单', desc: '实时追踪订单状态', icon: List, color: 'bg-blue-500', path: '/customer/orders', badge: myOrders.length },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'hsl(210 20% 98%)' }}>
      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-to-br from-teal-500 via-cyan-500 to-teal-600">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_50%)]" />
        <div className="relative mx-auto max-w-4xl px-6 py-10">
          <Link to="/" className="mb-5 inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium text-white/85 backdrop-blur-md transition-colors hover:bg-white/20 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">老人端</h1>
              <p className="mt-1.5 text-sm text-white/80">在线选菜或拍照下单，轻松订餐</p>
            </div>
            {pendingCount > 0 && (
              <div className="hidden items-center gap-2 rounded-lg bg-white/10 px-3.5 py-2 backdrop-blur sm:flex">
                <Clock className="h-4 w-4 text-white/80" />
                <span className="text-sm font-medium text-white">{pendingCount} 个订单处理中</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        {/* Quick actions */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3 stagger-children">
          {quickActions.map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className="group relative flex flex-col rounded-xl border border-slate-100 bg-white px-6 py-6 text-left  transition-all hover:border-slate-200"
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${action.color} shadow-sm`}>
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-1.5 text-lg font-bold text-foreground group-hover:text-teal-600 transition-colors">{action.label}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{action.desc}</p>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold opacity-0 transition-all group-hover:opacity-100 group-hover:gap-2 text-teal-600">
                立即使用 <ArrowRight className="h-3 w-3" />
              </div>
              {action.badge !== undefined && action.badge > 0 && (
                <span className="absolute right-4 top-4 rounded-full bg-teal-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                  {action.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 费用限额提示（如果有设置限额） */}
        {(() => {
          const limit = currentUser?.phone ? storage.getSpendingLimit(currentUser.phone) : null
          if (!limit || (limit.dailyLimit <= 0 && limit.weeklyLimit <= 0 && limit.monthlyLimit <= 0)) return null
          const dailySpent = storage.getSpentInPeriod(currentUser!.phone, 'daily')
          const weeklySpent = storage.getSpentInPeriod(currentUser!.phone, 'weekly')
          const monthlySpent = storage.getSpentInPeriod(currentUser!.phone, 'monthly')
          const items: { label: string; spent: number; limitVal: number }[] = [
            ...(limit.dailyLimit > 0 ? [{ label: '今日', spent: dailySpent, limitVal: limit.dailyLimit }] : []),
            ...(limit.weeklyLimit > 0 ? [{ label: '本周', spent: weeklySpent, limitVal: limit.weeklyLimit }] : []),
            ...(limit.monthlyLimit > 0 ? [{ label: '本月', spent: monthlySpent, limitVal: limit.monthlyLimit }] : []),
          ]
          return (
            <div className="mb-10 rounded-xl border border-slate-100 bg-white px-6 py-5 ">
              <div className="mb-3 flex items-center gap-2">
                <DollarSign className="h-4.5 w-4.5 text-teal-600" />
                <h3 className="text-sm font-bold text-foreground">消费额度</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {items.map(item => {
                  const remaining = Math.max(0, item.limitVal - item.spent)
                  const pct = Math.min(100, Math.round((item.spent / item.limitVal) * 100))
                  const isLow = remaining < item.limitVal * 0.2
                  return (
                    <div key={item.label} className="rounded-lg border border-slate-200 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">{item.label}限额</span>
                        <span className={`text-sm font-bold tabular-nums ${isLow ? 'text-amber-600' : 'text-foreground'}`}>
                          剩余 ¥{remaining}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{
                            width: `${pct}%`,
                            background: isLow ? '#f59e0b' : '#0d9488',
                          }} />
                        </div>
                        <span className="text-[10px] tabular-nums text-slate-500">¥{item.spent.toFixed(0)} / ¥{item.limitVal}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* Guide */}
        <div className="rounded-xl border border-slate-100 bg-white px-8 py-7 ">
          <h3 className="mb-5 text-lg font-bold text-foreground">使用指南</h3>
          <div className="relative">
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 hidden sm:block bg-slate-200" />
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-4">
              {[
                { step: '1', text: '浏览周菜单选菜，或拍照上传手写订单，系统自动识别' },
                { step: '2', text: '填写联系信息后提交，订单直接发送到分销商' },
                { step: '3', text: '分销商确认后安排配送' },
                { step: '4', text: '在"我的订单"中实时追踪配送状态' },
              ].map(item => (
                <div key={item.step} className="relative flex items-start gap-4">
                  <span className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm bg-teal-600">
                    {item.step}
                  </span>
                  <p className="pt-1.5 text-sm leading-relaxed text-slate-500">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
