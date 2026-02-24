# Booking Platform（中国市场）

这是一个面向中国客户的预约系统后端初始化工程，技术栈为 Node.js + TypeScript + MySQL。

## 已完成能力（当前版本）

- 基础服务启动（Express）
- 安全基线（Helmet + 日志脱敏 + Request ID）
- 中国合规示例接口：个人信息保护法（PIPL）同意校验
- 预约报价与创建接口（按分钟计费 + 起约时长/提前预约校验）
- MySQL 初始化 SQL（含协议、用户、门店、座位、预约规则、预约单、审计日志）

## 快速开始

```bash
cp .env.example .env
npm install
npm run dev
```

## 数据库初始化

```bash
npm run migrate
```

执行的是 `sql/001_init_schema.sql`。

## API

- `GET /api/health`
- `GET /api/system/readiness`
- `POST /api/compliance/consent/check`
  - body: `{ "consentAccepted": true | false }`
- `POST /api/reservations/quote`
  - body 示例：
    ```json
    {
      "startAt": "2026-03-01T10:00:00+08:00",
      "endAt": "2026-03-01T12:00:00+08:00",
      "pricePerMinute": 1.2,
      "minDurationMin": 60,
      "advanceBookingMin": 30
    }
    ```
- `POST /api/reservations`
  - 基于同样规则创建预约记录，返回 `reservationNo`

## 你可以提供给我的信息（我将继续接入）

你已提到有阿里云 MySQL，我下一步可以直接帮你接通。请提供：

1. `MYSQL_HOST`
2. `MYSQL_PORT`
3. `MYSQL_USER`
4. `MYSQL_PASSWORD`
5. `MYSQL_DATABASE`
6. 是否开启 SSL（如开启我会补充 TLS 配置）

## 下一步建议

1. 落地鉴权体系（JWT + RBAC + 门店维度权限）
2. 增加预约冲突检测（同座位时间段重叠检查 + 事务锁）
3. 接入微信支付与回调验签
4. 补充审计日志落库和导出留痕


## 阿里云部署（可直接执行）

仓库已提供一键脚本：

```bash
bash scripts/deploy_aliyun.sh <你的Git仓库地址> work
```

部署说明见：`deploy/aliyun-checklist.md`。


### 生产增强部署（推荐）

```bash
bash scripts/deploy_aliyun_hardened.sh <你的Git仓库地址> work <你的域名> <你的邮箱>
```

说明：该脚本包含 `systemd` 守护、可选 HTTPS、失败自动回滚。
