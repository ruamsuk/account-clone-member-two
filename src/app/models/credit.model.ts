export interface Credit {
  id?: string;
  date: Date;
  details: string;
  amount: number;
  created: Date;
  modify: Date;
  isCashback: boolean;
  remark?: string;
}

export interface CreditData {
  id?: string;
  date: Date;
  details: string;
  amount: number;
  isCashback: boolean;
  created: Date;
  modify: Date;
  remark?: string;
}

export interface MonthSummary {
  expense: number;
  cashback: number;
  transactions: CreditData[];
}
