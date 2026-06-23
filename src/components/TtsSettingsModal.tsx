import { useState } from 'react'
import { X, Settings, Check, Volume2 } from 'lucide-react'
import { VoiceGroups, VoiceLabels, VoiceDescs, dashFetchAudio } from '../utils/dashscopeTts'
import { getTtsSettings, saveTtsSettings, TtsSettings } from '../utils/ttsSettings'

interface Props {
  open: boolean
  onClose: () => void
}

const LANGUAGES: { value: TtsSettings['language']; label: string }[] = [
  { value: 'Chinese', label: '中文' },
  { value: 'English', label: 'English' },
  { value: 'Japanese', label: '日本語' },
  { value: 'Korean', label: '한국어' },
  { value: 'French', label: 'Français' },
]

export default function TtsSettingsModal({ open, onClose }: Props) {
  const [settings, setSettings] = useState<TtsSettings>(getTtsSettings)
  const [testing, setTesting] = useState(false)

  if (!open) return null

  const handleSave = () => {
    saveTtsSettings(settings)
    onClose()
  }

  const handleTest = async () => {
    setTesting(true)
    try {
      const testText = settings.language === 'Chinese' ? '您好，这是语音测试。' :
                        settings.language === 'English' ? 'Hello, this is a voice test.' :
                        settings.language === 'Japanese' ? 'こんにちは、音声テストです。' :
                        settings.language === 'Korean' ? '안녕하세요, 음성 테스트입니다.' :
                        'Bonjour, ceci est un test vocal.'
      const { dashPlayAudio } = await import('../utils/dashscopeTts')
      const blobUrl = await dashFetchAudio(testText, settings.voice, settings.language)
      await dashPlayAudio(blobUrl, {
        onStart: () => {},
        onEnd: () => setTesting(false),
        onError: () => setTesting(false),
      })
    } catch {
      setTesting(false)
    }
  }

  const primaryColor = 'hsl(15 55% 42%)'
  const borderColor = 'hsl(30 8% 90%)'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 backdrop-blur-sm" style={{ background: 'hsl(20 12% 10% / 0.35)' }}>
      <div className="mx-4 w-full max-w-lg overflow-hidden rounded-lg border bg-white shadow-xl" style={{ borderColor }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${borderColor}` }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl shadow-sm" style={{ background: `linear-gradient(135deg, ${primaryColor}, hsl(32 35% 48%))` }}>
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-display text-lg text-foreground">语音设置</h2>
              <p className="text-xs" style={{ color: 'hsl(20 8% 48%)' }}>调整 TTS 音色与语言</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-slate-100"
            style={{ color: 'hsl(20 8% 55%)' }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[65vh] space-y-5 overflow-y-auto p-6">
          {/* Language */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">播报语言</label>
            <div className="grid grid-cols-3 gap-2">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.value}
                  onClick={() => setSettings({ ...settings, language: lang.value })}
                  className="rounded-lg border px-3 py-2 text-xs font-medium transition-all"
                  style={{
                    borderColor: settings.language === lang.value ? primaryColor : borderColor,
                    background: settings.language === lang.value ? `${primaryColor}10` : 'white',
                    color: settings.language === lang.value ? primaryColor : 'hsl(20 8% 45%)',
                    boxShadow: settings.language === lang.value ? `0 0 0 1px ${primaryColor}20` : 'none',
                  }}
                >
                  {settings.language === lang.value && <Check className="mr-1 inline h-3 w-3" />}
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Voice */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">播报音色</label>
            {Object.entries(VoiceGroups).map(([groupKey, group]) => (
              <div key={groupKey} className="mb-3">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(20 8% 55%)' }}>{group.label}</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {group.voices.map(voiceName => {
                    const selected = settings.voice === voiceName
                    const desc = VoiceDescs[voiceName]
                    return (
                      <button
                        key={voiceName}
                        onClick={() => setSettings({ ...settings, voice: voiceName })}
                        className="rounded-lg border px-2 py-2 text-left text-xs transition-all"
                        style={{
                          borderColor: selected ? primaryColor : 'hsl(30 12% 90%)',
                          background: selected ? `${primaryColor}0A` : 'white',
                          color: selected ? primaryColor : 'hsl(20 8% 45%)',
                          boxShadow: selected ? `0 0 0 1px ${primaryColor}15` : 'none',
                        }}
                        title={desc}
                      >
                        <div className="flex items-center gap-1">
                          {selected && <Check className="h-3 w-3 flex-shrink-0" style={{ color: primaryColor }} />}
                          <span className="truncate font-medium">{VoiceLabels[voiceName] || voiceName}</span>
                        </div>
                        <div className="mt-0.5 truncate text-[10px]" style={{ color: 'hsl(20 8% 60%)' }}>{voiceName}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4" style={{ borderTop: `1px solid ${borderColor}`, background: 'hsl(30 12% 96%)' }}>
          <button
            onClick={handleTest}
            disabled={testing}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
            style={{ borderColor: 'hsl(30 12% 85%)', color: 'hsl(20 12% 30%)' }}
          >
            <Volume2 className="h-4 w-4" />
            {testing ? '试听中...' : '试听'}
          </button>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-200/50"
            style={{ color: 'hsl(20 8% 45%)' }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:opacity-90"
            style={{ background: 'hsl(20 12% 15%)' }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
