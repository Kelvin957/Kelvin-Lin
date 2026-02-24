#!/usr/bin/env bash
set -euo pipefail

APP_NAME="booking-platform"
APP_USER="booking"
APP_GROUP="booking"
APP_ROOT="/opt/${APP_NAME}"
RELEASES_DIR="${APP_ROOT}/releases"
CURRENT_LINK="${APP_ROOT}/current"
REPO_URL="${1:-}"
BRANCH="${2:-work}"
DOMAIN="${3:-}"
LETSENCRYPT_EMAIL="${4:-}"

if [[ -z "${REPO_URL}" ]]; then
  echo "用法: bash scripts/deploy_aliyun_hardened.sh <git_repo_url> [branch] [domain] [letsencrypt_email]"
  exit 1
fi

TIMESTAMP="$(date +%Y%m%d%H%M%S)"
NEW_RELEASE_DIR="${RELEASES_DIR}/${TIMESTAMP}"
PREV_TARGET=""

rollback() {
  echo "[ROLLBACK] 检测到失败，开始回滚..."
  if [[ -n "${PREV_TARGET}" && -d "${PREV_TARGET}" ]]; then
    sudo ln -sfn "${PREV_TARGET}" "${CURRENT_LINK}"
    sudo systemctl restart ${APP_NAME}.service || true
    echo "[ROLLBACK] 已回滚到 ${PREV_TARGET}"
  else
    echo "[ROLLBACK] 无可回滚版本"
  fi
}
trap rollback ERR

echo "[1/10] 安装基础组件"
sudo apt-get update -y
sudo apt-get install -y curl git nginx ca-certificates

if ! command -v node >/dev/null 2>&1; then
  echo "[2/10] 安装 Node.js 22"
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

if ! id -u "${APP_USER}" >/dev/null 2>&1; then
  echo "[3/10] 创建系统用户 ${APP_USER}"
  sudo useradd --system --create-home --shell /usr/sbin/nologin "${APP_USER}"
fi

echo "[4/10] 准备目录结构"
sudo mkdir -p "${RELEASES_DIR}" "${APP_ROOT}/shared"
sudo chown -R ${APP_USER}:${APP_GROUP} "${APP_ROOT}"

if [[ -L "${CURRENT_LINK}" ]]; then
  PREV_TARGET="$(readlink -f "${CURRENT_LINK}")"
fi

echo "[5/10] 拉取新版本 ${BRANCH} -> ${NEW_RELEASE_DIR}"
sudo -u ${APP_USER} git clone -b "${BRANCH}" "${REPO_URL}" "${NEW_RELEASE_DIR}"

if [[ ! -f "${APP_ROOT}/shared/.env" ]]; then
  echo "[6/10] 初始化 shared/.env"
  sudo cp "${NEW_RELEASE_DIR}/.env.example" "${APP_ROOT}/shared/.env"
  sudo chown ${APP_USER}:${APP_GROUP} "${APP_ROOT}/shared/.env"
  echo "请先编辑 ${APP_ROOT}/shared/.env（阿里云 MySQL 参数），然后重新执行脚本。"
  exit 2
fi

sudo ln -sfn "${APP_ROOT}/shared/.env" "${NEW_RELEASE_DIR}/.env"

echo "[7/10] 安装依赖与构建"
cd "${NEW_RELEASE_DIR}"
sudo -u ${APP_USER} npm install
sudo -u ${APP_USER} npm run build

# 网络受限时尝试国内镜像
if [[ ! -d node_modules ]]; then
  echo "[INFO] node_modules 不存在，尝试切换镜像后重试"
  sudo -u ${APP_USER} npm config set registry https://registry.npmmirror.com
  sudo -u ${APP_USER} npm install
  sudo -u ${APP_USER} npm run build
fi

echo "[8/10] 执行数据库迁移"
sudo -u ${APP_USER} npm run migrate

echo "[9/10] 更新 current 软链接"
sudo ln -sfn "${NEW_RELEASE_DIR}" "${CURRENT_LINK}"

cat <<SYSTEMD | sudo tee /etc/systemd/system/${APP_NAME}.service >/dev/null
[Unit]
Description=${APP_NAME} service
After=network.target

[Service]
Type=simple
User=${APP_USER}
Group=${APP_GROUP}
WorkingDirectory=${CURRENT_LINK}
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=5
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
SYSTEMD

sudo systemctl daemon-reload
sudo systemctl enable ${APP_NAME}.service
sudo systemctl restart ${APP_NAME}.service

cat <<NGINX | sudo tee /etc/nginx/sites-available/${APP_NAME}.conf >/dev/null
server {
    listen 80;
    server_name ${DOMAIN:-_};

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/${APP_NAME}.conf /etc/nginx/sites-enabled/${APP_NAME}.conf
sudo nginx -t
sudo systemctl restart nginx

if [[ -n "${DOMAIN}" && -n "${LETSENCRYPT_EMAIL}" ]]; then
  echo "[10/10] 配置 HTTPS（Let's Encrypt）"
  sudo apt-get install -y certbot python3-certbot-nginx
  sudo certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos -m "${LETSENCRYPT_EMAIL}" --redirect || true
else
  echo "[10/10] 跳过 HTTPS：未提供 domain/email"
fi

echo "部署成功："
echo "- 本地健康检查: curl http://127.0.0.1:3000/api/health"
echo "- 服务状态: sudo systemctl status ${APP_NAME}.service"
