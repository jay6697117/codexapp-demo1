#!/bin/bash

# ============================================
# Pixel Arena - 一键关闭脚本
# ============================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="$PROJECT_DIR/.pids"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Pixel Arena 像素竞技场 - 关闭中...   ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

stopped=0

# 从 PID 文件读取并关闭
if [ -f "$PID_FILE" ]; then
    while IFS='=' read -r key value; do
        if [ -n "$value" ]; then
            if kill -0 "$value" 2>/dev/null; then
                echo -e "${YELLOW}关闭 $key (PID: $value)...${NC}"
                kill "$value" 2>/dev/null
                stopped=$((stopped + 1))
            fi
        fi
    done < "$PID_FILE"
    rm -f "$PID_FILE"
fi

# 查找并关闭可能遗留的进程
echo -e "${YELLOW}检查遗留进程...${NC}"

# 关闭服务器进程 (ts-node server)
SERVER_PIDS=$(pgrep -f "ts-node.*server" 2>/dev/null || true)
if [ -n "$SERVER_PIDS" ]; then
    echo -e "${YELLOW}关闭服务器进程: $SERVER_PIDS${NC}"
    echo "$SERVER_PIDS" | xargs kill 2>/dev/null || true
    stopped=$((stopped + 1))
fi

# 关闭 Vite 客户端进程
CLIENT_PIDS=$(pgrep -f "vite.*client" 2>/dev/null || true)
if [ -n "$CLIENT_PIDS" ]; then
    echo -e "${YELLOW}关闭客户端进程: $CLIENT_PIDS${NC}"
    echo "$CLIENT_PIDS" | xargs kill 2>/dev/null || true
    stopped=$((stopped + 1))
fi

# 关闭占用端口的进程
check_and_kill_port() {
    local port=$1
    local name=$2
    local pid=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
        echo -e "${YELLOW}关闭占用端口 $port 的进程 ($name): $pid${NC}"
        kill $pid 2>/dev/null || true
        stopped=$((stopped + 1))
    fi
}

check_and_kill_port 2567 "游戏服务器"
check_and_kill_port 5173 "Vite 客户端"

# 清理日志文件（可选）
# rm -f "$PROJECT_DIR/server.log" "$PROJECT_DIR/client.log"

echo ""
if [ $stopped -gt 0 ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}       所有服务已关闭！${NC}"
    echo -e "${GREEN}========================================${NC}"
else
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}       没有发现运行中的服务${NC}"
    echo -e "${BLUE}========================================${NC}"
fi
echo ""
