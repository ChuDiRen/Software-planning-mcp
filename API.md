# 软件规划工具 API 文档

本文档详细说明了软件规划工具提供的所有API接口。

## 目录

- [开始规划](#开始规划)
- [任务管理](#任务管理)
- [任务查询](#任务查询)
- [目标管理](#目标管理)
- [数据统计](#数据统计)
- [导入导出](#导入导出)
- [可视化](#可视化)

---

## 开始规划

### `start_planning`

开始一个新的规划会话，设置项目目标。

**参数**

| 名称 | 类型 | 必填 | 描述 |
|------|------|------|------|
| goal | string | 是 | 软件开发目标描述 |
| deadline | string | 否 | 项目截止日期（YYYY-MM-DD格式） |

**返回值**

返回一个提示文本，引导用户进行逐步思考规划。

**示例**

```typescript
const result = await client.callTool("software-planning-tool", "start_planning", {
  goal: "开发一个电子商务网站的购物车功能",
  deadline: "2024-09-30"
});
```

### `save_plan`

保存当前实现计划。

**参数**

| 名称 | 类型 | 必填 | 描述 |
|------|------|------|------|
| plan | string | 是 | 实现计划文本 |
| notes | string | 否 | 关于计划的备注 |

**返回值**

返回保存成功的消息，包含保存的任务数量。

**示例**

```typescript
const result = await client.callTool("software-planning-tool", "save_plan", {
  plan: `
1. 设计购物车数据模型
目标：定义购物车的数据结构
操作步骤：
- 分析需求
- 确定字段
预期产出：数据模型文档
复杂度：3
优先级：high
截止日期：2024-07-05
标签：设计,数据库
里程碑：是`,
  notes: "已与前端团队确认过接口设计"
});
```

## 任务管理

### `add_todo`

添加一个新的任务项。

**参数**

| 名称 | 类型 | 必填 | 描述 |
|------|------|------|------|
| title | string | 是 | 任务标题 |
| description | string | 是 | 详细描述 |
| complexity | number | 是 | 复杂度评分(0-10) |
| priority | string | 否 | 优先级(critical/high/medium/low) |
| dueDate | string | 否 | 截止日期(YYYY-MM-DD) |
| tags | string[] | 否 | 标签列表 |
| assignedTo | string | 否 | 负责人 |
| milestone | boolean | 否 | 是否为里程碑 |
| codeExample | string | 否 | 代码示例 |
| steps | string[] | 否 | 步骤列表 |
| dependencies | string[] | 否 | 依赖项列表 |
| risk | string | 否 | 风险描述 |
| output | string | 否 | 预期产出 |

**返回值**

返回创建的任务对象，包含自动生成的ID。

**示例**

```typescript
const todo = await client.callTool("software-planning-tool", "add_todo", {
  title: "实现购物车添加商品功能",
  description: "允许用户将商品添加到购物车",
  complexity: 4,
  priority: "high",
  dueDate: "2024-07-15",
  tags: ["前端", "购物车"],
  assignedTo: "张三",
  milestone: false,
  steps: [
    "创建添加商品API",
    "实现购物车状态管理",
    "开发UI交互"
  ],
  risk: "高并发可能导致库存问题"
});
```

### `update_todo_status`

更新任务的完成状态。

**参数**

| 名称 | 类型 | 必填 | 描述 |
|------|------|------|------|
| todoId | string | 是 | 任务ID |
| isComplete | boolean | 是 | 是否完成 |

**返回值**

返回更新后的任务对象。

**示例**

```typescript
const updatedTodo = await client.callTool("software-planning-tool", "update_todo_status", {
  todoId: "1626859337000",
  isComplete: true
});
```

### `update_todo`

更新任务的多个字段。

**参数**

| 名称 | 类型 | 必填 | 描述 |
|------|------|------|------|
| todoId | string | 是 | 任务ID |
| updates | object | 是 | 要更新的字段 |

**返回值**

返回更新后的任务对象。

**示例**

```typescript
const updatedTodo = await client.callTool("software-planning-tool", "update_todo", {
  todoId: "1626859337000",
  updates: {
    title: "优化购物车添加商品功能",
    priority: "critical",
    complexity: 6
  }
});
```

### `remove_todo`

删除一个任务。

**参数**

| 名称 | 类型 | 必填 | 描述 |
|------|------|------|------|
| todoId | string | 是 | 任务ID |

**返回值**

返回删除成功的消息。

**示例**

```typescript
const result = await client.callTool("software-planning-tool", "remove_todo", {
  todoId: "1626859337000"
});
```

## 任务查询

### `get_todos`

获取当前计划中的所有任务，支持多种过滤方式。

**参数**

| 名称 | 类型 | 必填 | 描述 |
|------|------|------|------|
| filter | string | 否 | 过滤类型：all/incomplete/completed/milestone/priority/tag/assignedTo |
| filterValue | string | 否 | 过滤值，用于priority/tag/assignedTo过滤器 |

**返回值**

返回符合过滤条件的任务列表。

**示例**

```typescript
// 获取所有高优先级任务
const highPriorityTasks = await client.callTool("software-planning-tool", "get_todos", {
  filter: "priority",
  filterValue: "high"
});

// 获取所有未完成任务
const incompleteTasks = await client.callTool("software-planning-tool", "get_todos", {
  filter: "incomplete"
});
```

## 目标管理

### `update_goal_status`

更新当前目标的状态。

**参数**

| 名称 | 类型 | 必填 | 描述 |
|------|------|------|------|
| status | string | 是 | 目标状态：planning/in_progress/completed/on_hold |

**返回值**

返回更新成功的消息。

**示例**

```typescript
const result = await client.callTool("software-planning-tool", "update_goal_status", {
  status: "in_progress"
});
```

## 数据统计

### `get_plan_stats`

获取当前计划的统计数据。

**参数**

无需参数。

**返回值**

返回包含以下字段的统计数据对象：
- totalTodos: 总任务数
- completedTodos: 已完成任务数
- avgComplexity: 平均复杂度
- milestones: 里程碑数量
- completedMilestones: 已完成的里程碑数量
- highPriorityTasks: 高优先级任务数量
- riskAreas: 风险领域列表

**示例**

```typescript
const stats = await client.callTool("software-planning-tool", "get_plan_stats", {});
```

## 导入导出

### `export_plan`

将当前计划导出为JSON格式。

**参数**

无需参数。

**返回值**

返回包含目标和实现计划的JSON字符串。

**示例**

```typescript
const planJson = await client.callTool("software-planning-tool", "export_plan", {});
```

### `import_plan`

从JSON导入计划。

**参数**

| 名称 | 类型 | 必填 | 描述 |
|------|------|------|------|
| planJson | string | 是 | 计划的JSON数据 |

**返回值**

返回导入成功的消息。

**示例**

```typescript
const result = await client.callTool("software-planning-tool", "import_plan", {
  planJson: exportedJsonString
});
```

## 可视化

### `visualize_plan`

获取当前计划的可视化指导。

**参数**

无需参数。

**返回值**

返回用于生成甘特图和任务依赖图的指导文本。

**示例**

```typescript
const visualizationGuide = await client.callTool("software-planning-tool", "visualize_plan", {});
``` 