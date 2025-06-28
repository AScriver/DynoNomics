import axios from 'axios';

/**
 * Manages Firebase authentication tokens with automatic refresh capabilities
 */
class TokenManager {
    // Constants
    static TOKEN_BUFFER_SECONDS = 60;
    static BASE_URL = 'https://securetoken.googleapis.com/v1';

    // Private properties
    #apiKey;
    #client;

    // Public properties
    accessToken = null;
    expiresIn = null;
    tokenType = null;
    refreshToken = null;
    idToken = null;
    userId = null;
    projectId = null;
    expiresAt = null;

    /**
     * Creates a new TokenManager instance
     * @param {string} refreshToken - The refresh token for authentication
     * @param {string} apiKey - The API key for the Firebase project
     * @throws {Error} If required parameters are missing
     */
    constructor({refreshToken, apiKey}) {
        if (!refreshToken || typeof refreshToken !== 'string') {
            throw new Error('refreshToken is required and must be a string');
        }
        if (!apiKey || typeof apiKey !== 'string') {
            throw new Error('apiKey is required and must be a string');
        }

        this.refreshToken = refreshToken;
        this.#apiKey = apiKey;

        this.#client = axios.create({
            baseURL: TokenManager.BASE_URL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Refreshes the authentication token
     * @returns {Promise<Object>} The token response data
     * @throws {Error} If the refresh request fails
     */
    async refresh() {
        try {
            const response = await this.#client.post(`/token?key=${this.#apiKey}`, {
                grant_type: 'refresh_token',
                refresh_token: this.refreshToken,
            });

            this.accessToken = response.data.access_token;
            this.expiresIn = response.data.expires_in;
            this.tokenType = response.data.token_type;
            this.refreshToken = response.data.refresh_token;
            this.idToken = response.data.id_token;
            this.userId = response.data.user_id;
            this.projectId = response.data.project_id;

            const expirationSeconds = this.expiresIn - TokenManager.TOKEN_BUFFER_SECONDS;
            const expirationMilliseconds = expirationSeconds * 1000;
            this.expiresAt = new Date(Date.now() + expirationMilliseconds);

            return response.data;
        } catch (error) {
            if (error.response) {
                // Server responded with error status
                const status = error.response.status;
                const message = error.response.data?.error?.message || 'Token refresh failed';
                throw new Error(`Token refresh failed (${status}): ${message}`);
            } else if (error.request) {
                throw new Error('Network error during token refresh. Please check your connection.');
            } else {
                throw new Error(`Token refresh error: ${error.message}`);
            }
        }
    }

    /**
     * Checks if the current token is still valid
     * @returns {boolean} True if token is valid and not expired
     */
    isTokenValid() {
        if (!this.accessToken || !this.expiresAt) {
            return false;
        }
        return new Date() < this.expiresAt;
    }

    /**
     * Gets a valid access token, refreshing if necessary
     * @returns {Promise<string>} A valid access token
     * @throws {Error} If unable to get a valid token
     */
    async getValidToken() {
        if (!this.isTokenValid()) {
            await this.refresh();
        }
        return this.accessToken;
    }

    /**
     * Gets the time remaining until token expiration
     * @returns {number|null} Milliseconds until expiration, or null if no token
     */
    getTimeUntilExpiration() {
        if (!this.expiresAt) {
            return null;
        }
        return Math.max(0, this.expiresAt.getTime() - Date.now());
    }

    /**
     * Clears all token data
     */
    clearTokens() {
        this.accessToken = null;
        this.expiresIn = null;
        this.tokenType = null;
        this.idToken = null;
        this.userId = null;
        this.projectId = null;
        this.expiresAt = null;
        // Note: We keep refreshToken as it's needed for future refreshes
    }
}

export default TokenManager;