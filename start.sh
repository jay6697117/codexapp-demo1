#!/bin/bash

# ============================================
# Pixel Arena - 一键启动脚本
# ============================================

set -e

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
echo -e "${BLUE}   Pixel Arena 像素竞技场 - 启动中...   ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查是否已经在运行
if [ -f "$PID_FILE" ]; then
    echo -e "${YELLOW}检测到服务可能已在运行，先执行关闭...${NC}"
    "$PROJECT_DIR/stop.sh" 2>/dev/null || true
    sleep 1
fi

# 进入项目目录
cd "$PROJECT_DIR"

# 检查 node_modules
check_dependencies() {
    local dir=$1
    local name=$2
    if [ ! -d "$dir/node_modules" ]; then
        echo -e "${YELLOW}[$name] 安装依赖中...${NC}"
        (cd "$dir" && npm install)
    fi
}

echo -e "${GREEN}[1/4] 检查依赖...${NC}"
check_dependencies "$PROJECT_DIR/shared" "shared"
check_dependencies "$PROJECT_DIR/server" "server"
check_dependencies "$PROJECT_DIR/client" "client"

# 构建 shared
echo -e "${GREEN}[2/4] 构建共享库...${NC}"
(cd "$PROJECT_DIR/shared" && npm run build 2>/dev/null) || {
    echo -e "${YELLOW}共享库构建跳过（可能已构建）${NC}"
}

# 启动服务器
echo -e "${GREEN}[3/4] 启动游戏服务器...${NC}"
cd "$PROJECT_DIR/server"
npm run dev > "$PROJECT_DIR/server.log" 2>&1 &
SERVER_PID=$!
echo "SERVER_PID=$SERVER_PID" > "$PID_FILE"

# 等待服务器启动
sleep 2

# 检查服务器是否启动成功
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo -e "${RED}服务器启动失败！查看 server.log 了解详情${NC}"
    exit 1
fi

echo -e "${GREEN}  服务器已启动 (PID: $SERVER_PID)${NC}"

# 启动客户端
echo -e "${GREEN}[4/4] 启动游戏客户端...${NC}"
cd "$PROJECT_DIR/client"
npm run dev > "$PROJECT_DIR/client.log" 2>&1 &
CLIENT_PID=$!
echo "CLIENT_PID=$CLIENT_PID" >> "$PID_FILE"

# 等待客户端启动
sleep 3

# 检查客户端是否启动成功
if ! kill -0 $CLIENT_PID 2>/dev/null; then
    echo -e "${RED}客户端启动失败！查看 client.log 了解详情${NC}"
    exit 1
fi

echo -e "${GREEN}  客户端已启动 (PID: $CLIENT_PID)${NC}"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}       启动成功！${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "  ${YELLOW}游戏地址:${NC}  http://localhost:5173"
echo -e "  ${YELLOW}服务器:${NC}    http://localhost:2567"
echo ""
echo -e "  ${YELLOW}日志文件:${NC}"
echo -e "    - 服务器: $PROJECT_DIR/server.log"
echo -e "    - 客户端: $PROJECT_DIR/client.log"
echo ""
echo -e "  ${YELLOW}关闭服务:${NC}  ./stop.sh"
echo ""

# 尝试自动打开浏览器
if command -v open &> /dev/null; then
    # macOS
    sleep 1
    open "http://localhost:5173"
elif command -v xdg-open &> /dev/null; then
    # Linux
    sleep 1
    xdg-open "http://localhost:5173"
fi

echo -e "${GREEN}按 Ctrl+C 可以在前台查看日志，服务将继续在后台运行${NC}"
echo ""

# 实时显示日志（可选）
tail -f "$PROJECT_DIR/server.log" "$PROJECT_DIR/client.log" 2>/dev/null || true
