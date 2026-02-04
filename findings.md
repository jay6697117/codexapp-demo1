# Findings & Decisions
<!-- 
  WHAT: Your knowledge base for the task. Stores everything you discover and decide.
  WHY: Context windows are limited. This file is your "external memory" - persistent and unlimited.
  WHEN: Update after ANY discovery, especially after 2 view/browser/search operations (2-Action Rule).
-->

## Requirements
<!-- 
  WHAT: What the user asked for, broken down into specific requirements.
  WHY: Keeps requirements visible so you don't forget what you're building.
  WHEN: Fill this in during Phase 1 (Requirements & Discovery).
  EXAMPLE:
    - Command-line interface
    - Add tasks
    - List all tasks
    - Delete tasks
    - Python implementation
-->
<!-- Captured from user request -->
- 实现 GameRoom 的服务端碰撞检测，玩家不能穿过墙壁、水池或栅栏。
- 服务端需要加载与客户端完全一致的地图数据。
- 当前状态：用户反馈仍未实现（碰撞仍不生效）。

## Research Findings
<!-- 
  WHAT: Key discoveries from web searches, documentation reading, or exploration.
  WHY: Multimodal content (images, browser results) doesn't persist. Write it down immediately.
  WHEN: After EVERY 2 view/browser/search operations, update this section (2-Action Rule).
  EXAMPLE:
    - Python's argparse module supports subcommands for clean CLI design
    - JSON module handles file persistence easily
    - Standard pattern: python script.py <command> [args]
-->
<!-- Key discoveries during exploration -->
- 已创建任务跟踪模板文件：`task_plan.md`、`findings.md`、`progress.md`。
- 仓库包含 `client/`、`server/`、`shared/` 目录，项目根下已有 `.worktrees/` 目录。
- 本地未安装 `rg`，需改用 `grep` 做代码搜索。
- GameRoom 主要实现位于 `server/src/rooms/GameRoom.ts`，同时存在 `server/deno-entry.ts` 中的简化版 GameRoom（Deno 兼容）。
- `server/src/rooms/GameRoom.ts` 中已出现碰撞相关代码：子弹碰撞检测、玩家半径、tile 碰撞检测（玩家 32x32 角点检查）。
- `GameRoom.handleInput` 会计算下一位置并调用 `checkCollision`，若无碰撞才更新 `player.x/y`。
- `checkCollision` 使用 `mapMatrix` + `isCollidable` 判断，`mapMatrix` 在 `onCreate` 中通过 `generateTilemap` 生成。
- `generateTilemap` 与 `isCollidable` 定义在 `shared/src/utils/map-generator.ts`。
- 客户端 `client/src/scenes/GameScene.ts` 从 `@pixel-arena/shared` 引入 `generateTilemap`，并使用与服务端一致的 `mapWidth/mapHeight` 计算方式。
- 客户端本地还有 `client/src/utils/tilemap-generator.ts`（带随机 seed），但 GameScene 并未使用该版本。
- `start.sh` 通过 `npm run dev` 启动服务端；`server/package.json` 的 `dev` 指向 `tsx watch src/index.ts`，实际运行的是 `server/src/index.ts`（非 `deno-entry.ts`）。
- 服务端 `server/src/index.ts` 注册了 `game` → `GameRoom`，`village` → `VillageRoom`。
- `server/src/rooms` 目录下包含 `GameRoom.ts`、`VillageRoom.ts` 和 `index.ts`。
- 客户端存在 `ClientPrediction`（输入序列、调和与平滑），但需要确认是否实际被调用。
- `NetworkManager` 仅负责发送输入并通过 `stateChange` 事件转发服务器状态，具体位置同步逻辑在场景/实体层。
- `ClientPrediction` 被 `client/src/entities/Player.ts` 引入并实例化（本地玩家预测/调和）。
- `reconcileWithServer` 仅在 `Player` 内定义，当前未发现调用点。
- `GameScene` 在多人模式下仅在 `stateChange` 回调中调用 `syncPlayersFromState`，本地玩家在 `create()` 中直接初始化到地图中心。
- `syncPlayersFromState` 对本地玩家直接 `return`，并注释掉“服务器权威同步”逻辑，这会导致本地玩家完全不受服务器位置约束。
- 服务端未发现用于客户端调和的 `sequence`/`lastProcessedInput` 字段；`seq` 仅存在于 `InputMessage` 接口中，当前未被保存到 `PlayerState`。
- `PlayerState` 目前仅包含位置/角度/血量等字段，没有输入序列号或服务器时间戳。
- 远程玩家通过 `RemotePlayer.updateFromState` + 插值平滑位置；本地玩家并未走同样的状态同步路径。
- 客户端测试框架为 Vitest（`client/package.json` 的 `test` 脚本为 `vitest run`）。
- 新增 `client/src/utils/collision-tiles.ts` 用于生成可碰撞 tile 索引列表，并有对应单元测试。
- `GameScene` 将在 `createMap` 中设置 tilemap 碰撞层，并在创建本地玩家后添加物理碰撞器。
- 游戏地图尺寸为 `1600x1200`，tile 尺寸 `32`（`shared/src/constants.ts`）。
- Playwright 测试示例 actions 位于 `~/.codex/skills/develop-web-game/references/action_payloads.json`。
- 客户端 Vite 开发服务器自动切换到 `http://localhost:3001/`（3000 已占用）。
- `InputManager` 使用 WASD 键位（`A`/`D`/`W`/`S`），之前 Playwright 用 `ArrowLeft` 不会触发移动。

## Technical Decisions
<!-- 
  WHAT: Architecture and implementation choices you've made, with reasoning.
  WHY: You'll forget why you chose a technology or approach. This table preserves that knowledge.
  WHEN: Update whenever you make a significant technical choice.
  EXAMPLE:
    | Use JSON for storage | Simple, human-readable, built-in Python support |
    | argparse with subcommands | Clean CLI: python todo.py add "task" |
-->
<!-- Decisions made with rationale -->
| Decision | Rationale |
|----------|-----------|
|          |           |

## Issues Encountered
<!-- 
  WHAT: Problems you ran into and how you solved them.
  WHY: Similar to errors in task_plan.md, but focused on broader issues (not just code errors).
  WHEN: Document when you encounter blockers or unexpected challenges.
  EXAMPLE:
    | Empty file causes JSONDecodeError | Added explicit empty file check before json.load() |
-->
<!-- Errors and how they were resolved -->
| Issue | Resolution |
|-------|------------|
| `rg` command not found | 使用 `grep` 作为替代搜索工具 |
| 单机模式玩家穿墙 | 发现 `GameScene` 未对 tilemap 设置物理碰撞层，本地玩家不受地图阻挡 |

## Resources
<!-- 
  WHAT: URLs, file paths, API references, documentation links you've found useful.
  WHY: Easy reference for later. Don't lose important links in context.
  WHEN: Add as you discover useful resources.
  EXAMPLE:
    - Python argparse docs: https://docs.python.org/3/library/argparse.html
    - Project structure: src/main.py, src/utils.py
-->
<!-- URLs, file paths, API references -->
-

## Visual/Browser Findings
<!-- 
  WHAT: Information you learned from viewing images, PDFs, or browser results.
  WHY: CRITICAL - Visual/multimodal content doesn't persist in context. Must be captured as text.
  WHEN: IMMEDIATELY after viewing images or browser results. Don't wait!
  EXAMPLE:
    - Screenshot shows login form has email and password fields
    - Browser shows API returns JSON with "status" and "data" keys
-->
<!-- CRITICAL: Update after every 2 view/browser operations -->
<!-- Multimodal content must be captured as text immediately -->
- Playwright 抓取的 `output/web-game/shot-0.png` 为全黑画面（看不到地图/玩家），需要进一步确认是否为 headless/WebGL 或加载时机问题。
- 同次运行的 `state-0.json` 显示 `mode=game` 且玩家位置为 `x=800,y=600`，说明动作没有生效或未触发键位。
- 第二次使用 `A` 键动作后截图仍为全黑，`state-0.json` 仍显示 `x=800,y=600`，表明当前 Playwright 测试未驱动实际移动，需改用可视化/手动验证或调整测试方式（headed/延迟）。
- Headed 模式截图仍全黑，`errors-0.json` 显示资源 404（未定位具体资源）；`state-0.json` 位置不变。自动化视觉验证暂不可用。

---
<!-- 
  REMINDER: The 2-Action Rule
  After every 2 view/browser/search operations, you MUST update this file.
  This prevents visual information from being lost when context resets.
-->
*Update this file after every 2 view/browser/search operations*
*This prevents visual information from being lost*
