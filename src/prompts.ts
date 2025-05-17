export const SEQUENTIAL_THINKING_PROMPT = `你是一位顶级软件架构师，负责通过"逐步提问-拆解-计划"的方式，帮助用户生成一份真正可落地的软件开发计划。请严格遵循以下要求：

1. 充分理解目标
- 仔细分析用户的需求和目标，发现潜在挑战和约束。
- 确认项目的整体截止日期和关键里程碑时间点。

2. 逐步提问，澄清细节
- 针对架构、技术选型、集成、性能、安全、数据、用户体验、测试、上线等方面，逐步提问，直到所有细节清晰。
- 明确各阶段的时间要求和资源限制。

3. 生成结构化、可执行的计划
- 每个任务（todo）必须包含：
  1. 目标（要实现什么）
  2. 具体操作步骤（steps，越细越好，每一步都能直接执行）
  3. 预期产出（output，完成后会得到什么）
  4. 所需资源/依赖（dependencies，如工具、权限、资料等）
  5. 风险提示（risk，可能遇到的问题和建议）
  6. 是否为里程碑节点（milestone，重要阶段请标注）
  7. 优先级（priority，critical/high/medium/low）
  8. 截止日期（dueDate，任务的完成时间）
  9. 标签（tags，任务的类别，如"前端"、"后端"、"测试"等）
  10. 分配给谁（assignedTo，负责人）
- 计划需包含里程碑节点（如需求评审、测试通过、上线等）
- 对每个任务给出复杂度评分（0-10）
- 如有需要，补充代码示例

4. 计划输出格式
- 请用如下结构输出每个任务：
1. 任务标题
目标：xxx
操作步骤：
- 步骤1
- 步骤2
预期产出：xxx
依赖：xxx
风险：xxx
复杂度：5
优先级：high
截止日期：YYYY-MM-DD
标签：前端,UI
分配给：xxx
里程碑：是/否
代码示例：
// 代码内容（如有）

5. 计划自检
- 检查每一步是否具体、可执行，是否有遗漏。
- 确保高优先级任务和关键路径任务已明确标记。
- 如有不确定的地方，继续提问直到明确。

6. 迭代完善
- 根据用户反馈不断细化和优化计划。
- 特别关注任务间的依赖关系是否合理，时间安排是否现实。

请先分析目标并提出第一个关键问题，然后逐步生成上述结构化、可执行的开发计划。`;

export const formatPlanAsTodos = (plan: string): Array<{
  title: string;
  description: string;
  complexity: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  codeExample?: string;
  steps?: string[];
  output?: string;
  dependencies?: string[];
  risk?: string;
  milestone?: boolean;
  dueDate?: string;
  tags?: string[];
  assignedTo?: string;
}> => {
  // 按两个换行分割每个任务
  const todos = plan.split(/\n{2,}/)
    .filter(section => section.trim().length > 0)
    .map(section => {
      const lines = section.split('\n');
      const title = lines[0].replace(/^[0-9]+\.\s*/, '').trim();
      // 解析各字段
      const getField = (label: string) => {
        const match = section.match(new RegExp(label + '：(.+)', 'i'));
        return match ? match[1].trim() : undefined;
      };
      const stepsBlock = section.match(/操作步骤：([\s\S]*?)(?=\n\S|$)/);
      let steps: string[] | undefined = undefined;
      if (stepsBlock) {
        steps = stepsBlock[1]
          .split(/\n|-/)
          .map(s => s.trim())
          .filter(s => s.length > 0 && s !== '操作步骤：');
      }
      const output = getField('预期产出');
      const dependencies = getField('依赖')?.split(/[，,、]/).map(s => s.trim()).filter(Boolean);
      const risk = getField('风险');
      const milestone = /里程碑：\s*是/.test(section);
      const complexityMatch = section.match(/复杂度：\s*(\d+)/);
      const complexity = complexityMatch ? parseInt(complexityMatch[1]) : 5;
      const codeExampleMatch = section.match(/代码示例：([\s\S]*)/);
      const codeExample = codeExampleMatch ? codeExampleMatch[1].trim() : undefined;
      
      // 新增字段解析
      const priorityMatch = section.match(/优先级：\s*(critical|high|medium|low)/i);
      const priority = priorityMatch ? priorityMatch[1].toLowerCase() as 'critical' | 'high' | 'medium' | 'low' : 'medium';
      
      const dueDateMatch = section.match(/截止日期：\s*(\d{4}-\d{2}-\d{2})/);
      const dueDate = dueDateMatch ? dueDateMatch[1] : undefined;
      
      const tagsMatch = section.match(/标签：\s*([^,]+(?:,[^,]+)*)/);
      const tags = tagsMatch ? tagsMatch[1].split(/[，,、]/).map(s => s.trim()).filter(Boolean) : undefined;
      
      const assignedToMatch = section.match(/分配给：\s*(.+)/);
      const assignedTo = assignedToMatch ? assignedToMatch[1].trim() : undefined;
      
      // description为目标+其他补充
      const goal = getField('目标');
      const description = goal ? `目标：${goal}` : '';
      
      return {
        title,
        description,
        complexity,
        priority,
        codeExample,
        steps,
        output,
        dependencies,
        risk,
        milestone,
        dueDate,
        tags,
        assignedTo
      };
    });
  return todos;
};

// 帮助函数：将Todo转换为文本格式
export const formatTodoAsText = (todo: {
  title: string;
  description: string;
  complexity: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  codeExample?: string;
  steps?: string[];
  output?: string;
  dependencies?: string[];
  risk?: string;
  milestone?: boolean;
  dueDate?: string;
  tags?: string[];
  assignedTo?: string;
}): string => {
  let result = `${todo.title}\n`;
  if (todo.description) result += `${todo.description}\n`;
  
  if (todo.steps && todo.steps.length > 0) {
    result += `操作步骤：\n`;
    todo.steps.forEach(step => {
      result += `- ${step}\n`;
    });
  }
  
  if (todo.output) result += `预期产出：${todo.output}\n`;
  
  if (todo.dependencies && todo.dependencies.length > 0) {
    result += `依赖：${todo.dependencies.join('、')}\n`;
  }
  
  if (todo.risk) result += `风险：${todo.risk}\n`;
  
  result += `复杂度：${todo.complexity}\n`;
  
  if (todo.priority) {
    result += `优先级：${todo.priority}\n`;
  }
  
  if (todo.dueDate) {
    result += `截止日期：${todo.dueDate}\n`;
  }
  
  if (todo.tags && todo.tags.length > 0) {
    result += `标签：${todo.tags.join('、')}\n`;
  }
  
  if (todo.assignedTo) {
    result += `分配给：${todo.assignedTo}\n`;
  }
  
  result += `里程碑：${todo.milestone ? '是' : '否'}\n`;
  
  if (todo.codeExample) {
    result += `代码示例：\n${todo.codeExample}\n`;
  }
  
  return result;
};

// 用于生成甘特图和任务依赖图的辅助提示
export const VISUALIZATION_PROMPT = `基于当前开发计划，请帮我生成一个可视化表示方案，以便于团队成员理解任务依赖关系和时间安排。可以考虑以下格式：

1. 甘特图表示（时间线）：
\`\`\`
日期 -> 2024-06-01 ... 2024-06-15 ... 2024-07-01
任务1  ============
任务2            ===========
任务3                       =====
\`\`\`

2. 任务依赖图（箭头表示依赖关系）：
\`\`\`
任务1 -> 任务3
|
任务2 -> 任务4
\`\`\`

请尽量简洁清晰地表示关键任务的依赖关系和时间安排，特别关注里程碑任务和高优先级任务。`;
