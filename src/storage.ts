import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { StorageData, Goal, ImplementationPlan, Todo, PlanStats } from './types.js';

export class Storage {
  private storagePath: string;
  private data: StorageData;
  private backupDir: string;

  constructor() {
    // Store data in user's home directory under .software-planning-tool
    const dataDir = path.join(os.homedir(), '.software-planning-tool');
    this.storagePath = path.join(dataDir, 'data.json');
    this.backupDir = path.join(dataDir, 'backups');
    this.data = {
      goals: {},
      plans: {},
    };
  }

  async initialize(): Promise<void> {
    try {
      // Create data directory if it doesn't exist
      const dataDir = path.dirname(this.storagePath);
      await fs.mkdir(dataDir, { recursive: true });
      
      // Create backup directory
      await fs.mkdir(this.backupDir, { recursive: true });

      // Try to read existing data
      const data = await fs.readFile(this.storagePath, 'utf-8');
      this.data = JSON.parse(data);
      
      // Migrate old data to new format if necessary
      await this.migrateDataIfNeeded();
    } catch (error) {
      // If file doesn't exist or can't be read, use default empty data
      await this.save();
    }
  }

  private async migrateDataIfNeeded(): Promise<void> {
    let needsSave = false;
    
    // Iterate through all plans to add version if missing
    for (const planId in this.data.plans) {
      const plan = this.data.plans[planId];
      if (plan.version === undefined) {
        plan.version = 1;
        needsSave = true;
      }
      
      // Update todos to include new fields if missing
      for (const todo of plan.todos) {
        if (todo.priority === undefined) {
          todo.priority = 'medium';
          needsSave = true;
        }
      }
    }
    
    // Iterate through all goals to add new fields if missing
    for (const goalId in this.data.goals) {
      const goal = this.data.goals[goalId];
      if (goal.status === undefined) {
        goal.status = 'planning';
        needsSave = true;
      }
    }
    
    if (needsSave) {
      await this.save();
    }
  }

  private async createBackup(): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const backupPath = path.join(this.backupDir, `data-${timestamp}.json`);
      await fs.writeFile(backupPath, JSON.stringify(this.data, null, 2));
      
      // Cleanup old backups (keep only last 10)
      const backupFiles = await fs.readdir(this.backupDir);
      if (backupFiles.length > 10) {
        // Sort by creation time (oldest first)
        const sortedFiles = await Promise.all(
          backupFiles
            .filter(file => file.startsWith('data-'))
            .map(async file => {
              const filePath = path.join(this.backupDir, file);
              const stats = await fs.stat(filePath);
              return {
                name: file,
                path: filePath,
                ctime: stats.ctime.getTime()
              };
            })
        );
        
        // Sort files by creation time
        sortedFiles.sort((a, b) => a.ctime - b.ctime);
        
        // Delete oldest files (keep only 10 newest)
        for (let i = 0; i < sortedFiles.length - 10; i++) {
          await fs.unlink(sortedFiles[i].path);
        }
      }
    } catch (error) {
      console.error('Failed to create backup:', error);
    }
  }

  private async save(): Promise<void> {
    // Create a backup before saving
    await this.createBackup();
    await fs.writeFile(this.storagePath, JSON.stringify(this.data, null, 2));
  }

  async createGoal(description: string, deadline?: string): Promise<Goal> {
    const goal: Goal = {
      id: Date.now().toString(),
      description,
      createdAt: new Date().toISOString(),
      status: 'planning',
      deadline
    };

    this.data.goals[goal.id] = goal;
    await this.save();
    return goal;
  }

  async getGoal(id: string): Promise<Goal | null> {
    return this.data.goals[id] || null;
  }

  async updateGoalStatus(goalId: string, status: Goal['status']): Promise<Goal> {
    const goal = await this.getGoal(goalId);
    if (!goal) {
      throw new Error(`No goal found with id ${goalId}`);
    }
    
    goal.status = status;
    await this.save();
    return goal;
  }

  async createPlan(goalId: string): Promise<ImplementationPlan> {
    const plan: ImplementationPlan = {
      goalId,
      todos: [],
      updatedAt: new Date().toISOString(),
      version: 1
    };

    this.data.plans[goalId] = plan;
    await this.save();
    return plan;
  }

  async getPlan(goalId: string): Promise<ImplementationPlan | null> {
    return this.data.plans[goalId] || null;
  }

  async updatePlanNotes(goalId: string, notes: string): Promise<ImplementationPlan> {
    const plan = await this.getPlan(goalId);
    if (!plan) {
      throw new Error(`No plan found for goal ${goalId}`);
    }
    
    plan.notes = notes;
    plan.updatedAt = new Date().toISOString();
    plan.version += 1;
    await this.save();
    return plan;
  }

  async addTodo(
    goalId: string,
    {
      title,
      description,
      complexity,
      codeExample,
      priority = 'medium',
      dueDate,
      tags,
      steps,
      output,
      dependencies,
      risk,
      milestone = false,
      assignedTo
    }: Omit<Todo, 'id' | 'isComplete' | 'createdAt' | 'updatedAt'>
  ): Promise<Todo> {
    const plan = await this.getPlan(goalId);
    if (!plan) {
      throw new Error(`No plan found for goal ${goalId}`);
    }

    const todo: Todo = {
      id: Date.now().toString(),
      title,
      description,
      complexity,
      codeExample,
      priority: priority || 'medium',
      isComplete: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate,
      tags,
      steps,
      output,
      dependencies,
      risk,
      milestone,
      assignedTo
    };

    plan.todos.push(todo);
    plan.updatedAt = new Date().toISOString();
    plan.version += 1;
    await this.save();
    return todo;
  }

  async removeTodo(goalId: string, todoId: string): Promise<void> {
    const plan = await this.getPlan(goalId);
    if (!plan) {
      throw new Error(`No plan found for goal ${goalId}`);
    }

    plan.todos = plan.todos.filter((todo: Todo) => todo.id !== todoId);
    plan.updatedAt = new Date().toISOString();
    plan.version += 1;
    await this.save();
  }

  async updateTodoStatus(goalId: string, todoId: string, isComplete: boolean): Promise<Todo> {
    const plan = await this.getPlan(goalId);
    if (!plan) {
      throw new Error(`No plan found for goal ${goalId}`);
    }

    const todo = plan.todos.find((t: Todo) => t.id === todoId);
    if (!todo) {
      throw new Error(`No todo found with id ${todoId}`);
    }

    todo.isComplete = isComplete;
    todo.updatedAt = new Date().toISOString();
    plan.updatedAt = new Date().toISOString();
    plan.version += 1;
    await this.save();
    return todo;
  }
  
  async updateTodo(goalId: string, todoId: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>): Promise<Todo> {
    const plan = await this.getPlan(goalId);
    if (!plan) {
      throw new Error(`No plan found for goal ${goalId}`);
    }

    const todo = plan.todos.find((t: Todo) => t.id === todoId);
    if (!todo) {
      throw new Error(`No todo found with id ${todoId}`);
    }

    // Apply all updates to the todo
    Object.assign(todo, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    plan.updatedAt = new Date().toISOString();
    plan.version += 1;
    await this.save();
    return todo;
  }

  async getTodos(goalId: string): Promise<Todo[]> {
    const plan = await this.getPlan(goalId);
    return plan?.todos || [];
  }
  
  async getTodosByPriority(goalId: string, priority: Todo['priority']): Promise<Todo[]> {
    const todos = await this.getTodos(goalId);
    return todos.filter(todo => todo.priority === priority);
  }
  
  async getTodosByTag(goalId: string, tag: string): Promise<Todo[]> {
    const todos = await this.getTodos(goalId);
    return todos.filter(todo => todo.tags?.includes(tag));
  }
  
  async getIncompleteTodos(goalId: string): Promise<Todo[]> {
    const todos = await this.getTodos(goalId);
    return todos.filter(todo => !todo.isComplete);
  }
  
  async getPlanStats(goalId: string): Promise<PlanStats> {
    const todos = await this.getTodos(goalId);
    
    const totalTodos = todos.length;
    const completedTodos = todos.filter(todo => todo.isComplete).length;
    
    const totalComplexity = todos.reduce((sum, todo) => sum + todo.complexity, 0);
    const avgComplexity = totalTodos > 0 ? totalComplexity / totalTodos : 0;
    
    const milestones = todos.filter(todo => todo.milestone).length;
    const completedMilestones = todos.filter(todo => todo.milestone && todo.isComplete).length;
    
    const highPriorityTasks = todos.filter(todo => 
      todo.priority === 'high' || todo.priority === 'critical'
    ).length;
    
    const riskAreas = todos
      .filter(todo => todo.risk && todo.risk.trim().length > 0)
      .map(todo => todo.risk as string);
    
    return {
      totalTodos,
      completedTodos,
      avgComplexity,
      milestones,
      completedMilestones,
      highPriorityTasks,
      riskAreas
    };
  }
  
  async exportPlanToJson(goalId: string): Promise<string> {
    const goal = await this.getGoal(goalId);
    const plan = await this.getPlan(goalId);
    
    if (!goal || !plan) {
      throw new Error(`No plan found for goal ${goalId}`);
    }
    
    const exportData = {
      goal,
      plan
    };
    
    return JSON.stringify(exportData, null, 2);
  }
  
  async importPlanFromJson(jsonData: string): Promise<{ goal: Goal; plan: ImplementationPlan }> {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.goal || !importData.plan) {
        throw new Error('Invalid import data: missing goal or plan');
      }
      
      this.data.goals[importData.goal.id] = importData.goal;
      this.data.plans[importData.goal.id] = importData.plan;
      
      await this.save();
      return importData;
    } catch (error) {
      throw new Error(`Failed to import plan: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const storage = new Storage();
