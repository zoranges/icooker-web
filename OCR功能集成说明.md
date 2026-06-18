# OCR功能已集成到主应用

## 更新时间
2026-06-17

## 更新内容

### 1. 老人端订单上传页面增强

已在 `CustomerPortal.tsx` 的订单上传页面集成了OCR图片识别功能。

#### 新增功能

**方式一：上传订单图片（自动识别）**
- 支持拖拽或点击上传图片
- 自动调用OCR服务识别图片内容
- 实时显示识别进度和结果
- 智能提取识别内容中的关键信息：
  - 电话号码（自动识别11位手机号）
  - 配送地址（识别包含"路"、"街"、"号"等关键词的行）
  - 姓名（识别第一行文本）

**方式二：手动填写订单信息**
- 保留原有的手动填写表单
- 作为OCR识别失败时的备用方案

### 2. 使用流程

1. **访问老人端**
   - 打开 http://localhost:5173
   - 选择"老人端"角色
   - 点击"拍照上传订单"

2. **上传图片**
   - 点击上传区域或拖拽图片
   - 系统自动进行OCR识别
   - 等待识别完成（约几秒）

3. **查看识别结果**
   - 成功：显示识别的文本内容和提取的信息
   - 失败：显示错误提示，可手动填写

4. **确认并提交**
   - 检查自动填充的表单信息
   - 选择需要的餐品
   - 点击提交订单

### 3. 技术实现

#### 前端组件更新
- 文件：`icooker-web/src/portals/CustomerPortal.tsx`
- 新增状态：
  ```typescript
  const [uploadedImage, setUploadedimage] = useState<string | null>(null)
  const [ocrResult, setOcrResult] = useState<string>('')
  const [isRecognizing, setIsRecognizing] = useState(false)
  const [ocrError, setOcrError] = useState<string>('')
  ```

- 核心函数：
  - `handleImageUpload`: 处理图片上传和OCR调用
  - `parseOCRResult`: 解析OCR结果并自动填充表单
  - `clearImage`: 清除上传的图片

#### API调用
```typescript
fetch('http://localhost:3000/api/ocr/recognize-base64', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ image: base64Data })
})
```

### 4. 界面预览

上传区域包含：
- 虚线边框的上传提示区
- 图片预览（带删除按钮）
- OCR识别进度指示器（旋转动画）
- 识别成功结果展示（绿色框）
- 识别失败错误提示（红色框）

### 5. 文件限制
- 支持格式：JPG, PNG, GIF等常见图片格式
- 最大文件大小：10MB
- 超时时间：60秒

### 6. 错误处理

| 错误类型 | 提示信息 |
|---------|---------|
| 非图片文件 | "请上传图片文件" |
| 文件过大 | "图片大小不能超过10MB" |
| OCR服务失败 | "OCR识别失败: [具体错误]" |
| 网络连接失败 | "OCR服务连接失败，请手动填写订单信息" |

### 7. 智能填充逻辑

当前实现的简单解析规则：
```typescript
// 提取手机号
const phoneMatch = text.match(/1[3-9]\d{9}/)

// 提取地址（包含特定关键词的行）
const addressMatch = lines.find(line => 
  line.includes('路') || line.includes('街') || 
  line.includes('号') || line.includes('小区')
)

// 提取姓名（第一行，长度<10，不以数字开头）
const nameLine = lines[0]?.trim()
if (nameLine && nameLine.length < 10 && !/^\d/.test(nameLine))
```

> **注意**: 解析规则可根据实际OCR返回结果进行优化和调整。

### 8. 测试建议

1. 准备一张清晰的订单手写照片
2. 确保后端API服务正在运行（localhost:3000）
3. 上传图片后观察识别结果
4. 检查自动填充的表单字段是否正确
5. 如识别失败，可手动填写表单

### 9. 后续优化方向

1. **更智能的解析**：根据订单模板定制解析规则
2. **餐品识别**：从图片中直接识别选择的菜品
3. **历史记录**：保存用户的常用地址和信息
4. **批量识别**：支持一次上传多张图片
5. **离线模式**：本地缓存待上传的订单

## 相关文档

- 后端API文档：`../icooker-api/OCR功能完成说明.md`
- OCR使用说明：`OCR使用说明.md`
- OCR测试页面：`ocr-test.html`
