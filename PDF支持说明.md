# OCR功能PDF支持更新说明

## 更新时间
2026-06-17

## 新增功能

### PDF文件识别支持

现在系统支持直接上传PDF文件进行OCR识别，无需转换为图片格式。

### 技术实现

#### 后端修改

1. **ocrService.ts**
   - 添加了 `FileType` 类型：`'image' | 'pdf'`
   - `callOCRService` 函数新增 `fileType` 参数
   - 根据文件类型自动设置OCR请求参数：
     - 图片：`fileType: 1`
     - PDF：`fileType: 2`

2. **ocr.ts 路由**
   - `/api/ocr/recognize` 支持上传PDF文件
   - `/api/ocr/recognize-base64` 支持base64格式的PDF
   - 自动检测文件类型并传递正确参数

#### 前端修改

1. **CustomerPortal.tsx**
   - 文件输入支持 `accept="image/*,.pdf"`
   - 上传验证支持PDF格式
   - PDF文件显示特殊图标预览（📄）
   - API调用时传递正确的 `fileType` 参数

### 使用方式

#### 方式1：在主应用中使用

1. 访问 http://localhost:5175
2. 选择"老人端"
3. 点击"拍照上传订单"
4. 上传区域支持：
   - **图片**：JPG, PNG等格式
   - **PDF**：直接上传PDF文件
5. 系统自动识别并填充表单

#### 方式2：直接调用API

```bash
# 上传PDF文件
curl -X POST http://localhost:3000/api/ocr/recognize \
  -F "file=@order.pdf"

# Base64方式上传PDF
curl -X POST http://localhost:3000/api/ocr/recognize-base64 \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:application/pdf;base64,JVBERi0xLjQK...",
    "fileType": "pdf"
  }'
```

### OCR参数配置

| 参数 | 图片值 | PDF值 | 说明 |
|------|--------|-------|------|
| fileType | 1 | 2 | 文件类型标识 |
| useLayoutDetection | true | true | 启用布局检测 |
| useChartRecognition | true | true | 启用图表识别 |
| useSealRecognition | true | true | 启用印章识别 |
| prettifyMarkdown | true | true | 美化Markdown输出 |
| visualize | true | true | 生成可视化结果 |

### 文件限制

| 项目 | 限制 |
|------|------|
| 支持格式 | JPG, PNG, GIF, PDF |
| 最大文件大小 | 10MB |
| 超时时间 | 60秒 |

### 界面变化

1. **上传提示文本**
   - 原来："点击上传图片"
   - 现在："点击上传文件或图片"

2. **支持格式提示**
   - 原来："支持JPG、PNG格式，最大10MB"
   - 现在："支持JPG、PNG、PDF格式，最大10MB"

3. **PDF预览**
   - PDF文件上传后显示红色文档图标和"PDF文件已上传"提示
   - 与图片预览区分开

### 测试建议

1. 准备测试用的PDF文件（如扫描的订单、菜单等）
2. 确保PDF文件清晰可读
3. PDF文件大小不超过10MB
4. 观察识别结果的准确性

### 注意事项

1. **PDF质量**：扫描件PDF的识别效果取决于扫描质量
2. **多页PDF**：当前版本仅识别第一页内容
3. **加密PDF**：不支持加密或受保护的PDF文件
4. **文字型PDF**：由文字组成的PDF识别效果最佳

### 相关服务状态

| 服务 | 地址 | 状态 |
|------|------|------|
| 后端API | http://localhost:3000 | 运行中 |
| 前端应用 | http://localhost:5175 | 运行中 |
| OCR服务 | http://101.47.12.170:8080 | 远程服务 |
