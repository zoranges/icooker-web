import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, Camera, Clock, List } from 'lucide-react'
import { storage } from '../../store'
import { useCurrentUser } from '../../components/LoginGate'

export function CustomerHome() {
  const navigate = useNavigate()
  const { currentUser } = useCurrentUser()
  const allOrders = storage.getOrders().filter(o => o.customerPhone === currentUser?.phone)
  const myOrders = allOrders.filter(o => o.status !== 'delivered')
  const pendingCount = allOrders.filter(o => o.status === 'pending').length

  const quickActions = [
    { label: '浏览周菜单', desc: '在线选菜，直接下单', icon: BookOpen, color: 'bg-emerald-500', path: '/customer/menu' },
    { label: '拍照上传', desc: 'OCR 智能识别手写菜单', icon: Camera, color: 'bg-orange-500', path: '/customer/upload' },
    { label: '我的订单', desc: '实时追踪订单状态', icon: List, color: 'bg-blue-500', path: '/customer/orders', badge: myOrders.length },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'hsl(30 20% 98%)' }}>
      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_50%)]" />
        <div className="relative mx-auto max-w-4xl px-6 py-10">
          <Link to="/" className="mb-5 inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium text-white/85 backdrop-blur transition-colors hover:bg-white/20 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-white">老人端</h1>
              <p className="mt-1.5 text-sm text-white/80">在线选菜或拍照下单，轻松订餐</p>
            </div>
            {pendingCount > 0 && (
              <div className="hidden items-center gap-2 rounded-md bg-white/10 px-3.5 py-2 backdrop-blur sm:flex">
                <Clock className="h-4 w-4 text-white/80" />
                <span className="text-sm font-medium text-white">{pendingCount} 个订单审核中</span>
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
              className="group relative flex flex-col rounded-xl bg-white px-6 py-6 text-left transition-all hover:ring-1 hover:ring-primary/20 hover:shadow-sm"
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${action.color} shadow-sm`}>
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-1.5 font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">{action.label}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'hsl(20 6% 48%)' }}>{action.desc}</p>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold opacity-0 transition-all group-hover:opacity-100 group-hover:gap-2" style={{ color: 'hsl(15 55% 40%)' }}>
                立即使用 <ArrowRight className="h-3 w-3" />
              </div>
              {action.badge !== undefined && action.badge > 0 && (
                <span className="absolute right-4 top-4 rounded-full px-2.5 py-0.5 text-xs font-bold text-white shadow-sm" style={{ background: 'hsl(15 55% 40%)' }}>
                  {action.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Guide */}
        <div className="rounded-xl bg-white px-8 py-7">
          <h3 className="mb-5 font-display text-lg font-bold text-foreground">使用指南</h3>
          <div className="relative">
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 hidden sm:block" style={{ background: 'hsl(30 8% 88%)' }} />
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-4">
              {[
                { step: '1', text: '浏览周菜单选菜，或拍照上传手写订单，系统自动识别' },
                { step: '2', text: '填写联系信息后提交，服务机构将审核您的订单' },
                { step: '3', text: '审核通过后，分销商汇总并向中央厨房下单生产' },
                { step: '4', text: '生产完成后安排配送，您可在"我的订单"中实时追踪' },
              ].map(item => (
                <div key={item.step} className="relative flex items-start gap-4">
                  <span className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm" style={{ background: 'hsl(15 55% 40%)' }}>
                    {item.step}
                  </span>
                  <p className="pt-1.5 text-sm leading-relaxed" style={{ color: 'hsl(20 8% 40%)' }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
