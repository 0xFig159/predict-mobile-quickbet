# Predict Mobile QuickBet 技术文档

## 目标

在黑客松提交标准内完成一个可演示 MVP：真实前端、真实测试网合约、真实链上/协议数据，不依赖 mock 数据。

## 赛道

DeepBook

## 技术栈

- 前端：`vp + React + Bun`。
- 样式：CSS variables + Tailwind/shadcn 可选，但每个项目必须保留独立主题 token。
- 钱包：Sui dApp Kit / Slush wallet 兼容。
- 链：Sui Testnet，所有核心动作必须产生真实 transaction digest。
- 合约：Move package，部署到 Testnet，README 记录 Package ID。
- 数据原则：**不要 mock 数据**。开发阶段允许空状态和错误状态，但演示数据必须来自 Sui RPC、DeepBook Predict API、Walrus/Seal 或真实测试网对象。

## UI 主题

Neon Sportsbook：深海蓝背景、电光青/荧光绿按钮、移动卡片式盘口、底部固定下单栏。

### 主题 token

- `--bg`: 项目专属主背景色。
- `--panel`: 卡片/面板色。
- `--accent`: 主行动按钮和关键图形色。
- `--danger`: 风险/失败状态。
- `--success`: 成功/完成状态。

## 合约设计

quickbet_receipt.move：记录每次 Predict mint 的 QuickBetReceipt { owner, market_key, side, size, tx_digest, status }；redeem 后更新结算状态。

### 合约最低要求

- `init` 或 create 函数能创建核心对象。
- 核心对象必须包含 owner、created_at、status。
- 所有演示状态变化必须发 event。
- 部署脚本输出 Package ID、核心对象 ID、示例交易 digest。

## 数据源

DeepBook Predict testnet API + Sui testnet RPC；读取真实 market/manager/redeem 状态，不用本地赔率 mock。

### 无 mock 落地规则

- 空状态可以显示“暂无链上数据”。
- 失败状态显示真实 RPC/API 错误。
- demo seed 脚本必须向测试网写入真实对象，而不是写本地 fixture。
- 前端所有核心列表从 RPC/API 查询；本地缓存只能做性能优化，不能作为权威数据。

## 前端页面

1. **Landing**：一句话价值、赛道、连接钱包、当前 testnet 状态。
2. **Console**：核心操作区，完成项目唯一最重要动作。
3. **Evidence**：展示 Package ID、Object ID、Transaction Digest、Walrus Blob ID（如适用）。
4. **Submission**：直接复制到 DeepSurge/CN PR 的项目描述、链接、部署信息。

## Demo 流程

连接钱包 → 领取/检查 dUSDC → 选择 UP/DOWN/RANGE → 调用 Predict mint → 写 QuickBetReceipt → 到期 redeem / 展示 PnL 分享卡。

## 实施步骤

1. `vp create predict-mobile-quickbet`，选择 React，包管理使用 Bun。
2. 添加 Sui 钱包连接和 testnet network guard。
3. 建 `contracts/` Move package，实现最小对象状态机。
4. 写 `scripts/deploy.ts`：publish package，并把输出写入 `deployments/testnet.json`。
5. 写 `scripts/seed-demo.ts`：创建演示对象/执行核心链上动作。
6. 前端接真实 RPC/API，展示交易和对象链接。
7. 录制 5 分钟以内 demo。

## 验证命令

```bash
bun install
bun run build
bun run testnet:deploy
bun run testnet:seed
bun run dev
```

## 验收标准

- [ ] `bun run build` 通过。
- [ ] `bun run testnet:deploy` 输出 Package ID。
- [ ] `bun run testnet:seed` 输出至少 1 条交易 digest。
- [ ] 前端 Evidence 页面能打开 explorer 链接。
- [ ] 页面刷新后仍能从链上恢复演示状态。

## 仓库结构

```text
predict-mobile-quickbet/
├── app/                    # vp/react 前端
├── contracts/              # Move package
├── scripts/                # deploy、seed、演示脚本
├── public/logo.png          # 或根目录 logo.png 软引用/复制
├── doc/
│   ├── MVP.md
│   └── TECHNICAL_PLAN.md
└── README.md
```

## 黑客松提交达标线

- [ ] Website 可访问，首页 10 秒内讲清项目。
- [ ] GitHub 公开，`README.md` 有 install/dev/deploy/demo。
- [ ] Testnet Package ID 已记录。
- [ ] 至少 1 条真实交易 digest。
- [ ] 如果用 Walrus，至少 1 个真实 blob id。
- [ ] Demo 视频 ≤ 5 分钟：问题、操作、链上证据、愿景。
- [ ] DeepSurge 项目页包含 logo、repo、website、video、deployment。

## 禁止

- 禁止用静态 mock JSON 伪造核心数据。
- 禁止只做 UI，没有 testnet 合约或真实链上动作。
- 禁止复用其他项目主题导致 8 个项目看起来像同一个皮肤。

