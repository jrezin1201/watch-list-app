import { neon } from "@neondatabase/serverless";

function getDB() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return neon(process.env.DATABASE_URL);
}

// --- Status Types ---

export type StockStatus = "buy_zone" | "watch_zone" | "extended" | "avoid";

// --- Core Interfaces ---

export interface Stock {
  id: string;
  ticker: string;
  company_name: string;
  sector: string | null;
  current_price: number | null;
  fair_value: number;
  buy_target: number;
  peg_ratio: number | null;
  thesis: string | null;
  risk_notes: string | null;
  status: StockStatus;
  price_updated_at: string | null;
  created_at: string;
  updated_at: string;
  // New V2 fields
  conviction: number | null;
  allocation_hint: string | null;
  bear_case_fv: number | null;
  bull_case_fv: number | null;
  macro_gated: boolean;
  last_thesis_update: string | null;
  ps_ratio: number | null;
  ps_ratio_5y_avg: number | null;
  shares_outstanding_current: number | null;
  shares_outstanding_prior: number | null;
  iv_percentile: number | null;
  covered_call_yield: number | null;
  leap_score: number | null;
}

export interface StockThesis {
  id: string;
  stock_id: string;
  thesis: string | null;
  what_would_break_it: string | null;
  buy_triggers: string | null;
  sell_triggers: string | null;
  notes: string | null;
  risk_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockScores {
  id: string;
  stock_id: string;
  revenue_growth: number;
  fcf_margin: number;
  roic: number;
  dilution: number;
  net_cash: number;
  interest_coverage: number;
  balance_dilution_risk: number;
  organic_growth: number;
  fcf_conversion: number;
  gross_margin_stability: number;
  created_at: string;
  updated_at: string;
}

export interface StockTag {
  id: string;
  stock_id: string;
  tag_type: "macro_sensitivity" | "narrative_phase" | "ownership_quality";
  tag_value: string;
  created_at: string;
}

export interface MacroRegime {
  id: string;
  risk_on_pct: number;
  liquidity: string;
  credit: string;
  btc_status: string;
  updated_at: string;
}

export interface BuyZoneEntry {
  id: string;
  stock_id: string;
  entered_at: string;
  exited_at: string | null;
  entry_price: number | null;
  exit_price: number | null;
  outcome: string | null;
}

export interface PriceHistoryPoint {
  id: string;
  stock_id: string;
  price: number;
  recorded_at: string;
}

export interface TriggerAlert {
  id: string;
  stock_id: string;
  trigger_text: string;
  is_active: boolean;
  created_at: string;
}

export interface StockWithDetails extends Stock {
  stock_thesis: StockThesis | null;
  stock_scores: StockScores | null;
  tags: StockTag[];
  triggers: TriggerAlert[];
  buy_zone_entries: BuyZoneEntry[];
  price_history: PriceHistoryPoint[];
  // Computed metrics
  upside_pct: number | null;
  execution_score: number | null;
  balance_sheet_score: number | null;
  growth_quality_score: number | null;
  asymmetry_ratio: number | null;
  dilution_risk_pct: number | null;
}

// --- Status Computation ---

export function computeStatus(
  currentPrice: number | null,
  buyTarget: number,
  macroGated: boolean = false
): StockStatus {
  if (currentPrice === null) return "extended";
  if (macroGated) return "avoid";
  if (currentPrice <= buyTarget) return "buy_zone";
  const pctAbove = ((currentPrice - buyTarget) / buyTarget) * 100;
  if (pctAbove <= 15) return "watch_zone";
  return "extended";
}

// --- Computed Score Helpers ---

function computeExecutionScore(scores: StockScores): number {
  return (scores.revenue_growth + scores.fcf_margin + scores.roic + scores.dilution) / 4;
}

function computeBalanceSheetScore(scores: StockScores): number {
  return (scores.net_cash + scores.interest_coverage + scores.balance_dilution_risk) / 3;
}

function computeGrowthQualityScore(scores: StockScores): number {
  return (scores.organic_growth + scores.fcf_conversion + scores.gross_margin_stability) / 3;
}

// --- Database Initialization ---

export async function initDB() {
  const sql = getDB();

  // Main watchlist table with new columns
  await sql`
    CREATE TABLE IF NOT EXISTS watchlist_stocks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ticker VARCHAR(10) NOT NULL UNIQUE,
      company_name VARCHAR(255) NOT NULL,
      sector VARCHAR(100),
      current_price DECIMAL(10,2),
      fair_value DECIMAL(10,2) NOT NULL,
      buy_target DECIMAL(10,2) NOT NULL,
      peg_ratio DECIMAL(5,2),
      thesis TEXT,
      risk_notes TEXT,
      status VARCHAR(20) DEFAULT 'extended',
      price_updated_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      conviction INTEGER DEFAULT 0,
      allocation_hint VARCHAR(20),
      bear_case_fv DECIMAL(10,2),
      bull_case_fv DECIMAL(10,2),
      macro_gated BOOLEAN DEFAULT false,
      last_thesis_update TIMESTAMP,
      ps_ratio DECIMAL(10,2),
      ps_ratio_5y_avg DECIMAL(10,2),
      shares_outstanding_current BIGINT,
      shares_outstanding_prior BIGINT,
      iv_percentile DECIMAL(5,2),
      covered_call_yield DECIMAL(5,2),
      leap_score DECIMAL(5,2)
    )
  `;

  // Add new columns to existing table (idempotent)
  await sql`ALTER TABLE watchlist_stocks ADD COLUMN IF NOT EXISTS conviction INTEGER DEFAULT 0`;
  await sql`ALTER TABLE watchlist_stocks ADD COLUMN IF NOT EXISTS allocation_hint VARCHAR(20)`;
  await sql`ALTER TABLE watchlist_stocks ADD COLUMN IF NOT EXISTS bear_case_fv DECIMAL(10,2)`;
  await sql`ALTER TABLE watchlist_stocks ADD COLUMN IF NOT EXISTS bull_case_fv DECIMAL(10,2)`;
  await sql`ALTER TABLE watchlist_stocks ADD COLUMN IF NOT EXISTS macro_gated BOOLEAN DEFAULT false`;
  await sql`ALTER TABLE watchlist_stocks ADD COLUMN IF NOT EXISTS last_thesis_update TIMESTAMP`;
  await sql`ALTER TABLE watchlist_stocks ADD COLUMN IF NOT EXISTS ps_ratio DECIMAL(10,2)`;
  await sql`ALTER TABLE watchlist_stocks ADD COLUMN IF NOT EXISTS ps_ratio_5y_avg DECIMAL(10,2)`;
  await sql`ALTER TABLE watchlist_stocks ADD COLUMN IF NOT EXISTS shares_outstanding_current BIGINT`;
  await sql`ALTER TABLE watchlist_stocks ADD COLUMN IF NOT EXISTS shares_outstanding_prior BIGINT`;
  await sql`ALTER TABLE watchlist_stocks ADD COLUMN IF NOT EXISTS iv_percentile DECIMAL(5,2)`;
  await sql`ALTER TABLE watchlist_stocks ADD COLUMN IF NOT EXISTS covered_call_yield DECIMAL(5,2)`;
  await sql`ALTER TABLE watchlist_stocks ADD COLUMN IF NOT EXISTS leap_score DECIMAL(5,2)`;

  // Migrate old status values
  await sql`UPDATE watchlist_stocks SET status = 'extended' WHERE status = 'overvalued'`;
  await sql`UPDATE watchlist_stocks SET status = 'watch_zone' WHERE status = 'approaching'`;

  // Stock thesis table
  await sql`
    CREATE TABLE IF NOT EXISTS stock_thesis (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      stock_id UUID NOT NULL REFERENCES watchlist_stocks(id) ON DELETE CASCADE,
      thesis TEXT,
      what_would_break_it TEXT,
      buy_triggers TEXT,
      sell_triggers TEXT,
      notes TEXT,
      risk_notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(stock_id)
    )
  `;

  // Stock scores table
  await sql`
    CREATE TABLE IF NOT EXISTS stock_scores (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      stock_id UUID NOT NULL REFERENCES watchlist_stocks(id) ON DELETE CASCADE,
      revenue_growth INTEGER DEFAULT 5,
      fcf_margin INTEGER DEFAULT 5,
      roic INTEGER DEFAULT 5,
      dilution INTEGER DEFAULT 5,
      net_cash INTEGER DEFAULT 5,
      interest_coverage INTEGER DEFAULT 5,
      balance_dilution_risk INTEGER DEFAULT 5,
      organic_growth INTEGER DEFAULT 5,
      fcf_conversion INTEGER DEFAULT 5,
      gross_margin_stability INTEGER DEFAULT 5,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(stock_id)
    )
  `;

  // Stock tags table
  await sql`
    CREATE TABLE IF NOT EXISTS stock_tags (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      stock_id UUID NOT NULL REFERENCES watchlist_stocks(id) ON DELETE CASCADE,
      tag_type VARCHAR(30) NOT NULL,
      tag_value VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Macro regime singleton
  await sql`
    CREATE TABLE IF NOT EXISTS macro_regime (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      risk_on_pct INTEGER DEFAULT 50,
      liquidity VARCHAR(30) DEFAULT 'Neutral',
      credit VARCHAR(30) DEFAULT 'Healthy',
      btc_status VARCHAR(50) DEFAULT 'Unknown',
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Ensure singleton row exists
  const macroRows = await sql`SELECT id FROM macro_regime LIMIT 1`;
  if (macroRows.length === 0) {
    await sql`INSERT INTO macro_regime (risk_on_pct, liquidity, credit, btc_status) VALUES (50, 'Neutral', 'Healthy', 'Unknown')`;
  }

  // Buy zone history
  await sql`
    CREATE TABLE IF NOT EXISTS buy_zone_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      stock_id UUID NOT NULL REFERENCES watchlist_stocks(id) ON DELETE CASCADE,
      entered_at TIMESTAMP DEFAULT NOW(),
      exited_at TIMESTAMP,
      entry_price DECIMAL(10,2),
      exit_price DECIMAL(10,2),
      outcome VARCHAR(20)
    )
  `;

  // Price history for sparklines
  await sql`
    CREATE TABLE IF NOT EXISTS price_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      stock_id UUID NOT NULL REFERENCES watchlist_stocks(id) ON DELETE CASCADE,
      price DECIMAL(10,2) NOT NULL,
      recorded_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Trigger alerts
  await sql`
    CREATE TABLE IF NOT EXISTS trigger_alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      stock_id UUID NOT NULL REFERENCES watchlist_stocks(id) ON DELETE CASCADE,
      trigger_text TEXT NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

// --- CRUD: Watchlist Stocks ---

export async function getAllStocks(): Promise<Stock[]> {
  const sql = getDB();
  const rows = await sql`SELECT * FROM watchlist_stocks ORDER BY created_at DESC`;
  return rows.map(normalizeStock);
}

export async function getStockById(id: string): Promise<Stock | null> {
  const sql = getDB();
  const rows = await sql`SELECT * FROM watchlist_stocks WHERE id = ${id}`;
  return rows[0] ? normalizeStock(rows[0]) : null;
}

function normalizeStock(row: Record<string, unknown>): Stock {
  return {
    ...row,
    macro_gated: row.macro_gated === true || row.macro_gated === "true",
    conviction: row.conviction !== null && row.conviction !== undefined ? Number(row.conviction) : null,
  } as Stock;
}

export async function createStock(data: {
  ticker: string;
  company_name: string;
  sector?: string;
  fair_value: number;
  buy_target: number;
  peg_ratio?: number;
  thesis?: string;
  risk_notes?: string;
  current_price?: number;
  conviction?: number;
  allocation_hint?: string;
  bear_case_fv?: number;
  bull_case_fv?: number;
  macro_gated?: boolean;
  ps_ratio?: number;
  ps_ratio_5y_avg?: number;
  shares_outstanding_current?: number;
  shares_outstanding_prior?: number;
  iv_percentile?: number;
  covered_call_yield?: number;
  leap_score?: number;
}): Promise<Stock> {
  const sql = getDB();
  const status = computeStatus(data.current_price ?? null, data.buy_target, data.macro_gated ?? false);
  const rows = await sql`
    INSERT INTO watchlist_stocks (
      ticker, company_name, sector, fair_value, buy_target, peg_ratio,
      thesis, risk_notes, current_price, status,
      conviction, allocation_hint, bear_case_fv, bull_case_fv, macro_gated,
      ps_ratio, ps_ratio_5y_avg, shares_outstanding_current, shares_outstanding_prior,
      iv_percentile, covered_call_yield, leap_score
    )
    VALUES (
      ${data.ticker.toUpperCase()},
      ${data.company_name},
      ${data.sector ?? null},
      ${data.fair_value},
      ${data.buy_target},
      ${data.peg_ratio ?? null},
      ${data.thesis ?? null},
      ${data.risk_notes ?? null},
      ${data.current_price ?? null},
      ${status},
      ${data.conviction ?? 0},
      ${data.allocation_hint ?? null},
      ${data.bear_case_fv ?? null},
      ${data.bull_case_fv ?? null},
      ${data.macro_gated ?? false},
      ${data.ps_ratio ?? null},
      ${data.ps_ratio_5y_avg ?? null},
      ${data.shares_outstanding_current ?? null},
      ${data.shares_outstanding_prior ?? null},
      ${data.iv_percentile ?? null},
      ${data.covered_call_yield ?? null},
      ${data.leap_score ?? null}
    )
    RETURNING *
  `;
  return normalizeStock(rows[0]);
}

export async function updateStock(
  id: string,
  data: Partial<Omit<Stock, "id" | "created_at" | "updated_at" | "status">>
): Promise<Stock | null> {
  const sql = getDB();
  const existing = await getStockById(id);
  if (!existing) return null;

  const updated = { ...existing, ...data };
  const macroGated = data.macro_gated !== undefined ? data.macro_gated : existing.macro_gated;
  const status = computeStatus(
    updated.current_price !== undefined ? updated.current_price : existing.current_price,
    updated.buy_target ?? existing.buy_target,
    macroGated
  );

  const rows = await sql`
    UPDATE watchlist_stocks SET
      ticker = ${(updated.ticker ?? existing.ticker).toUpperCase()},
      company_name = ${updated.company_name ?? existing.company_name},
      sector = ${updated.sector !== undefined ? updated.sector : existing.sector},
      fair_value = ${updated.fair_value ?? existing.fair_value},
      buy_target = ${updated.buy_target ?? existing.buy_target},
      peg_ratio = ${updated.peg_ratio !== undefined ? updated.peg_ratio : existing.peg_ratio},
      thesis = ${updated.thesis !== undefined ? updated.thesis : existing.thesis},
      risk_notes = ${updated.risk_notes !== undefined ? updated.risk_notes : existing.risk_notes},
      current_price = ${updated.current_price !== undefined ? updated.current_price : existing.current_price},
      status = ${status},
      conviction = ${updated.conviction !== undefined ? updated.conviction : existing.conviction},
      allocation_hint = ${updated.allocation_hint !== undefined ? updated.allocation_hint : existing.allocation_hint},
      bear_case_fv = ${updated.bear_case_fv !== undefined ? updated.bear_case_fv : existing.bear_case_fv},
      bull_case_fv = ${updated.bull_case_fv !== undefined ? updated.bull_case_fv : existing.bull_case_fv},
      macro_gated = ${macroGated},
      last_thesis_update = ${updated.last_thesis_update !== undefined ? updated.last_thesis_update : existing.last_thesis_update},
      ps_ratio = ${updated.ps_ratio !== undefined ? updated.ps_ratio : existing.ps_ratio},
      ps_ratio_5y_avg = ${updated.ps_ratio_5y_avg !== undefined ? updated.ps_ratio_5y_avg : existing.ps_ratio_5y_avg},
      shares_outstanding_current = ${updated.shares_outstanding_current !== undefined ? updated.shares_outstanding_current : existing.shares_outstanding_current},
      shares_outstanding_prior = ${updated.shares_outstanding_prior !== undefined ? updated.shares_outstanding_prior : existing.shares_outstanding_prior},
      iv_percentile = ${updated.iv_percentile !== undefined ? updated.iv_percentile : existing.iv_percentile},
      covered_call_yield = ${updated.covered_call_yield !== undefined ? updated.covered_call_yield : existing.covered_call_yield},
      leap_score = ${updated.leap_score !== undefined ? updated.leap_score : existing.leap_score},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] ? normalizeStock(rows[0]) : null;
}

export async function deleteStock(id: string): Promise<boolean> {
  const sql = getDB();
  const rows = await sql`DELETE FROM watchlist_stocks WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}

export async function updateStockPrice(
  ticker: string,
  price: number
): Promise<{ oldStatus: StockStatus; newStatus: StockStatus } | null> {
  const sql = getDB();
  const rows = await sql`SELECT id, buy_target, status, macro_gated FROM watchlist_stocks WHERE ticker = ${ticker}`;
  if (rows.length === 0) return null;

  const stockId = rows[0].id as string;
  const buyTarget = Number(rows[0].buy_target);
  const oldStatus = rows[0].status as StockStatus;
  const macroGated = rows[0].macro_gated === true || rows[0].macro_gated === "true";
  const newStatus = computeStatus(price, buyTarget, macroGated);

  await sql`
    UPDATE watchlist_stocks SET
      current_price = ${price},
      status = ${newStatus},
      price_updated_at = NOW(),
      updated_at = NOW()
    WHERE ticker = ${ticker}
  `;

  // Record price history
  await sql`
    INSERT INTO price_history (stock_id, price)
    VALUES (${stockId}, ${price})
  `;

  // Track buy zone transitions
  if (oldStatus !== "buy_zone" && newStatus === "buy_zone") {
    await sql`
      INSERT INTO buy_zone_history (stock_id, entry_price)
      VALUES (${stockId}, ${price})
    `;
  } else if (oldStatus === "buy_zone" && newStatus !== "buy_zone") {
    await sql`
      UPDATE buy_zone_history SET
        exited_at = NOW(),
        exit_price = ${price}
      WHERE stock_id = ${stockId} AND exited_at IS NULL
    `;
  }

  return { oldStatus, newStatus };
}

// --- CRUD: Stock Thesis ---

export async function getThesisByStockId(stockId: string): Promise<StockThesis | null> {
  const sql = getDB();
  const rows = await sql`SELECT * FROM stock_thesis WHERE stock_id = ${stockId}`;
  return (rows[0] as StockThesis) || null;
}

export async function upsertThesis(stockId: string, data: {
  thesis?: string | null;
  what_would_break_it?: string | null;
  buy_triggers?: string | null;
  sell_triggers?: string | null;
  notes?: string | null;
  risk_notes?: string | null;
}): Promise<StockThesis> {
  const sql = getDB();
  const existing = await getThesisByStockId(stockId);

  if (existing) {
    const rows = await sql`
      UPDATE stock_thesis SET
        thesis = ${data.thesis !== undefined ? data.thesis : existing.thesis},
        what_would_break_it = ${data.what_would_break_it !== undefined ? data.what_would_break_it : existing.what_would_break_it},
        buy_triggers = ${data.buy_triggers !== undefined ? data.buy_triggers : existing.buy_triggers},
        sell_triggers = ${data.sell_triggers !== undefined ? data.sell_triggers : existing.sell_triggers},
        notes = ${data.notes !== undefined ? data.notes : existing.notes},
        risk_notes = ${data.risk_notes !== undefined ? data.risk_notes : existing.risk_notes},
        updated_at = NOW()
      WHERE stock_id = ${stockId}
      RETURNING *
    `;
    return rows[0] as StockThesis;
  } else {
    const rows = await sql`
      INSERT INTO stock_thesis (stock_id, thesis, what_would_break_it, buy_triggers, sell_triggers, notes, risk_notes)
      VALUES (
        ${stockId},
        ${data.thesis ?? null},
        ${data.what_would_break_it ?? null},
        ${data.buy_triggers ?? null},
        ${data.sell_triggers ?? null},
        ${data.notes ?? null},
        ${data.risk_notes ?? null}
      )
      RETURNING *
    `;
    return rows[0] as StockThesis;
  }
}

// --- CRUD: Stock Scores ---

export async function getScoresByStockId(stockId: string): Promise<StockScores | null> {
  const sql = getDB();
  const rows = await sql`SELECT * FROM stock_scores WHERE stock_id = ${stockId}`;
  return (rows[0] as StockScores) || null;
}

export async function upsertScores(stockId: string, data: {
  revenue_growth?: number;
  fcf_margin?: number;
  roic?: number;
  dilution?: number;
  net_cash?: number;
  interest_coverage?: number;
  balance_dilution_risk?: number;
  organic_growth?: number;
  fcf_conversion?: number;
  gross_margin_stability?: number;
}): Promise<StockScores> {
  const sql = getDB();
  const existing = await getScoresByStockId(stockId);

  if (existing) {
    const rows = await sql`
      UPDATE stock_scores SET
        revenue_growth = ${data.revenue_growth ?? existing.revenue_growth},
        fcf_margin = ${data.fcf_margin ?? existing.fcf_margin},
        roic = ${data.roic ?? existing.roic},
        dilution = ${data.dilution ?? existing.dilution},
        net_cash = ${data.net_cash ?? existing.net_cash},
        interest_coverage = ${data.interest_coverage ?? existing.interest_coverage},
        balance_dilution_risk = ${data.balance_dilution_risk ?? existing.balance_dilution_risk},
        organic_growth = ${data.organic_growth ?? existing.organic_growth},
        fcf_conversion = ${data.fcf_conversion ?? existing.fcf_conversion},
        gross_margin_stability = ${data.gross_margin_stability ?? existing.gross_margin_stability},
        updated_at = NOW()
      WHERE stock_id = ${stockId}
      RETURNING *
    `;
    return rows[0] as StockScores;
  } else {
    const rows = await sql`
      INSERT INTO stock_scores (
        stock_id, revenue_growth, fcf_margin, roic, dilution,
        net_cash, interest_coverage, balance_dilution_risk,
        organic_growth, fcf_conversion, gross_margin_stability
      )
      VALUES (
        ${stockId},
        ${data.revenue_growth ?? 5},
        ${data.fcf_margin ?? 5},
        ${data.roic ?? 5},
        ${data.dilution ?? 5},
        ${data.net_cash ?? 5},
        ${data.interest_coverage ?? 5},
        ${data.balance_dilution_risk ?? 5},
        ${data.organic_growth ?? 5},
        ${data.fcf_conversion ?? 5},
        ${data.gross_margin_stability ?? 5}
      )
      RETURNING *
    `;
    return rows[0] as StockScores;
  }
}

// --- CRUD: Stock Tags ---

export async function getTagsByStockId(stockId: string): Promise<StockTag[]> {
  const sql = getDB();
  const rows = await sql`SELECT * FROM stock_tags WHERE stock_id = ${stockId} ORDER BY created_at`;
  return rows as StockTag[];
}

export async function setTagsForStock(stockId: string, tags: { tag_type: string; tag_value: string }[]): Promise<StockTag[]> {
  const sql = getDB();
  await sql`DELETE FROM stock_tags WHERE stock_id = ${stockId}`;
  for (const tag of tags) {
    await sql`
      INSERT INTO stock_tags (stock_id, tag_type, tag_value)
      VALUES (${stockId}, ${tag.tag_type}, ${tag.tag_value})
    `;
  }
  return getTagsByStockId(stockId);
}

export async function deleteTag(tagId: string): Promise<boolean> {
  const sql = getDB();
  const rows = await sql`DELETE FROM stock_tags WHERE id = ${tagId} RETURNING id`;
  return rows.length > 0;
}

// --- CRUD: Macro Regime ---

export async function getMacroRegime(): Promise<MacroRegime> {
  const sql = getDB();
  const rows = await sql`SELECT * FROM macro_regime LIMIT 1`;
  return rows[0] as MacroRegime;
}

export async function updateMacroRegime(data: {
  risk_on_pct?: number;
  liquidity?: string;
  credit?: string;
  btc_status?: string;
}): Promise<MacroRegime> {
  const sql = getDB();
  const existing = await getMacroRegime();
  const rows = await sql`
    UPDATE macro_regime SET
      risk_on_pct = ${data.risk_on_pct ?? existing.risk_on_pct},
      liquidity = ${data.liquidity ?? existing.liquidity},
      credit = ${data.credit ?? existing.credit},
      btc_status = ${data.btc_status ?? existing.btc_status},
      updated_at = NOW()
    WHERE id = ${existing.id}
    RETURNING *
  `;
  return rows[0] as MacroRegime;
}

// --- CRUD: Buy Zone History ---

export async function getBuyZoneHistory(stockId: string): Promise<BuyZoneEntry[]> {
  const sql = getDB();
  const rows = await sql`SELECT * FROM buy_zone_history WHERE stock_id = ${stockId} ORDER BY entered_at DESC`;
  return rows as BuyZoneEntry[];
}

// --- CRUD: Price History ---

export async function getPriceHistory(stockId: string, limit: number = 30): Promise<PriceHistoryPoint[]> {
  const sql = getDB();
  const rows = await sql`
    SELECT * FROM price_history
    WHERE stock_id = ${stockId}
    ORDER BY recorded_at DESC
    LIMIT ${limit}
  `;
  return (rows as PriceHistoryPoint[]).reverse();
}

export async function insertPriceHistory(stockId: string, price: number): Promise<void> {
  const sql = getDB();
  await sql`INSERT INTO price_history (stock_id, price) VALUES (${stockId}, ${price})`;
}

// --- CRUD: Trigger Alerts ---

export async function getTriggersByStockId(stockId: string): Promise<TriggerAlert[]> {
  const sql = getDB();
  const rows = await sql`SELECT * FROM trigger_alerts WHERE stock_id = ${stockId} ORDER BY created_at`;
  return rows as TriggerAlert[];
}

export async function createTrigger(stockId: string, triggerText: string): Promise<TriggerAlert> {
  const sql = getDB();
  const rows = await sql`
    INSERT INTO trigger_alerts (stock_id, trigger_text)
    VALUES (${stockId}, ${triggerText})
    RETURNING *
  `;
  return rows[0] as TriggerAlert;
}

export async function updateTrigger(triggerId: string, data: { trigger_text?: string; is_active?: boolean }): Promise<TriggerAlert | null> {
  const sql = getDB();
  const rows = await sql`SELECT * FROM trigger_alerts WHERE id = ${triggerId}`;
  if (rows.length === 0) return null;
  const existing = rows[0] as TriggerAlert;

  const updated = await sql`
    UPDATE trigger_alerts SET
      trigger_text = ${data.trigger_text ?? existing.trigger_text},
      is_active = ${data.is_active !== undefined ? data.is_active : existing.is_active}
    WHERE id = ${triggerId}
    RETURNING *
  `;
  return updated[0] as TriggerAlert;
}

export async function deleteTrigger(triggerId: string): Promise<boolean> {
  const sql = getDB();
  const rows = await sql`DELETE FROM trigger_alerts WHERE id = ${triggerId} RETURNING id`;
  return rows.length > 0;
}

// --- Denormalized Fetch ---

export async function getAllStocksWithDetails(): Promise<StockWithDetails[]> {
  const sql = getDB();
  const stocks = await getAllStocks();

  const results: StockWithDetails[] = [];

  for (const stock of stocks) {
    const [thesis, scores, tags, triggers, buyZoneEntries, priceHistory] = await Promise.all([
      getThesisByStockId(stock.id),
      getScoresByStockId(stock.id),
      getTagsByStockId(stock.id),
      getTriggersByStockId(stock.id),
      getBuyZoneHistory(stock.id),
      getPriceHistory(stock.id),
    ]);

    // Computed metrics
    const upside_pct = stock.current_price && stock.fair_value
      ? ((Number(stock.fair_value) - Number(stock.current_price)) / Number(stock.current_price)) * 100
      : null;

    const execution_score = scores ? computeExecutionScore(scores) : null;
    const balance_sheet_score = scores ? computeBalanceSheetScore(scores) : null;
    const growth_quality_score = scores ? computeGrowthQualityScore(scores) : null;

    // Asymmetry: upside / downside ratio using bull/bear case
    let asymmetry_ratio: number | null = null;
    if (stock.current_price && stock.bull_case_fv && stock.bear_case_fv) {
      const upside = Number(stock.bull_case_fv) - Number(stock.current_price);
      const downside = Number(stock.current_price) - Number(stock.bear_case_fv);
      if (downside > 0) {
        asymmetry_ratio = Math.round((upside / downside) * 100) / 100;
      }
    }

    // Dilution risk %
    let dilution_risk_pct: number | null = null;
    if (stock.shares_outstanding_current && stock.shares_outstanding_prior) {
      dilution_risk_pct = Math.round(
        ((Number(stock.shares_outstanding_current) - Number(stock.shares_outstanding_prior)) /
          Number(stock.shares_outstanding_prior)) * 10000
      ) / 100;
    }

    results.push({
      ...stock,
      stock_thesis: thesis,
      stock_scores: scores,
      tags,
      triggers,
      buy_zone_entries: buyZoneEntries,
      price_history: priceHistory,
      upside_pct,
      execution_score,
      balance_sheet_score,
      growth_quality_score,
      asymmetry_ratio,
      dilution_risk_pct,
    });
  }

  return results;
}
