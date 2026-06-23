/**
 * Edge TTS 客户端
 * 使用微软 Edge 浏览器的 TTS WebSocket 服务
 * 提供接近真人音色的中文语音（晓晓 Xiaoxiao 等）
 * 
 * 原理：复用 Edge 浏览器的 TTS WebSocket 接口，
 * 无需 API Key，音色质量远高于 Web Speech API
 */

// Edge TTS 服务端点（通过 Vite 代理避免 CORS）
// 动态检测当前页面的 host 和协议，自动适配端口
const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
const EDGE_TTS_PROXY_URL = `${WS_PROTOCOL}//${window.location.host}/edge-tts`
const EDGE_TTS_DIRECT_URL = 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1'
const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4'

// 可用的中文语音
export const EdgeVoices = {
  // 女声 - 温暖亲切（推荐）
  Xiaoxiao: 'zh-CN-XiaoxiaoNeural',
  // 女声 - 活泼
  Xiaoyi: 'zh-CN-XiaoyiNeural',
  // 男声 - 沉稳
  Yunxi: 'zh-CN-YunxiNeural',
  // 男声 - 新闻播报风格
  Yunyang: 'zh-CN-YunyangNeural',
  // 男声 - 阳光
  Yunjian: 'zh-CN-YunjianNeural',
} as const

export type EdgeVoiceName = keyof typeof EdgeVoices

interface SpeakOptions {
  text: string
  voice?: EdgeVoiceName
  rate?: string    // 语速，如 "+0%", "-10%", "+20%"
  pitch?: string   // 音调，如 "+0Hz", "-50Hz", "+50Hz"
  volume?: string  // 音量，如 "+0%", "-50%", "+50%"
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: Error) => void
}

// 生成 GUID
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// 获取当前时间戳（Edge TTS 格式）
function getTimestamp(): string {
  const now = new Date()
  return now.toISOString().replace('T', ' ').replace(/\.\d+Z/, ' UTC')
}

// 构建 SSML
function buildSSML(
  text: string,
  voice: string,
  rate: string = '-5%',
  pitch: string = '+0Hz',
  volume: string = '+0%'
): string {
  return (
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">` +
    `<voice name="${voice}">` +
    `<prosody rate="${rate}" pitch="${pitch}" volume="${volume}">` +
    escapeXml(text) +
    `</prosody></voice></speak>`
  )
}

// XML 转义
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// 当前连接和音频状态
let currentWs: WebSocket | null = null
let currentAudio: HTMLAudioElement | null = null

/**
 * 使用 Edge TTS 合成并播放语音
 */
export async function edgeSpeak(options: SpeakOptions): Promise<void> {
  const {
    text,
    voice = 'Xiaoxiao',
    rate = '-5%',
    pitch = '+0Hz',
    volume = '+0%',
    onStart,
    onEnd,
    onError,
  } = options

  if (!text.trim()) return

  // 停止之前的播放
  edgeStop()

  const voiceName = EdgeVoices[voice] || EdgeVoices.Xiaoxiao
  const connectionId = generateId()

  return new Promise<void>((resolve, reject) => {
    const audioChunks: ArrayBuffer[] = []
    let settled = false

    // 尝试连接：先代理，后直连
    const urls = [EDGE_TTS_PROXY_URL, EDGE_TTS_DIRECT_URL]
    let urlIndex = 0

    function tryConnect(): void {
      if (urlIndex >= urls.length) {
        const err = new Error('Edge TTS 所有连接方式均失败')
        onError?.(err)
        reject(err)
        return
      }

      const baseUrl = urls[urlIndex]
      const wsUrl = `${baseUrl}?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&ConnectionId=${connectionId}`
      console.log(`[Edge TTS] 尝试连接: ${baseUrl === EDGE_TTS_PROXY_URL ? '代理' : '直连'}`)

      let ws: WebSocket
      try {
        ws = new WebSocket(wsUrl)
      } catch (e) {
        console.warn(`[Edge TTS] WebSocket 创建失败，尝试下一种方式`)
        urlIndex++
        tryConnect()
        return
      }

      ws.binaryType = 'arraybuffer'
      currentWs = ws

      // 连接超时 - 5 秒内未连接则尝试下一种方式
      const timeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.warn(`[Edge TTS] 连接超时，尝试下一种方式`)
          ws.close()
          urlIndex++
          tryConnect()
        }
      }, 5000)

      ws.onopen = () => {
        clearTimeout(timeout)
        // 1. 发送配置
        const configMsg = [
          `X-Timestamp:${getTimestamp()}`,
          'Content-Type:application/json; charset=utf-8',
          'Path:speech.config',
          '',
          JSON.stringify({
            context: {
              synthesis: {
                audio: {
                  metadataoptions: {
                    sentenceBoundaryEnabled: 'false',
                    wordBoundaryEnabled: 'false',
                  },
                  outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
                },
              },
            },
          }),
        ].join('\r\n')
        ws.send(configMsg)

        // 2. 发送 SSML
        const ssml = buildSSML(text, voiceName, rate, pitch, volume)
        const requestId = generateId()
        const ssmlMsg = [
          `X-RequestId:${requestId}`,
          'Content-Type:application/ssml+xml',
          `Path:ssml`,
          `X-Timestamp:${getTimestamp()}`,
          '',
          ssml,
        ].join('\r\n')
        ws.send(ssmlMsg)
      }

      ws.onmessage = (event: MessageEvent) => {
        if (typeof event.data === 'string') {
          // 文本消息 - 解析 header
          const msg = event.data as string
          if (msg.includes('Path:turn.start')) {
            onStart?.()
          } else if (msg.includes('Path:turn.end')) {
            // TTS 完成，播放音频
            if (audioChunks.length > 0) {
              playAudioChunks(audioChunks, onEnd, onError)
            }
            ws.close()
            if (!settled) { settled = true; resolve() }
          } else if (msg.includes('Path:response')) {
            // 服务器响应确认
          }
        } else if (event.data instanceof ArrayBuffer) {
          // 二进制消息 - 音频数据
          const buffer = event.data
          // Edge TTS 二进制消息格式：
          // 2 bytes header length (big-endian) + header + audio data
          const view = new DataView(buffer)
          const headerLength = view.getUint16(0)
          const audioData = buffer.slice(2 + headerLength)
          if (audioData.byteLength > 0) {
            audioChunks.push(audioData)
          }
        }
      }

      ws.onerror = () => {
        clearTimeout(timeout)
        console.warn(`[Edge TTS] ${baseUrl === EDGE_TTS_PROXY_URL ? '代理' : '直连'}连接失败`)
        ws.close()
        urlIndex++
        tryConnect()
      }

      ws.onclose = () => {
        clearTimeout(timeout)
        currentWs = null
      }
    }

    tryConnect()
  })
}

// 播放音频数据
function playAudioChunks(
  chunks: ArrayBuffer[],
  onEnd?: () => void,
  onError?: (err: Error) => void
): void {
  try {
    const totalLength = chunks.reduce((sum, c) => sum + c.byteLength, 0)
    const merged = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of chunks) {
      merged.set(new Uint8Array(chunk), offset)
      offset += chunk.byteLength
    }

    const blob = new Blob([merged], { type: 'audio/mp3' })
    const url = URL.createObjectURL(blob)

    const audio = new Audio(url)
    currentAudio = audio

    audio.onended = () => {
      URL.revokeObjectURL(url)
      currentAudio = null
      onEnd?.()
    }

    audio.onerror = () => {
      URL.revokeObjectURL(url)
      currentAudio = null
      onError?.(new Error('音频播放失败'))
    }

    audio.play().catch(err => {
      URL.revokeObjectURL(url)
      currentAudio = null
      onError?.(err instanceof Error ? err : new Error('音频播放被阻止'))
    })
  } catch (err) {
    onError?.(err instanceof Error ? err : new Error('音频处理失败'))
  }
}

/**
 * 停止播放
 */
export function edgeStop(): void {
  if (currentWs) {
    currentWs.close()
    currentWs = null
  }
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
  }
}

/**
 * 是否正在播放
 */
export function edgeIsPlaying(): boolean {
  return currentWs !== null || currentAudio !== null
}
