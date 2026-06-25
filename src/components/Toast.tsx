import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: number
  type: ToastType
  title: string
  message?: string
  duration: number
}

let nextId = 0
const listeners = new Set<(toast: ToastItem) => void>()

function notify(toast: ToastItem) {
  listeners.forEach(fn => fn(toast))
}

function show(type: ToastType, title: string, message?: string, duration = 4000) {
  const toast: ToastItem = { id: nextId++, type, title, message, duration }
  notify(toast)
}

export const toast = {
  success: (title: string, message?: string) => show('success', title, message),
  error: (title: string, message?: string) => show('error', title, message, 6000),
  warning: (title: string, message?: string) => show('warning', title, message, 5000),
  info: (title: string, message?: string) => show('info', title, message),
}

const iconMap = {
  success: { icon: CheckCircle, bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-600', title: 'text-emerald-900' },
  error: { icon: XCircle, bg: 'bg-red-50 border-red-200', text: 'text-red-500', title: 'text-red-900' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50 border-amber-200', text: 'text-amber-500', title: 'text-amber-900' },
  info: { icon: Info, bg: 'bg-blue-50 border-blue-200', text: 'text-blue-500', title: 'text-blue-900' },
}

function ToastCard({ toast: t, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  useEffect(() => {
    if (t.duration > 0) {
      const timer = setTimeout(() => onDismiss(t.id), t.duration)
      return () => clearTimeout(timer)
    }
  }, [t.id, t.duration, onDismiss])

  const style = iconMap[t.type]
  const Icon = style.icon

  return (
    <div className="flex items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg animate-slide-in-right" style={{ minWidth: 320, maxWidth: 420 }}>
      <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${style.bg}`}>
        <Icon className={`h-4 w-4 ${style.text}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${style.title}`}>{t.title}</p>
        {t.message && <p className="mt-0.5 text-xs text-slate-600 whitespace-pre-line">{t.message}</p>}
      </div>
      <button onClick={() => onDismiss(t.id)} className="shrink-0 rounded-md p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    const handler = (toast: ToastItem) => {
      setToasts(prev => [...prev.slice(-4), toast])
    }
    listeners.add(handler)
    return () => { listeners.delete(handler) }
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  if (toasts.length === 0) return null

  return createPortal(
    <div className="pointer-events-none fixed right-4 top-4 z-[9999] flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastCard toast={t} onDismiss={dismiss} />
        </div>
      ))}
    </div>,
    document.body
  )
}

// ── ConfirmDialog ──

interface ConfirmState {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  resolve: ((value: boolean) => void) | null
}

let confirmListeners = new Set<(state: ConfirmState) => void>()
let currentConfirmState: ConfirmState = {
  open: false, title: '', message: '', confirmLabel: '确定', cancelLabel: '取消', resolve: null,
}

function setConfirmState(partial: Partial<ConfirmState>) {
  currentConfirmState = { ...currentConfirmState, ...partial }
  confirmListeners.forEach(fn => fn(currentConfirmState))
}

export function confirmDialog(
  title: string,
  message: string,
  options?: { confirmLabel?: string; cancelLabel?: string }
): Promise<boolean> {
  return new Promise(resolve => {
    setConfirmState({
      open: true,
      title,
      message,
      confirmLabel: options?.confirmLabel ?? '确定',
      cancelLabel: options?.cancelLabel ?? '取消',
      resolve,
    })
  })
}

export function ConfirmDialog() {
  const [state, setState] = useState(currentConfirmState)

  useEffect(() => {
    const handler = (s: ConfirmState) => setState({ ...s })
    confirmListeners.add(handler)
    return () => { confirmListeners.delete(handler) }
  }, [])

  const handleAction = (result: boolean) => {
    state.resolve?.(result)
    setConfirmState({ open: false, resolve: null })
  }

  if (!state.open) return null

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => handleAction(false)}>
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-bold text-slate-900">{state.title}</h3>
        <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{state.message}</p>
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            onClick={() => handleAction(false)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {state.cancelLabel}
          </button>
          <button
            onClick={() => handleAction(true)}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700"
          >
            {state.confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
