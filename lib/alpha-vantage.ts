const BASE_URL = "https://www.alphavantage.co/query";

interface GlobalQuoteResponse {
  "Global Quote": {
    "01. symbol": string;
    "02. open": string;
    "03. high": string;
    "04. low": string;
    "05. price": string;
    "06. volume": string;
    "07. latest trading day": string;
    "08. previous close": string;
    "09. change": string;
    "10. change percent": string;
  };
  Note?: string;
  Information?: string;
}

interface OverviewResponse {
  Symbol: string;
  PriceToSalesRatioTTM: string;
  SharesOutstanding: string;
  "52WeekHigh": string;
  "52WeekLow": string;
  Note?: string;
  Information?: string;
  [key: string]: string | undefined;
}

export async function fetchStockPrice(
  ticker: string
): Promise<number | null> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    console.error("ALPHA_VANTAGE_API_KEY is not set");
    return null;
  }

  try {
    const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(ticker)}&apikey=${apiKey}`;
    const res = await fetch(url);
    const data: GlobalQuoteResponse = await res.json();

    if (data.Note || data.Information) {
      console.warn(`Alpha Vantage rate limit hit: ${data.Note || data.Information}`);
      return null;
    }

    const price = data["Global Quote"]?.["05. price"];
    if (!price) return null;

    return parseFloat(price);
  } catch (error) {
    console.error(`Failed to fetch price for ${ticker}:`, error);
    return null;
  }
}

export async function fetchMultipleStockPrices(
  tickers: string[]
): Promise<Map<string, number>> {
  const prices = new Map<string, number>();

  for (let i = 0; i < tickers.length; i++) {
    const ticker = tickers[i];
    const price = await fetchStockPrice(ticker);
    if (price !== null) {
      prices.set(ticker, price);
    }

    if (i < tickers.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 12000));
    }
  }

  return prices;
}

export async function fetchOverviewData(
  ticker: string
): Promise<{ ps_ratio: number | null; shares_outstanding: number | null; week_high_52: number | null; week_low_52: number | null } | null> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    console.error("ALPHA_VANTAGE_API_KEY is not set");
    return null;
  }

  try {
    const url = `${BASE_URL}?function=OVERVIEW&symbol=${encodeURIComponent(ticker)}&apikey=${apiKey}`;
    const res = await fetch(url);
    const data: OverviewResponse = await res.json();

    if (data.Note || data.Information) {
      console.warn(`Alpha Vantage rate limit hit: ${data.Note || data.Information}`);
      return null;
    }

    if (!data.Symbol) return null;

    return {
      ps_ratio: data.PriceToSalesRatioTTM ? parseFloat(data.PriceToSalesRatioTTM) : null,
      shares_outstanding: data.SharesOutstanding ? parseInt(data.SharesOutstanding) : null,
      week_high_52: data["52WeekHigh"] ? parseFloat(data["52WeekHigh"]) : null,
      week_low_52: data["52WeekLow"] ? parseFloat(data["52WeekLow"]) : null,
    };
  } catch (error) {
    console.error(`Failed to fetch overview for ${ticker}:`, error);
    return null;
  }
}

interface DailyTimeSeries {
  "Time Series (Daily)": Record<string, {
    "1. open": string;
    "2. high": string;
    "3. low": string;
    "4. close": string;
    "5. volume": string;
  }>;
  Note?: string;
  Information?: string;
}

export async function fetchDailyHistory(
  ticker: string,
  days: number = 30
): Promise<{ date: string; price: number }[] | null> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `${BASE_URL}?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(ticker)}&outputsize=compact&apikey=${apiKey}`;
    const res = await fetch(url);
    const data: DailyTimeSeries = await res.json();

    if (data.Note || data.Information) return null;

    const timeSeries = data["Time Series (Daily)"];
    if (!timeSeries) return null;

    return Object.entries(timeSeries)
      .slice(0, days)
      .map(([date, values]) => ({
        date,
        price: parseFloat(values["4. close"]),
      }))
      .reverse();
  } catch (error) {
    console.error(`Failed to fetch daily history for ${ticker}:`, error);
    return null;
  }
}
