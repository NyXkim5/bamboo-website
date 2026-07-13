// Skill: finance/sma-backtest
// Backtest a simple moving-average (SMA) crossover strategy over a price series.
// Pure + deterministic — you pass the prices in, so it runs fully offline. A
// separate data-fetch skill (finance/price-history) will feed this later.

export const meta = {
  id: "finance/sma-backtest",
  name: "SMA Crossover Backtest",
  domain: "finance",
  version: "0.1.0",
  description:
    "Backtest a fast/slow SMA crossover long-only strategy over a close-price series. Returns trades, total return, win rate, and max drawdown vs. buy-and-hold.",
  tags: ["finance", "backtest", "trading", "sma", "quant", "stocks"],
  inputs: { prices: "number[] of closes (oldest→newest)", fast: "int (default 10)", slow: "int (default 30)" },
  outputs: "{ trades, strategyReturn, buyHoldReturn, winRate, maxDrawdown }",
  license: "MIT",
  source: "Original implementation; standard SMA-crossover methodology.",
};

function sma(prices, period, i) {
  if (i + 1 < period) return null;
  let sum = 0;
  for (let k = i - period + 1; k <= i; k++) sum += prices[k];
  return sum / period;
}

export function run(input = {}) {
  const { prices = [], fast = 10, slow = 30 } = input;
  if (!Array.isArray(prices) || prices.length < slow + 1) {
    throw new Error(`need at least ${slow + 1} prices, got ${prices.length}`);
  }
  if (fast >= slow) throw new Error("fast period must be < slow period");

  let position = 0; // 0 = flat, 1 = long
  let entryPrice = 0;
  const trades = [];
  const equity = [1]; // strategy equity curve, starts at 1.0
  let cash = 1;

  for (let i = 1; i < prices.length; i++) {
    const fPrev = sma(prices, fast, i - 1), sPrev = sma(prices, slow, i - 1);
    const fNow = sma(prices, fast, i), sNow = sma(prices, slow, i);

    // Mark-to-market the equity curve when in a position.
    const ret = position === 1 ? prices[i] / prices[i - 1] : 1;
    cash *= ret;
    equity.push(cash);

    if (fPrev === null || sPrev === null || fNow === null || sNow === null) continue;

    const crossUp = fPrev <= sPrev && fNow > sNow;
    const crossDown = fPrev >= sPrev && fNow < sNow;

    if (position === 0 && crossUp) {
      position = 1; entryPrice = prices[i];
    } else if (position === 1 && crossDown) {
      trades.push({ entry: entryPrice, exit: prices[i], return: prices[i] / entryPrice - 1 });
      position = 0;
    }
  }
  // Close any open position at the last price.
  if (position === 1) {
    const last = prices[prices.length - 1];
    trades.push({ entry: entryPrice, exit: last, return: last / entryPrice - 1 });
  }

  const wins = trades.filter((t) => t.return > 0).length;
  const strategyReturn = cash - 1;
  const buyHoldReturn = prices[prices.length - 1] / prices[0] - 1;

  let peak = equity[0], maxDD = 0;
  for (const v of equity) {
    if (v > peak) peak = v;
    maxDD = Math.min(maxDD, v / peak - 1);
  }

  const round = (x) => Math.round(x * 10000) / 10000;
  return {
    trades: trades.map((t) => ({ ...t, return: round(t.return) })),
    tradeCount: trades.length,
    strategyReturn: round(strategyReturn),
    buyHoldReturn: round(buyHoldReturn),
    winRate: trades.length ? round(wins / trades.length) : 0,
    maxDrawdown: round(maxDD),
  };
}
