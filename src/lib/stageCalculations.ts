export interface EditableStage {
  name: string;
  amount: number;
  revisions: number;
  extensionPrice: number;
}

export function calculateTotal(stages: EditableStage[]): number {
  return stages.reduce((sum, stage) => sum + stage.amount, 0);
}

export function getBudgetMatchStatus(
  total: number,
  budget: number
): 'exact' | 'close' | 'far' {
  const difference = Math.abs(total - budget);
  if (difference === 0) return 'exact';
  if (difference <= 100) return 'close';
  return 'far';
}
