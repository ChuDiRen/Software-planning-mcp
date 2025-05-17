export interface Todo {
  id: string;
  title: string;
  description: string;
  complexity: number;
  codeExample?: string;
  isComplete: boolean;
  createdAt: string;
  updatedAt: string;
  steps?: string[];
  output?: string;
  dependencies?: string[];
  risk?: string;
  milestone?: boolean;
}

export interface Goal {
  id: string;
  description: string;
  createdAt: string;
}

export interface ImplementationPlan {
  goalId: string;
  todos: Todo[];
  updatedAt: string;
}

export interface StorageData {
  goals: Record<string, Goal>;
  plans: Record<string, ImplementationPlan>;
}
