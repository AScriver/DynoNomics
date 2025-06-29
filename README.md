# DynoNomics

DynoNomics is a Node.js application for monitoring and logging exchange prices for [Craft World](https://preview.craft-world.gg/). It fetches current prices from the API, tracks changes, and appends updates to a log file for further analysis.

## Features
- Fetches current prices for resources from the exchange
- Logs only changed prices with timestamp and recommendation
- Maintains a snapshot of the last known prices for efficient change detection
- Console output with color-coded price changes
- Graceful shutdown support

## Project Structure
```
index.js                # Main entry point
package.json            # Project metadata and dependencies
data/
  lastPrices.json       # Snapshot of last known prices
  prices.json           # Log of price changes
src/
  BidirectionalEnum.js
  ExchangePriceService.js
  RecommendationEnum.js
  ResourceEnum.js
  TokenManager.js
```

## Setup
1. **Install dependencies:**
   ```sh
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file in the project root with the following variables:
   ```env
   CLIENT_ID=your_client_id
   REFRESH_TOKEN=your_refresh_token
   FIREBASE_API_KEY=your_firebase_api_key
   ```

3. **Run the application:**
   ```sh
   node index.js
   ```

## How It Works
- On startup, the app authenticates using credentials from environment variables.
- It fetches the latest prices and compares them to the last snapshot.
- Only changed prices are logged to `data/prices.json` with compact fields:
  - `s`: Symbol ID (from `ResourceEnum`)
  - `a`: Amount (price)
  - `r`: Recommendation ID (from `RecommendationEnum`)
  - `t`: Timestamp (ms since epoch)
- The snapshot is updated for the next run.
