#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { storage } from './storage.js';
import { SEQUENTIAL_THINKING_PROMPT, VISUALIZATION_PROMPT, formatPlanAsTodos, formatTodoAsText } from './prompts.js';
import { Goal, Todo } from './types.js';

class SoftwarePlanningServer {
  private server: Server;
  private currentGoal: Goal | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'software-planning-tool',
        version: '0.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.setupResourceHandlers();
    this.setupToolHandlers();
    
    this.server.onerror = (error) => console.error('[MCP Error]', error);
  }

  private setupResourceHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'planning://current-goal',
          name: 'Current Goal',
          description: 'The current software development goal being planned',
          mimeType: 'application/json',
        },
        {
          uri: 'planning://implementation-plan',
          name: 'Implementation Plan',
          description: 'The current implementation plan with todos',
          mimeType: 'application/json',
        },
        {
          uri: 'planning://stats',
          name: 'Plan Statistics',
          description: 'Statistical information about the current plan',
          mimeType: 'application/json',
        },
      ],
    }));

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      switch (request.params.uri) {
        case 'planning://current-goal': {
          if (!this.currentGoal) {
            throw new McpError(
              ErrorCode.InvalidParams,
              'No active goal. Start a new planning session first.'
            );
          }
          return {
            contents: [
              {
                uri: request.params.uri,
                mimeType: 'application/json',
                text: JSON.stringify(this.currentGoal, null, 2),
              },
            ],
          };
        }
        case 'planning://implementation-plan': {
          if (!this.currentGoal) {
            throw new McpError(
              ErrorCode.InvalidParams,
              'No active goal. Start a new planning session first.'
            );
          }
          const plan = await storage.getPlan(this.currentGoal.id);
          if (!plan) {
            throw new McpError(
              ErrorCode.InvalidParams,
              'No implementation plan found for current goal.'
            );
          }
          return {
            contents: [
              {
                uri: request.params.uri,
                mimeType: 'application/json',
                text: JSON.stringify(plan, null, 2),
              },
            ],
          };
        }
        case 'planning://stats': {
          if (!this.currentGoal) {
            throw new McpError(
              ErrorCode.InvalidParams,
              'No active goal. Start a new planning session first.'
            );
          }
          const stats = await storage.getPlanStats(this.currentGoal.id);
          return {
            contents: [
              {
                uri: request.params.uri,
                mimeType: 'application/json',
                text: JSON.stringify(stats, null, 2),
              },
            ],
          };
        }
        default:
          throw new McpError(
            ErrorCode.InvalidRequest,
            `Unknown resource URI: ${request.params.uri}`
          );
      }
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'start_planning',
          description: 'Start a new planning session with a goal',
          inputSchema: {
            type: 'object',
            properties: {
              goal: {
                type: 'string',
                description: 'The software development goal to plan',
              },
              deadline: {
                type: 'string',
                description: 'Optional deadline for the goal (YYYY-MM-DD format)',
              },
            },
            required: ['goal'],
          },
        },
        {
          name: 'save_plan',
          description: 'Save the current implementation plan',
          inputSchema: {
            type: 'object',
            properties: {
              plan: {
                type: 'string',
                description: 'The implementation plan text to save',
              },
              notes: {
                type: 'string',
                description: 'Optional notes about the plan',
              },
            },
            required: ['plan'],
          },
        },
        {
          name: 'add_todo',
          description: 'Add a new todo item to the current plan',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Title of the todo item',
              },
              description: {
                type: 'string',
                description: 'Detailed description of the todo item',
              },
              complexity: {
                type: 'number',
                description: 'Complexity score (0-10)',
                minimum: 0,
                maximum: 10,
              },
              priority: {
                type: 'string',
                description: 'Priority level (critical, high, medium, low)',
                enum: ['critical', 'high', 'medium', 'low'],
              },
              dueDate: {
                type: 'string',
                description: 'Due date in YYYY-MM-DD format',
              },
              tags: {
                type: 'array',
                description: 'Tags or categories for the todo item',
                items: {
                  type: 'string',
                },
              },
              assignedTo: {
                type: 'string',
                description: 'Person responsible for this task',
              },
              milestone: {
                type: 'boolean',
                description: 'Whether this todo is a milestone',
              },
              codeExample: {
                type: 'string',
                description: 'Optional code example',
              },
              steps: {
                type: 'array',
                description: 'Step-by-step instructions to complete the task',
                items: {
                  type: 'string',
                },
              },
              dependencies: {
                type: 'array',
                description: 'Dependencies required for this task',
                items: {
                  type: 'string',
                },
              },
              risk: {
                type: 'string',
                description: 'Potential risks associated with this task',
              },
              output: {
                type: 'string',
                description: 'Expected output or deliverable',
              },
            },
            required: ['title', 'description', 'complexity'],
          },
        },
        {
          name: 'remove_todo',
          description: 'Remove a todo item from the current plan',
          inputSchema: {
            type: 'object',
            properties: {
              todoId: {
                type: 'string',
                description: 'ID of the todo item to remove',
              },
            },
            required: ['todoId'],
          },
        },
        {
          name: 'get_todos',
          description: 'Get all todos in the current plan',
          inputSchema: {
            type: 'object',
            properties: {
              filter: {
                type: 'string',
                description: 'Optional filter type: all, incomplete, completed, milestone, priority, tag',
                enum: ['all', 'incomplete', 'completed', 'milestone', 'priority', 'tag', 'assignedTo'],
              },
              filterValue: {
                type: 'string',
                description: 'Value for the filter (e.g., priority level, tag name, or assignee name)',
              },
            },
          },
        },
        {
          name: 'update_todo_status',
          description: 'Update the completion status of a todo item',
          inputSchema: {
            type: 'object',
            properties: {
              todoId: {
                type: 'string',
                description: 'ID of the todo item',
              },
              isComplete: {
                type: 'boolean',
                description: 'New completion status',
              },
            },
            required: ['todoId', 'isComplete'],
          },
        },
        {
          name: 'update_todo',
          description: 'Update a todo item with new values',
          inputSchema: {
            type: 'object',
            properties: {
              todoId: {
                type: 'string',
                description: 'ID of the todo item to update',
              },
              updates: {
                type: 'object',
                description: 'Fields to update',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  complexity: { type: 'number' },
                  priority: { 
                    type: 'string',
                    enum: ['critical', 'high', 'medium', 'low'],
                  },
                  dueDate: { type: 'string' },
                  tags: { 
                    type: 'array',
                    items: { type: 'string' },
                  },
                  assignedTo: { type: 'string' },
                  milestone: { type: 'boolean' },
                  codeExample: { type: 'string' },
                  isComplete: { type: 'boolean' },
                },
              },
            },
            required: ['todoId', 'updates'],
          },
        },
        {
          name: 'update_goal_status',
          description: 'Update the status of the current goal',
          inputSchema: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                description: 'New status of the goal',
                enum: ['planning', 'in_progress', 'completed', 'on_hold'],
              },
            },
            required: ['status'],
          },
        },
        {
          name: 'get_plan_stats',
          description: 'Get statistics about the current plan',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'export_plan',
          description: 'Export the current plan to JSON',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'import_plan',
          description: 'Import a plan from JSON',
          inputSchema: {
            type: 'object',
            properties: {
              planJson: {
                type: 'string',
                description: 'Plan JSON data to import',
              },
            },
            required: ['planJson'],
          },
        },
        {
          name: 'visualize_plan',
          description: 'Get visualization instructions for the current plan',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'start_planning': {
          const { goal, deadline } = request.params.arguments as { 
            goal: string;
            deadline?: string;
          };
          this.currentGoal = await storage.createGoal(goal, deadline);
          await storage.createPlan(this.currentGoal.id);

          return {
            content: [
              {
                type: 'text',
                text: SEQUENTIAL_THINKING_PROMPT,
              },
            ],
          };
        }

        case 'save_plan': {
          if (!this.currentGoal) {
            throw new McpError(
              ErrorCode.InvalidRequest,
              'No active goal. Start a new planning session first.'
            );
          }

          const { plan, notes } = request.params.arguments as { 
            plan: string;
            notes?: string;
          };
          const todos = formatPlanAsTodos(plan);

          const currentPlan = await storage.getPlan(this.currentGoal.id);
          if (currentPlan) {
            for (const todo of currentPlan.todos) {
              await storage.removeTodo(this.currentGoal.id, todo.id);
            }
          }

          for (const todo of todos) {
            await storage.addTodo(this.currentGoal.id, todo);
          }

          if (notes) {
            await storage.updatePlanNotes(this.currentGoal.id, notes);
          }

          return {
            content: [
              {
                type: 'text',
                text: `Successfully saved ${todos.length} todo items to the implementation plan.`,
              },
            ],
          };
        }

        case 'add_todo': {
          if (!this.currentGoal) {
            throw new McpError(
              ErrorCode.InvalidRequest,
              'No active goal. Start a new planning session first.'
            );
          }

          const todoInput = request.params.arguments as Partial<Omit<
            Todo,
            'id' | 'isComplete' | 'createdAt' | 'updatedAt'
          >>;
          
          // 确保必填字段存在
          if (!todoInput.title || !todoInput.description || todoInput.complexity === undefined) {
            throw new McpError(
              ErrorCode.InvalidParams,
              'Title, description, and complexity are required fields'
            );
          }

          // 设置默认优先级为medium
          const todoParams: Omit<Todo, 'id' | 'isComplete' | 'createdAt' | 'updatedAt'> = {
            title: todoInput.title,
            description: todoInput.description,
            complexity: todoInput.complexity,
            priority: todoInput.priority,
            codeExample: todoInput.codeExample,
            steps: todoInput.steps,
            output: todoInput.output,
            dependencies: todoInput.dependencies,
            risk: todoInput.risk,
            milestone: !!todoInput.milestone,
            dueDate: todoInput.dueDate,
            tags: todoInput.tags,
            assignedTo: todoInput.assignedTo
          };
          
          const newTodo = await storage.addTodo(this.currentGoal.id, todoParams);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(newTodo, null, 2),
              },
            ],
          };
        }

        case 'remove_todo': {
          if (!this.currentGoal) {
            throw new McpError(
              ErrorCode.InvalidRequest,
              'No active goal. Start a new planning session first.'
            );
          }

          const { todoId } = request.params.arguments as { todoId: string };
          await storage.removeTodo(this.currentGoal.id, todoId);

          return {
            content: [
              {
                type: 'text',
                text: `Successfully removed todo ${todoId}`,
              },
            ],
          };
        }

        case 'get_todos': {
          if (!this.currentGoal) {
            throw new McpError(
              ErrorCode.InvalidRequest,
              'No active goal. Start a new planning session first.'
            );
          }

          const { filter, filterValue } = request.params.arguments as { 
            filter?: 'all' | 'incomplete' | 'completed' | 'milestone' | 'priority' | 'tag' | 'assignedTo';
            filterValue?: string;
          };

          let todos: Todo[];

          if (filter === 'incomplete') {
            todos = await storage.getIncompleteTodos(this.currentGoal.id);
          } else if (filter === 'completed') {
            const allTodos = await storage.getTodos(this.currentGoal.id);
            todos = allTodos.filter(todo => todo.isComplete);
          } else if (filter === 'milestone') {
            const allTodos = await storage.getTodos(this.currentGoal.id);
            todos = allTodos.filter(todo => todo.milestone);
          } else if (filter === 'priority' && filterValue) {
            todos = await storage.getTodosByPriority(
              this.currentGoal.id, 
              filterValue as 'critical' | 'high' | 'medium' | 'low'
            );
          } else if (filter === 'tag' && filterValue) {
            todos = await storage.getTodosByTag(this.currentGoal.id, filterValue);
          } else if (filter === 'assignedTo' && filterValue) {
            const allTodos = await storage.getTodos(this.currentGoal.id);
            todos = allTodos.filter(todo => todo.assignedTo === filterValue);
          } else {
            todos = await storage.getTodos(this.currentGoal.id);
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(todos, null, 2),
              },
            ],
          };
        }

        case 'update_todo_status': {
          if (!this.currentGoal) {
            throw new McpError(
              ErrorCode.InvalidRequest,
              'No active goal. Start a new planning session first.'
            );
          }

          const { todoId, isComplete } = request.params.arguments as {
            todoId: string;
            isComplete: boolean;
          };
          const updatedTodo = await storage.updateTodoStatus(
            this.currentGoal.id,
            todoId,
            isComplete
          );

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(updatedTodo, null, 2),
              },
            ],
          };
        }

        case 'update_todo': {
          if (!this.currentGoal) {
            throw new McpError(
              ErrorCode.InvalidRequest,
              'No active goal. Start a new planning session first.'
            );
          }

          const { todoId, updates } = request.params.arguments as {
            todoId: string;
            updates: Partial<Omit<Todo, 'id' | 'createdAt'>>;
          };

          const updatedTodo = await storage.updateTodo(
            this.currentGoal.id,
            todoId,
            updates
          );

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(updatedTodo, null, 2),
              },
            ],
          };
        }

        case 'update_goal_status': {
          if (!this.currentGoal) {
            throw new McpError(
              ErrorCode.InvalidRequest,
              'No active goal. Start a new planning session first.'
            );
          }

          const { status } = request.params.arguments as {
            status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
          };

          const updatedGoal = await storage.updateGoalStatus(
            this.currentGoal.id,
            status
          );

          this.currentGoal = updatedGoal;

          return {
            content: [
              {
                type: 'text',
                text: `Goal status updated to: ${status}`,
              },
            ],
          };
        }

        case 'get_plan_stats': {
          if (!this.currentGoal) {
            throw new McpError(
              ErrorCode.InvalidRequest,
              'No active goal. Start a new planning session first.'
            );
          }

          const stats = await storage.getPlanStats(this.currentGoal.id);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(stats, null, 2),
              },
            ],
          };
        }

        case 'export_plan': {
          if (!this.currentGoal) {
            throw new McpError(
              ErrorCode.InvalidRequest,
              'No active goal. Start a new planning session first.'
            );
          }

          const exportData = await storage.exportPlanToJson(this.currentGoal.id);

          return {
            content: [
              {
                type: 'text',
                text: exportData,
              },
            ],
          };
        }

        case 'import_plan': {
          const { planJson } = request.params.arguments as { planJson: string };

          try {
            const importedData = await storage.importPlanFromJson(planJson);
            this.currentGoal = importedData.goal;

            return {
              content: [
                {
                  type: 'text',
                  text: `Successfully imported plan for goal: ${this.currentGoal.description}`,
                },
              ],
            };
          } catch (error) {
            throw new McpError(
              ErrorCode.InvalidParams,
              `Failed to import plan: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        }

        case 'visualize_plan': {
          if (!this.currentGoal) {
            throw new McpError(
              ErrorCode.InvalidRequest,
              'No active goal. Start a new planning session first.'
            );
          }

          const todos = await storage.getTodos(this.currentGoal.id);
          
          let todoListText = '';
          for (const todo of todos) {
            todoListText += formatTodoAsText(todo) + '\n\n';
          }

          return {
            content: [
              {
                type: 'text',
                text: VISUALIZATION_PROMPT + '\n\n当前计划任务列表：\n\n' + todoListText,
              },
            ],
          };
        }

        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    });
  }

  async run() {
    await storage.initialize();
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Software Planning MCP server running on stdio');
  }
}

const server = new SoftwarePlanningServer();
server.run().catch(console.error);
