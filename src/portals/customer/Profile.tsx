import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, User } from 'lucide-react'
import { storage } from '../../store'
import { useCurrentUser } from '../../components/LoginGate'

export function Profile() {
  const { currentUser, logout } = useCurrentUser()
  const navigate = useNavigate()
  const myOrders = storage.getOrders().filter(o => o.customerPhone === currentUser?.phone)
  const handleLogout = () => {
    logout()
    navigate('/customer')
  }

  return (
    <div className="min-h-screen px-6 py-8" style={{ background: 'hsl(210 20% 98%)' }}>
      <div className="mx-auto max-w-lg">
        <Link to="/customer" className="mb-6 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
          <ArrowLeft className="h-4 w-4" />
          返回
        </Link>
        <div className="flex flex-col items-center rounded-xl border border-slate-100 bg-white px-8 py-10 ">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-teal-600">
            <User className="h-8 w-8 text-white" />
          </div>
          <h2 className="mb-0.5 text-xl font-bold text-foreground">{currentUser?.name || '未知用户'}</h2>
          <p className="text-sm text-slate-500">{currentUser?.phone}</p>
          {currentUser && (() => {
            const accounts = storage.getAccounts<{name:string;phone:string;address:string}>('customer')
            const acc = accounts.find(a => a.phone === currentUser.phone)
            return acc?.address ? <p className="mt-0.5 text-xs text-slate-400">{acc.address}</p> : null
          })()}
          <div className="mt-5 flex gap-3 text-center">
            <div className="rounded-xl bg-slate-50 px-4 py-2.5">
              <div className="text-lg font-bold text-foreground">{myOrders.length}</div>
              <div className="text-xs text-slate-500">历史订单</div>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-2.5">
              <div className="text-lg font-bold text-foreground">{myOrders.filter(o => o.status === 'delivered').length}</div>
              <div className="text-xs text-slate-500">已完成</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-5 flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
          >
            <ArrowLeft className="h-4 w-4 rotate-180" />
            切换身份
          </button>
        </div>
      </div>
    </div>
  )
}
