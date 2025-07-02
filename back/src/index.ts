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
