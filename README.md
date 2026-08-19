📊 AI Stock Analyzer

Intelligent Stock Market Research & Analysis Platform

AI Stock Analyzer is a full-stack financial research platform built by LITSES for analyzing stocks through market data, technical information, company fundamentals, financial metrics, news, risk analysis, and AI-powered research insights.

The platform is designed to bring multiple layers of stock research into a single modern dashboard so users can research companies without switching between multiple financial websites and tools.

🚧 Status: Active Development

⸻

🌐 Live Application

Production:
https://ai-stock-analyzer-delta.vercel.app

GitHub Repository:
https://github.com/adhilofficial/ai-stock-analyzer

⸻

🎯 What is AI Stock Analyzer?

AI Stock Analyzer is designed to help users research publicly traded companies by combining:

* 📊 Live/market stock data
* 📈 Price charts
* 💰 Fundamental metrics
* 🧮 Financial metrics
* 📰 Stock-related news
* ⚠️ Risk analysis
* 🤖 AI-powered research
* 🔎 Stock search
* 📋 Stock screening
* ⚖️ Stock comparison
* 💼 Portfolio tracking
* 🔔 Alerts
* 📉 Market monitoring

The goal is to create a single research workspace for investors and market researchers.

⸻

✨ Features

📊 Dashboard

The dashboard provides a centralized overview of the user’s market-research workspace.

It is designed to provide quick access to:

* Recent stock analysis
* Market information
* Portfolio information
* Watch/analysis activity
* Market research tools

⸻

🔎 Stock Search

Users can search for stocks directly from the platform.

The application communicates with the backend stock-search API and retrieves matching securities.

Example Indian stocks supported by the current application include:

RELIANCE.NS
HDFCBANK.NS
INFY.NS
TCS.NS
TATAMOTORS.NS
ICICIBANK.NS
BHARTIARTL.NS
SBIN.NS

The platform is designed around exchange-specific symbols such as:

NSE → .NS
BSE → .BO

⸻

📈 Stock Analysis

The Analyze module is one of the core parts of the platform.

Users can select a stock and inspect multiple layers of information.

Current analysis areas include:

* Current price
* Previous close
* Daily change
* Daily percentage change
* Market capitalization
* P/E ratio
* 52-week high
* 52-week low
* Trading volume
* Sector
* Industry
* Company information
* Business description
* Financial metrics
* Technical information
* Risk information
* Stock news
* AI research

The analysis page also supports multiple chart ranges:

1D
1W
1M
1Y
5Y
MAX

⸻

🤖 AI-Powered Research

The platform contains an AI research engine designed specifically for financial-market research.

The AI backend currently uses Google Gemini models.

The primary model is configurable through:

GEMINI_MODEL

with a fallback model configured through:

GEMINI_FALLBACK_MODEL

The current default models are:

gemini-2.5-flash-lite
gemini-2.5-flash

⸻

🧠 AI Analysis Output

The AI engine generates structured research containing:

Signal

BUY
SELL
NEUTRAL
WATCH

Confidence Score

A score from:

0 – 100

Risk Level

Low
Moderate
High

Research Summary

A concise AI-generated overview of the available market information.

Key Themes

The AI identifies major themes from the supplied data.

Growth Drivers

Potential positive factors identified from the available company information.

Key Risks

Important risks identified from the supplied data.

Analytical Scores

The AI generates separate scores for:

Fundamental Score
Momentum Score
Valuation Score
Sentiment Score

Each score ranges from:

0 – 100

⸻

🧮 Fundamental Analysis

The platform retrieves company fundamentals and financial metrics through Yahoo Finance.

Current data includes metrics such as:

* Market capitalization
* P/E ratio
* Forward P/E
* Price-to-book
* PEG ratio
* EPS
* Revenue
* Revenue growth
* Earnings growth
* Profit margins
* Return on equity
* Total cash
* Total debt
* Debt-to-equity
* Current ratio
* Free cash flow
* Dividend yield
* Enterprise value

Company information can also include:

* Sector
* Industry
* Business description
* Website
* Employee count

⸻

📉 Market Data & Charts

The backend retrieves market information using:

Yahoo Finance + yahoo-finance2

The stock-data API provides:

* Current price
* Previous close
* Open
* Day high
* Day low
* Market cap
* Trading volume
* Average volume
* 52-week high
* 52-week low
* P/E
* Company information
* Financial metrics
* Historical chart data

⸻

📅 Chart Timeframes

The platform currently supports:

Range	Data Interval
1D	5 minutes
1W	30 minutes
1M	1 day
1Y	1 day
5Y	1 week
MAX	1 month

Charts are rendered using Recharts.

⸻

📰 Stock News

The Analyze experience includes stock-news functionality to help users review relevant information surrounding a company.

News is presented alongside the stock’s analytical information so users can consider both quantitative data and current developments.

⸻

⚠️ Risk Analysis

The platform includes a dedicated risk-analysis area.

The AI research engine categorizes overall research risk into:

Low
Moderate
High

The AI also identifies specific key risks based on the supplied verified market and company data.

⸻

🔬 Technical Analysis

The platform contains a dedicated technical-analysis section within the stock analysis experience.

The technical-analysis layer is designed to help users interpret:

* Price movement
* Historical trends
* Market momentum
* Chart behavior
* Technical signals

This area will continue to expand as the analytical engine develops.

⸻

🔎 Stock Screener

The platform includes a dedicated Screener module.

The project also contains scripts for generating:

Indian Stock Master
Screener Universe
Screener Snapshot

Available scripts:

npm run build:stock-master
npm run build:screener-universe
npm run build:screener-snapshot

The screener architecture is intended to make it possible to analyze and filter larger groups of stocks instead of researching companies individually.

⸻

⚖️ Stock Comparison

The platform includes a dedicated Compare page.

This allows the product to evolve from individual stock analysis into comparative research between multiple companies.

Example:

Company A
vs
Company B
vs
Company C

⸻

💼 Portfolio

The application includes a dedicated Portfolio module.

The portfolio area is intended to give users a centralized place to track and analyze their holdings.

⸻

🔔 Alerts

The platform includes an Alerts module.

This provides the foundation for future market and stock-monitoring functionality.

⸻

📡 Market Pulse

The Market Pulse module is designed to provide a broader market-level view instead of focusing only on an individual stock.

This creates a separation between:

Individual Stock Research
        ↓
Market-Level Research

⸻

🔐 Authentication

Production authentication is implemented using:

Supabase Auth

The application contains:

* Login
* Protected routes
* Forgot password
* Reset password
* Authentication context
* Google OAuth support

Protected application pages require authentication.

Public pages include:

/about
/disclaimer
/methodology
/login
/forgot-password
/reset-password

⸻

🏗️ Application Architecture

The project follows a frontend + serverless API architecture.

                    USER
                      │
                      ▼
             ┌─────────────────┐
             │  React Frontend │
             │     + Vite      │
             └────────┬────────┘
                      │
          ┌───────────┼───────────┐
          │           │           │
          ▼           ▼           ▼
     Supabase     Stock API     AI API
       Auth       /api/...      /api/analyze
          │           │           │
          │           ▼           ▼
          │      Yahoo Finance   Gemini
          │           │           │
          └───────────┼───────────┘
                      ▼
              Analysis Interface
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
     Charts       Financials       AI Research
        │             │             │
        └─────────────┼─────────────┘
                      ▼
                 User Insights

⸻

🛠️ Technology Stack

Frontend

* React 19
* Vite 8
* React Router
* Recharts
* Lucide React
* React Icons
* JavaScript / JSX

Backend

* Node.js
* Express
* Vercel API functions
* REST APIs

Authentication

* Supabase
* Supabase Auth
* Google OAuth

Market Data

* Yahoo Finance
* yahoo-finance2

AI

* Google Gemini
* Structured AI responses
* AI response validation
* AI caching
* Fallback AI model

Deployment

* Vercel

Development

* npm
* Git
* GitHub
* ESLint

⸻

📦 Dependencies

Important production dependencies include:

react
react-dom
react-router-dom
recharts
lucide-react
react-icons
@supabase/supabase-js
express
cors
dotenv
yahoo-finance2

The project currently targets:

Node.js 22.x

⸻

📁 Project Structure

ai-stock-analyzer/
│
├── .github/
│   └── workflows/
│
├── api/
│   ├── analyze.js
│   ├── stock-data.js
│   ├── stock-search.js
│   └── _lib/
│
├── data/
│
├── public/
│
├── scripts/
│   ├── build-indian-stock-master.mjs
│   ├── build-screener-universe.mjs
│   └── build-screener-snapshot.mjs
│
├── src/
│   │
│   ├── components/
│   │
│   ├── config/
│   │
│   ├── context/
│   │
│   ├── data/
│   │
│   ├── hooks/
│   │
│   ├── lib/
│   │
│   ├── pages/
│   │
│   ├── services/
│   │
│   ├── styles/
│   │
│   └── utils/
│
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── vercel.json
├── vite.config.js
└── README.md

⸻

🧩 Main Application Pages

The current application routing includes:

/login
/dashboard
/analyze
/portfolio
/screener
/market-pulse
/research
/alerts
/learn
/settings
/compare
/about
/disclaimer
/methodology
/forgot-password
/reset-password

The application also uses protected routes for authenticated product functionality.

⸻

🔌 API Architecture

Stock Search

GET /api/stock-search?q=<query>

Used to search for stocks.

⸻

Stock Data

GET /api/stock-data?symbol=<symbol>&range=<range>

Supported ranges:

1d
1w
1m
1y
5y
max

The API retrieves market information and historical chart data from Yahoo Finance.

⸻

AI Analysis

POST /api/analyze

The frontend sends verified stock data to the AI analysis endpoint.

The AI service then generates a structured research result.

⸻

🤖 AI Processing Flow

User selects stock
        ↓
Stock Search
        ↓
Stock Symbol
        ↓
Yahoo Finance
        ↓
Market + Fundamental Data
        ↓
Verified Stock Data
        ↓
Gemini AI Research Engine
        ↓
Structured AI Analysis
        ↓
Score + Signal + Risks + Summary
        ↓
Analyze Dashboard

⸻

⚡ AI Performance

The AI backend includes several reliability and performance mechanisms.

Model fallback

A primary Gemini model and fallback model are supported.

Retry handling

Retryable server responses are handled automatically.

Request timeout

AI requests have a defined timeout.

Response caching

AI summaries are cached for a limited period to reduce unnecessary repeated AI requests.

In-flight request handling

The backend maintains in-flight analysis tracking to prevent unnecessary duplicate processing.

⸻

🛡️ Data Reliability

The stock-data API treats the current quote as the mandatory data source while allowing some secondary requests to fail independently.

For example:

Current Quote
     │
     ├── Fundamentals
     │
     └── Historical Chart

If fundamentals or chart retrieval fails, the application can still preserve the core quote response rather than treating the entire request as unusable.

⸻

🔒 Security

Never commit sensitive credentials to GitHub.

Use environment variables for:

Supabase credentials
Gemini API key
Private API keys
OAuth secrets
Database credentials

Example:

VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key

Use the actual variable names required by the current implementation when configuring your deployment environment.

⸻

⚙️ Installation

1. Clone the repository

git clone https://github.com/adhilofficial/ai-stock-analyzer.git

2. Enter the project

cd ai-stock-analyzer

3. Install dependencies

npm install

4. Configure environment variables

Create:

.env

Add the required Supabase, AI, and API configuration.

⸻

▶️ Run Development Server

npm run dev

The Vite development server will start locally.

Usually:

http://localhost:5173

⸻

🏭 Production Build

Build the application:

npm run build

Preview the production build:

npm run preview

⸻

🧹 Lint

Run:

npm run lint

⸻

📊 Data Build Scripts

The project includes data-generation utilities.

Build Indian stock master

npm run build:stock-master

Build screener universe

npm run build:screener-universe

Build screener snapshot

npm run build:screener-snapshot

⸻

🚀 Deployment

The project is deployed through Vercel.

Production application:

https://ai-stock-analyzer-delta.vercel.app

Deployment requires the appropriate environment variables to be configured in Vercel.

⸻

🔵 Supabase Production Authentication

Configure Supabase:

Authentication
    ↓
URL Configuration

Site URL

https://litses-markets.vercel.app

Redirect URL

https://litses-markets.vercel.app/**

Local development

http://localhost:5173/**

Google OAuth callback

https://vlzfzygsprdgjxssgjff.supabase.co/auth/v1/callback

Keep the Supabase callback URL as the OAuth redirect URI when Supabase is handling the Google authentication callback.

⸻

🧪 Development Checklist

Before pushing a major update:

* Login works
* Google OAuth works
* Protected routes work
* Stock search works
* Stock data loads
* Charts load
* Fundamentals load
* Technical analysis loads
* AI analysis works
* News loads
* Portfolio works
* Screener works
* Compare works
* Alerts work
* No critical console errors
* npm run lint passes
* npm run build succeeds
* Production deployment works

⸻

🗺️ Roadmap

Phase 1 — Foundation

* React application
* Vite setup
* Supabase authentication
* Protected routes
* Stock search
* Stock market data
* Historical charts
* Basic fundamental data
* AI research engine
* Stock analysis dashboard
* Portfolio module
* Screener module
* Compare module
* Market Pulse
* Alerts foundation

Phase 2 — Advanced Intelligence

* Advanced technical indicators
* More advanced stock scoring
* Improved fundamental scoring
* Advanced sentiment analysis
* Better AI research reports
* More financial metrics
* Advanced stock screening
* Portfolio analytics

Phase 3 — Personalization

* Personalized dashboards
* Personalized watchlists
* Custom alerts
* Portfolio-based insights
* User preferences
* Research history improvements

Phase 4 — LITSES Financial Intelligence

* Advanced AI research assistant
* Market-wide intelligence
* Automated research reports
* Advanced portfolio intelligence
* Multi-market support
* Mobile application
* Premium subscription features
* Commercial financial research platform

⸻

⚠️ Financial Disclaimer

AI Stock Analyzer is a financial research and analysis software product.

The information generated by the platform is intended for educational and research purposes.

AI-generated signals, scores, summaries, technical information, fundamental information, and other outputs are not guaranteed predictions and should not be considered personalized financial advice.

The platform does not guarantee investment returns.

Users are responsible for their own investment decisions and should conduct independent research before making financial decisions.

⸻

🏢 About LITSES

LITSES is the technology brand developing AI Stock Analyzer.

The project represents LITSES’s work in:

* Artificial intelligence
* Financial technology
* Market analytics
* Data-driven applications
* Financial research software

⸻

👨‍💻 Developer

Adhil
Neha Maria Melvin
Software Developer & Founder — LITSES

GitHub:

https://github.com/adhilofficial

⸻

📄 License

The licensing model for the project is currently being finalized.

⸻

⭐ Project

AI Stock Analyzer

Built with:

React
Vite
Node.js
Express
Supabase
Yahoo Finance
Gemini AI
Recharts
Vercel

Built by LITSES

Analyze markets. Understand companies. Research smarter.