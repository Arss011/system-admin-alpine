/**
 * Incentive Service
 * Service layer for all incentive-related operations
 * Follows Single Responsibility Principle and Dependency Inversion
 */

class IncentiveService {
  constructor(apiClient, eventBus, configService) {
    this.apiClient = apiClient;
    this.eventBus = eventBus;
    this.configService = configService;
    this.baseEndpoint = '/incentive';

    console.log('🔧 IncentiveService: Initialized');
  }

  // ==================== INCENTIVE TYPES ====================

  /**
   * Get all incentive types
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} Array of incentive types
   */
  async getTypes(filters = {}) {
    console.log('📋 IncentiveService: Fetching types with filters:', filters);

    try {
      this.eventBus.emit(EventTypes.DATA_LOADING, { type: 'types' });

      const response = await this.apiClient.get(`${this.baseEndpoint}/incentive-types`, filters);

      this.eventBus.emit(EventTypes.DATA_LOADED, {
        type: 'types',
        data: response.data || response
      });

      return response.data || response;
    } catch (error) {
      console.error('❌ IncentiveService: Error fetching types:', error);
      this.eventBus.emit(EventTypes.DATA_ERROR, {
        type: 'types',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get incentive type by ID
   * @param {number} id - Type ID
   * @returns {Promise<Object>} Incentive type data
   */
  async getTypeById(id) {
    console.log(`🔍 IncentiveService: Fetching type ${id}`);

    try {
      const response = await this.apiClient.get(`${this.baseEndpoint}/incentive-types/${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ IncentiveService: Error fetching type ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new incentive type
   * @param {Object} typeData - Type data
   * @param {string} typeData.name - Type name
   * @param {string} typeData.code - Type code
   * @param {string} typeData.descriptions - Type description
   * @param {boolean} typeData.is_active - Active status
   * @returns {Promise<Object>} Created type data
   */
  async createType(typeData) {
    console.log('➕ IncentiveService: Creating type:', typeData);

    // Validate required fields
    this._validateTypeData(typeData, true);

    try {
      const response = await this.apiClient.post(`${this.baseEndpoint}/incentive-types`, typeData);

      this.eventBus.emit(EventTypes.INCENTIVE_TYPE_CREATED, {
        type: response.data,
        action: 'create'
      });

      console.log('✅ IncentiveService: Type created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ IncentiveService: Error creating type:', error);
      throw error;
    }
  }

  /**
   * Update incentive type
   * @param {number} id - Type ID
   * @param {Object} typeData - Updated type data
   * @returns {Promise<Object>} Updated type data
   */
  async updateType(id, typeData) {
    console.log(`📝 IncentiveService: Updating type ${id}:`, typeData);

    // Validate required fields
    this._validateTypeData(typeData, false);

    try {
      const response = await this.apiClient.put(`${this.baseEndpoint}/incentive-types/${id}`, typeData);

      this.eventBus.emit(EventTypes.INCENTIVE_TYPE_UPDATED, {
        id,
        type: response.data,
        action: 'update'
      });

      console.log('✅ IncentiveService: Type updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ IncentiveService: Error updating type ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete incentive type
   * @param {number} id - Type ID
   * @returns {Promise<Object>} Deletion response
   */
  async deleteType(id) {
    console.log(`🗑️ IncentiveService: Deleting type ${id}`);

    try {
      const response = await this.apiClient.delete(`${this.baseEndpoint}/incentive-types/${id}`);

      this.eventBus.emit(EventTypes.INCENTIVE_TYPE_DELETED, {
        id,
        action: 'delete'
      });

      console.log('✅ IncentiveService: Type deleted successfully:', response.message);
      return response;
    } catch (error) {
      console.error(`❌ IncentiveService: Error deleting type ${id}:`, error);
      throw error;
    }
  }

  // ==================== INCENTIVE CONFIGS ====================

  /**
   * Get all incentive configurations
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} Array of incentive configurations
   */
  async getConfigs(filters = {}) {
    console.log('📋 IncentiveService: Fetching configs with filters:', filters);

    try {
      this.eventBus.emit(EventTypes.DATA_LOADING, { type: 'configs' });

      const response = await this.apiClient.get(`${this.baseEndpoint}/incentive-config`, filters);

      this.eventBus.emit(EventTypes.DATA_LOADED, {
        type: 'configs',
        data: response.data || response
      });

      return response.data || response;
    } catch (error) {
      console.error('❌ IncentiveService: Error fetching configs:', error);
      this.eventBus.emit(EventTypes.DATA_ERROR, {
        type: 'configs',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get incentive configuration by ID
   * @param {number} id - Config ID
   * @returns {Promise<Object>} Configuration data
   */
  async getConfigById(id) {
    console.log(`🔍 IncentiveService: Fetching config ${id}`);

    try {
      const response = await this.apiClient.get(`${this.baseEndpoint}/incentive-config/${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ IncentiveService: Error fetching config ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new incentive configuration
   * @param {Object} configData - Configuration data
   * @returns {Promise<Object>} Created configuration data
   */
  async createConfig(configData) {
    console.log('➕ IncentiveService: Creating config:', configData);

    // Validate required fields
    this._validateConfigData(configData, true);

    try {
      const response = await this.apiClient.post(`${this.baseEndpoint}/incentive-config`, configData);

      this.eventBus.emit(EventTypes.INCENTIVE_CONFIG_CREATED, {
        config: response.data,
        action: 'create'
      });

      console.log('✅ IncentiveService: Config created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ IncentiveService: Error creating config:', error);
      throw error;
    }
  }

  /**
   * Update incentive configuration
   * @param {number} id - Config ID
   * @param {Object} configData - Updated configuration data
   * @returns {Promise<Object>} Updated configuration data
   */
  async updateConfig(id, configData) {
    console.log(`📝 IncentiveService: Updating config ${id}:`, configData);

    // Validate required fields
    this._validateConfigData(configData, false);

    try {
      const response = await this.apiClient.put(`${this.baseEndpoint}/incentive-config/${id}`, configData);

      this.eventBus.emit(EventTypes.INCENTIVE_CONFIG_UPDATED, {
        id,
        config: response.data,
        action: 'update'
      });

      console.log('✅ IncentiveService: Config updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ IncentiveService: Error updating config ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete incentive configuration
   * @param {number} id - Config ID
   * @returns {Promise<Object>} Deletion response
   */
  async deleteConfig(id) {
    console.log(`🗑️ IncentiveService: Deleting config ${id}`);

    try {
      const response = await this.apiClient.delete(`${this.baseEndpoint}/incentive-config/${id}`);

      this.eventBus.emit(EventTypes.INCENTIVE_CONFIG_DELETED, {
        id,
        action: 'delete'
      });

      console.log('✅ IncentiveService: Config deleted successfully:', response.message);
      return response;
    } catch (error) {
      console.error(`❌ IncentiveService: Error deleting config ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get configuration by type and period
   * @param {number} typeId - Incentive type ID
   * @param {string} period - Period (YYYY-MM format)
   * @returns {Promise<Object>} Configuration data
   */
  async getConfigByTypeAndPeriod(typeId, period) {
    console.log(`🔍 IncentiveService: Fetching config for type ${typeId}, period ${period}`);

    try {
      const response = await this.apiClient.get(`${this.baseEndpoint}/incentive-config/by-type-period`, {
        type_id: typeId,
        periode: period
      });
      return response.data;
    } catch (error) {
      console.error(`❌ IncentiveService: Error fetching config by type and period:`, error);
      throw error;
    }
  }

  // ==================== EMPLOYEE INCENTIVES ====================

  /**
   * Get all employee incentives
   * @param {Object} filters - Optional filters (limit, offset, etc.)
   * @returns {Promise<Object>} Employee incentives data with pagination
   */
  async getEmployeeIncentives(filters = {}) {
    console.log('📋 IncentiveService: Fetching employee incentives with filters:', filters);

    try {
      this.eventBus.emit(EventTypes.DATA_LOADING, { type: 'employees' });

      const response = await this.apiClient.get(`${this.baseEndpoint}/employee-incentives`, filters);

      this.eventBus.emit(EventTypes.DATA_LOADED, {
        type: 'employees',
        data: response.data || response
      });

      return response; // Return full response including pagination info
    } catch (error) {
      console.error('❌ IncentiveService: Error fetching employee incentives:', error);
      this.eventBus.emit(EventTypes.DATA_ERROR, {
        type: 'employees',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get employee incentives by employee ID
   * @param {number} employeeId - Employee ID
   * @returns {Promise<Object>} Employee incentives data
   */
  async getEmployeeIncentivesByEmployeeId(employeeId) {
    console.log(`📋 IncentiveService: Fetching incentives for employee ${employeeId}`);

    try {
      const response = await this.apiClient.get(`${this.baseEndpoint}/employee-incentives/${employeeId}`);

      console.log(`✅ IncentiveService: Employee ${employeeId} incentives loaded:`, response.data?.length || 0, 'items');
      return response;
    } catch (error) {
      console.error(`❌ IncentiveService: Error fetching incentives for employee ${employeeId}:`, error);
      throw error;
    }
  }

  /**
   * Get employee incentive summary by employee and period
   * @param {number} employeeId - Employee ID
   * @param {string} period - Period (YYYY-MM format)
   * @returns {Promise<Object>} Employee incentive summary
   */
  async getEmployeeIncentiveSummary(employeeId, period) {
    console.log(`📋 IncentiveService: Fetching incentive summary for employee ${employeeId}, period ${period}`);

    try {
      const response = await this.apiClient.get(`${this.baseEndpoint}/employee-incentives/summary/${employeeId}/${period}`);

      console.log(`✅ IncentiveService: Employee ${employeeId} summary loaded for period ${period}`);
      return response.data || response;
    } catch (error) {
      console.error(`❌ IncentiveService: Error fetching incentive summary for employee ${employeeId}, period ${period}:`, error);
      throw error;
    }
  }

  /**
   * Assign incentive to employee
   * @param {Object} employeeIncentiveData - Employee incentive data
   * @param {number} employeeIncentiveData.employee_id - Employee ID
   * @param {string} employeeIncentiveData.email - Employee email
   * @param {string} employeeIncentiveData.fullname - Employee full name
   * @param {number} employeeIncentiveData.incentive_type_id - Incentive type ID
   * @param {string} employeeIncentiveData.notes - Optional notes
   * @param {string} employeeIncentiveData.descriptions - Optional descriptions
   * @param {string} employeeIncentiveData.periode - Period (YYYY-MM format)
   * @returns {Promise<Object>} Created employee incentive data
   */
  async assignIncentiveToEmployee(employeeIncentiveData) {
    console.log('➕ IncentiveService: Assigning incentive to employee:', employeeIncentiveData);

    // Validate required fields
    this._validateEmployeeIncentiveData(employeeIncentiveData, true);

    try {
      const response = await this.apiClient.post(`${this.baseEndpoint}/employee-incentives`, employeeIncentiveData);

      this.eventBus.emit(EventTypes.INCENTIVE_EMPLOYEE_CREATED, {
        employeeIncentive: response.data,
        action: 'assign'
      });

      console.log('✅ IncentiveService: Incentive assigned to employee successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ IncentiveService: Error assigning incentive to employee:', error);
      throw error;
    }
  }

  /**
   * Update employee incentive
   * @param {number} id - Employee incentive ID
   * @param {Object} employeeIncentiveData - Updated employee incentive data
   * @returns {Promise<Object>} Updated employee incentive data
   */
  async updateEmployeeIncentive(id, employeeIncentiveData) {
    console.log(`📝 IncentiveService: Updating employee incentive ${id}:`, employeeIncentiveData);

    // Validate required fields
    this._validateEmployeeIncentiveData(employeeIncentiveData, false);

    try {
      const response = await this.apiClient.put(`${this.baseEndpoint}/employee-incentives/${id}`, employeeIncentiveData);

      this.eventBus.emit(EventTypes.INCENTIVE_EMPLOYEE_UPDATED, {
        id,
        employeeIncentive: response.data,
        action: 'update'
      });

      console.log('✅ IncentiveService: Employee incentive updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ IncentiveService: Error updating employee incentive ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete employee incentive
   * @param {number} id - Employee incentive ID
   * @returns {Promise<Object>} Deletion response
   */
  async deleteEmployeeIncentive(id) {
    console.log(`🗑️ IncentiveService: Deleting employee incentive ${id}`);

    try {
      const response = await this.apiClient.delete(`${this.baseEndpoint}/employee-incentives/${id}`);

      this.eventBus.emit(EventTypes.INCENTIVE_EMPLOYEE_DELETED, {
        id,
        action: 'delete'
      });

      console.log('✅ IncentiveService: Employee incentive deleted successfully:', response.message);
      return response;
    } catch (error) {
      console.error(`❌ IncentiveService: Error deleting employee incentive ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get employee incentive by ID
   * @param {number} id - Employee incentive ID
   * @returns {Promise<Object>} Employee incentive data
   */
  async getEmployeeIncentiveById(id) {
    console.log(`🔍 IncentiveService: Fetching employee incentive ${id}`);

    try {
      const response = await this.apiClient.get(`${this.baseEndpoint}/employee-incentives/${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ IncentiveService: Error fetching employee incentive ${id}:`, error);
      throw error;
    }
  }

  // ==================== VALIDATION HELPERS ====================

  /**
   * Validate type data
   * @private
   * @param {Object} data - Type data to validate
   * @param {boolean} isCreate - Whether this is for creation
   */
  _validateTypeData(data, isCreate) {
    const errors = [];

    if (isCreate || data.name !== undefined) {
      if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push('Name is required and must be a non-empty string');
      }
    }

    if (isCreate || data.code !== undefined) {
      if (!data.code || typeof data.code !== 'string' || data.code.trim().length === 0) {
        errors.push('Code is required and must be a non-empty string');
      }
    }

    if (data.descriptions && typeof data.descriptions !== 'string') {
      errors.push('Descriptions must be a string');
    }

    if (data.is_active !== undefined && typeof data.is_active !== 'boolean') {
      errors.push('Is_active must be a boolean');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Validate configuration data
   * @private
   * @param {Object} data - Config data to validate
   * @param {boolean} isCreate - Whether this is for creation
   */
  _validateConfigData(data, isCreate) {
    const errors = [];

    if (isCreate || data.incentive_type_id !== undefined) {
      if (!data.incentive_type_id || typeof data.incentive_type_id !== 'number') {
        errors.push('Incentive type ID is required and must be a number');
      }
    }

    if (isCreate || data.periode !== undefined) {
      if (!data.periode || typeof data.periode !== 'string' || !this._isValidPeriod(data.periode)) {
        errors.push('Period is required and must be in YYYY-MM format');
      }
    }

    if (isCreate || data.default_value !== undefined) {
      if (!data.default_value || typeof data.default_value !== 'string') {
        errors.push('Default value is required and must be a string');
      }
    }

    if (data.descriptions && typeof data.descriptions !== 'string') {
      errors.push('Descriptions must be a string');
    }

    if (data.is_active !== undefined && typeof data.is_active !== 'boolean') {
      errors.push('Is_active must be a boolean');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Validate period format (YYYY-MM)
   * @private
   * @param {string} period - Period string
   * @returns {boolean} True if valid
   */
  _isValidPeriod(period) {
    const periodRegex = /^\d{4}-\d{2}$/;
    return periodRegex.test(period);
  }

  /**
   * Validate employee incentive data
   * @private
   * @param {Object} data - Employee incentive data to validate
   * @param {boolean} isCreate - Whether this is for creation
   */
  _validateEmployeeIncentiveData(data, isCreate) {
    const errors = [];

    if (isCreate || data.employee_id !== undefined) {
      if (!data.employee_id || typeof data.employee_id !== 'number') {
        errors.push('Employee ID is required and must be a number');
      }
    }

    if (isCreate || data.email !== undefined) {
      if (!data.email || typeof data.email !== 'string' || data.email.trim().length === 0) {
        errors.push('Email is required and must be a non-empty string');
      } else if (data.email && !this._isValidEmail(data.email)) {
        errors.push('Email must be a valid email format');
      }
    }

    if (data.fullname !== undefined && data.fullname !== null) {
      if (typeof data.fullname !== 'string') {
        errors.push('Fullname must be a string');
      }
    }

    if (isCreate || data.incentive_type_id !== undefined) {
      if (!data.incentive_type_id || typeof data.incentive_type_id !== 'number') {
        errors.push('Incentive type ID is required and must be a number');
      }
    }

    if (isCreate || data.periode !== undefined) {
      if (!data.periode || typeof data.periode !== 'string' || !this._isValidPeriod(data.periode)) {
        errors.push('Period is required and must be in YYYY-MM format');
      }
    }

    if (data.notes !== undefined && data.notes !== null) {
      if (typeof data.notes !== 'string') {
        errors.push('Notes must be a string');
      }
    }

    if (data.descriptions !== undefined && data.descriptions !== null) {
      if (typeof data.descriptions !== 'string') {
        errors.push('Descriptions must be a string');
      }
    }

    if (data.is_active !== undefined && typeof data.is_active !== 'boolean') {
      errors.push('Is_active must be a boolean');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Validate email format
   * @private
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid email format
   */
  _isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Refresh all incentive data
   * @returns {Promise<Object>} Fresh data
   */
  async refreshAllData() {
    console.log('🔄 IncentiveService: Refreshing all data');

    this.eventBus.emit(EventTypes.DATA_REFRESH, { type: 'all' });

    const [types, configs, employees] = await Promise.all([
      this.getTypes(),
      this.getConfigs(),
      this.getEmployeeIncentives({ limit: 50 }) // Add pagination for better performance
    ]);

    return {
      types,
      configs,
      employees: employees.data || employees // Handle different response formats
    };
  }

  /**
   * Get service statistics
   * @returns {Promise<Object>} Service statistics
   */
  async getStats() {
    try {
      const [types, configs, employees] = await this.refreshAllData();

      return {
        totalTypes: types.length || 0,
        activeTypes: types?.filter(t => t.is_active).length || 0,
        totalConfigs: configs.length || 0,
        activeConfigs: configs?.filter(c => c.is_active).length || 0,
        totalEmployees: employees.length || 0,
        activeEmployees: employees?.filter(e => e.is_active).length || 0
      };
    } catch (error) {
      console.error('❌ IncentiveService: Error getting stats:', error);
      return {
        totalTypes: 0,
        activeTypes: 0,
        totalConfigs: 0,
        activeConfigs: 0,
        totalEmployees: 0,
        activeEmployees: 0
      };
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IncentiveService;
} else {
  window.IncentiveService = IncentiveService;
}