import { useState, useRef } from 'react'
import * as React from 'react'
import { Routes, Route, useNavigate, Link } from 'react-router-dom'
import { Camera, List, User, ArrowLeft, CheckCircle, Clock, Package, Upload, X, Loader2, BookOpen, Truck, Volume2, VolumeX } from 'lucide-react'
import { storage, Order, mockMeals, OrderItem, CustomerInfo } from '../store'
import { speakMealInfo, stopSpeaking, unlockAudio } from '../utils/speech'
import WeekMenuTable from '../components/WeekMenuTable'
import OCRResultTable from '../components/OCRResultTable'
import { parseOCRMenuTable, ExtractedMeal } from '../utils/parseOCRMenu'

export default function CustomerPortal() {
  return (
    <Routes>
      <Route path="/" element={<CustomerHome />} />
      <Route path="/menu" element={<MenuBrowser />} />
      <Route path="/upload" element={<OrderUpload />} />
      <Route path="/orders" element={<OrderList />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  )
}

function CustomerHome() {
  const navigate = useNavigate()
  const orders = storage.getOrders()
  const myOrders = orders.filter(o => o.status !== 'delivered')

  const quickActions = [
    { label: '浏览周菜单', desc: '查看完整周菜单并点餐', icon: BookOpen, gradient: 'from-emerald-500 to-green-500', path: '/customer/menu' },
    { label: '拍照上传订单', desc: '拍摄手写菜单或选择餐品', icon: Camera, gradient: 'from-orange-500 to-amber-500', path: '/customer/upload' },
    { label: '我的订单', desc: '查看订单状态和配送进度', icon: List, gradient: 'from-blue-500 to-cyan-500', path: '/customer/orders', badge: myOrders.length },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/20 to-slate-50">
      <header className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE1YzMuMzE0IDAgNi0yLjY4NiA2LTZzLTIuNjg2LTYtNi02LTYgMi42ODYtNiA2IDIuNjg2IDYgNiA2em0wIDMwYzMuMzE0IDAgNi0yLjY4NiA2LTZzLTIuNjg2LTYtNi02LTYgMi42ODYtNiA2IDIuNjg2IDYgNiA2eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative mx-auto max-w-5xl px-6 py-8">
          <Link to="/" className="mb-6 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white/90 backdrop-blur transition-colors hover:bg-white/20 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>
          <h1 className="text-3xl font-bold text-white">老人端</h1>
          <p className="mt-1 text-white/80">拍照上传订单，轻松订餐</p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-10 grid gap-6 sm:grid-cols-3 stagger-children">
          {quickActions.map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 p-7 text-left shadow-lg shadow-slate-200/50 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-[0.03]`} />
              <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${action.gradient} shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                <action.icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="mb-1 text-lg font-bold text-slate-900">{action.label}</h3>
              <p className="text-sm text-slate-500">{action.desc}</p>
              {action.badge !== undefined && action.badge > 0 && (
                <span className="mt-3 inline-block rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white animate-pulse-glow">
                  {action.badge} 个进行中
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-slate-200/50 backdrop-blur">
          <h3 className="mb-5 text-lg font-bold text-slate-900">使用指南</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { step: '1', text: '点击"拍照上传订单"，上传订单图片或填写您的信息' },
              { step: '2', text: '系统会自动识别图片中的订单信息（OCR功能）' },
              { step: '3', text: '提交后，服务机构会审核您的订单' },
              { step: '4', text: '审核通过后，分销商会向工厂下单并安排配送' },
            ].map(item => (
              <div key={item.step} className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-xs font-bold text-white shadow-sm">
                  {item.step}
                </span>
                <p className="text-sm leading-relaxed text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

function OrderUpload() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    selectedMeals: [] as { mealId: string; quantity: number; days: string[] }[]
  })
  const [submitted, setSubmitted] = useState(false)
  
  // OCR相关状态
  const [uploadedImage, setUploadedimage] = useState<string | null>(null)
  const [ocrResult, setOcrResult] = useState<string>('')
  const [extractedMeals, setExtractedMeals] = useState<ExtractedMeal[]>([])
  const [isRecognizing, setIsRecognizing] = useState(false)
  const [ocrError, setOcrError] = useState<string>('')
  
  // 编辑餐品状态
  const [editingMealIndex, setEditingMealIndex] = useState<number | null>(null)
  const [editingMealData, setEditingMealData] = useState<Partial<ExtractedMeal>>({})

  // 语音播报状态
  const [speaking, setSpeaking] = useState(false)

  // 加载保存的客户信息
  React.useEffect(() => {
    const savedInfo = storage.getCustomerInfo()
    if (savedInfo) {
      setFormData(prev => ({
        ...prev,
        customerName: savedInfo.customerName || '',
        customerPhone: savedInfo.phone || '',
        customerAddress: savedInfo.address || ''
      }))
    }
    // 组件卸载时停止语音播报
    return () => { stopSpeaking() }
  }, [])

  // 保存客户信息
  const saveCustomerInfo = () => {
    const info: CustomerInfo = {
      customerName: formData.customerName,
      phone: formData.customerPhone,
      address: formData.customerAddress
    }
    storage.saveCustomerInfo(info)
  }

  // 编辑餐品
  const startEditMeal = (index: number) => {
    setEditingMealIndex(index)
    setEditingMealData({ ...extractedMeals[index] })
  }

  // 保存编辑的餐品
  const saveEditedMeal = () => {
    if (editingMealIndex === null) return
    
    const updatedMeals = [...extractedMeals]
    updatedMeals[editingMealIndex] = editingMealData as ExtractedMeal
    setExtractedMeals(updatedMeals)
    setEditingMealIndex(null)
    setEditingMealData({})
  }

  // 删除餐品
  const deleteMeal = (index: number) => {
    const updatedMeals = extractedMeals.filter((_, i) => i !== index)
    setExtractedMeals(updatedMeals)
  }

  // 添加新餐品
  const addNewMeal = () => {
    const newMeal: ExtractedMeal = {
      name: '',
      day: '周一',
      subCategory: 'Regular Main 常规主餐',
      quantity: 1,
      tags: ''
    }
    setExtractedMeals([...extractedMeals, newMeal])
    setEditingMealIndex(extractedMeals.length)
    setEditingMealData(newMeal)
  }

  // 处理文件上传（支持图片和PDF）
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 在用户手势中解锁音频播放权限（必须在 click 事件处理器中同步调用）
    unlockAudio()

    // 验证文件类型
    const isPDF = file.type === 'application/pdf'
    const isImage = file.type.startsWith('image/')
    
    if (!isPDF && !isImage) {
      setOcrError('请上传图片或PDF文件')
      return
    }

    // 验证文件大小（10MB）
    if (file.size > 10 * 1024 * 1024) {
      setOcrError('文件大小不能超过10MB')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    const T0 = Date.now()
    const log = (step: string) => {
      const elapsed = Date.now() - T0
      console.log(`[计时] ${step} — 距开始 ${elapsed}ms (${(elapsed/1000).toFixed(1)}s)`)
    }

    console.log('[Upload] ═══════════ 开始全链路计时 ═══════════')
    console.log('[Upload] 文件:', file.name, '大小:', (file.size / 1024).toFixed(1), 'KB', '类型:', file.type)
    setOcrError('')
    setIsRecognizing(true)

    // PDF 直接显示图标，图片先设预览占位
    if (isPDF) {
      setUploadedimage('pdf')
    }

    try {
      // ① 只读一次文件，同时用于预览和 base64
      log('① 开始读取文件 (FileReader.readAsDataURL)')
      const base64Data = await new Promise<string>((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => {
          const dataUrl = r.result as string
          // 设置预览（图片直接用 dataUrl，PDF 已在上面设了图标）
          if (!isPDF) {
            setUploadedimage(dataUrl)
          }
          log('① 文件读取完成')
          // 去掉 data URI 前缀，只保留纯 base64
          const base64 = dataUrl.split(',')[1] || dataUrl
          resolve(base64)
        }
        r.onerror = () => reject(new Error('FileReader 读取失败'))
        r.readAsDataURL(file)
      })

      // ② 构建请求体
      log('② Base64 长度: ' + (base64Data.length / 1024).toFixed(1) + 'KB，开始构建 JSON')
      const requestBody = {
        file: base64Data,
        fileType: isPDF ? 0 : 1,
        visualize: false  // 不返回标注图片和输入图片，大幅减小响应体积（~97%）
      }
      const jsonBody = JSON.stringify(requestBody)
      log('② JSON body 大小: ' + (jsonBody.length / 1024 / 1024).toFixed(2) + 'MB')

      // ③ 发送 OCR 请求
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000)
      log('③ 发送 fetch 请求到 /api/ocr/layout-parsing')

      const fetchStart = Date.now()
      const response = await fetch('/api/ocr/layout-parsing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonBody,
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      const fetchTime = Date.now() - fetchStart
      log(`③ fetch 响应到达 (HTTP ${response.status})，网络耗时 ${fetchTime}ms (${(fetchTime/1000).toFixed(1)}s)`)

      // ④ 解析 JSON 响应（visualize:false 后响应仅 ~40KB，解析瞬间完成）
      log('④ 开始解析响应 JSON')
      const data = await response.json()
      log('④ 响应解析完成')

      // ⑤ 从响应中提取表格 HTML
      log('⑤ 开始提取表格内容')
      let markdown = ''
      
      try {
        if (data.result && data.result.layoutParsingResults) {
          const parsingResults = data.result.layoutParsingResults
          for (const item of parsingResults) {
            if (item.prunedResult && item.prunedResult.parsing_res_list) {
              for (const block of item.prunedResult.parsing_res_list) {
                if (block.block_label === 'table' && block.block_content) {
                  markdown = block.block_content
                  break
                }
              }
            }
            if (markdown) break
          }
        }
        if (!markdown && data.success && data.data?.markdown) markdown = data.data.markdown
        if (!markdown && data.markdown) markdown = data.markdown
        if (!markdown && data.result && typeof data.result === 'string') markdown = data.result
      } catch (parseError) {
        console.error('[OCR] 解析响应失败:', parseError)
      }
      log('⑤ 表格提取完成' + (markdown ? `，长度 ${markdown.length}` : '，未找到表格'))
      
      if (markdown) {
        // ⑥ 解析餐品
        log('⑥ 开始解析餐品 (parseOCRMenuTable)')
        const meals = parseOCRMenuTable(markdown)
        log(`⑥ 解析完成，提取到 ${meals.length} 个餐品`)

        // ⑦ 更新 UI 状态
        log('⑦ 更新 UI 状态')
        setOcrResult(markdown)
        setExtractedMeals(meals)
        
        // 自动语音播报
        if (meals.length > 0) {
          setTimeout(() => {
            setSpeaking(true)
            speakMealInfo(meals, formData.customerName || undefined, () => {
              setSpeaking(false)
            })
          }, 800)
        }
        
        if (meals.length !== 5) {
          console.warn('[OCR] ⚠️ 期望5个餐品，实际识别到', meals.length, '个')
        } else {
          console.log('[OCR] ✅ 所有5个餐品正确识别')
        }
        
        parseOCRResult(markdown)
        log('⑦ 全流程完成')
        console.log(`[Upload] ═══════════ 总耗时: ${Date.now() - T0}ms (${((Date.now() - T0)/1000).toFixed(1)}s) ═══════════`)
      } else {
        console.error('[OCR] 识别失败，响应结构:', JSON.stringify(data, null, 2).substring(0, 500))
        setOcrError(data.error || data.message || 'OCR识别失败，未能从响应中提取表格数据')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    } catch (error: any) {
      console.error('OCR识别错误:', error)
      if (error.name === 'AbortError') {
        setOcrError('OCR识别超时（超过2分钟），请重试或手动填写')
      } else {
        setOcrError(`OCR服务连接失败: ${error.message}，请手动填写订单信息`)
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } finally {
      setIsRecognizing(false)
    }
  }

  // 解析OCR结果，尝试提取订单信息
  const parseOCRResult = (text: string) => {
    // 简单的文本解析逻辑（可根据实际OCR结果优化）
    const lines = text.split('\n').filter(line => line.trim())
    
    // 尝试提取电话号码
    const phoneMatch = text.match(/1[3-9]\d{9}/)
    if (phoneMatch && !formData.customerPhone) {
      setFormData(prev => ({ ...prev, customerPhone: phoneMatch[0] }))
    }

    // 尝试提取地址（包含"路"、"街"、"号"等关键词的行）
    const addressMatch = lines.find(line => 
      line.includes('路') || line.includes('街') || line.includes('号') || line.includes('小区')
    )
    if (addressMatch && !formData.customerAddress) {
      setFormData(prev => ({ ...prev, customerAddress: addressMatch }))
    }

    // 尝试提取姓名（第一行可能是姓名）
    const nameLine = lines[0]?.trim()
    if (nameLine && nameLine.length < 10 && !/^\d/.test(nameLine) && !formData.customerName) {
      setFormData(prev => ({ ...prev, customerName: nameLine }))
    }
  }

  // 清除上传的图片
  const clearImage = () => {
    setUploadedimage(null)
    setOcrResult('')
    setOcrError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // 检查是否有识别到的餐品
    if (extractedMeals.length === 0) {
      alert('请先上传菜单进行OCR识别，或手动添加餐品')
      return
    }
    
    // 保存客户信息到本地存储
    saveCustomerInfo()
    
    // 将识别到的餐品转换为订单项
    const items: OrderItem[] = extractedMeals.map(meal => ({
      mealName: `${meal.name} (${meal.day})`,
      quantity: meal.quantity,
      unitPrice: 25, // 默认单价
      days: [meal.day],
      tags: meal.tags,
      subCategory: meal.subCategory
    }))

    const totalAmount = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)

    const order: Order = {
      id: `ORD-${Date.now()}`,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerAddress: formData.customerAddress,
      items,
      totalAmount,
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    storage.saveOrder(order)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
          <CheckCircle className="w-20 h-20 mx-auto mb-4 text-green-500" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">订单提交成功！</h2>
          <p className="text-gray-600 mb-6">服务机构将尽快审核您的订单</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/customer/orders')}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              查看订单
            </button>
            <button
              onClick={() => navigate('/customer')}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to="/customer" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            返回老人端
          </Link>
          <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            OCR 服务可用
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-6">
        <section className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-orange-600">订单录入</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">上传订单</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              上传菜单文件后核对识别结果，补全联系信息即可提交审核。
            </p>
          </div>
          <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-slate-200 bg-white text-sm shadow-sm">
            {[
              ['1', '识别'],
              ['2', '核对'],
              ['3', '提交']
            ].map(([step, label], index) => (
              <div key={step} className={`flex min-w-24 items-center gap-2 px-4 py-3 ${index > 0 ? 'border-l border-slate-200' : ''}`}>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${index === 0 ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {step}
                </span>
                <span className={index === 0 ? 'font-medium text-slate-900' : 'text-slate-500'}>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="space-y-6">
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-950">订单文件</h3>
                  <p className="mt-1 text-sm text-slate-500">支持 JPG、PNG、PDF，单个文件最大 10MB</p>
                </div>
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">自动识别</span>
              </div>
              <div className="p-6">
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center transition-colors hover:border-orange-400 hover:bg-orange-50/40">
                  {!uploadedImage ? (
                    <div>
                      {isRecognizing ? (
                        <div className="py-10">
                          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-orange-600" />
                          <p className="font-medium text-slate-900">正在处理文件</p>
                          <p className="mt-2 text-sm text-slate-500">识别完成后会自动展示可核对的餐品清单</p>
                        </div>
                      ) : (
                        <div className="py-8">
                          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
                            <Upload className="h-7 w-7 text-orange-600" />
                          </div>
                          <label className="inline-flex cursor-pointer items-center justify-center rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800">
                            选择文件
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*,.pdf"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                          <p className="mt-3 text-sm text-slate-500">上传后将进入 OCR 识别队列</p>
                        </div>
                      )}
                    </div>
                  ) : uploadedImage === 'pdf' ? (
                    <div className="relative">
                      <div className="rounded-lg border border-slate-200 bg-white p-8">
                        <Package className="mx-auto mb-4 h-12 w-12 text-red-500" />
                        <p className="font-medium text-slate-900">PDF 文件已上传</p>
                        <p className="mt-2 text-sm text-slate-500">正在识别内容，请保持页面打开</p>
                      </div>
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:text-red-600"
                        aria-label="移除文件"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <img src={uploadedImage} alt="预览" className="mx-auto max-h-80 rounded-lg border border-slate-200 object-contain shadow-sm" />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:text-red-600"
                        aria-label="移除文件"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {isRecognizing && (
                  <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-blue-700">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      正在识别文件内容
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-blue-100">
                      <div className="h-full w-3/5 animate-pulse rounded-full bg-blue-600" />
                    </div>
                    <p className="mt-2 text-xs text-blue-700">PDF 文件可能需要 30-90 秒</p>
                  </div>
                )}

                {speaking && (
                  <div className="mt-4 rounded-lg border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-md animate-pulse-glow">
                          <Volume2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-orange-800">正在语音播报订餐信息</p>
                          <p className="text-xs text-orange-600">请仔细核对播报内容是否正确</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { stopSpeaking(); setSpeaking(false) }}
                        className="rounded-lg bg-white px-3 py-2 text-xs font-medium text-orange-700 shadow-sm transition-colors hover:bg-orange-100"
                      >
                        停止
                      </button>
                    </div>
                  </div>
                )}

                {ocrError && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {ocrError}
                  </div>
                )}
              </div>
            </div>

            {ocrResult && (
              <div className="space-y-6">
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <OCRResultTable htmlContent={ocrResult} />
                </div>

                {extractedMeals.length > 0 && (
                  <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                        <h4 className="text-base font-semibold text-slate-950">点餐内容</h4>
                        <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          {extractedMeals.length} 项
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (speaking) {
                            stopSpeaking()
                            setSpeaking(false)
                          } else {
                            setSpeaking(true)
                            speakMealInfo(extractedMeals, formData.customerName || undefined, () => {
                              setSpeaking(false)
                            })
                          }
                        }}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                          speaking
                            ? 'bg-orange-500 text-white shadow-md shadow-orange-200/50 animate-pulse'
                            : 'bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-orange-600'
                        }`}
                        title={speaking ? '停止播报' : '语音播报订餐信息'}
                      >
                        {speaking ? (
                          <>
                            <VolumeX className="h-4 w-4" />
                            停止播报
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-4 w-4" />
                            语音播报
                          </>
                        )}
                      </button>
                    </div>
                    
                    {/* 按星期分组显示 */}
                    <div className="max-h-[520px] space-y-4 overflow-y-auto p-6">
                      {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map(day => {
                        const dayMeals = extractedMeals.filter(m => m.day === day)
                        if (dayMeals.length === 0) return null
                        
                        return (
                          <div key={day} className="overflow-hidden rounded-lg border border-slate-200">
                            {/* 星期标题 */}
                            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                              <span className="text-sm font-semibold text-slate-800">{day}</span>
                              <span className="text-xs text-slate-500">{dayMeals.length} 个餐品</span>
                            </div>
                            
                            {/* 餐品列表 */}
                            <div className="divide-y divide-slate-100">
                              {dayMeals.map((meal, idx) => {
                                // 找到原始索引
                                const originalIndex = extractedMeals.findIndex(m => 
                                  m.day === day && m.name === meal.name && m.subCategory === meal.subCategory
                                )
                                
                                return (
                                  <div key={idx} className="group relative p-4 transition-colors hover:bg-slate-50">
                                    {/* 编辑和删除按钮 - 悬停时显示 */}
                                    <div className="absolute right-3 top-3 z-10 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                      <button
                                        type="button"
                                        onClick={() => startEditMeal(originalIndex)}
                                        className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:text-blue-600"
                                        title="编辑此餐品"
                                      >
                                        编辑
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => deleteMeal(originalIndex)}
                                        className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:text-red-600"
                                        title="删除此餐品"
                                      >
                                        删除
                                      </button>
                                    </div>
                                    
                                    <div className="flex items-start justify-between gap-3 pr-20">
                                      <div className="flex-1">
                                        {/* 子类别标签 */}
                                        <div className="mb-2 flex flex-wrap items-center gap-2">
                                          <span className="inline-block rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                                            {meal.subCategory}
                                          </span>
                                          {meal.tags && meal.tags.split(', ').map((tag, tagIdx) => (
                                            <span key={tagIdx} className="inline-block rounded-md bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700">
                                              {tag}
                                            </span>
                                          ))}
                                        </div>
                                        
                                        {/* 餐品名称 */}
                                        <div className="text-sm font-medium leading-6 text-slate-900">
                                          {meal.name}
                                        </div>
                                      </div>
                                      
                                      {/* 数量徽章 */}
                                      <div className="flex-shrink-0">
                                        <div className={`inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-base font-semibold ${
                                          meal.quantity === 1 
                                            ? 'bg-orange-50 text-orange-700' 
                                            : meal.quantity <= 2
                                            ? 'bg-orange-100 text-orange-800'
                                            : 'bg-red-50 text-red-700'
                                        }`}>
                                          {meal.quantity}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    
                    {/* 添加餐品按钮 */}
                    <button
                      type="button"
                      onClick={addNewMeal}
                      className="mx-6 mb-6 flex w-[calc(100%-3rem)] items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-600 transition-colors hover:border-orange-400 hover:bg-orange-50 hover:text-orange-700"
                    >
                      <span className="text-lg leading-none">+</span>
                      <span className="font-medium">添加餐品（如果OCR漏识别）</span>
                    </button>
                  </div>
                )}
                
                {/* 编辑餐品对话框 */}
                {editingMealIndex !== null && editingMealData && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-2xl">
                      <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
                        <h3 className="text-lg font-semibold text-slate-950">编辑餐品</h3>
                        <button
                          type="button"
                          onClick={() => { setEditingMealIndex(null); setEditingMealData({}); }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        >
                          ×
                        </button>
                      </div>
                      
                      <div className="p-6 space-y-4">
                        {/* 星期选择 */}
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">星期</label>
                          <select
                            value={editingMealData.day || '周一'}
                            onChange={(e) => setEditingMealData({ ...editingMealData, day: e.target.value })}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                          >
                            {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map(day => (
                              <option key={day} value={day}>{day}</option>
                            ))}
                          </select>
                        </div>
                        
                        {/* 子类别 */}
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">类别</label>
                          <select
                            value={editingMealData.subCategory || ''}
                            onChange={(e) => setEditingMealData({ ...editingMealData, subCategory: e.target.value })}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                          >
                            {[
                              'Regular Main 常规主餐',
                              'Easy to Chew Main 易咀嚼主餐',
                              'Vegetarian 素食',
                              'Main Meal 主餐 (Farmdoor)',
                              'Sweet 甜点',
                              'Fruit + Dairy 水果+乳制品'
                            ].map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        
                        {/* 餐品名称 */}
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">餐品名称</label>
                          <input
                            type="text"
                            value={editingMealData.name || ''}
                            onChange={(e) => setEditingMealData({ ...editingMealData, name: e.target.value })}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                            placeholder="输入餐品名称"
                          />
                        </div>
                        
                        {/* 数量 */}
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">数量</label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={editingMealData.quantity || 1}
                            onChange={(e) => setEditingMealData({ ...editingMealData, quantity: parseInt(e.target.value) })}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                          />
                        </div>
                        
                        {/* 饮食标签 */}
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">饮食标签（可选，用逗号分隔）</label>
                          <input
                            type="text"
                            value={editingMealData.tags || ''}
                            onChange={(e) => setEditingMealData({ ...editingMealData, tags: e.target.value })}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                            placeholder="如: LSF, LS, GF"
                          />
                        </div>
                      </div>
                      
                      <div className="sticky bottom-0 flex gap-3 border-t bg-slate-50 px-6 py-4">
                        <button
                          type="button"
                          onClick={() => { setEditingMealIndex(null); setEditingMealData({}); }}
                          className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
                        >
                          取消
                        </button>
                        <button
                          type="button"
                          onClick={saveEditedMeal}
                          className="flex-1 rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                        >
                          保存
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-4">
                <h3 className="flex items-center gap-2 text-base font-semibold text-slate-950">
                  <User className="h-5 w-5 text-orange-600" />
                  联系信息
                </h3>
                <p className="mt-1 text-sm text-slate-500">用于审核和配送确认</p>
              </div>
              <div className="space-y-4 p-6">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">姓名 *</label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                    placeholder="请输入姓名"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">电话 *</label>
                  <input
                    type="tel"
                    required
                    value={formData.customerPhone}
                    onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                    placeholder="请输入联系电话"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">配送地址 *</label>
                  <textarea
                    required
                    value={formData.customerAddress}
                    onChange={e => setFormData({ ...formData, customerAddress: e.target.value })}
                    className="w-full resize-none rounded-md border border-slate-300 px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                    rows={4}
                    placeholder="请输入详细配送地址"
                  />
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">已识别餐品</span>
                    <span className="font-semibold text-slate-950">{extractedMeals.length} 项</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-slate-500">预估金额</span>
                    <span className="font-semibold text-orange-600">
                      ${extractedMeals.reduce((sum, meal) => sum + meal.quantity * 25, 0)}
                    </span>
                  </div>
                </div>

                <p className="text-xs leading-5 text-slate-500">联系信息会保存在本机，便于下次继续填写。</p>
              </div>

              <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  disabled={isRecognizing}
                >
                  提交订单
                </button>
              </div>
            </form>
          </aside>
        </div>
      </main>
    </div>
  )
}

function OrderList() {
  const [orders, setOrders] = useState(storage.getOrders())
  
  React.useEffect(() => {
    const unsubscribe = storage.subscribeToOrderChanges(() => {
      setOrders(storage.getOrders())
    })
    return unsubscribe
  }, [])

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { icon: React.ReactNode; text: string; desc: string; border: string; bg: string; progress: string; step: string }> = {
      pending: { icon: <Clock className="h-5 w-5 text-amber-500" />, text: '待审核', desc: '您的订单正在等待服务机构审核', border: 'border-amber-200', bg: 'bg-amber-50', progress: 'bg-amber-500 w-1/4', step: '1/4' },
      approved: { icon: <CheckCircle className="h-5 w-5 text-blue-500" />, text: '已审核', desc: '订单已通过审核,分销商正在汇总', border: 'border-blue-200', bg: 'bg-blue-50', progress: 'bg-blue-500 w-2/4', step: '2/4' },
      processing: { icon: <Package className="h-5 w-5 text-violet-500" />, text: '生产中', desc: '工厂正在生产您的餐品', border: 'border-violet-200', bg: 'bg-violet-50', progress: 'bg-violet-500 w-3/4', step: '3/4' },
      completed: { icon: <Truck className="h-5 w-5 text-emerald-500" />, text: '配送中', desc: '餐品已完成,正在配送途中', border: 'border-emerald-200', bg: 'bg-emerald-50', progress: 'bg-emerald-500 w-full', step: '4/4' },
      delivered: { icon: <CheckCircle className="h-5 w-5 text-emerald-600" />, text: '已送达', desc: '订单已送达,祝您用餐愉快', border: 'border-emerald-300', bg: 'bg-emerald-100', progress: '', step: '' },
      rejected: { icon: <X className="h-5 w-5 text-red-500" />, text: '已拒绝', desc: '订单未通过审核,请联系服务机构', border: 'border-red-200', bg: 'bg-red-50', progress: '', step: '' },
    }
    return configs[status] || configs.pending
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/20 to-slate-50 p-6">
      <div className="mx-auto max-w-5xl">
        <Link to="/customer" className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm backdrop-blur transition-colors hover:bg-white hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          返回
        </Link>

        <h2 className="mb-8 text-3xl font-bold text-slate-900">我的订单</h2>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 py-20 backdrop-blur">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <Package className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-lg font-medium text-slate-600">暂无订单</p>
            <p className="mt-1 text-sm text-slate-400">上传菜单后即可创建第一个订单</p>
          </div>
        ) : (
          <div className="space-y-5 stagger-children">
            {orders.map(order => {
              const config = getStatusConfig(order.status)
              return (
                <div key={order.id} className={`overflow-hidden rounded-2xl border-2 ${config.border} bg-white/80 shadow-lg shadow-slate-200/50 backdrop-blur transition-all hover:shadow-xl`}>
                  <div className={`flex items-center justify-between px-6 py-4 ${config.bg}`}>
                    <div className="flex items-center gap-3">
                      {config.icon}
                      <div>
                        <h3 className="font-bold text-slate-900">{order.id}</h3>
                        <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString('zh-CN')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-slate-900">{config.text}</span>
                      <p className="text-xs text-slate-500">{config.desc}</p>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-4 space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5">
                          <span className="text-sm text-slate-700">{item.mealName} <span className="font-medium text-orange-500">x{item.quantity}</span></span>
                          <span className="text-sm font-semibold text-slate-900">${item.unitPrice * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                      <div>
                        <span className="text-sm font-medium text-slate-500">总计</span>
                        <p className="mt-0.5 text-xs text-slate-400">{order.customerName} · {order.customerPhone}</p>
                      </div>
                      <span className="text-2xl font-bold text-orange-500">${order.totalAmount}</span>
                    </div>

                    {order.status !== 'delivered' && order.status !== 'rejected' && config.step && (
                      <div className="mt-5 border-t border-slate-100 pt-4">
                        <div className="mb-2 flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-500">订单进度</span>
                          <span className="font-bold text-slate-700">{config.step}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className={`h-full rounded-full transition-all duration-700 ${config.progress}`} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function MenuBrowser() {
  const navigate = useNavigate()
  const [cart, setCart] = useState<{ mealId: string; quantity: number }[]>([])
  
  const addToCart = (mealId: string) => {
    const existing = cart.find(item => item.mealId === mealId)
    if (existing) {
      setCart(cart.map(item => 
        item.mealId === mealId ? { ...item, quantity: item.quantity + 1 } : item
      ))
    } else {
      setCart([...cart, { mealId, quantity: 1 }])
    }
  }
  
  const removeFromCart = (mealId: string) => {
    setCart(cart.filter(item => item.mealId !== mealId))
  }
  
  const getCartTotal = () => {
    return cart.reduce((sum, item) => {
      const meal = mockMeals.find(m => m.id === item.mealId)
      return sum + (meal?.price || 0) * item.quantity
    }, 0)
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-[1600px] mx-auto">
        <Link to="/customer" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          返回
        </Link>
        
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">CCA冬季菜单 - Week 4</h2>
          <p className="text-sm text-gray-600 mb-4">Hot-Chilled Winter Menu 2026 CHSP</p>
          
          {/* 饮食标签说明 */}
          <div className="grid md:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-green-50 text-green-700 rounded font-mono">(LSF)</span>
              <span>LOW SATURATED FAT 低脂肪 &lt; 1.5g per 100g</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-mono">(DBF)</span>
              <span>DIABETIC FRIENDLY 适合糖尿病患者 &lt; 15g sugar per 100g</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded font-mono">(LS)</span>
              <span>LOWER SODIUM 低钠 &lt; 150mg per 100g</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded font-mono">(GF)</span>
              <span>GLUTEN FREE 无麸质</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-red-50 text-red-700 rounded font-mono">(DF)</span>
              <span>DAIRY FREE 无乳制品</span>
            </div>
          </div>
        </div>
        
        {/* 完整的周菜单表格 */}
        <WeekMenuTable 
          cart={cart}
          addToCart={addToCart}
          removeFromCart={removeFromCart}
        />
        
        {/* 使用说明 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-900">
            <strong>💡 使用方法：</strong>点击任意餐品即可添加到订单，再次点击可取消。已选择的餐品会显示橙色标记和✓图标。
          </p>
        </div>
        
        {/* 购物车总结 */}
        {cart.length > 0 && (
          <div className="fixed bottom-6 right-6 bg-white rounded-xl shadow-xl p-6 max-w-sm border-2 border-orange-500">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-500" />
              已选餐品 ({cart.length})
            </h3>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {cart.map(item => {
                const meal = mockMeals.find(m => m.id === item.mealId)
                return (
                  <div key={item.mealId} className="flex justify-between text-sm items-center">
                    <span className="flex-1 pr-2">{meal?.name.split('\n')[0]} x{item.quantity}</span>
                    <span className="font-medium text-orange-500">¥{(meal?.price || 0) * item.quantity}</span>
                  </div>
                )
              })}
            </div>
            <div className="border-t pt-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="font-bold">总计</span>
                <span className="text-xl font-bold text-orange-500">¥{getCartTotal()}</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/customer/upload')}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 font-medium shadow-lg"
            >
              继续填写订单信息 →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Profile() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/20 to-slate-50 p-6">
      <div className="mx-auto max-w-2xl">
        <Link to="/customer" className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm backdrop-blur transition-colors hover:bg-white hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          返回
        </Link>
        <div className="flex flex-col items-center rounded-2xl border border-white/60 bg-white/80 p-10 shadow-lg shadow-slate-200/50 backdrop-blur">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg">
            <User className="h-10 w-10 text-white" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-slate-900">个人中心</h2>
          <p className="text-slate-500">功能开发中，敬请期待</p>
          <div className="mt-6 flex gap-4 text-center">
            <div className="rounded-xl bg-slate-50 px-5 py-3">
              <div className="text-lg font-bold text-slate-900">{storage.getOrders().length}</div>
              <div className="text-xs text-slate-500">历史订单</div>
            </div>
            <div className="rounded-xl bg-slate-50 px-5 py-3">
              <div className="text-lg font-bold text-slate-900">{storage.getOrders().filter(o => o.status === 'delivered').length}</div>
              <div className="text-xs text-slate-500">已完成</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
