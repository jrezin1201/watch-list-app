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

    // Check for rate limit messages
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

  // Alpha Vantage free tier: 25 requests/day, 5 requests/minute
  // Process sequentially with a delay to avoid rate limits
  for (let i = 0; i < tickers.length; i++) {
    const ticker = tickers[i];
    const price = await fetchStockPrice(ticker);
    if (price !== null) {
      prices.set(ticker, price);
    }

    // Wait 12 seconds between requests to respect 5/min rate limit
    if (i < tickers.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 12000));
    }
  }

  return prices;
}
