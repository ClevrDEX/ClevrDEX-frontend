# 多链 Uniswap V2 DEX 系统架构设计

## 1. 项目定位

本项目建设一套支持多链的 Uniswap V2 DEX 前端，用于接入自部署的 Uniswap V2 合约体系。

系统采用单一前端代码库，通过配置接入多条链。所有链共用同一套 Swap、Pool、Add Liquidity、Remove Liquidity、Token List、行情和用户仓位逻辑。

目标形态：

```text
一套前端应用
一套 V2 协议适配层
一套数据访问层
多条链通过配置接入
每条链接入自部署的 Factory / Router / WNative / Pair
```

新增一条链时，只增加链配置、DEX 部署配置、token list 数据、RPC、区块浏览器和索引服务地址，业务页面不做链级分叉。

---

## 2. 架构原则

### 2.1 单代码库多链

前端应用只有一套业务代码。链相关差异全部沉淀在配置层：

```text
chainId
chain name
native currency
RPC
block explorer
Factory
Router
WNative
INIT_CODE_PAIR_HASH
token list
base tokens
stable tokens
subgraph / indexer endpoint
```

业务模块只接收 `chainId`，通过 `chainId` 获取当前链的完整 DEX 部署信息。

### 2.2 统一 V2 Adapter

所有链都运行 Uniswap V2 协议模型，因此合约交互由统一的 V2 Adapter 封装。

V2 Adapter 负责：

```text
读取 Factory / Router / Pair
计算 Pair 地址
生成候选交易路径
读取报价
生成 swap 参数
生成 add liquidity 参数
生成 remove liquidity 参数
处理 approve
解析交易错误
```

页面不直接拼接 Router 参数，不直接读取 Factory，不直接处理 Pair 公式。

### 2.3 数据访问统一

前端页面通过 `DexDataProvider` 访问池子、仓位、交易历史、成交量、TVL 和图表数据。

第一版数据源使用 Subgraph。系统同时保留 Indexer Provider 结构，后续自建 Indexer 后切换 Provider 实现。

页面只依赖 Provider 接口，不绑定具体数据源。

### 2.4 Token List 标准化

Token 信息使用 Uniswap Token Lists 标准维护。前端按当前 `chainId` 过滤 token，并支持用户导入自定义 token。

Token List 负责提供：

```text
chainId
address
name
symbol
decimals
logoURI
tags
```

合约地址、token metadata 和 token logo 不写入业务页面。

---

## 3. 总体架构

```text
┌──────────────────────────────────────────────────────────────┐
│                          Frontend                            │
│                                                              │
│  Swap      Pool      Add Liquidity      Remove Liquidity     │
│    │         │             │                  │              │
│    └─────────┴─────────────┴──────────────────┘              │
│                         │                                    │
│                 Feature Business Layer                       │
│                         │                                    │
│      ┌──────────────────┼──────────────────┐                 │
│      │                  │                  │                 │
│ Chain Config        V2 Adapter       DexDataProvider         │
│      │                  │                  │                 │
│      │             wagmi / viem       Subgraph / Indexer     │
│      │                  │                  │                 │
└──────┼──────────────────┼──────────────────┼─────────────────┘
       │                  │                  │
       ▼                  ▼                  ▼
 RPC / Wallet     V2 Contracts        Indexed Data Service
```

系统分层：

```text
UI 层：Swap、Pool、Add、Remove、Token Selector、Transaction Modal
业务层：报价、路径、滑点、授权、交易状态、用户输入
协议层：V2 Adapter、ABI、Pair 计算、Router 调用、Pair 读取
配置层：Chain Config、Dex Deployment、Token List Source
数据层：Subgraph Provider、Indexer Provider、RPC Provider
```

---

## 4. 技术架构

前端技术栈：

```text
Next.js
React
TypeScript
wagmi
viem
RainbowKit / ConnectKit
TanStack Query
Zustand / Jotai
```

职责划分：

```text
Next.js：应用框架和路由
React：页面和组件
TypeScript：类型约束
wagmi：钱包连接、网络切换、合约读写 hooks
viem：ABI 编码、合约调用、数值处理
RainbowKit / ConnectKit：钱包连接 UI
TanStack Query：链上读取、报价、余额、allowance、数据接口缓存
Zustand / Jotai：用户选择、slippage、deadline、本地偏好
```

---

## 5. 多链配置

### 5.1 Chain Config

Chain Config 描述钱包和 RPC 层需要的信息：

```ts
export type ChainConfig = {
  id: number
  name: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrls: string[]
  blockExplorerUrl: string
}
```

### 5.2 Dex Deployment

Dex Deployment 描述当前链上的 Uniswap V2 合约部署：

```ts
export type DexDeployment = {
  chainId: number
  factory: `0x${string}`
  router: `0x${string}`
  wrappedNative: `0x${string}`
  initCodePairHash: `0x${string}`
  multicall?: `0x${string}`
  tokenListUrl: string
  subgraphUrl: string
  indexerApiUrl?: string
  baseTokens: `0x${string}`[]
  stableTokens: `0x${string}`[]
}
```

示例：

```ts
export const V2_DEPLOYMENTS = {
  1: {
    chainId: 1,
    factory: "0x...",
    router: "0x...",
    wrappedNative: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    initCodePairHash: "0x...",
    tokenListUrl: "https://assets.example.com/tokenlist.json",
    subgraphUrl: "https://subgraph.example.com/ethereum",
    baseTokens: ["0x..."],
    stableTokens: ["0x..."],
  },
  56: {
    chainId: 56,
    factory: "0x...",
    router: "0x...",
    wrappedNative: "0x...",
    initCodePairHash: "0x...",
    tokenListUrl: "https://assets.example.com/tokenlist.json",
    subgraphUrl: "https://subgraph.example.com/bsc",
    baseTokens: ["0x..."],
    stableTokens: ["0x..."],
  },
} as const
```

业务模块读取方式：

```ts
const deployment = getV2Deployment(chainId)

const router = deployment.router
const factory = deployment.factory
const wrappedNative = deployment.wrappedNative
```

---

## 6. 合约层

每条链部署同一套 V2 合约模型：

```text
UniswapV2Factory
UniswapV2Router02
UniswapV2Pair
WETH / WBNB / WNative
Multicall3
```

Router 构造参数：

```solidity
UniswapV2Router02(factory, wrappedNative)
```

前端交易统一通过 Router 执行：

```text
swapExactTokensForTokens
swapExactETHForTokens
swapExactTokensForETH
addLiquidity
addLiquidityETH
removeLiquidity
removeLiquidityETH
```

读取类操作覆盖：

```text
router.getAmountsOut
router.getAmountsIn
factory.getPair
pair.getReserves
pair.totalSupply
pair.balanceOf
pair.allowance
erc20.balanceOf
erc20.allowance
erc20.decimals
erc20.symbol
erc20.name
```

合约部署约束：

```text
Factory、Router、WNative 必须属于同一条链的同一套部署
Router 构造参数中的 factory 和 wrappedNative 必须与配置一致
INIT_CODE_PAIR_HASH 必须与自部署 Pair bytecode 匹配
Pair 地址计算必须使用当前链的 factory 和 initCodePairHash
native token 交易统一通过 wrappedNative 处理
```

---

## 7. 前端目录结构

```text
src/
  chains/
    index.ts
    wagmi.ts

  dex/
    deployments.ts
    getDeployment.ts

    v2/
      abi/
        factory.ts
        router.ts
        pair.ts
        erc20.ts
      pairFor.ts
      paths.ts
      quote.ts
      swap.ts
      liquidity.ts
      approvals.ts
      errors.ts

  token-lists/
    loadTokenList.ts
    validateToken.ts
    tokenSafety.ts

  data/
    provider.ts
    subgraphProvider.ts
    indexerProvider.ts
    rpcProvider.ts

  features/
    swap/
    pool/
    liquidity/
    tokens/
    transactions/
```

模块职责：

```text
chains：钱包网络、RPC、explorer 配置
dex/deployments：多链 DEX 合约部署配置
dex/v2：V2 协议交互、报价、路径、流动性、错误解析
token-lists：Token List 加载、校验、导入风险处理
data：池子、仓位、图表、交易历史数据访问
features：页面业务和 UI 状态
```

---

## 8. Swap 设计

### 8.1 Swap 主流程

```text
用户连接钱包
  ↓
识别当前 chainId
  ↓
读取 DexDeployment
  ↓
加载当前链 Token List
  ↓
用户选择 tokenIn / tokenOut / amountIn
  ↓
构造候选 path
  ↓
调用 router.getAmountsOut 获取报价
  ↓
选择最优 path
  ↓
计算 price impact、minimum received、slippage
  ↓
检查 token allowance
  ↓
执行 approve
  ↓
调用 Router swap
  ↓
展示交易状态和 explorer 链接
```

### 8.2 路径生成

第一版路由范围：

```text
A -> B
A -> WNative -> B
A -> StableCoin -> B
```

候选路径由当前链 `baseTokens` 生成：

```ts
export function buildCandidatePaths(
  tokenIn: `0x${string}`,
  tokenOut: `0x${string}`,
  baseTokens: `0x${string}`[],
) {
  return [
    [tokenIn, tokenOut],
    ...baseTokens
      .filter((base) => base !== tokenIn && base !== tokenOut)
      .map((base) => [tokenIn, base, tokenOut]),
  ]
}
```

报价逻辑：

```text
并发调用所有候选 path 的 getAmountsOut
过滤失败 path
选择 amountOut 最大的 path
使用该 path 生成交易参数
```

### 8.3 Swap 页面能力

```text
钱包连接
网络切换
token 选择
token 导入
token 风险提示
余额展示
allowance 检查
approve exact
approve max
报价刷新
price impact
minimum received
slippage
deadline
路径展示
交易 pending / success / failed
交易 hash
explorer 链接
合约错误解析
不支持链提示
```

---

## 9. Liquidity 设计

### 9.1 Add Liquidity

流程：

```text
选择 tokenA / tokenB
  ↓
读取 factory.getPair
  ↓
读取 pair reserves
  ↓
按池子比例计算 token 输入数量
  ↓
检查 tokenA / tokenB allowance
  ↓
执行 approve
  ↓
调用 addLiquidity 或 addLiquidityETH
  ↓
展示预计 LP、pool share、交易状态
```

功能范围：

```text
创建新池
向已有池添加流动性
ERC20 + ERC20 添加流动性
native token + ERC20 添加流动性
滑点保护
deadline
LP token 预估
pool share 预估
```

### 9.2 Remove Liquidity

流程：

```text
读取用户 LP 仓位
  ↓
选择移除的池子
  ↓
读取 LP balance、totalSupply、reserves
  ↓
选择移除比例
  ↓
计算可取回 token0 / token1
  ↓
检查 LP token allowance
  ↓
执行 approve
  ↓
调用 removeLiquidity 或 removeLiquidityETH
  ↓
展示交易状态
```

功能范围：

```text
LP 仓位列表
25% / 50% / 75% / 100% 快捷比例
自定义移除比例
可取回 token 数量预估
LP token approve
native token 移除流动性
ERC20 + ERC20 移除流动性
```

---

## 10. Token List 设计

Token List 使用 Uniswap Token Lists 标准。

统一地址：

```text
https://assets.example.com/tokenlist.json
```

数据结构：

```json
{
  "name": "Clean DEX Token List",
  "timestamp": "2026-06-12T00:00:00Z",
  "version": {
    "major": 1,
    "minor": 0,
    "patch": 0
  },
  "tokens": [
    {
      "chainId": 1,
      "address": "0x...",
      "name": "Wrapped Ether",
      "symbol": "WETH",
      "decimals": 18,
      "logoURI": "https://assets.example.com/tokens/weth.png"
    },
    {
      "chainId": 56,
      "address": "0x...",
      "name": "Wrapped BNB",
      "symbol": "WBNB",
      "decimals": 18,
      "logoURI": "https://assets.example.com/tokens/wbnb.png"
    }
  ]
}
```

前端处理规则：

```text
按当前 chainId 过滤 token
默认展示官方 token list
用户可导入任意 ERC20 token
导入 token 时展示合约地址和风险提示
同名 token 展示完整地址辅助识别
未知 token 保存在本地导入列表
```

---

## 11. 数据索引层

### 11.1 数据范围

索引层提供以下数据：

```text
Pool 列表
热门交易对
用户 LP 仓位
历史交易
TVL
成交量
K 线图
token price
pool APR
```

### 11.2 Subgraph Provider

第一版数据源为 Uniswap V2 Subgraph。

每条链部署一个 Subgraph，索引当前链自部署 Factory 下创建的所有 Pair。

索引事件：

```text
Factory.PairCreated
Pair.Mint
Pair.Burn
Pair.Swap
Pair.Sync
ERC20.Transfer
```

查询对象：

```text
pairs
tokens
liquidityPositions
swaps
mints
burns
pairDayDatas
tokenDayDatas
```

### 11.3 Indexer Provider

系统保留自建 Indexer Provider。

Indexer 架构：

```text
Node.js / Go / Rust Indexer
  ↓
监听 Factory / Pair / ERC20 事件
  ↓
写入 Postgres
  ↓
Redis 缓存热点数据
  ↓
提供 REST / GraphQL API
```

API：

```text
GET /chains/:chainId/pairs
GET /chains/:chainId/tokens/:address
GET /chains/:chainId/users/:address/positions
GET /chains/:chainId/pairs/:address/chart
GET /chains/:chainId/pairs/:address/transactions
```

Indexer 处理能力：

```text
多链事件监听
断点续扫
reorg 处理
confirmed block 控制
RPC fallback
indexing lag 监控
热点数据缓存
```

### 11.4 DexDataProvider

页面统一依赖 `DexDataProvider`：

```ts
export interface DexDataProvider {
  getPairs(chainId: number): Promise<Pair[]>
  getToken(chainId: number, address: `0x${string}`): Promise<Token>
  getUserPositions(chainId: number, user: `0x${string}`): Promise<Position[]>
  getPairDayData(chainId: number, pair: `0x${string}`): Promise<PairDayData[]>
  getTransactions(chainId: number, pair: `0x${string}`): Promise<Transaction[]>
}
```

Provider 实现：

```text
SubgraphDataProvider
IndexerDataProvider
RpcFallbackDataProvider
```

---

## 12. 状态管理

### 12.1 链上和远程数据

使用 TanStack Query 管理：

```text
token balance
token allowance
pair reserves
router quote
pool list
user positions
transactions
chart data
```

### 12.2 本地业务状态

使用 Zustand / Jotai 管理：

```text
当前 tokenIn / tokenOut
当前 amountIn / amountOut
当前 slippage
当前 deadline
当前最佳 path
用户导入 token
用户常用 token
交易弹窗状态
```

### 12.3 钱包状态

使用 wagmi 管理：

```text
account
chainId
connector
network switch
contract read
contract write
transaction receipt
```

---

## 13. 错误处理

系统统一解析以下错误类型：

```text
用户拒绝签名
用户拒绝交易
当前链不支持
Router 未部署
token decimals 读取失败
token 没有流动性
报价路径全部失败
price impact 过高
allowance 不足
approve 失败
swap 失败
add liquidity 失败
remove liquidity 失败
RPC 超时
Subgraph 延迟
Pair 不存在
```

错误展示规则：

```text
用户行为类错误展示明确操作结果
链配置类错误展示当前链不支持或配置缺失
流动性类错误展示无可用交易路径
交易失败展示失败原因和 explorer 链接
RPC / Subgraph 错误展示重试入口
```

---

## 14. 落地阶段

### 14.1 第一阶段：多链 V2 基础版本

交付内容：

```text
Next.js 应用骨架
wagmi + viem 多链配置
RainbowKit / ConnectKit 钱包连接
DexDeployment 配置
V2 ABI 封装
Pair 地址计算
路径生成
Router 报价
Swap 页面
Add Liquidity 页面
Remove Liquidity 页面
Token List 加载
Subgraph Provider
Pool 列表
用户 LP 仓位
```

### 14.2 第二阶段：生产能力

交付内容：

```text
RPC fallback
交易错误解析
token 风险提示
热门 token
热门 pool
price impact 优化
TVL
volume
chart
交易监控
前端错误监控
```

### 14.3 第三阶段：规模化运营

交付内容：

```text
自建 Indexer
Token List 管理后台
多链部署管理后台
token 风控 registry
API 缓存层
合约事件告警
indexing lag 监控
```

---

## 15. 最终架构

最终系统由以下部分组成：

```text
Next.js + React + TypeScript 前端
wagmi + viem 钱包和合约交互层
统一 V2 Adapter
多链 Chain Config
多链 DexDeployment Config
Uniswap Token Lists
SubgraphDataProvider
IndexerDataProvider
```

核心运行方式：

```text
页面接收用户输入
  ↓
根据 chainId 获取 DEX 配置
  ↓
V2 Adapter 生成报价、路径和交易参数
  ↓
wagmi / viem 执行链上读写
  ↓
DexDataProvider 查询池子、仓位和历史数据
  ↓
UI 展示交易结果和数据状态
```

架构约束：

```text
新增链只修改配置和数据源
所有链共用 V2 Adapter
页面不感知具体合约地址
页面不绑定具体索引服务
Token 信息由 Token List 管理
交易统一通过自部署 Router 执行
```
