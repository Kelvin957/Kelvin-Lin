#!/usr/bin/env bash
set -euo pipefail

APP_NAME="booking-platform"
APP_DIR="/opt/${APP_NAME}"
REPO_URL="${1:-}"
BRANCH="${2:-work}"

if [[ -z "${REPO_URL}" ]]; then
  echo "用法: bash scripts/deploy_aliyun.sh <git_repo_url> [branch]"
  exit 1
fi

echo "[1/8] 安装基础依赖"
sudo apt-get update -y
sudo apt-get install -y curl git nginx

if ! command -v node >/dev/null 2>&1; then
  echo "[2/8] 安装 Node.js 22"
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "[3/8] 安装 PM2"
  sudo npm install -g pm2
fi

if [[ ! -d "${APP_DIR}" ]]; then
  echo "[4/8] 拉取代码"
  sudo git clone -b "${BRANCH}" "${REPO_URL}" "${APP_DIR}"
else
  echo "[4/8] 更新代码"
  cd "${APP_DIR}"
  sudo git fetch --all --prune
  sudo git checkout "${BRANCH}"
  sudo git pull origin "${BRANCH}"
fi

cd "${APP_DIR}"

if [[ ! -f .env ]]; then
  echo "[5/8] 初始化 .env"
  sudo cp .env.example .env
  echo "请编辑 ${APP_DIR}/.env，填写阿里云 MySQL 参数后再继续运行。"
  exit 2
fi

echo "[6/8] 安装依赖和构建"
sudo npm install
sudo npm run build

echo "[7/8] 执行数据库迁移"
sudo npm run migrate

echo "[8/8] 启动服务"
sudo pm2 delete "${APP_NAME}" >/dev/null 2>&1 || true
sudo pm2 start dist/server.js --name "${APP_NAME}"
sudo pm2 save

cat <<NGINX | sudo tee /etc/nginx/sites-available/${APP_NAME}.conf >/dev/null
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/${APP_NAME}.conf /etc/nginx/sites-enabled/${APP_NAME}.conf
sudo nginx -t
sudo systemctl restart nginx

echo "部署完成: http://<你的服务器IP>/api/health"
