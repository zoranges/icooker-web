import { Routes, Route } from 'react-router-dom'
import { User } from 'lucide-react'
import LoginGate from '../components/LoginGate'
import { CustomerHome } from './customer/CustomerHome'
import { MenuBrowser } from './customer/MenuBrowser'
import { OrderUpload } from './customer/OrderUpload'
import { OrderList } from './customer/OrderList'
import { Profile } from './customer/Profile'

export default function CustomerPortal() {
  return (
    <LoginGate role="customer" title="老人端 - 选择身份" description="请选择您的账号以进入系统" gradient="from-orange-500 via-amber-500 to-orange-600" icon={User}>
      <Routes>
        <Route path="/" element={<CustomerHome />} />
        <Route path="/menu" element={<MenuBrowser />} />
        <Route path="/upload" element={<OrderUpload />} />
        <Route path="/orders" element={<OrderList />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </LoginGate>
  )
}
