import 'dotenv/config'
import chalk from 'chalk'
import fsp from 'fs/promises'
import { fileURLToPath } from 'url'
import path from 'path'
import TokenManager from './src/TokenManager.js'
import ExchangePriceService from './src/ExchangePriceService.js'
import { ResourceEnum } from './src/ResourceEnum.js'
import { RecommendationEnum } from './src/RecommendationEnum.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const outLogPath = path.resolve(__dirname, 'data', 'prices.json')
const snapshotPath = path.resolve(__dirname, 'data', 'lastPrices.json')

let exchangePriceService;
let priceCheckInterval;

const loadLastPrices = async () => {
    try {
        const text = await fsp.readFile(snapshotPath, 'utf8')
        return JSON.parse(text)
    } catch {
        return {}  // no snapshot yet
    }
}

const saveLastPrices = async map => {
    await fsp.writeFile(snapshotPath, JSON.stringify(map, null, 2), 'utf8')
}

const fetchAndStorePrices = async () => {
    console.clear()
    try {
        const exchangePriceList = await exchangePriceService.getCurrentPrices()
        const lastPricesMap = await loadLastPrices()
        const toAppend = []
        const newSnapshot = { ...lastPricesMap }
        const timestamp = Date.now()

        for (const entry of exchangePriceList.prices) {
            const { referenceSymbol, amount, recommendation } = entry
            const lastAmount = lastPricesMap[referenceSymbol] ?? 0;
            const diff = amount - lastAmount;
            const changeStr = `${diff >= 0 ? '+' : ''}${diff}`;
            
            console.log(
                `${referenceSymbol}: ${chalk.bold(amount.toString())} ` +
                `(${diff >= 0 ? chalk.green(changeStr) : chalk.red(changeStr)})`
            );
            
            if (lastAmount !== amount) {
                // Convert string symbols to int IDs for space efficiency
                const symbolId = ResourceEnum[referenceSymbol]
                const recommendationId = RecommendationEnum[recommendation]
                
                if (symbolId === undefined) {
                    console.warn(chalk.yellow(`Unknown symbol: ${referenceSymbol}`))
                    continue
                }
                if (recommendationId === undefined) {
                    console.warn(chalk.yellow(`Unknown recommendation: ${recommendation}`))
                    recommendationId = RecommendationEnum.HOLD; // default to HOLD if unknown
                }

                toAppend.push({
                    s: symbolId,
                    a: amount,
                    r: recommendationId,
                    t: timestamp
                })
                newSnapshot[referenceSymbol] = amount
            }
        }

        if (toAppend.length === 0) {
            console.log(chalk.gray('No changes detected, nothing to append'))
            return
        }

        // ensure file exists
        try { await fsp.access(outLogPath) }
        catch { await fsp.writeFile(outLogPath, '', 'utf8') }

        const blob = toAppend.map(e => JSON.stringify(e)).join('\n') + '\n'
        await fsp.appendFile(outLogPath, blob, 'utf8')

        console.log(
            chalk.blue(
                `Appended ${toAppend.length} changed entr${toAppend.length === 1 ? 'y' : 'ies'
                } at ${new Date().toLocaleString()}`
            )
        )
        
        await saveLastPrices(newSnapshot)
    }
    catch (err) {
        console.error(chalk.red('Fetch/store error:'), err)
    }
}

const cleanup = () => {
    console.log(chalk.yellow('\nShutting down gracefully...'))
    if (priceCheckInterval) {
        clearInterval(priceCheckInterval)
    }
    process.exit(0)
}

const init = async () => {
    try {
        exchangePriceService = new ExchangePriceService({
            clientId: process.env.CLIENT_ID,
            tokenManager: new TokenManager({
                refreshToken: process.env.REFRESH_TOKEN,
                apiKey: process.env.FIREBASE_API_KEY
            })
        })

        // graceful shutdown handlers
        process.on('SIGINT', cleanup)
        process.on('SIGTERM', cleanup)

        // run immediately, then schedule every 60 seconds
        await fetchAndStorePrices()
        //priceCheckInterval = setInterval(fetchAndStorePrices, 60 * 1000)
        
        console.log(chalk.green('Price monitoring started. Press Ctrl+C to stop.'))
    }
    catch (err) {
        console.error(chalk.red('Initial auth failed:'), err)
        process.exit(1)
    }
}

init()
