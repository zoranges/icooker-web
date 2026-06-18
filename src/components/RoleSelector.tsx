import { useNavigate } from 'react-router-dom'
import { Users, Building2, Truck, Factory, ChefHat, ArrowRight, ShieldCheck, Clock, BarChart3 } from 'lucide-react'

const roles = [
  {
    id: 'customer',
    name: '老人端',
    desc: '拍照上传订单、查看配送状态',
    icon: Users,
    gradient: 'from-blue-500 to-cyan-500',
    bgAccent: 'bg-blue-50',
    textAccent: 'text-blue-600',
    borderAccent: 'border-blue-200',
    path: '/customer',
    features: ['拍照识别菜单', '在线下单', '订单追踪']
  },
  {
    id: 'service',
    name: '服务机构',
    desc: '审核老人订单费用',
    icon: Building2,
    gradient: 'from-violet-500 to-purple-500',
    bgAccent: 'bg-violet-50',
    textAccent: 'text-violet-600',
    borderAccent: 'border-violet-200',
    path: '/service',
    features: ['订单审核', '费用管理', '客户管理']
  },
  {
    id: 'distributor',
    name: '分销端',
    desc: '汇总订单、向工厂下单、配送管理',
    icon: Truck,
    gradient: 'from-amber-500 to-orange-500',
    bgAccent: 'bg-amber-50',
    textAccent: 'text-amber-600',
    borderAccent: 'border-amber-200',
    path: '/distributor',
    features: ['订单汇总', '工厂下单', '配送调度']
  },
  {
    id: 'factory',
    name: '工厂端',
    desc: '菜品管理、订单生产',
    icon: Factory,
    gradient: 'from-emerald-500 to-green-500',
    bgAccent: 'bg-emerald-50',
    textAccent: 'text-emerald-600',
    borderAccent: 'border-emerald-200',
    path: '/factory',
    features: ['菜品管理', '生产排单', '订单处理']
  }
]

const flowSteps = [
  { label: '老人上传订单', icon: Users, color: 'from-blue-500 to-cyan-500' },
  { label: '机构审核', icon: ShieldCheck, color: 'from-violet-500 to-purple-500' },
  { label: '分销汇总', icon: BarChart3, color: 'from-amber-500 to-orange-500' },
  { label: '工厂生产', icon: Factory, color: 'from-emerald-500 to-green-500' },
  { label: '配送完成', icon: Truck, color: 'from-blue-500 to-indigo-500' }
]

export default function RoleSelector() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-slate-50">
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-orange-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-200/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-12 lg:py-16">
        {/* Hero Section */}
        <div className="mb-16 text-center animate-fade-in-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-sm font-medium text-orange-700 shadow-sm backdrop-blur">
            <ChefHat className="h-4 w-4" />
            <span>iCooker 智慧养老餐饮平台</span>
          </div>
          <h1 className="mb-4 text-5xl font-bold tracking-tight text-slate-900 lg:text-6xl">
            <span className="gradient-text">老人餐饮服务</span>系统
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-500">
            连接老人、服务机构、分销商与工厂的一站式协同平台，让养老订餐更高效、更透明
          </p>
        </div>

        {/* Role Cards */}
        <div className="mb-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => navigate(role.path)}
              className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white/70 p-7 text-left shadow-lg shadow-slate-200/50 backdrop-blur transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-slate-300/50"
            >
              {/* Hover gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-[0.03]`} />
              
              {/* Icon */}
              <div className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${role.gradient} shadow-lg shadow-${role.gradient.split(' ')[0].replace('from-', '')}/25 transition-transform duration-300 group-hover:scale-110`}>
                <role.icon className="h-7 w-7 text-white" />
              </div>

              {/* Content */}
              <h3 className="mb-2 text-xl font-bold text-slate-900">{role.name}</h3>
              <p className="mb-4 text-sm leading-relaxed text-slate-500">{role.desc}</p>

              {/* Feature tags */}
              <div className="mb-5 flex flex-wrap gap-1.5">
                {role.features.map(f => (
                  <span key={f} className={`rounded-md ${role.bgAccent} px-2 py-0.5 text-xs font-medium ${role.textAccent}`}>
                    {f}
                  </span>
                ))}
              </div>

              {/* Enter link */}
              <div className={`flex items-center gap-1.5 text-sm font-semibold ${role.textAccent} transition-all duration-300 group-hover:gap-3`}>
                进入
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </button>
          ))}
        </div>

        {/* Flow Section */}
        <div className="animate-fade-in">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-2xl font-bold text-slate-900">完整数据流程</h2>
            <p className="text-sm text-slate-500">从下单到配送，全链路数字化管理</p>
          </div>
          
          <div className="rounded-2xl border border-white/60 bg-white/70 p-8 shadow-lg shadow-slate-200/50 backdrop-blur">
            <div className="flex flex-wrap items-center justify-center gap-3 lg:gap-0">
              {flowSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-3 lg:gap-0">
                  <div className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-slate-50">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${step.color} shadow-md`}>
                      <step.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-400">步骤 {idx + 1}</div>
                      <div className="text-sm font-semibold text-slate-800">{step.label}</div>
                    </div>
                  </div>
                  {idx < flowSteps.length - 1 && (
                    <div className="mx-2 hidden text-slate-300 lg:block">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer stats */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div>
            <div className="text-2xl font-bold text-slate-900">4</div>
            <div className="text-xs text-slate-500">核心角色</div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <div className="text-2xl font-bold text-slate-900">64+</div>
            <div className="text-xs text-slate-500">API 端点</div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <div className="text-2xl font-bold text-slate-900">18</div>
            <div className="text-xs text-slate-500">状态流转</div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium text-slate-600">MVP v1.0</span>
          </div>
        </div>
      </div>
    </div>
  )
}
