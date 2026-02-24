# 阿里云服务器部署清单

## 1. 服务器要求
- Ubuntu 22.04+（推荐）
- 已开放安全组端口：80、22
- 可访问 npm 源（如受限可切换 npmmirror）

## 2. 环境变量（`.env`）
必须填写：
- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`

建议：
- `NODE_ENV=production`
- `PORT=3000`

## 3. 一键部署
```bash
bash scripts/deploy_aliyun.sh <你的Git仓库地址> work
```

## 4. 健康检查
```bash
curl http://127.0.0.1:3000/api/health
curl http://127.0.0.1:3000/api/system/readiness
```

## 5. 常见问题
1. npm 403：
```bash
npm config set registry https://registry.npmmirror.com
npm install
```

2. MySQL 连接失败：
- 检查阿里云 RDS 白名单是否包含服务器公网 IP
- 检查 3306 是否放行
- 检查账号权限是否允许远程连接

3. 迁移失败：
- 确认数据库已创建
- 执行 `npm run migrate` 前确认 `.env` 正确


## 6. 生产增强部署（HTTPS + systemd + 回滚）
推荐使用增强脚本：

```bash
bash scripts/deploy_aliyun_hardened.sh <你的Git仓库地址> work <你的域名> <你的邮箱>
```

特性：
- systemd 守护进程（开机自启）
- Let's Encrypt 自动签发 HTTPS（提供域名和邮箱时）
- 版本目录 + current 软链接
- 部署失败自动回滚到上个版本
