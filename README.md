# 软件规划工具（Software Planning Tool）🚀

<div align="center">
  <img src="software-planning-tool-logo.png" alt="软件规划工具标志" width="180" />
  <p>基于MCP协议的智能软件开发规划助手</p>
  <p>
    <a href="#主要功能-">功能</a> •
    <a href="#快速开始">快速开始</a> •
    <a href="#使用示例">使用示例</a> •
    <a href="#开发指南">开发指南</a> •
    <a href="#常见问题faq">常见问题</a>
  </p>
</div>

---

## 简介 📋

软件规划工具是一个基于MCP协议的开发规划服务器，利用结构化思维帮助你将复杂的软件项目拆解为可执行的任务，并自动生成详细开发计划。无论是个人开发者还是团队协作，这个工具都能帮助你更清晰地组织和管理开发过程。

## 主要功能 ✨

- **智能规划** - AI辅助生成结构化、可落地的开发计划
- **任务管理** - 添加、更新、移除和查询开发任务
- **优先级分类** - 支持任务优先级（critical/high/medium/low）
- **复杂度评分** - 每个任务可标注复杂度（0-10）
- **时间规划** - 支持设置截止日期和项目期限
- **团队协作** - 可指定任务负责人，支持标签分类
- **可视化展示** - 生成任务依赖图和甘特图
- **数据统计** - 提供计划完成情况和复杂度统计
- **数据导出** - 支持保存和导出完整开发计划

---

## 快速开始

### 方式一：使用 npm 安装（推荐）

```bash
# 全局安装
npm install -g @zhangzhixiong/software-planning-tool

# 或作为项目依赖安装
npm install @zhangzhixiong/software-planning-tool
```

### 方式二：使用 npx 直接运行

```bash
npx @zhangzhixiong/software-planning-tool
```

### 方式三：在MCP配置中使用

```json
{
  "mcpServers": {
    "software-planning-tool": {
      "command": "npx",
      "args": ["@zhangzhixiong/software-planning-tool"]
    }
  }
}
```

### 方式四：克隆代码并本地运行

适合开发和调试：
```bash
# 克隆仓库
git clone https://github.com/zhangzhixiong/software-planning-tool.git
cd software-planning-tool

# 安装依赖
npm install

# 构建
npm run build

# 运行
node build/index.js
```

### 启动方式对比

| 方式   | 优点                 | 适用场景         |
|--------|----------------------|------------------|
| npm全局 | 随时可用，升级方便   | 日常使用         |
| npm本地 | 项目依赖管理         | 团队协作         |
| npx    | 无需安装，即用即走   | 快速体验         |
| 本地   | 可调试源码、自定义   | 开发/二次开发    |

---

## 使用示例

### 1. 开启规划会话

```typescript
await client.callTool("software-planning-tool", "start_planning", {
  goal: "开发一个用户注册与登录功能",
  deadline: "2024-12-31" // 可选的项目截止日期
});
```

### 2. 添加任务

```typescript
const todo = await client.callTool("software-planning-tool", "add_todo", {
  title: "实现注册接口",
  description: "编写注册API，校验参数，密码加密存储，写单元测试",
  complexity: 4,
  priority: "high", // 优先级：critical, high, medium, low
  dueDate: "2024-07-15", // 任务截止日期
  tags: ["后端", "安全"], // 任务标签
  assignedTo: "张三", // 负责人
  codeExample: `// 代码片段`,
  milestone: true, // 是否为里程碑任务
  steps: [ // 任务步骤
    "设计API接口",
    "实现参数验证",
    "编写密码加密逻辑",
    "完成数据库操作",
    "编写单元测试"
  ],
  dependencies: ["数据库设计"], // 依赖的其他任务
  risk: "需要考虑并发注册和安全性问题", // 风险说明
  output: "完整的注册API接口文档和测试报告" // 预期输出
});
```

### 3. 更新任务状态

```typescript
await client.callTool("software-planning-tool", "update_todo_status", {
  todoId: todo.id,
  isComplete: true
});
```

### 4. 筛选特定任务

```typescript
// 获取所有高优先级任务
const highPriorityTasks = await client.callTool("software-planning-tool", "get_todos", {
  filter: "priority",
  filterValue: "high"
});

// 获取特定标签的任务
const backendTasks = await client.callTool("software-planning-tool", "get_todos", {
  filter: "tag",
  filterValue: "后端"
});

// 获取未完成的任务
const incompleteTasks = await client.callTool("software-planning-tool", "get_todos", {
  filter: "incomplete"
});

// 获取特定负责人的任务
const userTasks = await client.callTool("software-planning-tool", "get_todos", {
  filter: "assignedTo",
  filterValue: "张三"
});
```

### 5. 获取计划统计数据

```typescript
const stats = await client.callTool("software-planning-tool", "get_plan_stats", {});
// 返回：总任务数、已完成任务数、平均复杂度、里程碑数量等
```

### 6. 可视化计划

```typescript
const visualization = await client.callTool("software-planning-tool", "visualize_plan", {});
// 返回用于生成甘特图和任务依赖图的指导
```

### 7. 导出和导入计划

```typescript
// 导出计划为JSON
const planJson = await client.callTool("software-planning-tool", "export_plan", {});

// 导入之前导出的计划
await client.callTool("software-planning-tool", "import_plan", {
  planJson: planJson
});
```

> 📝 **更多示例**  
> 有关更多高级用法和完整API文档，请参阅[API文档](./API.md)

---

## 开发指南

### 项目结构

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

### 构建与测试

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 使用MCP Inspector测试
npm run inspector
```

### 开发注意事项

1. 确保使用 TypeScript 4.9+ 版本
2. 遵循项目的代码风格指南
3. 编写单元测试确保功能正确性
4. 使用 `npm run inspector` 进行本地测试

---

## 常见问题FAQ

### 安装相关

- **npm安装失败？**  
  检查网络连接，或尝试使用 `npm install --registry=https://registry.npmmirror.com`

- **npx启动报错？**  
  检查是否已正确安装包，或使用 `npm link` 在本地测试

### 使用相关

- **如何重置数据？**  
  删除用户目录下 `.software-planning-tool/data.json` 文件

- **如何导出计划？**  
  通过 `export_plan` 接口导出JSON，或使用 `get_todos` 接口获取所有任务

- **支持多用户/多项目吗？**  
  当前为单用户单项目模式，未来版本将支持多项目管理

- **数据备份在哪里？**  
  数据保存在用户目录下的 `.software-planning-tool/backups` 目录中

### 功能相关

- **如何筛选优先级高的任务？**  
  使用 `get_todos` 接口，设置 `filter` 为 priority，`filterValue` 为 high 或 critical

- **是否支持任务依赖关系？**  
  是，可以在任务的 dependencies 字段中指定依赖的其他任务

- **如何设置任务截止日期？**  
  在添加或更新任务时，使用 `dueDate` 字段设置日期（格式：YYYY-MM-DD）

---

## 贡献指南

欢迎贡献代码、报告问题或提出新功能建议！请通过以下方式参与：

1. Fork本仓库
2. 创建你的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启一个Pull Request

### 贡献规范

1. 遵循项目的代码风格
2. 确保所有测试通过
3. 更新相关文档
4. 提供清晰的提交信息

---

## 版本历史

- v0.0.1 (2024-03-17)
  - 初始版本发布
  - 支持基本的任务管理功能
  - 实现计划导入导出

## 许可证

MIT

---

<div align="center">
  <p>由 ❤️ 和 Model Context Protocol 强力驱动</p>
  <p>作者：zhangzhixiong</p>
</div>