export interface Todo {
  id: string;
  title: string;
  description: string;
  complexity: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  codeExample?: string;
  isComplete: boolean;
  createdAt: string;
  updatedAt: string;
  steps?: string[];
  output?: string;
  dependencies?: string[];
  risk?: string;
  milestone?: boolean;
  dueDate?: string;
  tags?: string[];
  assignedTo?: string;
}

export interface Goal {
  id: string;
  description: string;
  createdAt: string;
  deadline?: string;
  status?: 'planning' | 'in_progress' | 'completed' | 'on_hold';
}

export interface ImplementationPlan {
  goalId: string;
  todos: Todo[];
  updatedAt: string;
  version: number;
  notes?: string;
}

export interface StorageData {
  goals: Record<string, Goal>;
  plans: Record<string, ImplementationPlan>;
}

export interface PlanStats {
  totalTodos: number;
  completedTodos: number;
  avgComplexity: number;
  milestones: number;
  completedMilestones: number;
  highPriorityTasks: number;
  riskAreas: string[];
}
