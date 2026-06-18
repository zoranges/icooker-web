interface OCRResultTableProps {
  htmlContent: string
}

export default function OCRResultTable({ htmlContent }: OCRResultTableProps) {
  // 从OCR结果中提取HTML表格
  const tableMatch = htmlContent.match(/<table[\s\S]*<\/table>/i)
  
  if (!tableMatch) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-sm">未检测到表格结构，请手动填写订单信息</p>
      </div>
    )
  }

  // 清理并美化表格样式
  const cleanHTML = tableMatch[0]
    .replace(/border=1/g, '')
    .replace(/style='[^']*'/g, '')

  return (
    <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
      <div className="bg-blue-50 border-b border-blue-200 p-3">
        <p className="text-sm text-blue-900 font-medium">✓ OCR识别成功 - 检测到菜单表格</p>
        <p className="text-xs text-blue-700 mt-1">点击下方餐品即可添加到订单</p>
      </div>
      <div 
        className="overflow-x-auto p-4"
        dangerouslySetInnerHTML={{ __html: cleanHTML }}
      />
      <style>{`
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        td, th {
          border: 1px solid #d1d5db;
          padding: 8px;
          text-align: center;
          vertical-align: middle;
        }
        tr:first-child {
          background: linear-gradient(to right, #f97316, #f59e0b);
          color: white;
          font-weight: bold;
        }
        tr:first-child td, tr:first-child th {
          border-color: rgba(255, 255, 255, 0.3);
        }
        td[rowspan] {
          background-color: #fff7ed;
          font-weight: bold;
        }
        td:nth-child(2) {
          background-color: #f9fafb;
          font-weight: 500;
        }
        td:not(:first-child):not(:nth-child(2)):hover {
          background-color: #fff7ed;
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}
