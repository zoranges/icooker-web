import { useNavigate } from 'react-router-dom'
import { Users, Truck, Factory, ShieldCheck, Settings, ArrowUpRight, ChevronRight } from 'lucide-react'

const R = {
  customer:  { name: '老人端',   desc: '在线选菜或拍照上传，轻松订餐',     icon: Users,        accent: '#3b82f6', path: '/customer' },
  service:   { name: '服务机构', desc: '审核订单、管理资金、客户管理',       icon: ShieldCheck,  accent: '#8b5cf6', path: '/service' },
  distributor:{ name: '分销端',  desc: '汇总订单、向工厂下单、配送调度',     icon: Truck,        accent: '#f59e0b', path: '/distributor' },
  factory:   { name: '工厂端',   desc: '菜品管理、生产排单、订单处理',       icon: Factory,      accent: '#10b981', path: '/factory' },
  admin:     { name: '管理端',   desc: '账号管理、全局订单监控、数据统计',   icon: Settings,     accent: '#f43f5e', path: '/admin' },
}

const flowSteps = [
  { label: '老人下单', icon: Users, accent: '#3b82f6' },
  { label: '机构审核', icon: ShieldCheck, accent: '#8b5cf6' },
  { label: '分销汇总', icon: Truck, accent: '#f59e0b' },
  { label: '工厂生产', icon: Factory, accent: '#10b981' },
  { label: '配送到家', icon: Truck, accent: '#06b6d4' },
]

export default function RoleSelector() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen" style={{ background: 'hsl(240 5% 96%)' }}>
      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: 'radial-gradient(circle, hsl(240 5% 55%) 0.6px, transparent 0.6px)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 py-10 sm:py-14 lg:py-20">
        {/* ── BENTO GRID ── */}
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-4">

          {/* ═══ HERO — span 2 cols, 2 rows ═══ */}
          <div className="group relative overflow-hidden rounded-3xl bg-white shadow-sm lg:col-span-2 lg:row-span-2">
            <div className="flex h-full flex-col justify-between p-8 sm:p-10 lg:p-14">
              <div>
                <div
                  className="mb-8 inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-sm font-medium"
                  style={{ background: 'hsl(240 5% 91%)', color: 'hsl(240 5% 36%)' }}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  iCooker 智慧养老餐饮平台
                </div>

                <h1 className="font-display text-6xl font-normal leading-[1.06] tracking-tight text-foreground sm:text-7xl lg:text-8xl">
                  老人餐饮<br />
                  <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">
                    服务系统
                  </span>
                </h1>

                <p className="mt-6 max-w-lg text-lg leading-relaxed sm:text-xl" style={{ color: 'hsl(240 4% 40%)' }}>
                  连接老人、服务机构、分销商与工厂的一站式协同平台
                </p>
              </div>

              <div className="mt-10 flex flex-wrap gap-2">
                {Object.entries(R).map(([id, r]) => (
                  <button
                    key={id}
                    onClick={() => navigate(r.path)}
                    className="rounded-lg px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-100"
                    style={{ color: 'hsl(240 4% 46%)' }}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ═══ SERVICE ═══ */}
          <div className="group relative overflow-hidden rounded-3xl bg-white shadow-sm transition-shadow hover:shadow-md lg:col-span-1">
            <button onClick={() => navigate(R.service.path)} className="flex h-full w-full flex-col p-6 text-left sm:p-7">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl" style={{ background: `${R.service.accent}18` }}>
                <R.service.icon className="h-7 w-7" style={{ color: R.service.accent }} />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">{R.service.name}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'hsl(240 4% 46%)' }}>{R.service.desc}</p>
              <div className="mt-4 flex items-center gap-1.5 text-sm font-medium opacity-0 transition-all group-hover:opacity-100" style={{ color: R.service.accent }}>
                进入 <ArrowUpRight className="h-4 w-4" />
              </div>
            </button>
          </div>

          {/* ═══ DISTRIBUTOR ═══ */}
          <div className="group relative overflow-hidden rounded-3xl bg-white shadow-sm transition-shadow hover:shadow-md lg:col-span-1">
            <button onClick={() => navigate(R.distributor.path)} className="flex h-full w-full flex-col p-6 text-left sm:p-7">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl" style={{ background: `${R.distributor.accent}18` }}>
                <R.distributor.icon className="h-7 w-7" style={{ color: R.distributor.accent }} />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">{R.distributor.name}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'hsl(240 4% 46%)' }}>{R.distributor.desc}</p>
              <div className="mt-4 flex items-center gap-1.5 text-sm font-medium opacity-0 transition-all group-hover:opacity-100" style={{ color: R.distributor.accent }}>
                进入 <ArrowUpRight className="h-4 w-4" />
              </div>
            </button>
          </div>

          {/* ═══ FLOW TIMELINE — span 2 ═══ */}
          <div className="group relative overflow-hidden rounded-3xl bg-white shadow-sm lg:col-span-2">
            <div className="p-7 sm:p-8">
              <p className="mb-6 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'hsl(240 4% 50%)' }}>业务流程</p>
              <div className="relative flex flex-col gap-0 sm:flex-row">
                <div
                  className="absolute left-[21px] top-0 h-full w-px sm:left-6 sm:right-6 sm:top-[21px] sm:h-px sm:w-auto"
                  style={{ background: 'hsl(240 5% 86%)' }}
                />
                {flowSteps.map((step, idx) => (
                  <div key={idx} className="group/item relative flex items-center gap-5 py-2.5 sm:flex-1 sm:flex-col sm:gap-4 sm:py-0 sm:text-center">
                    <div
                      className="relative z-10 flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover/item:scale-110"
                      style={{ background: `${step.accent}20` }}
                    >
                      <step.icon className="h-5 w-5" style={{ color: step.accent }} />
                    </div>
                    <div>
                      <div className="font-mono text-xs font-semibold tracking-[0.1em]" style={{ color: 'hsl(240 4% 54%)' }}>
                        {String(idx + 1).padStart(2, '0')}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-foreground">{step.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ═══ CUSTOMER — span 2 (wide) ═══ */}
          <div className="group relative overflow-hidden rounded-3xl bg-white shadow-sm transition-shadow hover:shadow-md lg:col-span-2">
            <button onClick={() => navigate(R.customer.path)} className="flex w-full items-center gap-6 p-7 text-left sm:p-8">
              <div
                className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105"
                style={{ background: `linear-gradient(135deg, ${R.customer.accent}28, ${R.customer.accent}12)` }}
              >
                <R.customer.icon className="h-8 w-8" style={{ color: R.customer.accent }} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-xl font-semibold text-foreground">{R.customer.name}</h3>
                <p className="mt-1.5 text-base leading-relaxed" style={{ color: 'hsl(240 4% 46%)' }}>{R.customer.desc}</p>
              </div>
              <ChevronRight className="h-6 w-6 flex-shrink-0 transition-transform duration-300 group-hover:translate-x-1" style={{ color: 'hsl(240 4% 36%)' }} />
            </button>
          </div>

          {/* ═══ FACTORY ═══ */}
          <div className="group relative overflow-hidden rounded-3xl bg-white shadow-sm transition-shadow hover:shadow-md lg:col-span-1">
            <button onClick={() => navigate(R.factory.path)} className="flex h-full w-full flex-col p-6 text-left sm:p-7">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl" style={{ background: `${R.factory.accent}18` }}>
                <R.factory.icon className="h-7 w-7" style={{ color: R.factory.accent }} />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">{R.factory.name}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'hsl(240 4% 46%)' }}>{R.factory.desc}</p>
              <div className="mt-4 flex items-center gap-1.5 text-sm font-medium opacity-0 transition-all group-hover:opacity-100" style={{ color: R.factory.accent }}>
                进入 <ArrowUpRight className="h-4 w-4" />
              </div>
            </button>
          </div>

          {/* ═══ ADMIN ═══ */}
          <div className="group relative overflow-hidden rounded-3xl bg-white shadow-sm transition-shadow hover:shadow-md lg:col-span-1">
            <button onClick={() => navigate(R.admin.path)} className="flex h-full w-full flex-col p-6 text-left sm:p-7">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl" style={{ background: `${R.admin.accent}18` }}>
                <R.admin.icon className="h-7 w-7" style={{ color: R.admin.accent }} />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">{R.admin.name}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'hsl(240 4% 46%)' }}>{R.admin.desc}</p>
              <div className="mt-4 flex items-center gap-1.5 text-sm font-medium opacity-0 transition-all group-hover:opacity-100" style={{ color: R.admin.accent }}>
                进入 <ArrowUpRight className="h-4 w-4" />
              </div>
            </button>
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="mt-14 text-center">
          <div className="mx-auto mb-4 h-px w-16" style={{ background: 'hsl(240 5% 86%)' }} />
          <p className="text-xs" style={{ color: 'hsl(240 4% 54%)' }}>
            iCooker v2.0 · 智慧养老餐饮服务平台
          </p>
        </div>
      </div>
    </div>
  )
}
