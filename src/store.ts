// 模拟数据存储 - MVP版本使用本地状态
export interface Order {
  id: string
  customerName: string
  customerPhone: string
  customerAddress: string
  items: OrderItem[]
  totalAmount: number
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'delivered'
  createdAt: string
  approvedAt?: string
  factoryOrderId?: string
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
  factoryName: string
  items: OrderItem[]
  totalAmount: number
  status: 'pending' | 'confirmed' | 'completed' | 'delivered'
  createdAt: string
}

// 饮食标签说明
export const dietaryTagInfo: Record<string, string> = {
  'LSF': '低脂肪 (< 1.5g/100g)',
  'DBF': '适合糖尿病患者 (< 15g糖/100g)',
  'LS': '低钠 (< 150mg/100g)',
  'GF': '无麸质',
  'DF': '无乳制品'
}

// CCA冬季菜单 Week 4 - 基于实际PDF菜单
export const mockMeals: Meal[] = [
  // 周一 (Monday)
  { id: 'w4-mon-1', name: '瑞典肉丸配温和胡椒肉汁', nameEn: 'Swedish Meatballs with Mild Pepper Gravy', price: 28, category: '常规主餐', subCategory: 'Regular Main', dietaryTags: ['LS'], weekNumber: 4, dayOfWeek: '周一' },
  { id: 'w4-mon-2', name: '奶油芥末鸡', nameEn: 'Creamy Mustard Chicken', price: 26, category: '易咀嚼主餐', subCategory: 'Easy to Chew', dietaryTags: ['LSF'], weekNumber: 4, dayOfWeek: '周一' },
  { id: 'w4-mon-3', name: '西班牙烩饭', nameEn: 'Spanish Risotto Slice', price: 24, category: '素食', subCategory: 'Vegetarian', dietaryTags: ['LS'], weekNumber: 4, dayOfWeek: '周一' },
  { id: 'w4-mon-4', name: '羊肝培根配洋葱肉汁和土豆泥', nameEn: 'Lambs Fry & bacon with Onion gravy & Mashed Potato', price: 30, category: 'Farmdoor主餐', subCategory: 'Main Meal', weekNumber: 4, dayOfWeek: '周一' },
  { id: 'w4-mon-5', name: '椰香烤蛋奶', nameEn: 'Coconut Baked Custard', price: 12, category: '甜点', subCategory: 'Sweet', dietaryTags: ['DBF'], weekNumber: 4, dayOfWeek: '周一' },
  { id: 'w4-mon-6', name: '双拼水果配蛋奶', nameEn: 'Two Fruits with Custard', price: 10, category: '甜点', subCategory: 'Fruit + Dairy', dietaryTags: ['DBF'], weekNumber: 4, dayOfWeek: '周一' },

  // 周二 (Tuesday)
  { id: 'w4-tue-1', name: '烟熏辣椒酱猪排', nameEn: 'Pork Steak with Smoky Peppernata Sauce', price: 28, category: '常规主餐', subCategory: 'Regular Main', dietaryTags: ['LS'], weekNumber: 4, dayOfWeek: '周二' },
  { id: 'w4-tue-2', name: '辣味玉米牛肉', nameEn: 'Chilli Corn Carne', price: 26, category: '易咀嚼主餐', subCategory: 'Easy to Chew', dietaryTags: ['LSF', 'LS'], weekNumber: 4, dayOfWeek: '周二' },
  { id: 'w4-tue-3', name: '蔬菜达尔咖喱', nameEn: 'Vegetable Dahl', price: 24, category: '素食', subCategory: 'Vegetarian', dietaryTags: ['LSF', 'LS'], weekNumber: 4, dayOfWeek: '周二' },
  { id: 'w4-tue-4', name: '法式鸡肉炖菜', nameEn: 'French Chicken Casserole', price: 30, category: 'Farmdoor主餐', subCategory: 'Main Meal', dietaryTags: ['GF', 'LS'], weekNumber: 4, dayOfWeek: '周二' },
  { id: 'w4-tue-5', name: '苹果、梨和大黄果脆配蛋奶', nameEn: 'Apple, Pear & Rhubarb Cobbler with Custard', price: 12, category: '甜点', subCategory: 'Sweet', weekNumber: 4, dayOfWeek: '周二' },
  { id: 'w4-tue-6', name: '水果沙拉配酸奶', nameEn: 'Fruit Salad with Yoghurt', price: 10, category: '甜点', subCategory: 'Fruit + Dairy', dietaryTags: ['DBF'], weekNumber: 4, dayOfWeek: '周二' },

  // 周三 (Wednesday)
  { id: 'w4-wed-1', name: '帕玛森鸡排', nameEn: 'Chicken Parmigiana', price: 28, category: '常规主餐', subCategory: 'Regular Main', dietaryTags: ['LSF', 'LS'], weekNumber: 4, dayOfWeek: '周三' },
  { id: 'w4-wed-2', name: '猪肉苹果酒炖菜', nameEn: 'Pork & Cider Casserole', price: 26, category: '易咀嚼主餐', subCategory: 'Easy to Chew', dietaryTags: ['LSF', 'LS'], weekNumber: 4, dayOfWeek: '周三' },
  { id: 'w4-wed-3', name: '土豆菠菜派', nameEn: 'Potato Spinach Pie', price: 24, category: '素食', subCategory: 'Vegetarian', weekNumber: 4, dayOfWeek: '周三' },
  { id: 'w4-wed-4', name: '咸味牛肉碎配土豆泥', nameEn: 'Savoury Beef Mince with Mash Potato', price: 30, category: 'Farmdoor主餐', subCategory: 'Main Meal', dietaryTags: ['GF', 'LSF'], weekNumber: 4, dayOfWeek: '周三' },
  { id: 'w4-wed-5', name: '葡萄干布丁配蛋奶', nameEn: 'Sultana Pudding with Custard', price: 12, category: '甜点', subCategory: 'Sweet', weekNumber: 4, dayOfWeek: '周三' },
  { id: 'w4-wed-6', name: '桃子配蛋奶', nameEn: 'Peaches with Custard', price: 10, category: '甜点', subCategory: 'Fruit + Dairy', dietaryTags: ['DBF'], weekNumber: 4, dayOfWeek: '周三' },

  // 周四 (Thursday)
  { id: 'w4-thu-1', name: '牧羊人派', nameEn: 'Shepherd\'s Pie', price: 28, category: '常规主餐', subCategory: 'Regular Main', dietaryTags: ['LSF'], weekNumber: 4, dayOfWeek: '周四' },
  { id: 'w4-thu-2', name: '三文鱼焗意面', nameEn: 'Salmon Pasta Bake', price: 26, category: '易咀嚼主餐', subCategory: 'Easy to Chew', dietaryTags: ['LSF'], weekNumber: 4, dayOfWeek: '周四' },
  { id: 'w4-thu-3', name: '蔬菜青酱焗意面', nameEn: 'Vegetable Pesto Pasta Bake', price: 24, category: '素食', subCategory: 'Vegetarian', weekNumber: 4, dayOfWeek: '周四' },
  { id: 'w4-thu-4', name: '印度黄油鸡配蒸米饭', nameEn: 'Indian Butter Chicken with Steamed Rice', price: 30, category: 'Farmdoor主餐', subCategory: 'Main Meal', dietaryTags: ['GF', 'LS'], weekNumber: 4, dayOfWeek: '周四' },
  { id: 'w4-thu-5', name: '柑橘、乳清干酪和杏仁蛋糕配蛋奶', nameEn: 'Citrus, Ricotta & Almond Cake with Custard', price: 12, category: '甜点', subCategory: 'Sweet', weekNumber: 4, dayOfWeek: '周四' },
  { id: 'w4-thu-6', name: '香料苹果配酸奶', nameEn: 'Spiced Apples with Yoghurt', price: 10, category: '甜点', subCategory: 'Fruit + Dairy', dietaryTags: ['DBF'], weekNumber: 4, dayOfWeek: '周四' },

  // 周五 (Friday)
  { id: 'w4-fri-1', name: '裹粉炸鱼', nameEn: 'Crumbed Fish', price: 28, category: '常规主餐', subCategory: 'Regular Main', dietaryTags: ['LSF', 'LS'], weekNumber: 4, dayOfWeek: '周五' },
  { id: 'w4-fri-2', name: '印度黄油鸡', nameEn: 'Butter Chicken', price: 26, category: '易咀嚼主餐', subCategory: 'Easy to Chew', dietaryTags: ['LSF'], weekNumber: 4, dayOfWeek: '周五' },
  { id: 'w4-fri-3', name: '印度黄油豆腐', nameEn: 'Indian Butter Tofu', price: 24, category: '素食', subCategory: 'Vegetarian', dietaryTags: ['LSF', 'LS'], weekNumber: 4, dayOfWeek: '周五' },
  { id: 'w4-fri-4', name: '蔬菜千层面配白酱', nameEn: 'Vegetable Lasagna with Bechamel Sauce', price: 30, category: 'Farmdoor主餐', subCategory: 'Main Meal', dietaryTags: ['LSF'], weekNumber: 4, dayOfWeek: '周五' },
  { id: 'w4-fri-5', name: '奶油米布丁配太妃苹果泥', nameEn: 'Creamy Rice & Toffee Apple Puree', price: 12, category: '甜点', subCategory: 'Sweet', dietaryTags: ['DBF'], weekNumber: 4, dayOfWeek: '周五' },
  { id: 'w4-fri-6', name: '混合水果果酱', nameEn: 'Mixed Fruit Compote', price: 10, category: '甜点', subCategory: 'Fruit + Dairy', weekNumber: 4, dayOfWeek: '周五' },

  // 周六 (Saturday)
  { id: 'w4-sat-1', name: '波特酒酱烤牛肉', nameEn: 'Roast Beef with Port Wine Sauce', price: 28, category: '常规主餐', subCategory: 'Regular Main', dietaryTags: ['LSF', 'LS'], weekNumber: 4, dayOfWeek: '周六' },
  { id: 'w4-sat-2', name: '蜂蜜胡椒猪肉', nameEn: 'Honey Pepper Pork', price: 26, category: '易咀嚼主餐', subCategory: 'Easy to Chew', dietaryTags: ['LSF'], weekNumber: 4, dayOfWeek: '周六' },
  { id: 'w4-sat-3', name: '焗烤蔬菜', nameEn: 'Veggie Slice', price: 24, category: '素食', subCategory: 'Vegetarian', dietaryTags: ['LS'], weekNumber: 4, dayOfWeek: '周六' },
  { id: 'w4-sat-4', name: '法式鸡肉炖菜', nameEn: 'French Chicken Casserole', price: 30, category: 'Farmdoor主餐', subCategory: 'Main Meal', dietaryTags: ['GF', 'LS'], weekNumber: 4, dayOfWeek: '周六' },
  { id: 'w4-sat-5', name: '果冻配双拼水果蛋奶', nameEn: 'Jelly & Two Fruits Custard', price: 12, category: '甜点', subCategory: 'Sweet', weekNumber: 4, dayOfWeek: '周六' },
  { id: 'w4-sat-6', name: '梨配酸奶', nameEn: 'Pear with Yoghurt', price: 10, category: '甜点', subCategory: 'Fruit + Dairy', dietaryTags: ['DBF'], weekNumber: 4, dayOfWeek: '周六' },

  // 周日 (Sunday)
  { id: 'w4-sun-1', name: '烟熏烧烤酱烤鸡腿', nameEn: 'Roast Chicken Thigh with Smoky BBQ Sauce', price: 28, category: '常规主餐', subCategory: 'Regular Main', dietaryTags: ['LSF'], weekNumber: 4, dayOfWeek: '周日' },
  { id: 'w4-sun-2', name: '慢炖羊肉砂锅', nameEn: 'Slow Cooked Lamb Casserole', price: 26, category: '易咀嚼主餐', subCategory: 'Easy to Chew', dietaryTags: ['LSF'], weekNumber: 4, dayOfWeek: '周日' },
  { id: 'w4-sun-3', name: '扁豆薄洛尼亚酱', nameEn: 'Lentil Bolognaise', price: 24, category: '素食', subCategory: 'Vegetarian', dietaryTags: ['LSF', 'LS'], weekNumber: 4, dayOfWeek: '周日' },
  { id: 'w4-sun-4', name: '咸味牛肉碎配土豆泥', nameEn: 'Savoury Beef Mince with Mash Potato', price: 30, category: 'Farmdoor主餐', subCategory: 'Main Meal', dietaryTags: ['GF', 'LSF'], weekNumber: 4, dayOfWeek: '周日' },
  { id: 'w4-sun-5', name: '倒扣桃子蛋糕配蛋奶', nameEn: 'Peach Upside Down Cake with Custard', price: 12, category: '甜点', subCategory: 'Sweet', weekNumber: 4, dayOfWeek: '周日' },
  { id: 'w4-sun-6', name: '杏子配蛋奶', nameEn: 'Apricots with Custard', price: 10, category: '甜点', subCategory: 'Fruit + Dairy', dietaryTags: ['DBF'], weekNumber: 4, dayOfWeek: '周日' },
]

export const mockFactories = [
  { id: '1', name: 'CCA中央厨房' },
  { id: '2', name: 'Farmdoor营养餐工厂' },
]

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

// 本地存储键
const STORAGE_KEY = 'icooker_orders'
const CUSTOMER_INFO_KEY = 'icooker_customer_info'

// 订单变化监听器
type OrderChangeListener = () => void
const orderChangeListeners: OrderChangeListener[] = []

// 通知所有监听器
function notifyOrderChange() {
  orderChangeListeners.forEach(listener => listener())
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
    notifyOrderChange() // 通知监听者
  },
  
  updateOrder: (id: string, updates: Partial<Order>) => {
    const orders = storage.getOrders()
    const index = orders.findIndex(o => o.id === id)
    if (index !== -1) {
      orders[index] = { ...orders[index], ...updates }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
      notifyOrderChange() // 通知监听者
    }
  },
  
  // 订阅订单变化
  subscribeToOrderChanges: (listener: OrderChangeListener) => {
    orderChangeListeners.push(listener)
    return () => {
      const index = orderChangeListeners.indexOf(listener)
      if (index > -1) {
        orderChangeListeners.splice(index, 1)
      }
    }
  },
  
  // 客户信息管理
  getCustomerInfo: (): CustomerInfo | null => {
    const data = localStorage.getItem(CUSTOMER_INFO_KEY)
    return data ? JSON.parse(data) : null
  },
  
  saveCustomerInfo: (info: CustomerInfo) => {
    localStorage.setItem(CUSTOMER_INFO_KEY, JSON.stringify(info))
  },
  
  clearAll: () => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(CUSTOMER_INFO_KEY)
  }
}
