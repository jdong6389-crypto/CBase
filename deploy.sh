#!/bin/bash
cd /home/CBase
echo "=== Deploy started at $(date) ==="
git pull origin main
systemctl restart cbase
echo "=== Deploy finished at $(date) ==="
