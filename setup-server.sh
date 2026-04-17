#!/bin/bash
# CBase 服务器一键配置脚本（只需运行一次）
set -e

NODE_PATH=$(which node)
PROJECT_DIR="/home/CBase"

echo ">>> Node path: $NODE_PATH"
echo ">>> Project dir: $PROJECT_DIR"

# 停掉旧的 nohup 进程（如果有）
echo ">>> Stopping old processes..."
pkill -f "node server/index.js" 2>/dev/null || true
sleep 1

# 创建 CBase 主服务
echo ">>> Creating cbase.service..."
cat > /etc/systemd/system/cbase.service << EOF
[Unit]
Description=CBase App
After=network.target

[Service]
Type=simple
WorkingDirectory=$PROJECT_DIR
Environment=NODE_ENV=production
ExecStart=$NODE_PATH server/index.js
Restart=always
RestartSec=5
StandardOutput=append:$PROJECT_DIR/cbase.log
StandardError=append:$PROJECT_DIR/cbase.log

[Install]
WantedBy=multi-user.target
EOF

# 创建 Webhook 监听服务
echo ">>> Creating cbase-webhook.service..."
cat > /etc/systemd/system/cbase-webhook.service << EOF
[Unit]
Description=CBase Webhook Listener
After=network.target

[Service]
Type=simple
WorkingDirectory=$PROJECT_DIR
Environment=WEBHOOK_SECRET=cbase-deploy-2026
ExecStart=$NODE_PATH server/webhook.js
Restart=always
RestartSec=5
StandardOutput=append:$PROJECT_DIR/webhook.log
StandardError=append:$PROJECT_DIR/webhook.log

[Install]
WantedBy=multi-user.target
EOF

# 给 deploy.sh 执行权限
chmod +x $PROJECT_DIR/deploy.sh

# 加载并启动服务
echo ">>> Starting services..."
systemctl daemon-reload
systemctl enable cbase cbase-webhook
systemctl start cbase
systemctl start cbase-webhook

# 验证
echo ""
echo ">>> Service status:"
systemctl is-active cbase && echo "  cbase: running" || echo "  cbase: FAILED"
systemctl is-active cbase-webhook && echo "  cbase-webhook: running" || echo "  cbase-webhook: FAILED"
echo ""
echo ">>> Setup complete!"
echo "  Main app:  http://$(hostname -I | awk '{print $1}'):3001"
echo "  Webhook:   http://$(hostname -I | awk '{print $1}'):9000/webhook"
echo ""
echo ">>> Next: open port 9000 in security group, then configure GitHub webhook."
