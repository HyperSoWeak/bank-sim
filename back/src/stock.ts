import fs from "fs/promises";
import path from "path";
import { StockData } from "./types";

const file = path.join(__dirname, "../data/stocks.json");

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export const updateStocks = async () => {
  const content = await fs.readFile(file, "utf-8");
  const data = JSON.parse(content) as StockData;

  for (const name of Object.keys(data.stocks)) {
    const stock = data.stocks[name];
    const currentPrice = stock.price[stock.price.length - 1];

    const t = stock.remaining > 0 ? 1 / stock.remaining : 1;
    const base = lerp(currentPrice, stock.target, t);
    const noise = (Math.random() - 0.5) * stock.stability;
    const nextPrice = parseFloat((base * (1 + noise)).toFixed(2));

    stock.price.push(nextPrice);
    stock.remaining -= 1;

    if (stock.remaining <= 0) {
      const percentChange = randomInRange(-0.05, 0.05); // ±5%
      stock.target = parseFloat((nextPrice * (1 + percentChange)).toFixed(2));
      stock.remaining = Math.floor(randomInRange(7, 14));
    }
  }

  data.lastUpdate = new Date().toISOString();
  await fs.writeFile(file, JSON.stringify(data, null, 2));
};
