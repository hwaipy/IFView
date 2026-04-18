#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

if command -v yarn >/dev/null 2>&1; then
  yarn quasar build
else
  npm run build
fi

DIST_SPA="$ROOT/dist/spa"
if [ ! -d "$DIST_SPA" ]; then
  echo "错误: 构建未生成 $DIST_SPA" >&2
  exit 1
fi

mkdir -p dist-history
zip -q -r "dist-history/spa-$(date -u +%Y-%m-%dT%H-%M-%SZ).zip" dist/spa

USER="ubuntu"
HOST="code.qpqi.group"
PORT="223"
LOCAL="${DIST_SPA}/"
REMOTE="/home/ubuntu/dockers/nginx/html/IFView/"
KEY_NAME="id_rsa_${HOST}"

# 确保 .ssh 目录存在
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# 检查或生成 SSH 密钥
if [ ! -f ~/.ssh/${KEY_NAME} ]; then
    echo "生成新的 SSH 密钥..."
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/${KEY_NAME} -N "" -q
    echo "密钥已生成: ~/.ssh/${KEY_NAME}"
fi

# 测试 SSH 连接，如果失败则复制密钥
ssh -i ~/.ssh/${KEY_NAME} -p ${PORT} -o BatchMode=yes ${USER}@${HOST} "echo" 2>/dev/null || {
    echo "需要配置 SSH 密钥认证..."
    echo "请输入远程服务器密码："
    ssh-copy-id -i ~/.ssh/${KEY_NAME}.pub -p ${PORT} ${USER}@${HOST}
}

# 同步文件
echo "开始同步文件..."
rsync --delete -avz -e "ssh -i ~/.ssh/${KEY_NAME} -p ${PORT}" ${LOCAL} ${USER}@${HOST}:${REMOTE}

echo "同步完成！"
