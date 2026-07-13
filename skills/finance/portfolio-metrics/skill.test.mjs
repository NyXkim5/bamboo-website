import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "finance/portfolio-metrics");
  assert.ok(meta.tags.includes("sharpe"));
});

test("throws on too-few returns", () => {
  assert.throws(() => run({ returns: [0.01] }));
});

test("constant positive returns give zero volatility and no drawdown", () => {
  const r = run({ returns: Array(50).fill(0.001) });
  assert.equal(r.annualizedVol, 0);
  assert.equal(r.maxDrawdown, 0);
  assert.ok(r.annualizedReturn > 0);
});

test("a drawdown is captured as negative", () => {
  const r = run({ returns: [0.1, -0.2, 0.05, -0.1] });
  assert.ok(r.maxDrawdown < 0);
});

test("higher risk-free rate lowers the Sharpe ratio", () => {
  const returns = [0.01, 0.02, -0.005, 0.015, 0.008, -0.002, 0.011];
  const low = run({ returns, riskFree: 0 }).sharpe;
  const high = run({ returns, riskFree: 0.1 }).sharpe;
  assert.ok(high < low);
});

test("metrics are finite numbers", () => {
  const r = run({ returns: [0.02, -0.01, 0.03, -0.04, 0.01] });
  for (const k of ["annualizedReturn", "annualizedVol", "sharpe", "maxDrawdown"]) {
    assert.ok(Number.isFinite(r[k]), `${k} should be finite`);
  }
});
