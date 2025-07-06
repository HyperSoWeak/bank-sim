export type Account = {
  id: string;
  name: string;
  balance: number;
  lastAction: string | null;
  lastTransaction: string | null;
  loanTime: string | null;
  stockNetWorth: number;
  stocks: {
    [company: string]: number;
  };
};
