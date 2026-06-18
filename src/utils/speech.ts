/**
 * 语音播报工具
 * 主方案：阿里云 DashScope CosyVoice（自然中文音色）
 * 降级方案：Web Speech API（浏览器内置）
 */

import { dashSpeak, dashStop, dashIsPlaying, unlockAudio, DashScopeVoiceName } from './dashscopeTts'

// 检查浏览器是否支持 Web Speech API
export function isSpeechSupported(): boolean {
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
}

// 当前播放状态
let usingDashTts = false
let localUtterance: SpeechSynthesisUtterance | null = null

/**
 * 播报餐品信息
 * 优先使用 DashScope CosyVoice（自然音色），失败时降级到本地语音
 */
export function speakMealInfo(
  meals: { name: string; day: string; quantity: number; subCategory?: string }[],
  customerName?: string,
  onEnd?: () => void
): void {
  // 停止正在播放的内容
  stopSpeaking()

  const text = buildMealAnnouncement(meals, customerName)
  if (!text) return

  // 优先尝试 DashScope TTS
  speakWithDashTts(text, onEnd).catch(() => {
    // DashScope 失败，清理并降级到本地语音
    dashStop()
    usingDashTts = false
    console.warn('[语音] DashScope TTS 不可用，降级到本地语音')
    speakWithLocalTts(text, onEnd)
  })
}

/**
 * 使用 DashScope CosyVoice 播报（带超时保护）
 */
async function speakWithDashTts(text: string, onEnd?: () => void): Promise<void> {
  usingDashTts = true

  // 超时保护：15 秒内未完成则放弃
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('DashScope TTS 连接超时')), 15000)
  })

  await Promise.race([
    dashSpeak({
      text,
      voice: 'Cherry' as DashScopeVoiceName,
      onStart: () => {
        console.log('[语音] DashScope Qwen3-TTS 开始播报')
      },
      onEnd: () => {
        usingDashTts = false
        onEnd?.()
      },
      onError: (err) => {
        console.warn('[语音] DashScope TTS 错误:', err.message)
        usingDashTts = false
      },
    }),
    timeoutPromise,
  ])
}

/**
 * 使用本地 Web Speech API 播报（降级方案）
 */
function speakWithLocalTts(text: string, onEnd?: () => void): void {
  if (!isSpeechSupported()) return

  const utterance = new SpeechSynthesisUtterance(text)
  localUtterance = utterance

  // 尝试选择中文语音
  const voices = window.speechSynthesis.getVoices()
  const zhVoice = voices.find(v => v.lang === 'zh-CN')
    || voices.find(v => v.lang.startsWith('zh'))
    || null
  if (zhVoice) utterance.voice = zhVoice

  utterance.lang = 'zh-CN'
  utterance.rate = 0.85
  utterance.pitch = 1.0
  utterance.volume = 1.0

  utterance.onend = () => {
    localUtterance = null
    onEnd?.()
  }

  utterance.onerror = () => {
    localUtterance = null
    onEnd?.()
  }

  window.speechSynthesis.speak(utterance)
}

/**
 * 构建播报文本
 */
function buildMealAnnouncement(
  meals: { name: string; day: string; quantity: number; subCategory?: string }[],
  customerName?: string
): string {
  if (meals.length === 0) return ''

  const parts: string[] = []

  // 开头问候
  if (customerName) {
    parts.push(`${customerName}，您好！`)
  } else {
    parts.push('您好！')
  }
  parts.push('以下是您本次的订餐信息：')

  // 按星期分组
  const dayGroups: Record<string, typeof meals> = {}
  meals.forEach(meal => {
    if (!dayGroups[meal.day]) dayGroups[meal.day] = []
    dayGroups[meal.day].push(meal)
  })

  // 按星期顺序播报
  const dayOrder = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  for (const day of dayOrder) {
    const dayMeals = dayGroups[day]
    if (!dayMeals || dayMeals.length === 0) continue

    const mealDescs = dayMeals.map(m => {
      const qty = m.quantity > 1 ? `${m.quantity}份` : '一份'
      return `${qty}${m.name}`
    })

    parts.push(`${day}，${mealDescs.join('，')}。`)
  }

  // 结尾汇总
  const totalItems = meals.reduce((sum, m) => sum + m.quantity, 0)
  const dayCount = Object.keys(dayGroups).length
  parts.push(`一共${dayCount}天，${totalItems}个餐品。`)
  parts.push('请您确认，谢谢！')

  return parts.join('')
}

/**
 * 停止播报
 */
export function stopSpeaking(): void {
  // 停止 DashScope TTS
  dashStop()
  usingDashTts = false

  // 停止本地语音
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    localUtterance = null
  }
}

/**
 * 是否正在播报
 */
export function isSpeaking(): boolean {
  return dashIsPlaying() || ('speechSynthesis' in window && window.speechSynthesis.speaking)
}

// 重新导出音频解锁函数
export { unlockAudio }
