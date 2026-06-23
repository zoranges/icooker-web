import { Order } from '../store'
import { CheckCircle, Clock, Truck, Factory, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface Props {
  order: Order
  collapsed?: boolean
}

export default function OrderInvoice({ order, collapsed: initialCollapsed }: Props) {
  const [collapsed, setCollapsed] = useState(initialCollapsed ?? false)

  const steps: { label: string; icon: React.ElementType; date?: string; active: boolean; done: boolean }[] = [
    { label: '创建', icon: Clock, date: order.createdAt, active: true, done: true },
    { label: '审核', icon: CheckCircle, date: order.approvedAt, active: order.status !== 'pending', done: order.status !== 'pending' && order.status !== 'rejected' },
    { label: '生产', icon: Factory, date: undefined, active: order.status === 'processing' || order.status === 'completed' || order.status === 'delivered', done: order.status === 'completed' || order.status === 'delivered' },
    { label: '配送', icon: Truck, date: undefined, active: order.status === 'delivered', done: order.status === 'delivered' },
    { label: '送达', icon: CheckCircle, date: undefined, active: order.status === 'delivered', done: order.status === 'delivered' },
  ]

  const borderColor = 'hsl(30 8% 90%)'
  const mutedText = 'hsl(20 8% 48%)'

  return (
    <div className="overflow-hidden rounded-lg border bg-white print:border-none" style={{ borderColor }}>
      {/* Header */}
      <div className="px-6 py-5" style={{ borderBottom: `2px solid hsl(20 12% 15%)` }}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl tracking-tight text-foreground">iCooker 智慧养老餐饮</h2>
            <p className="mt-0.5 text-sm font-semibold" style={{ color: 'hsl(20 12% 25%)' }}>订餐单据</p>
            <p className="mt-1 text-xs" style={{ color: mutedText }}>编号: {order.id}</p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: mutedText }}>日期</p>
            <p className="text-sm font-semibold text-foreground">{new Date(order.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <StatusBadge status={order.status} />
          </div>
        </div>
      </div>

      {/* Parties */}
      <div className="grid border-b sm:grid-cols-2 sm:divide-x" style={{ borderColor }}>
        <div className="px-6 py-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: mutedText }}>订餐人</p>
          <p className="text-sm font-bold text-foreground">{order.customerName}</p>
          <p className="mt-0.5 text-xs" style={{ color: mutedText }}>{order.customerPhone}</p>
          {order.customerAddress && <p className="mt-0.5 text-xs" style={{ color: 'hsl(20 8% 55%)' }}>{order.customerAddress}</p>}
        </div>
        <div className="px-6 py-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: mutedText }}>服务信息</p>
          {order.serviceName ? (
            <>
              <p className="text-sm font-bold" style={{ color: 'hsl(270 30% 42%)' }}>🏢 {order.serviceName}</p>
              {order.distributorName && <p className="mt-0.5 text-xs" style={{ color: mutedText }}>🚚 分销: {order.distributorName}</p>}
              {order.factoryName && <p className="mt-0.5 text-xs" style={{ color: mutedText }}>🏭 工厂: {order.factoryName}</p>}
            </>
          ) : (
            <p className="text-xs" style={{ color: mutedText }}>待审核分配</p>
          )}
        </div>
      </div>

      {/* Items table */}
      <div style={{ borderBottom: `1px solid ${borderColor}` }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left" style={{ background: 'hsl(30 12% 95%)', borderColor }}>
              <th className="px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: mutedText }}>餐品</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: mutedText }}>数量</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: mutedText }}>单价</th>
              <th className="px-6 py-2.5 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: mutedText }}>金额</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor }}>
            {order.items.map((item, idx) => (
              <tr key={idx}>
                <td className="px-6 py-3 text-sm font-medium text-foreground">{item.mealName}</td>
                <td className="px-3 py-3 text-center text-sm tabular-nums" style={{ color: 'hsl(20 8% 45%)' }}>×{item.quantity}</td>
                <td className="px-3 py-3 text-right text-sm tabular-nums" style={{ color: mutedText }}>${item.unitPrice}</td>
                <td className="px-6 py-3 text-right text-sm font-semibold tabular-nums text-foreground">${item.unitPrice * item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div className="px-6 py-4" style={{ borderBottom: `2px solid hsl(20 12% 15%)` }}>
        <div className="flex items-center justify-between">
          <span className="font-display text-lg text-foreground">合计金额</span>
          <span className="font-display text-2xl tabular-nums" style={{ color: 'hsl(15 55% 42%)' }}>${order.totalAmount}</span>
        </div>
        <p className="mt-0.5 text-right text-xs" style={{ color: mutedText }}>共 {order.items.reduce((s, i) => s + i.quantity, 0)} 件餐品</p>
      </div>

      {/* Traceability progress */}
      <div className="px-6 py-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mb-3 flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider"
          style={{ color: mutedText }}
        >
          流转记录
          {collapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
        </button>
        {!collapsed && (
          <div className="space-y-0">
            {steps.map((step, idx) => (
              <div key={step.label} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold" style={{
                    background: step.done ? 'hsl(120 12% 50%)' : step.active ? 'hsl(35 50% 92%)' : 'hsl(30 12% 92%)',
                    color: step.done ? 'white' : step.active ? 'hsl(35 40% 35%)' : 'hsl(20 5% 60%)',
                    ...(step.active && !step.done ? { boxShadow: 'inset 0 0 0 1px hsl(35 30% 70%)' } : {}),
                  }}>
                    {step.done ? '✓' : idx + 1}
                  </div>
                  {idx < steps.length - 1 && (
                    <div className="mt-0.5 h-4 w-0.5" style={{ background: step.done ? 'hsl(120 12% 75%)' : 'hsl(30 10% 88%)' }} />
                  )}
                </div>
                <div className="pb-3">
                  <p className="text-xs font-semibold" style={{
                    color: step.done ? 'hsl(20 12% 20%)' : step.active ? 'hsl(35 40% 30%)' : 'hsl(20 5% 60%)',
                  }}>
                    {step.label}
                    {step.date && <span className="ml-2 font-normal" style={{ color: mutedText }}>{new Date(step.date).toLocaleString('zh-CN')}</span>}
                  </p>
                  {step.label === '创建' && (
                    <p className="mt-0.5 text-[10px]" style={{ color: mutedText }}>客户: {order.customerName} · {order.customerPhone}</p>
                  )}
                  {step.label === '审核' && order.serviceName && (
                    <p className="mt-0.5 text-[10px]" style={{ color: mutedText }}>服务机构: {order.serviceName}</p>
                  )}
                  {step.label === '生产' && order.factoryName && (
                    <p className="mt-0.5 text-[10px]" style={{ color: mutedText }}>工厂: {order.factoryName} · 分销: {order.distributorName || '—'}</p>
                  )}
                  {step.label === '配送' && order.distributorName && (
                    <p className="mt-0.5 text-[10px]" style={{ color: mutedText }}>配送商: {order.distributorName}</p>
                  )}
                  {step.label === '送达' && order.status === 'delivered' && (
                    <p className="mt-0.5 text-[10px]" style={{ color: mutedText }}>已完成配送</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3" style={{ borderTop: `1px solid ${borderColor}`, background: 'hsl(30 12% 96%)' }}>
        <p className="text-center text-[10px]" style={{ color: mutedText }}>iCooker 智慧养老餐饮服务平台 · 本单据为电子凭证 · {order.id}</p>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    pending:    { bg: 'hsl(38 60% 93%)',  color: 'hsl(38 55% 35%)',  label: '待审核' },
    approved:   { bg: 'hsl(210 35% 93%)', color: 'hsl(210 40% 40%)',  label: '已审核' },
    processing: { bg: 'hsl(270 30% 93%)', color: 'hsl(270 30% 40%)',  label: '生产中' },
    completed:  { bg: 'hsl(120 18% 92%)', color: 'hsl(120 12% 38%)',  label: '已完成' },
    delivered:  { bg: 'hsl(30 10% 92%)',  color: 'hsl(20 8% 40%)',    label: '已送达' },
    rejected:   { bg: 'hsl(0 40% 93%)',   color: 'hsl(0 40% 42%)',    label: '已拒绝' },
  }
  const c = config[status] || config.pending
  return (
    <span
      className="ml-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: c.bg, color: c.color }}
    >
      {c.label}
    </span>
  )
}
