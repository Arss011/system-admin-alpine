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

    if (this.credentials) {
      config.credentials = 'include';
    }

    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    try {
      console.log(`🔍 API ${method} ${url}`);

      const response = await fetch(url, config);
      console.log(`📊 Response ${response.status}: ${response.statusText}`);

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