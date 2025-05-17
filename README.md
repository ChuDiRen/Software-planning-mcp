# 软件规划工具（Software Planning Tool）🚀

本项目是一个基于MCP协议的软件开发规划服务器，帮助你将复杂的软件项目拆解为可执行的任务，自动生成详细开发计划，支持任务管理、复杂度评估、代码示例等功能。

---

## 主要功能 ✨
- **智能规划**：AI自动生成结构化、可落地的开发计划
- **任务管理**：添加、更新、移除、查询开发任务
- **复杂度评分**：每个任务可标注复杂度（0-10）
- **代码示例**：任务描述中可包含代码片段
- **计划导出**：支持保存和导出完整开发计划

---

## 快速开始

### 方式一：npx 一键启动（推荐）
无需本地构建，直接运行：
```bash
npx -y software-planning-tool
```

或在MCP配置中：
```json
{
  "mcpServers": {
    "software-planning-tool": {
      "command": "npx",
      "args": [
        "-y",
        "software-planning-tool"
      ]
    }
  }
}
```

### 方式二：本地构建后 node 启动
适合开发调试：
```bash
pnpm install
pnpm run build
node build/index.js
```

### 启动方式对比
| 方式   | 优点                 | 适用场景         |
|--------|----------------------|------------------|
| npx    | 无需本地构建，升级快 | 生产/快速体验    |
| node   | 可本地调试源码       | 开发/二次开发    |

---

## 典型用法示例

1. **开启规划会话**
```typescript
await client.callTool("software-planning-tool", "start_planning", {
  goal: "开发一个用户注册与登录功能"
});
```

2. **添加任务（todo）**
```typescript
const todo = await client.callTool("software-planning-tool", "add_todo", {
  title: "实现注册接口",
  description: "编写注册API，校验参数，密码加密存储，写单元测试",
  complexity: 4,
  codeExample: `// 代码片段`
});
```

3. **更新任务状态**
```typescript
await client.callTool("software-planning-tool", "update_todo_status", {
  todoId: todo.id,
  isComplete: true
});
```

4. **保存开发计划**
```typescript
await client.callTool("software-planning-tool", "save_plan", {
  plan: `
1. 需求澄清与目标确认
目标：明确注册/登录需求
操作步骤：
- 与产品经理沟通
- 明确字段
预期产出：需求文档
依赖：产品经理
风险：需求不清
复杂度：2
里程碑：是
代码示例：
// ...
`
});
```

---

## 项目结构
```
software-planning-tool/
  ├── src/                # 源码目录
  │   ├── index.ts        # 主服务入口
  │   ├── prompts.ts      # 计划生成引导与解析
  │   ├── storage.ts      # 数据持久化
  │   └── types.ts        # 类型定义
  ├── build/              # 编译后产物
  ├── package.json        # 项目配置
  ├── tsconfig.json       # TypeScript配置
  └── .gitignore          # Git忽略文件
```

---

## 构建与测试

### 构建
```bash
pnpm run build
```

### 测试（推荐用MCP Inspector）
```bash
pnpm run inspector
```

---

## npm包发布操作手册

1. 注册npm账号：https://www.npmjs.com/
2. 登录npm：
```bash
npm login
```
3. 检查package.json：name唯一，version递增，bin指向build/index.js
4. 构建项目：
```bash
pnpm run build
```
5. 发布到npm：
```bash
npm publish --access public
```
6. 验证npx启动：
```bash
npx -y 你的包名
```

### 常见问题
- 包名冲突：更换package.json的name字段
- 权限问题：加--access public
- 版本未变无法发布：每次发布需修改version字段
- 本地测试：
```bash
npm link
npx -y software-planning-tool
```

---

## 常见问题FAQ
- **npx启动报错？** 检查是否已发布npm包，或用npm link本地测试
- **如何重置数据？** 删除用户目录下 .software-planning-tool/data.json 文件
- **如何导出计划？** 通过get_todos接口获取所有任务，或直接复制计划文本
- **支持多用户/多项目吗？** 当前为单用户单项目，后续可扩展

---

## 许可证
MIT

---

由 ❤️ 和 Model Context Protocol 强力驱动