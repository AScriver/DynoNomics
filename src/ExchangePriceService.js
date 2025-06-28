import axios from 'axios';

/**
 * Service for fetching current exchange prices using GraphQL
 */
class ExchangePriceService {
    // Constants
    static DEFAULT_TIMEOUT = 10000;
    static GRAPHQL_QUERY = `
        query {
            exchangePriceList {
                baseSymbol
                prices {
                    referenceSymbol
                    amount
                    recommendation
                }
            }
        }
    `;

    // Private properties
    #client;
    #tokenManager;

    /**
     * Creates a new ExchangePriceService instance
     * @param {string} baseURL - The GraphQL endpoint URL
     * @param {TokenManager} tokenManager - Token manager for authentication
     * @throws {Error} If required parameters are missing
     */
    constructor({clientId = process.env.CLIENT_ID, tokenManager}) {
        if (!tokenManager) {
            throw new Error('tokenManager is required');
        }

        this.#tokenManager = tokenManager;

        this.#client = axios.create({
            baseURL: 'https://preview.craft-world.gg/',
            timeout: ExchangePriceService.DEFAULT_TIMEOUT,
            headers: {
                'Content-Type': 'application/json',
                "Origin": "https://preview.craft-world.gg/",
				"Referer": "https://preview.craft-world.gg/",
                'X-Client-Id': clientId
            }
        });

        this.#client.interceptors.request.use(async cfg => {
			const token = await this.#tokenManager.getValidToken();
			cfg.headers.Authorization = `Bearer jwt_${token}`;
			return cfg;
		});
    }

    /**
     * Fetches current exchange prices for all items
     * @returns {Promise<Object>} The exchange price data
     * @throws {Error} If the request fails
     */
    async getCurrentPrices() {
        try {
            const response = await this.#client.post('graphql', {
                query: ExchangePriceService.GRAPHQL_QUERY
            });

            if (response.data.errors) {
                throw new Error(`GraphQL errors: ${JSON.stringify(response.data.errors)}`);
            }

            return response.data.data.exchangePriceList;
        } catch (error) {
            if (error.response) {
                const status = error.response.status;
                const message = error.response.data?.errors?.[0]?.message || 'Exchange price request failed';
                throw new Error(`Exchange price request failed (${status}): ${message}`);
            } else if (error.request) {
                throw new Error('Network error during exchange price request. Please check your connection.');
            } else {
                throw new Error(`Exchange price request error: ${error.message}`);
            }
        }
    }

    /**
     * Gets prices for a specific base symbol
     * @param {string} baseSymbol - The base symbol to filter by
     * @returns {Promise<Object|null>} Price data for the symbol, or null if not found
     */
    async getPricesForSymbol(baseSymbol) {
        const priceList = await this.getCurrentPrices();
        return priceList.find(item => item.baseSymbol === baseSymbol) || null;
    }

    /**
     * Gets all base symbols available in the exchange
     * @returns {Promise<string[]>} Array of base symbols
     */
    async getAvailableSymbols() {
        const priceList = await this.getCurrentPrices();
        return priceList.map(item => item.baseSymbol);
    }
}

export default ExchangePriceService;