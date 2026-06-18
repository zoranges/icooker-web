/**
 * 阿里云 DashScope TTS 客户端
 * 使用 Qwen3-TTS 模型合成自然中文语音
 * 通过 Vite 代理调用，API Key 不暴露给前端
 */

// Qwen3-TTS 可用音色（温暖女声优先）
export const DashScopeVoices = {
  // 温暖亲切女声（推荐用于老人服务）
  Cherry: 'Cherry',
  // 知性女声
  Serena: 'Serena',
  // 活力女声
  Ethan: 'Ethan',
  // 温暖男声
  Chelsie: 'Chelsie',
} as const

export type DashScopeVoiceName = keyof typeof DashScopeVoices

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
 * 使用 DashScope Qwen3-TTS 合成并播放语音
 */
export async function dashSpeak(options: TtsOptions): Promise<void> {
  const {
    text,
    voice = 'Cherry',
    onStart,
    onEnd,
    onError,
  } = options

  if (!text.trim()) return

  // 停止之前的播放
  dashStop()

  const voiceId = DashScopeVoices[voice] || DashScopeVoices.Cherry

  try {
    // ① 调用 TTS API（通过 Vite 代理）
    console.log(`[DashTTS] 开始合成语音，文本长度: ${text.length}，音色: ${voiceId}`)

    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen3-tts-flash',
        input: {
          text,
          voice: voiceId,
          language_type: 'Chinese',
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

    console.log('[DashTTS] 音频 URL 获取成功，开始下载播放')

    // ③ 下载音频
    const audioResponse = await fetch(audioUrl)
    if (!audioResponse.ok) {
      throw new Error(`音频下载失败 (${audioResponse.status})`)
    }

    const audioBlob = await audioResponse.blob()
    const blobUrl = URL.createObjectURL(audioBlob)

    // ④ 复用已解锁的持久化 Audio 元素（关键修复）
    const player = getAudioPlayer()
    player.src = blobUrl
    player.volume = 1.0

    onStart?.()

    await new Promise<void>((resolve, reject) => {
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
