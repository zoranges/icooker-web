import { useState, createContext, useContext } from 'react'
import { Link, ArrowLeft, Users, Phone, MapPin, ChevronRight, Building2, Truck } from 'lucide-react'
import { CurrentUser, CustomerAccount, ServiceAccount, DistributorAccount, FactoryAccount } from '../store'
import { loginAs, logout as doLogout, getCurrentUser, getAccountsByRole } from '../utils/accounts'

type Account = CustomerAccount | ServiceAccount | DistributorAccount | FactoryAccount

interface AuthContextValue {
  currentUser: CurrentUser | null
  login: (role: CurrentUser['role'], account: Account) => void
  logout: () => void
}
const AuthContext = createContext<AuthContextValue>({ currentUser: null, login: () => {}, logout: () => {} })
export function useCurrentUser() { return useContext(AuthContext) }

interface LoginGateProps {
  role: CurrentUser['role']
  children: React.ReactNode
  title: string
  description?: string
  gradient?: string
  icon: React.ElementType
}

export default function LoginGate({ role, children, title, description, gradient, icon: Icon }: LoginGateProps) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => getCurrentUser())

  const handleLogin = (account: Account) => {
    loginAs(role, account)
    setCurrentUser(getCurrentUser())
  }

  const handleLogout = () => {
    doLogout()
    setCurrentUser(null)
  }

  if (!currentUser || currentUser.role !== role) {
    return <AccountSelectionScreen role={role} title={title} description={description} gradient={gradient} icon={Icon} onLogin={handleLogin} />
  }

  return (
    <AuthContext.Provider value={{ currentUser, login: (r, a) => { loginAs(r, a); setCurrentUser(getCurrentUser()) }, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  )
}

function AccountSelectionScreen({ role, title, description, gradient, icon: Icon, onLogin }: {
  role: string
  title: string
  description?: string
  gradient?: string
  icon: React.ElementType
  onLogin: (account: Account) => void
}) {
  const accounts = getAccountsByRole<Account>(role)

  const getServiceName = (acc: Account) => {
    if ('serviceId' in acc && (acc as any).serviceId) {
      const services = getAccountsByRole<{id:string;name:string}>('service')
      return services.find(s => s.id === (acc as any).serviceId)?.name || null
    }
    return null
  }
  const getDistributorName = (acc: Account) => {
    if ('distributorId' in acc && (acc as any).distributorId) {
      const distributors = getAccountsByRole<{id:string;name:string}>('distributor')
      return distributors.find(d => d.id === (acc as any).distributorId)?.name || null
    }
    return null
  }

  const resolvedGradient = gradient || 'from-teal-500 via-cyan-500 to-teal-600'

  return (
    <div className="min-h-screen" style={{ background: 'hsl(210 20% 98%)' }}>
      {/* Header */}
      <header className={`relative overflow-hidden bg-gradient-to-br ${resolvedGradient}`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(255,255,255,0.06),transparent_60%)]" />
        <div className="relative mx-auto max-w-2xl px-6 py-12">
          <Link to="/" className="mb-6 inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3.5 py-2 text-sm font-medium text-white/90 backdrop-blur-md transition-all hover:bg-white/25 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
              {description && <p className="mt-1 text-sm text-white/80">{description}</p>}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold" style={{ color: 'hsl(210 20% 16%)' }}>选择身份</h2>
          <p className="mt-1 text-sm" style={{ color: 'hsl(210 10% 50%)' }}>请选择您的账号以进入系统</p>
        </div>

        {accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-white py-16 ">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'hsl(210 16% 94%)' }}>
              <Users className="h-6 w-6" style={{ color: 'hsl(210 10% 68%)' }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: 'hsl(210 12% 45%)' }}>暂无可用账号</p>
            <p className="mt-1.5 text-xs" style={{ color: 'hsl(210 10% 58%)' }}>请联系管理员添加账号</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {accounts.map((acc) => {
              const serviceName = getServiceName(acc)
              const distributorName = getDistributorName(acc)
              return (
                <button
                  key={acc.id}
                  onClick={() => onLogin(acc)}
                  className="flex w-full items-center gap-4 rounded-xl border border-slate-100 bg-white px-5 py-4 text-left  transition-all hover:border-slate-200 hover:bg-slate-50/60"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: 'hsl(168 40% 94%)' }}>
                    <Users className="h-4.5 w-4.5" style={{ color: 'hsl(168 50% 32%)' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold" style={{ color: 'hsl(210 20% 16%)' }}>{acc.name}</h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: 'hsl(210 10% 52%)' }}>
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {acc.phone}
                      </span>
                      {(acc as any).address && (
                        <span className="inline-flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3" />
                          {(acc as any).address}
                        </span>
                      )}
                      {serviceName && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: 'hsl(200 55% 94%)', color: 'hsl(200 55% 36%)' }}>
                          <Building2 className="h-3 w-3" />
                          {serviceName}
                        </span>
                      )}
                      {distributorName && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: 'hsl(168 40% 93%)', color: 'hsl(168 50% 30%)' }}>
                          <Truck className="h-3 w-3" />
                          {distributorName}
                        </span>
                      )}
                      {(acc as any).region && role !== 'customer' && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: 'hsl(220 40% 94%)', color: 'hsl(220 40% 40%)' }}>
                          <MapPin className="h-3 w-3" />
                          {(acc as any).region}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: 'hsl(210 12% 72%)' }} />
                </button>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
