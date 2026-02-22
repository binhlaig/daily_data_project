export type ChartBoxConfig = {
    title: string;
    subtitle?: string;
    number: string;
    percentage: number; // positive for increase, negative for decrease
    dataKey?: string; // e.g. "income", "outcome", "profit"
    chartData: any[]; // e.g. [{ name: "Mon", income: 1000 }, ...]
}


export type MoneyRow = {
    amount: number;
    date?: string;
    createdAt?: string;
  };
  
  export type DailyPoint = {
    day: string; // YYYY-MM-DD
    income: number;
    outcome: number;
    profit: number;
  };