import { BrowserRouter, Routes, Route } from 'react-router-dom'
import RoleSelector from './components/RoleSelector'
import CustomerPortal from './portals/CustomerPortal'
import DistributorPortal from './portals/DistributorPortal'
import FactoryPortal from './portals/FactoryPortal'
import ServicePortal from './portals/ServicePortal'
import AdminPortal from './portals/AdminPortal'
import { ToastContainer, ConfirmDialog } from './components/Toast'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleSelector />} />
        <Route path="/customer/*" element={<CustomerPortal />} />
        <Route path="/service/*" element={<ServicePortal />} />
        <Route path="/distributor/*" element={<DistributorPortal />} />
        <Route path="/factory/*" element={<FactoryPortal />} />
        <Route path="/admin/*" element={<AdminPortal />} />
      </Routes>
      <ToastContainer />
      <ConfirmDialog />
    </BrowserRouter>
  )
}

export default App
