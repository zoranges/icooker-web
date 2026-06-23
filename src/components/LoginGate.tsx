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
  gradient: string
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
  gradient: string
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

  return (
    <div className="min-h-screen" style={{ background: 'hsl(30 20% 98%)' }}>
      {/* Header */}
      <header className={`relative overflow-hidden bg-gradient-to-br ${gradient}`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="relative mx-auto max-w-2xl px-6 py-12">
          <Link to="/" className="mb-5 inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium text-white/85 backdrop-blur transition-colors hover:bg-white/20 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-13 w-13 items-center justify-center rounded-lg bg-white/12">
              <Icon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl tracking-tight text-white">{title}</h1>
              {description && <p className="mt-1 text-sm text-white/80">{description}</p>}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        <div className="mb-6">
          <h2 className="font-display text-xl text-foreground">选择身份</h2>
          <p className="mt-1 text-sm" style={{ color: 'hsl(20 6% 50%)' }}>请选择您的账号以进入系统</p>
        </div>

        {accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg bg-white py-16">
            <Users className="mb-3 h-8 w-8" style={{ color: 'hsl(30 8% 80%)' }} />
            <p className="text-sm font-medium" style={{ color: 'hsl(20 6% 50%)' }}>暂无可用账号</p>
            <p className="mt-1 text-xs" style={{ color: 'hsl(20 6% 58%)' }}>请联系管理员添加账号</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg">
            {accounts.map((acc, idx) => {
              const serviceName = getServiceName(acc)
              const distributorName = getDistributorName(acc)
              return (
                <button
                  key={acc.id}
                  onClick={() => onLogin(acc)}
                  className="row-item flex w-full items-center gap-4 px-5 py-4 text-left"
                  style={idx === 0 ? { borderTop: 'none' } : {}}
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md" style={{ background: 'hsl(30 10% 94%)' }}>
                    <Users className="h-4.5 w-4.5" style={{ color: 'hsl(20 8% 42%)' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-base text-foreground">{acc.name}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs" style={{ color: 'hsl(20 6% 52%)' }}>
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
                        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium" style={{ background: 'hsl(270 40% 95%)', color: 'hsl(270 40% 42%)' }}>
                          <Building2 className="h-3 w-3" />
                          {serviceName}
                        </span>
                      )}
                      {distributorName && (
                        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium" style={{ background: 'hsl(35 40% 94%)', color: 'hsl(35 40% 40%)' }}>
                          <Truck className="h-3 w-3" />
                          {distributorName}
                        </span>
                      )}
                      {(acc as any).region && role !== 'customer' && (
                        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium" style={{ background: 'hsl(35 40% 94%)', color: 'hsl(35 40% 40%)' }}>
                          <MapPin className="h-3 w-3" />
                          {(acc as any).region}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: 'hsl(30 8% 75%)' }} />
                </button>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
