// types.ts
export interface StepResult {
    name: string;
    status: 'pending' | 'success' | 'failure';
    message?: string;
  }
  