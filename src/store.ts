// 模拟数据存储 - MVP版本使用本地状态
export interface Order {
  id: string
  customerName: string
  customerPhone: string
  customerAddress: string
  items: OrderItem[]
  totalAmount: number
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'processing' | 'completed' | 'delivered'
  createdAt: string
  approvedAt?: string
  factoryOrderId?: string
  // 溯源信息
  serviceId?: string
  serviceName?: string
  distributorId?: string
  distributorName?: string
  factoryName?: string
}

export interface OrderItem {
  mealName: string
  quantity: number
  unitPrice: number
  days: string[]
}

export interface Meal {
  id: string
  name: string
  nameEn?: string
  price: number
  category: string
  subCategory?: string
  dietaryTags?: string[]
  image?: string
  weekNumber?: number
  dayOfWeek?: string
}

export interface FactoryOrder {
  id: string
  factoryId: string
  factoryName: string
  items: OrderItem[]
  totalAmount: number
  status: 'pending' | 'confirmed' | 'completed' | 'delivered'
  createdAt: string
  // 溯源信息
  distributorName?: string
  distributorId?: string
  serviceName?: string
  // 关联的老人订单ID列表
  customerOrderIds?: string[]
}

import { mockMeals, mockFactories } from './data/meals'

// 饮食标签说明
export const dietaryTagInfo: Record<string, string> = {
  'LSF': '低脂肪 (< 1.5g/100g)',
  'DBF': '适合糖尿病患者 (< 15g糖/100g)',
  'LS': '低钠 (< 150mg/100g)',
  'GF': '无麸质',
  'DF': '无乳制品'
}

export { mockMeals, mockFactories }

// ═══ 冬季菜单 (已迁移至 src/data/meals.ts) ═══

// ── 账号类型 ──
export interface CustomerAccount {
  id: string
  name: string
  phone: string
  address: string
  notes: string
  serviceId: string
  distributorId: string
  createdAt: string
}

export interface ServiceAccount {
  id: string
  name: string
  phone: string
  createdAt: string
}

export interface DistributorAccount {
  id: string
  name: string
  phone: string
  region: string
  createdAt: string
}

export interface FactoryAccount {
  id: string
  name: string
  phone: string
  address: string
  createdAt: string
}

export interface CurrentUser {
  role: 'customer' | 'service' | 'distributor' | 'factory'
  id: string
  name: string
  phone: string
}

// 按天和类别分组菜单的辅助函数
export const getMealsByDayAndCategory = (weekNumber: number = 4) => {
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const result: Record<string, Record<string, Meal[]>> = {}
  
  days.forEach(day => {
    const dayMeals = mockMeals.filter(m => m.weekNumber === weekNumber && m.dayOfWeek === day)
    const categorized: Record<string, Meal[]> = {}
    
    dayMeals.forEach(meal => {
      if (!categorized[meal.category]) {
        categorized[meal.category] = []
      }
      categorized[meal.category].push(meal)
    })
    
    result[day] = categorized
  })
  
  return result
}

// 根据客户电话解析关联的服务机构
export function resolveServiceForCustomer(phone: string): { serviceId: string; serviceName: string } {
  const custAccounts = storage.getAccounts<CustomerAccount>('customer')
  const cust = custAccounts.find(c => c.phone === phone)
  if (!cust?.serviceId) return { serviceId: '', serviceName: '' }
  const svcAccounts = storage.getAccounts<ServiceAccount>('service')
  const svc = svcAccounts.find(s => s.id === cust.serviceId)
  return svc ? { serviceId: svc.id, serviceName: svc.name } : { serviceId: '', serviceName: '' }
}

// 根据当前日期自动计算菜单周次 (4周轮换, 以2026年6月第1个周一为基准)
export function getCurrentMenuWeek(): number {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
  const weekZero = new Date(2026, 5, 1) // June 1, 2026 is a Monday
  const diffWeeks = Math.floor((monday.getTime() - weekZero.getTime()) / (7 * 24 * 60 * 60 * 1000))
  return ((diffWeeks % 4) + 4) % 4 + 1
}

// 本地存储键
const STORAGE_KEY = 'icooker_orders'
const CUSTOMER_INFO_KEY = 'icooker_customer_info'
const ACCOUNTS_CUSTOMERS_KEY = 'icooker_accounts_customers'
const ACCOUNTS_SERVICES_KEY = 'icooker_accounts_services'
const ACCOUNTS_DISTRIBUTORS_KEY = 'icooker_accounts_distributors'
const ACCOUNTS_FACTORIES_KEY = 'icooker_accounts_factories'
const CURRENT_USER_KEY = 'icooker_current_user'
const FACTORY_ORDERS_KEY = 'icooker_factory_orders'
const CUSTOM_MEALS_KEY = 'icooker_custom_meals'

function getAccountsKey(role: string): string {
  switch (role) {
    case 'customer': return ACCOUNTS_CUSTOMERS_KEY
    case 'service': return ACCOUNTS_SERVICES_KEY
    case 'distributor': return ACCOUNTS_DISTRIBUTORS_KEY
    case 'factory': return ACCOUNTS_FACTORIES_KEY
    default: throw new Error(`Unknown role: ${role}`)
  }
}

// 订单变化监听器
type OrderChangeListener = () => void
const orderChangeListeners: OrderChangeListener[] = []

// 工厂订单变化监听器
type FactoryOrderChangeListener = () => void
const factoryOrderChangeListeners: FactoryOrderChangeListener[] = []

// 通知所有监听器
function notifyOrderChange() {
  orderChangeListeners.forEach(listener => listener())
}

function notifyFactoryOrderChange() {
  factoryOrderChangeListeners.forEach(listener => listener())
}

// 客户信息接口
export interface CustomerInfo {
  customerName: string
  phone: string
  address: string
}

export const storage = {
  getOrders: (): Order[] => {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  },

  saveOrder: (order: Order) => {
    const orders = storage.getOrders()
    orders.push(order)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
    notifyOrderChange()
  },

  updateOrder: (id: string, updates: Partial<Order>) => {
    const orders = storage.getOrders()
    const index = orders.findIndex(o => o.id === id)
    if (index !== -1) {
      orders[index] = { ...orders[index], ...updates }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
      notifyOrderChange()
    }
  },

  subscribeToOrderChanges: (listener: OrderChangeListener) => {
    orderChangeListeners.push(listener)
    return () => {
      const index = orderChangeListeners.indexOf(listener)
      if (index > -1) orderChangeListeners.splice(index, 1)
    }
  },

  // ── 工厂订单管理 ──
  getFactoryOrders: (): FactoryOrder[] => {
    const data = localStorage.getItem(FACTORY_ORDERS_KEY)
    return data ? JSON.parse(data) : []
  },

  saveFactoryOrder: (order: FactoryOrder) => {
    const orders = storage.getFactoryOrders()
    orders.push(order)
    localStorage.setItem(FACTORY_ORDERS_KEY, JSON.stringify(orders))
    notifyFactoryOrderChange()
  },

  updateFactoryOrder: (id: string, updates: Partial<FactoryOrder>) => {
    const orders = storage.getFactoryOrders()
    const index = orders.findIndex(o => o.id === id)
    if (index !== -1) {
      orders[index] = { ...orders[index], ...updates }
      localStorage.setItem(FACTORY_ORDERS_KEY, JSON.stringify(orders))
      notifyFactoryOrderChange()
    }
  },

  subscribeToFactoryOrderChanges: (listener: FactoryOrderChangeListener) => {
    factoryOrderChangeListeners.push(listener)
    return () => {
      const index = factoryOrderChangeListeners.indexOf(listener)
      if (index > -1) factoryOrderChangeListeners.splice(index, 1)
    }
  },

  // ── 自定义菜品管理 ──
  getCustomMeals: (): Meal[] => {
    const data = localStorage.getItem(CUSTOM_MEALS_KEY)
    return data ? JSON.parse(data) : []
  },

  saveCustomMeal: (meal: Meal) => {
    const meals = storage.getCustomMeals()
    meals.push(meal)
    localStorage.setItem(CUSTOM_MEALS_KEY, JSON.stringify(meals))
  },

  updateCustomMeal: (id: string, updates: Partial<Meal>) => {
    const meals = storage.getCustomMeals()
    const idx = meals.findIndex(m => m.id === id)
    if (idx !== -1) {
      meals[idx] = { ...meals[idx], ...updates }
      localStorage.setItem(CUSTOM_MEALS_KEY, JSON.stringify(meals))
    }
  },

  deleteCustomMeal: (id: string) => {
    const meals = storage.getCustomMeals()
    localStorage.setItem(CUSTOM_MEALS_KEY, JSON.stringify(meals.filter(m => m.id !== id)))
  },

  // ── 根据客户ID获取关联订单 ──
  getOrdersByCustomerPhone: (phone: string): Order[] => {
    return storage.getOrders().filter(o => o.customerPhone === phone)
  },

  // ── 根据客户ID删除其所有订单 ──
  deleteOrdersByCustomerPhone: (phone: string) => {
    const orders = storage.getOrders().filter(o => o.customerPhone !== phone)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
    notifyOrderChange()
  },

  // ── 清理账户关联引用 ──
  cleanupAccountRefs: (role: string, id: string) => {
    if (role === 'service') {
      const orders = storage.getOrders()
      let changed = false
      orders.forEach(o => {
        if (o.serviceId === id) {
          o.serviceId = undefined
          o.serviceName = undefined
          changed = true
        }
      })
      if (changed) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
        notifyOrderChange()
      }
    } else if (role === 'distributor') {
      const orders = storage.getOrders()
      let changed = false
      orders.forEach(o => {
        if (o.distributorId === id) {
          o.distributorId = undefined
          o.distributorName = undefined
          changed = true
        }
      })
      if (changed) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
        notifyOrderChange()
      }
    } else if (role === 'factory') {
      const factoryOrders = storage.getFactoryOrders()
      let changed = false
      factoryOrders.forEach(o => {
        if (o.factoryId === id) {
          o.factoryId = ''
          o.factoryName = '已删除的工厂'
          changed = true
        }
      })
      if (changed) {
        localStorage.setItem(FACTORY_ORDERS_KEY, JSON.stringify(factoryOrders))
        notifyFactoryOrderChange()
      }
    }
    // 同时清理客户账户中对该角色的引用
    if (role === 'service') {
      const customers = storage.getAccounts<CustomerAccount>('customer')
      let changed = false
      customers.forEach(c => {
        if (c.serviceId === id) { c.serviceId = ''; changed = true }
      })
      if (changed) storage.saveAccounts('customer', customers)
    } else if (role === 'distributor') {
      const customers = storage.getAccounts<CustomerAccount>('customer')
      let changed = false
      customers.forEach(c => {
        if (c.distributorId === id) { c.distributorId = ''; changed = true }
      })
      if (changed) storage.saveAccounts('customer', customers)
    }
  },

  getCustomerInfo: (): CustomerInfo | null => {
    const data = localStorage.getItem(CUSTOMER_INFO_KEY)
    return data ? JSON.parse(data) : null
  },

  saveCustomerInfo: (info: CustomerInfo) => {
    localStorage.setItem(CUSTOMER_INFO_KEY, JSON.stringify(info))
  },

  // ── 账号管理 ──
  getAccounts: <T>(role: string): T[] => {
    const data = localStorage.getItem(getAccountsKey(role))
    return data ? JSON.parse(data) : []
  },

  saveAccounts: <T>(role: string, accounts: T[]) => {
    localStorage.setItem(getAccountsKey(role), JSON.stringify(accounts))
  },

  addAccount: <T extends { id: string }>(role: string, account: T) => {
    const accounts = storage.getAccounts<T>(role)
    accounts.push(account)
    storage.saveAccounts(role, accounts)
  },

  updateAccount: <T extends { id: string }>(role: string, id: string, updates: Partial<T>) => {
    const accounts = storage.getAccounts<T>(role)
    const idx = accounts.findIndex((a: T) => a.id === id)
    if (idx !== -1) {
      accounts[idx] = { ...accounts[idx], ...updates }
      storage.saveAccounts(role, accounts)
    }
  },

  deleteAccount: (role: string, id: string) => {
    const accounts = storage.getAccounts(role)
    storage.saveAccounts(role, accounts.filter((a: any) => a.id !== id))
  },

  // ── 当前用户 ──
  getCurrentUser: (): CurrentUser | null => {
    const data = localStorage.getItem(CURRENT_USER_KEY)
    return data ? JSON.parse(data) : null
  },

  setCurrentUser: (user: CurrentUser) => {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
  },

  clearCurrentUser: () => {
    localStorage.removeItem(CURRENT_USER_KEY)
  },

  // ── 预置账号 ──
  seedAccounts: () => {
    const now = new Date().toISOString()
    if (storage.getAccounts('customer').length === 0) {
      storage.saveAccounts('customer', [
        { id: 'cust-1', name: '张伟', phone: '13800001001', address: '北京市海淀区中关村南大街10号', notes: '需要低钠餐', serviceId: 'svc-1', distributorId: 'dist-1', createdAt: now },
        { id: 'cust-2', name: '李梅', phone: '13800001002', address: '北京市朝阳区建国路88号', notes: '偏好素食', serviceId: 'svc-1', distributorId: 'dist-2', createdAt: now },
        { id: 'cust-3', name: '王建', phone: '13800001003', address: '北京市西城区金融街15号', notes: '', serviceId: 'svc-1', distributorId: 'dist-1', createdAt: now },
      ])
    }
    if (storage.getAccounts('service').length === 0) {
      storage.saveAccounts('service', [
        { id: 'svc-1', name: '朝阳社区服务中心', phone: '010-88880001', createdAt: now },
      ])
    }
    if (storage.getAccounts('distributor').length === 0) {
      storage.saveAccounts('distributor', [
        { id: 'dist-1', name: '东城配送中心', phone: '010-88880002', region: '东城区', createdAt: now },
        { id: 'dist-2', name: '朝阳配送中心', phone: '010-88880005', region: '朝阳区', createdAt: now },
      ])
    }
    if (storage.getAccounts('factory').length === 0) {
      storage.saveAccounts('factory', [
        { id: 'fact-1', name: 'CCA中央厨房', phone: '010-88880003', address: '北京市大兴区工业园区A1', createdAt: now },
        { id: 'fact-2', name: 'Farmdoor营养餐工厂', phone: '010-88880004', address: '北京市通州区食品园区B3', createdAt: now },
      ])
    }
  },

  clearAll: () => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(CUSTOMER_INFO_KEY)
    localStorage.removeItem(ACCOUNTS_CUSTOMERS_KEY)
    localStorage.removeItem(ACCOUNTS_SERVICES_KEY)
    localStorage.removeItem(ACCOUNTS_DISTRIBUTORS_KEY)
    localStorage.removeItem(ACCOUNTS_FACTORIES_KEY)
    localStorage.removeItem(CURRENT_USER_KEY)
    localStorage.removeItem(FACTORY_ORDERS_KEY)
    localStorage.removeItem(CUSTOM_MEALS_KEY)
  }
}
