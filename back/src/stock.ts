import fs from "fs/promises";
import path from "path";

const file = path.join(__dirname, "../data/stocks.json");
import { STOCK_UPDATE_INTERVAL_MS } from "../shared/constants";

const updateStocks = async () => {
  const content = await fs.readFile(file, "utf-8");
  const data = JSON.parse(content);
  const now = new Date();
  const last = new Date(data.meta.lastUpdate);
  const minsPassed = Math.floor((now.getTime() - last.getTime()) / STOCK_UPDATE_INTERVAL_MS);
  if (minsPassed < 1) return; // already updated

  ["AAPL", "GOOG", "TSLA"].forEach((key) => {
    const prev = data[key][data[key].length - 1];
    const trend = data.meta.trend[key];
    const random = (Math.random() - 0.5) * 0.004;
    const change = trend + random;
    const newPrice = parseFloat((prev * (1 + change)).toFixed(2));
    data[key].push(newPrice);
  });

  data.meta.lastUpdate = now.toISOString();
  await fs.writeFile(file, JSON.stringify(data, null, 2));

  console.log("Stocks updated:", data);
};

export default updateStocks;
