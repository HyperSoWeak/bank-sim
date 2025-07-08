import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

const dataPath = path.join(__dirname, "..", "data", "accounts.json");
const stocksPath = path.join(__dirname, "..", "data", "stocks.json");

app.get("/", (_req, res) => {
  res.send("Welcome to the Bank Simulation Backend!");
});

// GET all accounts
app.get("/accounts", async (_req, res) => {
  const data = await fs.readFile(dataPath, "utf-8");
  res.json(JSON.parse(data));
});

// GET total assets across all accounts
app.get("/accounts/total-assets", async (_req, res) => {
  try {
    const accountsData = await fs.readFile(dataPath, "utf-8");
    const accounts = JSON.parse(accountsData);
    
    const stocksData = await fs.readFile(stocksPath, "utf-8");
    const stocksJson = JSON.parse(stocksData);
    
    let totalBalance = 0;
    let totalStockValue = 0;
    let totalRepayment = 0; // Outstanding loan amounts that need to be repaid
    
    for (const account of accounts) {
      // Add account balance (deposits)
      const balance = account.balance || 0;
      totalBalance += balance;
      
      // Calculate stock value
      const stocks = account.stocks || {};
      let accountStockValue = 0;
      
      for (const [symbol, quantity] of Object.entries(stocks)) {
        const stockData = stocksJson.stocks[symbol];
        if (stockData && stockData.price && stockData.price.length > 0) {
          const currentPrice = stockData.price[stockData.price.length - 1];
          accountStockValue += (quantity as number) * currentPrice;
        }
      }
      
      totalStockValue += accountStockValue;
      
      // Calculate loan repayment obligations
      if (account.loanTime) {
        const loanStart = new Date(account.loanTime).getTime();
        const now = Date.now();
        const overdue = (now - loanStart) / (60 * 1000) > 20; // 20 minutes in milliseconds
        const repaymentAmount = overdue ? 1500 : 500;
        totalRepayment += repaymentAmount;
      }
    }
    
    const totalAssets = totalBalance + totalStockValue - totalRepayment;
    
    res.json({
      totalBalance,
      totalStockValue,
      totalRepayment,
      totalAssets
    });
  } catch (err) {
    console.error("Failed to calculate total assets:", err);
    res.status(500).json({ error: "Failed to calculate total assets" });
  }
});

// GET specific account by ID
app.get("/accounts/:id", async (req, res) => {
  const { id } = req.params;
  const data = await fs.readFile(dataPath, "utf-8");
  const accounts = JSON.parse(data);
  const account = accounts.find((a: any) => a.id === id);
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  res.json(account);
});

// PUT update an account
app.put("/accounts/:id", async (req, res) => {
  const { id } = req.params;
  const updatedAccount = req.body;

  const data = await fs.readFile(dataPath, "utf-8");
  const accounts = JSON.parse(data);
  const index = accounts.findIndex((a: any) => a.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  accounts[index] = updatedAccount;
  await fs.writeFile(dataPath, JSON.stringify(accounts, null, 2));
  res.json({ message: "Account updated" });
});

app.get("/stocks", async (req, res) => {
  try {
    const data = await fs.readFile(stocksPath, "utf-8");
    const json = JSON.parse(data);
    res.json(json);
  } catch (err) {
    console.error("Failed to load stock data:", err);
    res.status(500).json({ error: "Failed to read stock data" });
  }
});

app.post("/stocks/marquee", async (req, res) => {
  const { marquee } = req.body;
  try {
    const data = await fs.readFile(stocksPath, "utf-8");
    const json = JSON.parse(data);

    json.marquee = marquee;

    await fs.writeFile(stocksPath, JSON.stringify(json, null, 2));
    res.json({ message: "Marquee updated." });
  } catch (err) {
    console.error("Failed to update marquee:", err);
    res.status(500).json({ error: "Failed to update marquee" });
  }
});

// GET stock aggregation across all accounts
app.get("/stocks/aggregation", async (_req, res) => {
  try {
    const data = await fs.readFile(dataPath, "utf-8");
    const accounts = JSON.parse(data);

    // Aggregate stock quantities
    const stockTotals: Record<string, number> = {};

    for (const account of accounts) {
      const stocks = account.stocks || {};
      for (const [symbol, amount] of Object.entries(stocks)) {
        stockTotals[symbol] = (stockTotals[symbol] || 0) + (amount as number);
      }
    }

    // Find max and min
    const symbols = Object.keys(stockTotals);
    let maxSymbol = null;
    let minSymbol = null;

    if (symbols.length > 0) {
      maxSymbol = symbols.reduce((max, symbol) =>
        stockTotals[symbol] > stockTotals[max] ? symbol : max
      );
      minSymbol = symbols.reduce((min, symbol) =>
        stockTotals[symbol] < stockTotals[min] ? symbol : min
      );
    }

    res.json({
      totals: stockTotals,
      max: maxSymbol ? { symbol: maxSymbol, amount: stockTotals[maxSymbol] } : null,
      min: minSymbol ? { symbol: minSymbol, amount: stockTotals[minSymbol] } : null
    });
  } catch (err) {
    console.error("Failed to get stock aggregation:", err);
    res.status(500).json({ error: "Failed to get stock aggregation" });
  }
});

// POST update a single stock's control values
app.post("/stocks/:symbol", async (req, res) => {
  const { symbol } = req.params;
  const { target, remaining, stability } = req.body;

  try {
    const data = await fs.readFile(stocksPath, "utf-8");
    const json = JSON.parse(data);

    if (!json.stocks[symbol]) {
      res.status(404).json({ error: "Stock not found" });
      return;
    }

    // Update stock control parameters
    json.stocks[symbol].target = target;
    json.stocks[symbol].remaining = remaining;
    json.stocks[symbol].stability = stability;

    await fs.writeFile(stocksPath, JSON.stringify(json, null, 2));
    res.json({ message: `Stock ${symbol} updated.` });
  } catch (err) {
    console.error("Failed to update stock:", err);
    res.status(500).json({ error: "Failed to update stock" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

import { updateStocks } from "./stock";
import { STOCK_UPDATE_INTERVAL_MS } from "../shared/constants";

setInterval(() => {
  updateStocks().catch(console.error);
}, STOCK_UPDATE_INTERVAL_MS);
