import { neon } from "@neondatabase/serverless";

function getDB() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return neon(process.env.DATABASE_URL);
}

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
  status: "overvalued" | "approaching" | "buy_zone";
  price_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export function computeStatus(
  currentPrice: number | null,
  buyTarget: number
): Stock["status"] {
  if (currentPrice === null) return "overvalued";
  if (currentPrice <= buyTarget) return "buy_zone";
  const pctAbove = ((currentPrice - buyTarget) / buyTarget) * 100;
  if (pctAbove <= 15) return "approaching";
  return "overvalued";
}

export async function initDB() {
  const sql = getDB();
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
      status VARCHAR(20) DEFAULT 'overvalued',
      price_updated_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

export async function getAllStocks(): Promise<Stock[]> {
  const sql = getDB();
  const rows = await sql`SELECT * FROM watchlist_stocks ORDER BY created_at DESC`;
  return rows as Stock[];
}

export async function getStockById(id: string): Promise<Stock | null> {
  const sql = getDB();
  const rows = await sql`SELECT * FROM watchlist_stocks WHERE id = ${id}`;
  return (rows[0] as Stock) || null;
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
}): Promise<Stock> {
  const sql = getDB();
  const status = computeStatus(data.current_price ?? null, data.buy_target);
  const rows = await sql`
    INSERT INTO watchlist_stocks (ticker, company_name, sector, fair_value, buy_target, peg_ratio, thesis, risk_notes, current_price, status)
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
      ${status}
    )
    RETURNING *
  `;
  return rows[0] as Stock;
}

export async function updateStock(
  id: string,
  data: {
    ticker?: string;
    company_name?: string;
    sector?: string | null;
    fair_value?: number;
    buy_target?: number;
    peg_ratio?: number | null;
    thesis?: string | null;
    risk_notes?: string | null;
    current_price?: number | null;
  }
): Promise<Stock | null> {
  const sql = getDB();
  const existing = await getStockById(id);
  if (!existing) return null;

  const updated = { ...existing, ...data };
  const status = computeStatus(
    updated.current_price !== undefined ? updated.current_price : existing.current_price,
    updated.buy_target ?? existing.buy_target
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
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return (rows[0] as Stock) || null;
}

export async function deleteStock(id: string): Promise<boolean> {
  const sql = getDB();
  const rows = await sql`DELETE FROM watchlist_stocks WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}

export async function updateStockPrice(
  ticker: string,
  price: number
): Promise<void> {
  const sql = getDB();
  // Compute status based on new price
  const rows = await sql`SELECT buy_target FROM watchlist_stocks WHERE ticker = ${ticker}`;
  if (rows.length === 0) return;
  const buyTarget = Number(rows[0].buy_target);
  const status = computeStatus(price, buyTarget);

  await sql`
    UPDATE watchlist_stocks SET
      current_price = ${price},
      status = ${status},
      price_updated_at = NOW(),
      updated_at = NOW()
    WHERE ticker = ${ticker}
  `;
}
