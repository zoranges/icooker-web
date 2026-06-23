/**
 * 阿里云 DashScope TTS 客户端
 * 使用 Qwen3-TTS 模型合成自然中文语音
 * 通过 Vite 代理调用，API Key 不暴露给前端
 */

// Qwen3-TTS 音色列表
export const DashScopeVoices = {
  // ── 中文普通话 ──
  Cherry: 'Cherry',       // 芊悦 - 温暖亲切女声
  Serena: 'Serena',       // 苏瑶 - 知性温柔女声
  Ethan: 'Ethan',         // 晨煦 - 阳光暖男声
  Chelsie: 'Chelsie',     // 千雪 - 二次元虚拟女友
  Momo: 'Momo',           // 茉兔 - 撒娇搞怪
  Vivian: 'Vivian',       // 十三 - 拽拽可爱小暴躁
  Moon: 'Moon',           // 月白 - 率性帅气男声
  Maia: 'Maia',           // 四月 - 知性温柔女声
  Kai: 'Kai',             // 凯 - 耳朵SPA男声
  Nofish: 'Nofish',       // 不吃鱼 - 不会翘舌音的设计师
  Bella: 'Bella',         // 萌宝 - 小萝莉
  EldricSage: 'Eldric Sage',  // 沧明子 - 沉稳睿智老者
  Mia: 'Mia',             // 乖小妹
  Mochi: 'Mochi',         // 沙小弥 - 聪明伶俐小大人
  Bellona: 'Bellona',     // 燕铮莺 - 洪亮字正腔圆
  Vincent: 'Vincent',     // 田叔 - 沙哑烟嗓
  Bunny: 'Bunny',         // 萌小姬 - 萌属性小萝莉
  Neil: 'Neil',           // 阿闻 - 专业新闻主持人
  Elias: 'Elias',         // 墨讲师
  Arthur: 'Arthur',       // 徐大爷 - 质朴岁月沉淀
  Nini: 'Nini',           // 邻家妹妹
  Seren: 'Seren',         // 小婉 - 温和舒缓
  Pip: 'Pip',             // 顽屁小孩
  Stella: 'Stella',       // 少女阿月 - 甜腻少女

  // ── 方言 ──
  Jada: 'Jada',           // 上海话·阿珍（女）
  Dylan: 'Dylan',         // 北京话·晓东（男）
  Li: 'Li',               // 南京话·老李（男）
  Marcus: 'Marcus',       // 陕西话·秦川（男）
  Rocky: 'Rocky',         // 粤语·阿强（男）
  Kiki: 'Kiki',           // 粤语·阿清（女）
  Roy: 'Roy',             // 闽南语·阿杰（男）
  Peter: 'Peter',         // 天津话·李彼得（男）
  Sunny: 'Sunny',         // 四川话·晴儿（女）
  Eric: 'Eric',           // 四川话·程川（男）

  // ── 外语 ──
  Jennifer: 'Jennifer',   // 詹妮弗 - 美语女声
  Ryan: 'Ryan',           // 甜茶 - 英语男声
  Sohee: 'Sohee',         // 素熙 - 韩语女声
  OnoAnna: 'Ono Anna',    // 小野杏 - 日语女声
  Emilien: 'Emilien',     // 埃米尔安 - 法语男声
} as const

export type DashScopeVoiceName = keyof typeof DashScopeVoices

// 音色分组信息（用于设置面板分组展示）
export const VoiceGroups: Record<string, { label: string; voices: DashScopeVoiceName[] }> = {
  mandarin: {
    label: '普通话',
    voices: ['Cherry', 'Serena', 'Ethan', 'Chelsie', 'Momo', 'Vivian', 'Moon', 'Maia', 'Kai', 'Nofish', 'Bella', 'EldricSage', 'Mia', 'Mochi', 'Bellona', 'Vincent', 'Bunny', 'Neil', 'Elias', 'Arthur', 'Nini', 'Seren', 'Pip', 'Stella'],
  },
  dialect: {
    label: '方言',
    voices: ['Jada', 'Dylan', 'Li', 'Marcus', 'Rocky', 'Kiki', 'Roy', 'Peter', 'Sunny', 'Eric'],
  },
  foreign: {
    label: '外语',
    voices: ['Jennifer', 'Ryan', 'Sohee', 'OnoAnna', 'Emilien'],
  },
}

// 音色中文名称映射
export const VoiceLabels: Record<DashScopeVoiceName, string> = {
  Cherry: '芊悦', Serena: '苏瑶', Ethan: '晨煦', Chelsie: '千雪',
  Momo: '茉兔', Vivian: '十三', Moon: '月白', Maia: '四月', Kai: '凯',
  Nofish: '不吃鱼', Bella: '萌宝', EldricSage: '沧明子', Mia: '乖小妹',
  Mochi: '沙小弥', Bellona: '燕铮莺', Vincent: '田叔', Bunny: '萌小姬',
  Neil: '阿闻', Elias: '墨讲师', Arthur: '徐大爷', Nini: '邻家妹妹',
  Seren: '小婉', Pip: '顽屁小孩', Stella: '少女阿月',
  Jada: '上海话·阿珍', Dylan: '北京话·晓东', Li: '南京话·老李',
  Marcus: '陕西话·秦川', Rocky: '粤语·阿强', Kiki: '粤语·阿清',
  Roy: '闽南语·阿杰', Peter: '天津话·李彼得', Sunny: '四川话·晴儿', Eric: '四川话·程川',
  Jennifer: 'Jennifer·美语', Ryan: 'Ryan·英语', Sohee: '素熙·韩语',
  OnoAnna: '小野杏·日语', Emilien: 'Emilien·法语',
}

// 音色描述映射
export const VoiceDescs: Partial<Record<DashScopeVoiceName, string>> = {
  Cherry: '温暖亲切，推荐用于老人服务',
  Ethan: '阳光温暖男声，字正腔圆',
  EldricSage: '沉稳睿智的老者嗓音',
  Arthur: '质朴嗓音，岁月沉淀',
  Seren: '温和舒缓，适合助眠',
  Neil: '专业新闻播报风格',
}

interface TtsOptions {
  text: string
  voice?: DashScopeVoiceName
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: Error) => void
}

// ========== 持久化 Audio 元素 ==========
// 关键：整个模块共用同一个 HTMLAudioElement，
// 在用户手势（click/touch）中解锁后，后续所有播放都复用此元素，
// 避免 new Audio() 在异步上下文中被浏览器自动播放策略拦截。
let audioPlayer: HTMLAudioElement | null = null
let audioUnlocked = false

/** 获取（懒创建）持久化 Audio 元素 */
function getAudioPlayer(): HTMLAudioElement {
  if (!audioPlayer) {
    audioPlayer = new Audio()
    // preload=none 避免不必要的网络请求
    audioPlayer.preload = 'none'
  }
  return audioPlayer
}

/**
 * 在用户手势中调用此函数解锁音频播放权限
 * 必须在 click/touch 事件处理器中同步调用
 *
 * 原理：在用户手势上下文中对同一个 Audio 元素调用 play()，
 * 浏览器会将该元素标记为"已解锁"，后续即使异步调用 play() 也不会被拦截。
 */
export function unlockAudio(): void {
  if (audioUnlocked) return
  const player = getAudioPlayer()
  try {
    // 播放一个极短的静音 WAV 来解锁此 Audio 元素
    player.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2LkY2Ff3V1goqOjIZ+dXF8hIyQjoiAd211fYaOkpCKgnlwc3yGj5KRi4R7cHB7hI2SkouFe3Bwe4SNkpKLhHtwcHuEjZKSi4R7cHB7hI2Skos='
    player.volume = 0.01
    player.play().then(() => {
      audioUnlocked = true
      console.log('[DashTTS] 音频播放权限已解锁（持久化元素）')
    }).catch(() => {})
  } catch {
    // 忽略
  }
}

/**
 * 调用 DashScope API 合成语音，返回音频 Blob URL
 * 只包含网络请求阶段（API 调用 + 音频下载），不包含播放
 */
export async function dashFetchAudio(text: string, voice: DashScopeVoiceName = 'Cherry', language = 'Chinese'): Promise<string> {
  const voiceId = DashScopeVoices[voice] || DashScopeVoices.Cherry

  console.log(`[DashTTS] 开始合成语音，文本长度: ${text.length}，音色: ${voiceId}`)

  // ① 调用 TTS API（通过 Vite 代理）
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen3-tts-flash',
      input: {
        text,
        voice: voiceId,
        language_type: language,
      },
    }),
  })

  if (!response.ok) {
    const errBody = await response.text().catch(() => '')
    throw new Error(`TTS API 请求失败 (${response.status}): ${errBody.substring(0, 200)}`)
  }

  const data = await response.json()

  // ② 提取音频 URL
  const audioUrl = data?.output?.audio?.url

  if (!audioUrl) {
    console.error('[DashTTS] 响应中未找到音频 URL:', JSON.stringify(data).substring(0, 500))
    throw new Error('TTS 响应中未找到音频 URL')
  }

  console.log('[DashTTS] 音频 URL 获取成功，开始下载')

  // ③ 下载音频
  const audioResponse = await fetch(audioUrl)
  if (!audioResponse.ok) {
    throw new Error(`音频下载失败 (${audioResponse.status})`)
  }

  const audioBlob = await audioResponse.blob()
  return URL.createObjectURL(audioBlob)
}

/**
 * 播放已获取的音频 Blob URL
 */
export function dashPlayAudio(blobUrl: string, options: {
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: Error) => void
}): Promise<void> {
  const { onStart, onEnd, onError } = options

  const player = getAudioPlayer()
  player.src = blobUrl
  player.volume = 1.0

  onStart?.()

  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      URL.revokeObjectURL(blobUrl)
      player.onended = null
      player.onerror = null
    }

    player.onended = () => {
      cleanup()
      onEnd?.()
      resolve()
    }

    player.onerror = () => {
      cleanup()
      const err = new Error('音频播放失败')
      onError?.(err)
      reject(err)
    }

    player.play().catch(err => {
      cleanup()
      console.error('[DashTTS] play() 被拒绝:', err.message, '已解锁:', audioUnlocked)
      onError?.(err)
      reject(err)
    })
  })
}

/**
 * 使用 DashScope Qwen3-TTS 合成并播放语音
 */
export async function dashSpeak(options: TtsOptions): Promise<void> {
  const { text, voice = 'Cherry', onStart, onEnd, onError } = options

  if (!text.trim()) return

  // 停止之前的播放
  dashStop()

  try {
    const blobUrl = await dashFetchAudio(text, voice)
    await dashPlayAudio(blobUrl, { onStart, onEnd, onError })
  } catch (err) {
    const error = err instanceof Error ? err : new Error('DashScope TTS 合成失败')
    console.error('[DashTTS] 错误:', error.message)
    onError?.(error)
    throw error
  }
}

/**
 * 停止播放
 */
export function dashStop(): void {
  if (audioPlayer) {
    audioPlayer.pause()
    audioPlayer.currentTime = 0
    audioPlayer.onended = null
    audioPlayer.onerror = null
  }
}

/**
 * 是否正在播放
 */
export function dashIsPlaying(): boolean {
  return audioPlayer !== null && !audioPlayer.paused && audioPlayer.currentTime > 0
}
