import YahooFinance from "yahoo-finance2";

/*
 * Create one shared Yahoo Finance client.
 * All serverless API routes import and reuse this instance.
 */
const yahooFinance = new YahooFinance();

export default yahooFinance;