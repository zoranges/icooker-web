/**
 * 从OCR识别的内容中提取实际点的餐品
 * 支持Markdown表格和HTML表格两种格式
 * 
 * 规则：
 * - ✓ 或 ✗ 表示选择1个该餐品
 * - 数字（如 1, 2, 3）表示选择对应数量的该餐品
 * - 空字符串表示未选择
 */

// 调试模式：设为 true 可输出每个单元格的详细日志
const DEBUG_PARSE = false

export interface ExtractedMeal {
  name: string           // 餐品名称
  day: string            // 星期几
  subCategory: string    // 子类别
  quantity: number       // 数量
  tags: string           // 饮食标签（如LSF、DBF等）
}

/**
 * 解析菜单表格（自动检测Markdown或HTML格式）
 * @param content OCR返回的内容（Markdown或HTML）
 * @returns 提取的餐品列表
 */
export function parseOCRMenuTable(content: string): ExtractedMeal[] {
  // 检测内容格式
  const isHTML = /<table[\s\S]*<\/table>/i.test(content)
  
  if (isHTML) {
    console.log('[ParseOCR] 检测到HTML表格格式')
    return parseHTMLTable(content)
  } else {
    console.log('[ParseOCR] 检测到Markdown表格格式')
    return parseMarkdownTable(content)
  }
}

/**
 * 解析HTML格式的表格
 */
function parseHTMLTable(htmlContent: string): ExtractedMeal[] {
  const extractedMeals: ExtractedMeal[] = []
  
  // 提取表格HTML
  const tableMatch = htmlContent.match(/<table[\s\S]*<\/table>/i)
  if (!tableMatch) {
    console.warn('未找到表格结构')
    return []
  }
  
  const tableHTML = tableMatch[0]
  
  // 解析所有行
  const rowMatches = tableHTML.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g)
  if (!rowMatches || rowMatches.length < 2) {
    console.warn('表格行数不足')
    return []
  }
  
  // 跳过表头（第一行）
  const dataRows = rowMatches.slice(1)
  
  // 星期映射
  const dayChinese = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  
  let currentSubCategory = ''
  
  dataRows.forEach((rowHTML, rowIndex) => {
    // 提取所有单元格
    const cellMatches = rowHTML.match(/<td[^>]*>([\s\S]*?)<\/td>/g)
    if (!cellMatches || cellMatches.length < 3) return
    
    let cellIndex = 0
    
    // 检查是否有主类别（rowspan）
    const firstCell = cellMatches[0]
    const rowspanMatch = firstCell.match(/rowspan=["']?(\d+)["']/)
    
    if (rowspanMatch) {
      cellIndex++
    }
    
    // 子类别
    if (cellIndex < cellMatches.length) {
      const subCat = cleanText(cellMatches[cellIndex])
      if (subCat && !isDayHeader(subCat)) {
        currentSubCategory = subCat
        cellIndex++
      }
    }
    
    // 提取7天的餐品
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      if (cellIndex >= cellMatches.length) break
      
      const mealCell = cellMatches[cellIndex]
      const mealContent = cleanText(mealCell)
      
      if (DEBUG_PARSE) {
        console.log(`[ParseOCR] 第${rowIndex + 1}行, 第${dayIdx + 1}天 (${dayChinese[dayIdx]}):`)
        console.log(`  餐品单元格内容: "${mealContent}"`)
      }
      
      // 跳过分隔列，从下一个单元格读取标记
      cellIndex++
      let marker = 0
      if (cellIndex < cellMatches.length) {
        const markerCell = cellMatches[cellIndex]
        const markerText = cleanText(markerCell)
        marker = extractMarker(markerCell)
        if (DEBUG_PARSE) console.log(`  标记单元格内容: "${markerText}" → 提取值: ${marker}`)
      } else if (DEBUG_PARSE) {
        console.log(`  标记单元格: 不存在`)
      }
      
      // 只有当有明确标记时才添加到结果中
      if (marker > 0 && mealContent) {
        // 提取饮食标签
        const tags = extractTags(mealContent)
        
        // 提取纯名称（去掉标签）
        const name = mealContent.replace(/\((LSF|DBF|LS|GF|DF)[,)]*/g, '').trim()
        
        // 只添加有实际名称的餐品
        if (name && name.length > 0 && !isDayHeader(name)) {
          extractedMeals.push({
            name: name,
            day: dayChinese[dayIdx],
            subCategory: currentSubCategory,
            quantity: marker,
            tags: tags
          })
          console.log(`[ParseOCR] ✓ ${dayChinese[dayIdx]}: ${name} (数量: ${marker})`)
        } else if (DEBUG_PARSE) {
          console.log(`  ✗ 跳过: 名称为空或是表头`)
        }
      } else if (DEBUG_PARSE) {
        console.log(`  ✗ 跳过: 无标记或无内容`)
      }
      
      // 继续到下一天
      cellIndex++
    }
  })
  
  console.log('[ParseOCR] HTML表格提取到', extractedMeals.length, '个餐品')
  return extractedMeals
}

/**
 * 解析Markdown格式的表格
 */
function parseMarkdownTable(markdownContent: string): ExtractedMeal[] {
  const extractedMeals: ExtractedMeal[] = []
  
  // 将Markdown内容按行分割
  const lines = markdownContent.split('\n').filter(line => line.trim())
  
  if (lines.length < 3) {
    console.warn('Markdown内容行数不足')
    return []
  }
  
  // 查找表格开始位置（以 | 开头的行）
  let tableStartIndex = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('|')) {
      tableStartIndex = i
      break
    }
  }
  
  if (tableStartIndex === -1) {
    console.warn('未找到Markdown表格')
    return []
  }
  
  // 提取表格行（跳过表头和分隔线）
  const tableLines = lines.slice(tableStartIndex)
  const dataRows: string[][] = []
  
  for (let i = 0; i < tableLines.length; i++) {
    const line = tableLines[i].trim()
    
    // 跳过分隔线（包含 --- 的行）
    if (line.includes('---')) continue
    
    // 解析表格行的单元格
    const cells = parseMarkdownRow(line)
    if (cells.length > 0) {
      dataRows.push(cells)
    }
  }
  
  // 跳过表头（第一行通常是列名）
  const headerRow = dataRows[0]
  const isHeader = headerRow.some(cell => 
    cell.includes('MONDAY') || cell.includes('TUESDAY') || cell.includes('WEDNESDAY') ||
    cell.includes('THURSDAY') || cell.includes('FRIDAY') || cell.includes('SATURDAY') || 
    cell.includes('SUNDAY') || cell.includes('周一') || cell.includes('周二')
  )
  
  const rowsToProcess = isHeader ? dataRows.slice(1) : dataRows
  
  // 星期映射
  const dayChinese = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  
  let currentSubCategory = ''
  
  rowsToProcess.forEach((cells) => {
    if (cells.length < 3) return
    
    let cellIndex = 0
    
    // 检查是否有主类别
    const firstCell = cells[0].trim()
    if (firstCell && (
        firstCell.includes('MAIN') || firstCell.includes('主餐') ||
        firstCell.includes('DESERTS') || firstCell.includes('甜点') ||
        firstCell.includes('Regular') || firstCell.includes('Easy to Chew') ||
        firstCell.includes('Vegetarian')
      )) {
      cellIndex++
    }
    
    // 子类别
    if (cellIndex < cells.length) {
      const subCat = cells[cellIndex].trim()
      if (subCat && !isDayHeader(subCat)) {
        currentSubCategory = cleanText(subCat)
        cellIndex++
      }
    }
    
    // 提取7天的餐品
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      if (cellIndex >= cells.length) break
      
      const mealCell = cells[cellIndex]
      const mealContent = cleanText(mealCell)
      
      // 跳过分隔列，从下一个单元格读取标记
      cellIndex++
      let marker = 0
      if (cellIndex < cells.length) {
        const markerCell = cells[cellIndex]
        marker = extractMarker(markerCell)
      }
      
      // 只有当有明确标记时才添加到结果中
      if (marker > 0 && mealContent) {
        // 提取饮食标签
        const tags = extractTags(mealContent)
        
        // 提取纯名称（去掉标签）
        const name = mealContent.replace(/\((LSF|DBF|LS|GF|DF)[,)]*/g, '').trim()
        
        // 只添加有实际名称的餐品
        if (name && name.length > 0 && !isDayHeader(name)) {
          extractedMeals.push({
            name: name,
            day: dayChinese[dayIdx],
            subCategory: currentSubCategory,
            quantity: marker,
            tags: tags
          })
        }
      }
      
      // 继续到下一天
      cellIndex++
    }
  })
  
  console.log('[ParseOCR] Markdown表格提取到', extractedMeals.length, '个餐品')
  return extractedMeals
}

/**
 * 解析Markdown表格的一行
 * @param line Markdown表格行，例如: "| 单元格1 | 单元格2 | 单元格3 |"
 * @returns 单元格数组
 */
function parseMarkdownRow(line: string): string[] {
  // 移除首尾的 | 符号
  let trimmed = line.trim()
  if (trimmed.startsWith('|')) trimmed = trimmed.substring(1)
  if (trimmed.endsWith('|')) trimmed = trimmed.substring(0, trimmed.length - 1)
  
  // 按 | 分割并清理每个单元格
  return trimmed.split('|').map(cell => cell.trim()).filter(cell => cell.length > 0)
}

// 清理单元格文本
function cleanText(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')  // ⭐ 移除所有HTML标签（最重要！）
    .replace(/\*\*/g, '')  // 移除加粗标记
    .replace(/\*/g, '')    // 移除斜体标记
    .replace(/`/g, '')     // 移除代码标记
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // 移除链接，保留文本
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")  // 另一种单引号编码
    .replace(/&quot;/g, '"')  // 双引号
    .replace(/\s+/g, ' ')
    .trim()
}

// 检查是否为星期标题
function isDayHeader(text: string): boolean {
  const dayNames = [
    'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY',
    '周一', '周二', '周三', '周四', '周五', '周六', '周日'
  ]
  return dayNames.some(day => text.toUpperCase().includes(day))
}

// 提取标记（✓、✗、数字）
function extractMarker(text: string): number {
  const cleaned = cleanText(text)
  
  if (DEBUG_PARSE) console.log(`    [extractMarker] 输入: "${text}" → 清理后: "${cleaned}"`)
  
  // 检查是否有 ✓ 或 ✗
  if (cleaned.includes('✓') || cleaned.includes('✔') || cleaned.includes('√')) {
    if (DEBUG_PARSE) console.log(`    [extractMarker] 检测到 ✓ 标记，返回 1`)
    return 1
  }
  
  if (cleaned.includes('✗') || cleaned.includes('✘') || cleaned.includes('×')) {
    if (DEBUG_PARSE) console.log(`    [extractMarker] 检测到 ✗ 标记，返回 1`)
    return 1  // 根据你的说明，✗也表示选择1个
  }
  
  // 检查是否有纯数字（整个单元格就是一个数字）
  if (/^[1-9]$/.test(cleaned)) {
    const num = parseInt(cleaned)
    if (DEBUG_PARSE) console.log(`    [extractMarker] 检测到纯数字 ${cleaned}，返回 ${num}`)
    return num
  }
  
  // 检查是否有数字标记（数字前面有空格，或者是末尾的数字）
  const markerMatch = cleaned.match(/(?:^|\s)([1-9])$/)
  if (markerMatch) {
    const num = parseInt(markerMatch[1])
    if (DEBUG_PARSE) console.log(`    [extractMarker] 检测到带空格的数字 ${markerMatch[1]}，返回 ${num}`)
    return num
  }
  
  // 也检查开头是否有数字（如 "1 " 或 "1 something"）
  const startMatch = cleaned.match(/^([1-9])(?:\s|$)/)
  if (startMatch) {
    const num = parseInt(startMatch[1])
    if (DEBUG_PARSE) console.log(`    [extractMarker] 检测到开头数字 ${startMatch[1]}，返回 ${num}`)
    return num
  }
  
  if (DEBUG_PARSE) console.log(`    [extractMarker] 未检测到有效标记，返回 0`)
  return 0
}

// 提取饮食标签
function extractTags(text: string): string {
  const tags: string[] = []
  const tagMatches = text.match(/\((LSF|DBF|LS|GF|DF)[,)]*/g)
  if (tagMatches) {
    tagMatches.forEach(tag => {
      const clean = tag.replace(/[(),]/g, '').trim()
      if (clean && !tags.includes(clean)) {
        tags.push(clean)
      }
    })
  }
  return tags.join(', ')
}

// 将提取的餐品转换为订单格式
export function convertToOrderItems(extractedMeals: ExtractedMeal[]) {
  return extractedMeals.map(meal => ({
    mealName: `${meal.name} (${meal.day})`,
    quantity: meal.quantity,
    unitPrice: 25, // 默认价格，实际应从数据库获取
    days: [meal.day],
    tags: meal.tags,
    subCategory: meal.subCategory
  }))
}
