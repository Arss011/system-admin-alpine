/**
 * API Client Service
 * Centralized API communication with error handling
 * Implements Single Responsibility Principle
 */
class ApiClient {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || (window.env?.VITE_API_URL || 'http://localhost:8000');
    this.credentials = config.credentials !== false;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers
    };
  }

  /**
   * Make GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Response data
   */
  async get(endpoint, params = {}) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    return this._makeRequest('GET', url.toString());
  }

  /**
   * Make POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @returns {Promise<Object>} Response data
   */
  async post(endpoint, data = {}) {
    return this._makeRequest('POST', `${this.baseUrl}${endpoint}`, data);
  }

  /**
   * Make PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @returns {Promise<Object>} Response data
   */
  async put(endpoint, data = {}) {
    return this._makeRequest('PUT', `${this.baseUrl}${endpoint}`, data);
  }

  /**
   * Make DELETE request
   * @param {string} endpoint - API endpoint
   * @returns {Promise<Object>} Response data
   */
  async delete(endpoint) {
    return this._makeRequest('DELETE', `${this.baseUrl}${endpoint}`);
  }

  /**
   * Internal request handler
   * @private
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {Object} data - Request body (optional)
   * @returns {Promise<Object>} Response data
   */
  async _makeRequest(method, url, data = null) {
    const config = {
      method,
      headers: { ...this.defaultHeaders },
    };

    // Include credentials for cookies
    if (this.credentials) {
      config.credentials = 'include';
    }

    // Add Bearer token from cookies
    const token = this._getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    try {
      console.log(`🔍 API ${method} ${url}`);
      console.log(`🔑 Token present: ${!!token}`);

      const response = await fetch(url, config);
      console.log(`📊 Response ${response.status}: ${response.statusText}`);

      // Handle 401 Unauthorized
      if (response.status === 401) {
        throw new ApiError('Unauthorized: Invalid or expired token', 401);
      }

      if (!response.ok) {
        const errorData = await this._parseError(response);
        throw new ApiError(errorData.message || `HTTP ${response.status}: ${response.statusText}`, response.status);
      }

      const result = await response.json();
      console.log(`✅ API Success:`, result);
      return result;

    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('❌ API Error:', error);
      throw new ApiError(`Network error: ${error.message}`, 0, error);
    }
  }

  /**
   * Get access token from cookies
   * @private
   * @returns {string|null} Access token or null
   */
  _getAccessToken() {
    try {
      // Try to get token from cookies
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'access_token') {
          return value;
        }
      }

      // Fallback to localStorage or other storage
      const localToken = localStorage.getItem('access_token');
      if (localToken) {
        return localToken;
      }

      // Check for token in sessionStorage
      const sessionToken = sessionStorage.getItem('access_token');
      if (sessionToken) {
        return sessionToken;
      }

      console.log('🔑 No access token found in cookies, localStorage, or sessionStorage');
      return null;
    } catch (error) {
      console.error('❌ Error getting access token:', error);
      return null;
    }
  }

  /**
   * Set access token (for future use)
   * @param {string} token - Access token
   * @param {boolean} remember - Whether to remember token
   */
  setAccessToken(token, remember = false) {
    try {
      if (remember) {
        // Set in cookie with longer expiration
        const expires = new Date();
        expires.setDate(expires.getDate() + 30); // 30 days
        document.cookie = `access_token=${token}; expires=${expires.toUTCString()}; path=/`;
        localStorage.setItem('access_token', token);
      } else {
        // Set in session storage
        document.cookie = `access_token=${token}; path=/`;
        sessionStorage.setItem('access_token', token);
      }

      console.log('🔑 Access token set successfully');
    } catch (error) {
      console.error('❌ Error setting access token:', error);
    }
  }

  /**
   * Clear access token
   */
  clearAccessToken() {
    try {
      // Clear from cookie
      document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

      // Clear from storage
      localStorage.removeItem('access_token');
      sessionStorage.removeItem('access_token');

      console.log('🔑 Access token cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing access token:', error);
    }
  }

  /**
   * Parse error response
   * @private
   * @param {Response} response - Fetch response object
   * @returns {Promise<Object>} Error data
   */
  async _parseError(response) {
    try {
      return await response.json();
    } catch {
      return { message: response.statusText };
    }
  }
}

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(message, status = 0, originalError = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.originalError = originalError;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ApiClient, ApiError };
} else {
  window.ApiClient = ApiClient;
  window.ApiError = ApiError;
}