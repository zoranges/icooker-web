import { useNavigate } from 'react-router-dom'
import { Users, Truck, Factory, Settings, ArrowUpRight } from 'lucide-react'

const R = {
  customer:  { name: '老人端',   desc: '在线选菜或拍照上传，轻松订餐',     icon: Users,        accent: '#3b82f6', path: '/customer' },
  distributor:{ name: '分销端',  desc: '汇总订单、向工厂下单、配送调度',     icon: Truck,        accent: '#f59e0b', path: '/distributor' },
  factory:   { name: '工厂端',   desc: '菜品管理、生产排单、订单处理',       icon: Factory,      accent: '#10b981', path: '/factory' },
  admin:     { name: '管理端',   desc: '账号管理、全局订单监控、数据统计',   icon: Settings,     accent: '#f43f5e', path: '/admin' },
}

const flowSteps = [
  { label: '老人下单', icon: Users, accent: '#3b82f6' },
  { label: '分销汇总', icon: Truck, accent: '#f59e0b' },
  { label: '工厂生产', icon: Factory, accent: '#10b981' },
  { label: '配送到家', icon: Truck, accent: '#06b6d4' },
]

export default function RoleSelector() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen" style={{ background: 'hsl(210 20% 98%)' }}>

      {/* ══════════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════════ */}
      <div className="relative overflow-hidden bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-500">
        {/* decorative blurred circles */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-10 h-60 w-60 rounded-full bg-white/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:py-24">
          {/* status badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            iCooker 智慧养老餐饮平台
          </div>

          {/* title */}
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            老人餐饮服务系统
          </h1>

          {/* subtitle */}
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/80 sm:text-xl">
            连接老人、分销商与工厂的一站式智能协同平台
          </p>

          {/* ── Quick-nav chips ── */}
          <div className="mt-8 flex flex-wrap gap-3">
            {Object.entries(R).map(([id, r]) => (
              <button
                key={id}
                onClick={() => navigate(r.path)}
                className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition-all hover:bg-white/20 hover:border-white/50"
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════ */}
      <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16">

        {/* ── Section heading ── */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">平台角色</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            选择您的角色
          </h2>
        </div>

        {/* ── Role cards grid ── */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(R).map(([id, r]) => (
            <button
              key={id}
              onClick={() => navigate(r.path)}
              className="group relative flex flex-col rounded-xl border border-slate-100 bg-white p-6 text-left  transition-all hover:border-slate-200"
            >
              {/* icon container */}
              <div
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: `${r.accent}15` }}
              >
                <r.icon className="h-6 w-6" style={{ color: r.accent }} />
              </div>

              {/* text */}
              <h3 className="text-base font-bold text-slate-900">{r.name}</h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-500">{r.desc}</p>

              {/* enter link — visible on hover */}
              <div className="mt-5 flex items-center gap-1 text-sm font-semibold opacity-0 transition-all duration-200 group-hover:opacity-100" style={{ color: r.accent }}>
                进入 <ArrowUpRight className="h-4 w-4" />
              </div>
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════
            FLOW STEPS TIMELINE
        ══════════════════════════════════════════ */}
        <div className="mt-16">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">业务流程</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              从下单到配送
            </h2>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-8  sm:p-10">
            <div className="relative flex items-start justify-between">
              {/* connecting line (desktop) */}
              <div className="absolute left-[calc(12.5%+20px)] right-[calc(12.5%+20px)] top-5 hidden h-px bg-slate-200 sm:block" />

              {/* connecting line (mobile — vertical) */}
              <div className="absolute left-5 top-10 bottom-5 block w-px bg-slate-200 sm:hidden" />

              {flowSteps.map((step, idx) => (
                <div key={idx} className="group/step relative flex flex-1 flex-col items-center text-center sm:flex-col">
                  {/* circle */}
                  <div
                    className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover/step:scale-110"
                    style={{ background: `${step.accent}20` }}
                  >
                    <step.icon className="h-4 w-4" style={{ color: step.accent }} />
                  </div>

                  {/* step number + label */}
                  <div className="mt-4">
                    <span className="block text-xs font-semibold tracking-wider text-slate-400">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="mt-1 block text-sm font-semibold text-slate-800">{step.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="mt-16 text-center">
          <div className="mx-auto mb-4 h-px w-16 bg-slate-200" />
          <p className="text-xs text-slate-400">
            iCooker v2.0 · 智慧养老餐饮服务平台
          </p>
        </div>
      </div>
    </div>
  )
}
