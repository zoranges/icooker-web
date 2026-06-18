# iCooker OCR订单识别系统

## 📋 功能概述

本系统支持通过OCR技术自动识别老人上传的订单图片（手写菜单、打印订单等），并将其转换为结构化的文本数据。

## 🚀 快速开始

### 方式一：独立OCR测试页面（推荐用于测试）

1. 在浏览器中打开：`http://localhost:5173/ocr-test.html`
2. 配置OCR API地址（默认：`http://101.47.12.170:8080/layout-parsing`）
3. 点击或拖拽上传图片
4. 点击"开始识别"按钮
5. 查看识别结果

### 方式二：集成到主应用

在主应用中，老人端已预留OCR功能接口，后续可直接调用。

## 📸 支持的图片格式

- PNG
- JPG/JPEG
- BMP
- GIF

## 🔧 API参数说明

### OCR API端点
```
POST http://101.47.12.170:8080/layout-parsing
```

### 请求参数
```json
{
  "file": "base64编码的图片数据",
  "fileType": 1,
  "useLayoutDetection": true,
  "useChartRecognition": true,
  "useSealRecognition": true,
  "prettifyMarkdown": true,
  "visualize": true
}
```

### 响应格式
```json
{
  "errorCode": 0,
  "result": {
    "layoutParsingResults": [
      {
        "markdown": {
          "text": "识别出的Markdown文本"
        }
      }
    ]
  }
}
```

## 💡 使用建议

1. **图片质量**：确保图片清晰，文字可读
2. **光线条件**：避免过暗或过亮的环境拍摄
3. **角度校正**：尽量正面拍摄，避免倾斜
4. **文件大小**：建议控制在10MB以内

## 🔗 完整工作流程

```
1. 老人上传订单图片
       ↓
2. OCR服务识别图片内容
       ↓
3. 返回Markdown格式文本
       ↓
4. 解析文本提取餐品信息
       ↓
5. 创建订单提交到系统
```

## 📝 示例场景

### 场景1：识别手写订单
- 老人在纸上写下想要的餐品
- 拍照上传
- OCR识别出文字内容
- 系统解析并创建订单

### 场景2：识别餐厅菜单
- 老人拍摄餐厅菜单
- 勾选想要的餐品后拍照
- OCR识别勾选内容
- 系统自动创建订单

## 🛠️ 后端API（Node.js）

如果需要通过后端调用OCR服务：

```bash
POST /api/ocr/recognize
Content-Type: multipart/form-data

# 或使用base64方式
POST /api/ocr/recognize-base64
Content-Type: application/json

{
  "image": "data:image/png;base64,iVBORw0KGgo..."
}
```

## ⚠️ 注意事项

1. OCR服务依赖外部API（101.47.12.170:8080），请确保网络可达
2. 识别准确率受图片质量影响
3. 建议在识别后提供人工校对功能
4. 超时时间设置为60秒，大图片可能需要更长时间

## 🎯 下一步优化方向

1. 添加图片预处理（裁剪、增强对比度等）
2. 实现智能餐品匹配（将识别文本映射到具体餐品ID）
3. 添加置信度评分
4. 支持批量识别
5. 缓存常用识别结果
