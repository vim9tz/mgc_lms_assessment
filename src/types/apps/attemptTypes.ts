export type AttemptWeightageItem = {
  type: string;
  mod_name: string;
  qus: string;
  weight: number;
  obtained: string;
};

export type GetAttemptResult = {
  attempts: string;
  weightage: AttemptWeightageItem[];
};
