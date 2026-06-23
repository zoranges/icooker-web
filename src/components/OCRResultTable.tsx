interface OCRResultTableProps {
  htmlContent: string
}

export default function OCRResultTable({ htmlContent }: OCRResultTableProps) {
  const tableMatch = htmlContent.match(/<table[\s\S]*<\/table>/i)

  if (!tableMatch) {
    return (
      <div className="rounded-xl border p-5" style={{ background: 'hsl(45 40% 94%)', borderColor: 'hsl(45 40% 80%)' }}>
        <p className="text-sm font-medium" style={{ color: 'hsl(30 30% 30%)' }}>未检测到表格结构，请手动填写订单信息</p>
      </div>
    )
  }

  const cleanHTML = tableMatch[0]
    .replace(/border=1/g, '')
    .replace(/style='[^']*'/g, '')

  const headerBg = 'hsl(15 55% 42%)'
  const borderColor = 'hsl(30 8% 90%)'

  return (
    <div className="overflow-hidden rounded-lg border bg-white" style={{ borderColor }}>
      <div className="border-b p-4" style={{ background: 'hsl(210 30% 94%)', borderColor: 'hsl(210 30% 84%)' }}>
        <p className="text-sm font-semibold" style={{ color: 'hsl(210 30% 30%)' }}>OCR识别成功 — 检测到菜单表格</p>
        <p className="mt-1 text-xs" style={{ color: 'hsl(210 20% 40%)' }}>点击下方餐品即可添加到订单</p>
      </div>
      <div
        className="p-3"
        dangerouslySetInnerHTML={{ __html: cleanHTML }}
      />
      <style>{`
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          table-layout: fixed;
        }
        td, th {
          border: 1px solid ${borderColor};
          padding: 6px 4px;
          text-align: center;
          vertical-align: middle;
          word-break: break-word;
        }
        tr:first-child {
          background: ${headerBg};
          color: white;
          font-weight: bold;
        }
        tr:first-child td, tr:first-child th {
          border-color: rgba(255, 255, 255, 0.25);
        }
        td[rowspan] {
          background-color: hsl(15 55% 42% / 0.04);
          font-weight: bold;
        }
        td:nth-child(2) {
          background-color: hsl(30 12% 94%);
          font-weight: 500;
        }
        td:not(:first-child):not(:nth-child(2)):hover {
          background-color: hsl(15 55% 42% / 0.05);
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}
