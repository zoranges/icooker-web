import React, { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, X, Loader2, CheckCircle, Volume2, VolumeX, Settings, Package, User } from 'lucide-react'
import { storage, Order, OrderItem } from '../../store'
import { speakMealInfo, stopSpeaking, unlockAudio } from '../../utils/speech'
import OCRResultTable from '../../components/OCRResultTable'
import { parseOCRMenuTable, ExtractedMeal } from '../../utils/parseOCRMenu'
import TtsSettingsModal from '../../components/TtsSettingsModal'

export function OrderUpload() {
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
  const [showTtsSettings, setShowTtsSettings] = useState(false)

  // 加载保存的客户信息
  React.useEffect(() => {
    const currentUser = storage.getCurrentUser()
    if (currentUser && currentUser.role === 'customer') {
      const accounts = storage.getAccounts<{name:string;phone:string;address:string}>('customer')
      const account = accounts.find(a => a.phone === currentUser.phone)
      if (account) {
        setFormData(prev => ({
          ...prev,
          customerName: account.name || '',
          customerPhone: account.phone || '',
          customerAddress: account.address || ''
        }))
        return () => { stopSpeaking() }
      }
    }
    const savedInfo = storage.getCustomerInfo()
    if (savedInfo) {
      setFormData(prev => ({
        ...prev,
        customerName: savedInfo.customerName || '',
        customerPhone: savedInfo.phone || '',
        customerAddress: savedInfo.address || ''
      }))
    }
    return () => { stopSpeaking() }
  }, [])

  // 保存客户信息
  const saveCustomerInfo = () => {
    const info = {
      customerName: formData.customerName,
      phone: formData.customerPhone,
      address: formData.customerAddress
    }
    storage.saveCustomerInfo(info as any)
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

    // Look up service agency for this customer
    const custAccounts = storage.getAccounts<{phone:string;serviceId:string}>('customer')
    const cust = custAccounts.find(c => c.phone === formData.customerPhone)
    let serviceName = ''
    let serviceId = ''
    if (cust?.serviceId) {
      const svcAccounts = storage.getAccounts<{id:string;name:string}>('service')
      const svc = svcAccounts.find(s => s.id === cust.serviceId)
      if (svc) { serviceId = svc.id; serviceName = svc.name }
    }

    const order: Order = {
      id: `ORD-${Date.now()}`,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerAddress: formData.customerAddress,
      items,
      totalAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      serviceId,
      serviceName,
    }

    // 检查今日重复订单
    const today = new Date().toISOString().slice(0, 10)
    const duplicate = storage.getOrders().find(o =>
      o.customerPhone === formData.customerPhone &&
      o.status === 'pending' &&
      o.createdAt.startsWith(today)
    )
    if (duplicate && !window.confirm(`您今天已有一个待审核订单 (${duplicate.id})。确定再提交一个吗？`)) return

    storage.saveOrder(order)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen p-6" style={{ background: 'hsl(30 20% 98%)' }}>
        <div className="max-w-2xl mx-auto rounded-lg bg-white p-8 text-center">
          <CheckCircle className="w-20 h-20 mx-auto mb-4 text-green-500" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2 font-display">订单提交成功！</h2>
          <p className="mb-6" style={{ color: 'hsl(20 8% 42%)' }}>服务机构将尽快审核您的订单</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/customer/orders')}
              className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              查看订单
            </button>
            <button
              onClick={() => navigate('/customer')}
              className="px-6 py-3 border rounded-lg transition-colors hover:bg-gray-50" style={{ borderColor: 'hsl(30 8% 90%)' }}
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'hsl(30 20% 98%)' }}>
      <header className="border-b bg-white/95 backdrop-blur" style={{ borderColor: 'hsl(30 8% 90%)' }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to="/customer" className="inline-flex items-center gap-2 text-sm font-medium transition-colors" style={{ color: 'hsl(20 8% 42%)' }}>
            <ArrowLeft className="h-4 w-4" />
            返回老人端
          </Link>
          <div className="hidden items-center gap-3 text-xs sm:flex" style={{ color: 'hsl(20 8% 42%)' }}>
            <button
              type="button"
              onClick={() => setShowTtsSettings(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-2.5 py-1.5 text-xs font-medium shadow-sm transition-colors hover:bg-[hsl(15,55%,42%,0.08)] hover:text-[hsl(15,55%,42%)] hover:border-[hsl(15,55%,42%,0.3)]"
              style={{ borderColor: 'hsl(30 8% 90%)', color: 'hsl(20 8% 42%)' }}
              title="语音设置"
            >
              <Settings className="h-3.5 w-3.5" />
              语音设置
            </button>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            OCR 服务可用
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-6">
        <section className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: 'hsl(15 55% 42%)' }}>订单录入</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950 font-display">上传订单</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: 'hsl(20 8% 42%)' }}>
              上传菜单文件后核对识别结果，补全联系信息即可提交审核。
            </p>
          </div>
          <div className="grid grid-cols-3 overflow-hidden rounded-lg bg-white text-sm shadow-sm">
            {[
              ['1', '识别'],
              ['2', '核对'],
              ['3', '提交']
            ].map(([step, label], index) => (
              <div key={step} className="flex min-w-24 items-center gap-2 px-4 py-3">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${index === 0 ? 'text-white' : 'bg-slate-100 text-slate-500'}`} style={index === 0 ? { background: 'hsl(15 55% 42%)' } : undefined}>
                  {step}
                </span>
                <span className={index === 0 ? 'font-medium text-slate-900' : 'text-slate-500'}>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="space-y-6">
            <div className="rounded-lg bg-white">
              <div className="flex items-center justify-between px-5 py-3">
                <div>
                  <h3 className="text-base font-semibold text-foreground font-display">订单文件</h3>
                  <p className="mt-1 text-sm text-muted-foreground">支持 JPG、PNG、PDF，单个文件最大 10MB</p>
                </div>
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium" style={{ color: 'hsl(20 8% 42%)' }}>自动识别</span>
              </div>
              <div className="p-4">
                <div className="rounded-lg bg-slate-50/70 p-4 text-center transition-colors hover:bg-[hsl(15,55%,42%,0.04)] ring-1 ring-inset" style={{ '--tw-ring-color': 'hsl(30 8% 90%)' } as React.CSSProperties}>
                  {!uploadedImage ? (
                    <div>
                      {isRecognizing ? (
                        <div className="py-10">
                          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin" style={{ color: 'hsl(15 55% 42%)' }} />
                          <p className="font-medium text-slate-900">正在处理文件</p>
                          <p className="mt-2 text-sm" style={{ color: 'hsl(20 8% 42%)' }}>识别完成后会自动展示可核对的餐品清单</p>
                        </div>
                      ) : (
                        <div className="py-8">
                          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-white shadow-sm ring-1" style={{ boxShadow: '0 0 0 1px hsl(30 8% 90%)' }}>
                            <Upload className="h-7 w-7" style={{ color: 'hsl(15 55% 42%)' }} />
                          </div>
                          <label className="inline-flex cursor-pointer items-center justify-center rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800">
                            选择文件
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*,.pdf"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                          <p className="mt-3 text-sm" style={{ color: 'hsl(20 8% 42%)' }}>上传后将进入 OCR 识别队列</p>
                        </div>
                      )}
                    </div>
                  ) : uploadedImage === 'pdf' ? (
                    <div className="relative">
                      <div className="rounded-lg bg-white p-8">
                        <Package className="mx-auto mb-4 h-12 w-12 text-red-500" />
                        <p className="font-medium text-slate-900">PDF 文件已上传</p>
                        <p className="mt-2 text-sm" style={{ color: 'hsl(20 8% 42%)' }}>正在识别内容，请保持页面打开</p>
                      </div>
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md border bg-white shadow-sm transition-colors hover:text-red-600" style={{ borderColor: 'hsl(30 8% 90%)', color: 'hsl(20 8% 42%)' }}
                        aria-label="移除文件"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <img src={uploadedImage} alt="预览" className="mx-auto max-h-80 rounded-lg border object-contain shadow-sm" style={{ borderColor: 'hsl(30 8% 90%)' }} />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md border bg-white shadow-sm transition-colors hover:text-red-600" style={{ borderColor: 'hsl(30 8% 90%)', color: 'hsl(20 8% 42%)' }}
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
                  <div className="mt-4 rounded-lg border p-4 animate-fade-in" style={{ borderColor: 'hsl(15 55% 42% / 0.3)', background: 'hsl(15 55% 42% / 0.06)' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl shadow-md animate-pulse-glow" style={{ background: 'hsl(15 55% 42%)' }}>
                          <Volume2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'hsl(15 55% 42%)' }}>正在语音播报订餐信息</p>
                          <p className="text-xs" style={{ color: 'hsl(15 55% 42%)' }}>请仔细核对播报内容是否正确</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { stopSpeaking(); setSpeaking(false) }}
                        className="rounded-lg bg-white px-3 py-2 text-xs font-medium shadow-sm transition-colors hover:bg-[hsl(15,55%,42%,0.12)]" style={{ color: 'hsl(15 55% 42%)' }}
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
              <div className="space-y-5">
                <OCRResultTable htmlContent={ocrResult} />

                {extractedMeals.length > 0 && (
                  <div className="rounded-lg bg-white">
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                        <h4 className="text-base font-semibold text-foreground font-display">点餐内容</h4>
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
                            ? 'text-white shadow-md animate-pulse'
                            : 'bg-slate-100 hover:bg-[hsl(15,55%,42%,0.08)] hover:text-[hsl(15,55%,42%)]'
                        }`}
                        style={
                          speaking
                            ? { background: 'hsl(15 55% 42%)' }
                            : { color: 'hsl(20 8% 42%)' }
                        }
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
                    <div className="max-h-[520px] space-y-3 overflow-y-auto p-4">
                      {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map(day => {
                        const dayMeals = extractedMeals.filter(m => m.day === day)
                        if (dayMeals.length === 0) return null

                        return (
                          <div key={day} className="overflow-hidden rounded-lg">
                            {/* 星期标题 */}
                            <div className="flex items-center justify-between border-b bg-slate-50 px-3 py-2" style={{ borderColor: 'hsl(30 8% 90%)' }}>
                              <span className="text-sm font-semibold text-slate-800">{day}</span>
                              <span className="text-xs" style={{ color: 'hsl(20 8% 42%)' }}>{dayMeals.length} 个餐品</span>
                            </div>

                            {/* 餐品列表 */}
                            <div className="divide-y" style={{ borderColor: 'hsl(30 8% 90%)' }}>
                              {dayMeals.map((meal, idx) => {
                                // 找到原始索引
                                const originalIndex = extractedMeals.findIndex(m =>
                                  m.day === day && m.name === meal.name && m.subCategory === meal.subCategory
                                )

                                return (
                                  <div key={idx} className="group relative p-3 transition-colors hover:bg-slate-50">
                                    {/* 编辑和删除按钮 - 悬停时显示 */}
                                    <div className="absolute right-3 top-3 z-10 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                      <button
                                        type="button"
                                        onClick={() => startEditMeal(originalIndex)}
                                        className="rounded-md border bg-white px-2.5 py-1 text-xs font-medium shadow-sm transition-colors hover:text-blue-600"
                                        style={{ borderColor: 'hsl(30 8% 90%)', color: 'hsl(20 8% 42%)' }}
                                        title="编辑此餐品"
                                      >
                                        编辑
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => deleteMeal(originalIndex)}
                                        className="rounded-md border bg-white px-2.5 py-1 text-xs font-medium shadow-sm transition-colors hover:text-red-600"
                                        style={{ borderColor: 'hsl(30 8% 90%)', color: 'hsl(20 8% 42%)' }}
                                        title="删除此餐品"
                                      >
                                        删除
                                      </button>
                                    </div>

                                    <div className="flex items-start justify-between gap-2 pr-16">
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
                                        <div
                                          className="inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-base font-semibold"
                                          style={
                                            meal.quantity === 1
                                              ? { background: 'hsl(15 55% 42% / 0.08)', color: 'hsl(15 55% 42%)' }
                                              : meal.quantity <= 2
                                              ? { background: 'hsl(15 55% 42% / 0.15)', color: 'hsl(15 55% 42%)' }
                                              : { background: 'hsl(0 70% 45% / 0.08)', color: 'hsl(0 70% 45%)' }
                                          }
                                        >
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
                      className="mx-6 mb-6 flex w-[calc(100%-3rem)] items-center justify-center gap-2 rounded-lg border border-dashed py-3 text-sm font-medium transition-colors hover:border-[hsl(15,55%,42%)] hover:bg-[hsl(15,55%,42%,0.04)]"
                      style={{ borderColor: 'hsl(30 8% 90%)', color: 'hsl(20 8% 42%)' }}
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
                      <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4" style={{ borderColor: 'hsl(30 8% 90%)' }}>
                        <h3 className="text-lg font-semibold text-slate-950 font-display">编辑餐品</h3>
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
                            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                            style={{ borderColor: 'hsl(30 8% 90%)' }}
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
                            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                            style={{ borderColor: 'hsl(30 8% 90%)' }}
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
                            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                            style={{ borderColor: 'hsl(30 8% 90%)' }}
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
                            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                            style={{ borderColor: 'hsl(30 8% 90%)' }}
                          />
                        </div>

                        {/* 饮食标签 */}
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">饮食标签（可选，用逗号分隔）</label>
                          <input
                            type="text"
                            value={editingMealData.tags || ''}
                            onChange={(e) => setEditingMealData({ ...editingMealData, tags: e.target.value })}
                            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                            style={{ borderColor: 'hsl(30 8% 90%)' }}
                            placeholder="如: LSF, LS, GF"
                          />
                        </div>
                      </div>

                      <div className="sticky bottom-0 flex gap-3 border-t bg-slate-50 px-6 py-4" style={{ borderColor: 'hsl(30 8% 90%)' }}>
                        <button
                          type="button"
                          onClick={() => { setEditingMealIndex(null); setEditingMealData({}); }}
                          className="flex-1 rounded-md border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
                          style={{ borderColor: 'hsl(30 8% 90%)' }}
                        >
                          取消
                        </button>
                        <button
                          type="button"
                          onClick={saveEditedMeal}
                          className="flex-1 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
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
            <form onSubmit={handleSubmit} className="rounded-lg bg-white">
              <div className="px-4 py-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground font-display">
                  <User className="h-4 w-4" style={{ color: 'hsl(15 55% 40%)' }} />
                  联系信息
                </h3>
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">姓名 *</label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2"
                    style={{ borderColor: 'hsl(30 8% 90%)' }}
                    placeholder="请输入姓名"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">电话 *</label>
                  <input
                    type="tel"
                    required
                    value={formData.customerPhone}
                    onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2"
                    style={{ borderColor: 'hsl(30 8% 90%)' }}
                    placeholder="请输入联系电话"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">配送地址 *</label>
                  <textarea
                    required
                    value={formData.customerAddress}
                    onChange={e => setFormData({ ...formData, customerAddress: e.target.value })}
                    className="w-full resize-none rounded-md border px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2"
                    style={{ borderColor: 'hsl(30 8% 90%)' }}
                    rows={3}
                    placeholder="请输入详细配送地址"
                  />
                </div>

                <div className="rounded-lg border bg-slate-50 p-3" style={{ borderColor: 'hsl(30 8% 90%)' }}>
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: 'hsl(20 8% 42%)' }}>已识别餐品</span>
                    <span className="font-semibold text-slate-950">{extractedMeals.length} 项</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span style={{ color: 'hsl(20 8% 42%)' }}>预估金额</span>
                    <span className="font-semibold" style={{ color: 'hsl(15 55% 42%)' }}>
                      ${extractedMeals.reduce((sum, meal) => sum + meal.quantity * 25, 0)}
                    </span>
                  </div>
                </div>

                <p className="text-[10px] leading-4" style={{ color: 'hsl(20 8% 42%)' }}>联系信息会保存在本机，便于下次继续填写。</p>
              </div>

              <div className="px-4 py-3">
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-md bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  disabled={isRecognizing}
                >
                  提交订单
                </button>
              </div>
            </form>
          </aside>
        </div>
      </main>

      <TtsSettingsModal open={showTtsSettings} onClose={() => setShowTtsSettings(false)} />
    </div>
  )
}

