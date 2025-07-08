export interface StockMeta {
  price: number[];
  target: number;
  remaining: number;
  stability: number;
}

export interface StockData {
  lastUpdate: string;
  marquee: string;
  stocks: {
    [key: string]: StockMeta;
  };
}
