# Booking Platform（中国市场）

这是一个面向中国客户的预约系统后端初始化工程，技术栈为 Node.js + TypeScript + MySQL。

## 已完成能力（第一版）

- 基础服务启动（Express）
- 安全基线（Helmet + 日志脱敏 + Request ID）
- 中国合规示例接口：个人信息保护法（PIPL）同意校验
- 健康检查接口

## 快速开始

```bash
cp .env.example .env
npm install
npm run dev
```

### API

- `GET /api/health`
- `POST /api/compliance/consent/check`
  - body: `{ "consentAccepted": true | false }`

## 下一步建议

1. 落地鉴权体系（JWT + RBAC + 门店维度权限）
2. 增加审计日志表（操作留痕、导出留痕、删除留痕）
3. 增加预约核心领域模型与订单状态机
4. 接入微信支付与回调验签
