/**
 * Incentive Config Page Controller
 * Manages CRUD operations for incentive configurations with pagination
 */

class IncentiveConfigPage {
  constructor() {
    this.services = {};
    this.currentData = [];
    this.pagination = null;
    this.paginationComponent = null;
    this.filters = {
      search: '',
      typeId: '',
      period: '',
      status: ''
    };
    this.isLoading = false;

    console.log('🔧 IncentiveConfigPage: Initialized');
  }

  /**
   * Initialize the page
   */
  async initialize() {
    try {
      console.log('🚀 IncentiveConfigPage: Starting initialization...');

      // Initialize services
      await this._initializeServices();

      // Bind event listeners
      this._bindEventListeners();

      // Setup pagination
      this._setupPagination();

      // Load initial data
      await this._loadInitialData();

      console.log('✅ IncentiveConfigPage: Initialization complete');

    } catch (error) {
      console.error('❌ IncentiveConfigPage: Initialization failed:', error);
      this.showError('Gagal menginisialisasi halaman: ' + error.message);
    }
  }

  /**
   * Initialize all required services
   * @private
   */
  async _initializeServices() {
    try {
      // Check if required classes are available
      if (typeof ApiClient === 'undefined') {
        throw new Error('ApiClient is not loaded');
      }
      if (typeof IncentiveService === 'undefined') {
        throw new Error('IncentiveService is not loaded');
      }
      if (typeof ModalService === 'undefined') {
        throw new Error('ModalService is not loaded');
      }
      if (typeof eventBus === 'undefined') {
        throw new Error('EventBus is not loaded');
      }

      // Initialize service instances
      this.apiClient = new ApiClient();
      this.eventBus = eventBus;
      this.modalService = new ModalService(this.eventBus);
      this.incentiveService = new IncentiveService(
        this.apiClient,
        this.eventBus,
        null
      );

      console.log('🔧 IncentiveConfigPage: Services initialized successfully');

    } catch (error) {
      console.error('❌ IncentiveConfigPage: Service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Bind event listeners
   * @private
   */
  _bindEventListeners() {
    // Subscribe to event bus events
    this.eventBus.on(EventTypes.DATA_LOADING, this._handleDataLoading.bind(this));
    this.eventBus.on(EventTypes.DATA_LOADED, this._handleDataLoaded.bind(this));
    this.eventBus.on(EventTypes.DATA_ERROR, this._handleDataError.bind(this));

    this.eventBus.on(EventTypes.INCENTIVE_CONFIG_CREATED, this._handleConfigCreated.bind(this));
    this.eventBus.on(EventTypes.INCENTIVE_CONFIG_UPDATED, this._handleConfigUpdated.bind(this));
    this.eventBus.on(EventTypes.INCENTIVE_CONFIG_DELETED, this._handleConfigDeleted.bind(this));

    // Bind form events
    this._bindFormEvents();

    // Bind filter events
    this._bindFilterEvents();

    // Bind button events
    this._bindButtonEvents();

    console.log('🔧 IncentiveConfigPage: Event listeners bound');
  }

  /**
   * Setup pagination component
   * @private
   */
  _setupPagination() {
    const paginationContainer = document.getElementById('configPagination');
    if (paginationContainer) {
      this.paginationComponent = new PaginationComponent(paginationContainer, {
        limit: 10,
        onPageChange: (page) => this._handlePageChange(page),
        onLimitChange: (limit) => this._handleLimitChange(limit),
        showLimitSelector: true,
        showInfo: true
      });

      console.log('🔧 IncentiveConfigPage: Pagination component initialized');
    }
  }

  /**
   * Load initial data
   * @private
   */
  async _loadInitialData() {
    try {
      this.isLoading = true;
      this._showLoadingStates();

      // Load config data with pagination
      await this._loadConfigs();

      console.log('✅ IncentiveConfigPage: Initial data loaded');

    } catch (error) {
      console.error('❌ IncentiveConfigPage: Failed to load initial data:', error);
      this.showError('Gagal memuat data: ' + error.message);
    } finally {
      this.isLoading = false;
      this._hideLoadingStates();
    }
  }

  /**
   * Load configs with pagination
   * @private
   */
  async _loadConfigs() {
    const params = {
      limit: this.paginationComponent?.getState().currentLimit || 10,
      page: this.paginationComponent?.getState().currentPage || 1,
      ...this._buildFilterParams()
    };

    console.log('📋 IncentiveConfigPage: Loading configs with params:', params);

    const response = await this.incentiveService.getConfigs(params);

    // Store current data
    this.currentData = response.data || [];
    this.pagination = response.pagination || {};

    // Update UI
    this._updateConfigTable();
    this._updatePagination();

    console.log('✅ IncentiveConfigPage: Configs loaded', {
      dataCount: this.currentData.length,
      pagination: this.pagination
    });
  }

  /**
   * Update config table
   * @private
   */
  _updateConfigTable() {
    const tbody = document.querySelector('#config-tab tbody');
    if (!tbody) {
      console.warn('❌ Config table tbody not found in DOM');
      return;
    }

    if (!this.currentData || this.currentData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-muted py-4">
            <i class="bi bi-inbox fs-1 d-block mb-2"></i>
            <p>Belum ada data konfigurasi</p>
            <button class="btn btn-primary btn-sm" onclick="window.incentiveConfigPage.handleCreateConfig()">
              <i class="bi bi-plus-lg me-1"></i>Tambah Konfigurasi
            </button>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.currentData.map((config, index) => `
      <tr>
        <td>${this._calculateRowNumber(index)}</td>
        <td>
          <span class="badge bg-primary">${config.incentive_type_id ? this._getTypeName(config.incentive_type_id) : 'Unknown'}</span>
        </td>
        <td>
          <span class="badge bg-info">${this._formatPeriode(config.periode)}</span>
        </td>
        <td>
          <strong>${config.default_value || 'N/A'}</strong>
        </td>
        <td>
          <small>${config.descriptions || 'Tidak ada deskripsi'}</small>
        </td>
        <td class="text-center">
          <span class="badge ${config.is_active ? 'bg-success' : 'bg-danger'}">
            ${config.is_active ? 'Aktif' : 'Non Aktif'}
          </span>
        </td>
        <td class="text-center">
          <div class="btn-group">
            <button class="btn btn-outline-primary btn-sm edit-btn"
                    data-config-id="${config.pk}"
                    data-config='${JSON.stringify(config).replace(/'/g, '&apos;')}'
                    onclick="window.incentiveConfigPage.handleEditConfig(this)">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-outline-danger btn-sm delete-btn"
                    data-config-id="${config.pk}"
                    data-config-name="${config.default_value || 'Konfigurasi'}"
                    onclick="window.incentiveConfigPage.handleDeleteConfig(this)">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  /**
   * Update pagination component
   * @private
   */
  _updatePagination() {
    if (this.paginationComponent) {
      this.paginationComponent.update(this.pagination);
    }
  }

  /**
   * Calculate row number based on pagination
   * @private
   */
  _calculateRowNumber(index) {
    if (!this.pagination) return index + 1;

    const { page, limit } = this.pagination;
    return ((page - 1) * limit) + index + 1;
  }

  /**
   * Get type name by ID (placeholder implementation)
   * @private
   */
  _getTypeName(typeId) {
    // This should be enhanced to fetch actual type names
    const typeMap = {
      1: 'Sembako',
      2: 'Tunjangan',
      3: 'Bonus'
    };
    return typeMap[typeId] || `Type ${typeId}`;
  }

  /**
   * Format period string
   * @private
   */
  _formatPeriode(periode) {
    if (!periode) return 'N/A';
    const [year, month] = periode.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }

  /**
   * Build filter parameters
   * @private
   */
  _buildFilterParams() {
    const params = {};

    if (this.filters.search) {
      params.search = this.filters.search;
    }

    if (this.filters.typeId) {
      params.incentive_type_id = this.filters.typeId;
    }

    if (this.filters.period) {
      params.periode = this.filters.period;
    }

    if (this.filters.status !== '') {
      params.is_active = this.filters.status;
    }

    return params;
  }

  /**
   * Handle create config button click
   */
  async handleCreateConfig() {
    try {
      console.log('➕ IncentiveConfigPage: Opening create config modal');

      // Reset form
      this._resetConfigForm();

      // Show modal
      await this.modalService.show('configModal', {
        title: 'Tambah Konfigurasi'
      });

    } catch (error) {
      console.error('❌ IncentiveConfigPage: Error opening create modal:', error);
      this.showError('Gagal membuka form: ' + error.message);
    }
  }

  /**
   * Handle edit button click
   * @param {HTMLElement} button - Edit button element
   */
  async handleEditConfig(button) {
    try {
      const configData = JSON.parse(button.dataset.config || '{}');

      console.log('✏️ IncentiveConfigPage: Editing config:', configData);

      // Populate form
      this._populateConfigForm(configData);

      // Show modal
      await this.modalService.show('configModal', {
        title: 'Edit Konfigurasi'
      });

    } catch (error) {
      console.error('❌ IncentiveConfigPage: Error opening edit modal:', error);
      this.showError('Gagal membuka form edit: ' + error.message);
    }
  }

  /**
   * Handle delete button click
   * @param {HTMLElement} button - Delete button element
   */
  async handleDeleteConfig(button) {
    try {
      const configId = parseInt(button.dataset.configId);
      const configName = button.dataset.configName;

      console.log('🗑️ IncentiveConfigPage: Requesting delete for:', configId, configName);

      // Show confirmation
      const confirmed = await this.modalService.confirm(
        'Konfirmasi Hapus',
        `Apakah Anda yakin ingin menghapus konfigurasi "${configName}"?`,
        {
          confirmButtonText: 'Hapus',
          confirmClass: 'btn-danger',
          cancelButtonText: 'Batal'
        }
      );

      if (confirmed) {
        await this.incentiveService.deleteConfig(configId);
      }

    } catch (error) {
      console.error('❌ IncentiveConfigPage: Error deleting config:', error);
      this.showError('Gagal menghapus data: ' + error.message);
    }
  }

  /**
   * Handle form submission
   * @param {Event} event - Submit event
   */
  async _handleConfigFormSubmit(event) {
    event.preventDefault();

    try {
      const formData = this._getConfigFormData();
      const isEdit = formData.pk !== undefined;

      console.log('💾 IncentiveConfigPage: Saving config:', formData);

      if (isEdit) {
        await this.incentiveService.updateConfig(formData.pk, formData);
      } else {
        await this.incentiveService.createConfig(formData);
      }

      // Modal will be closed by event handlers

    } catch (error) {
      console.error('❌ IncentiveConfigPage: Error saving config:', error);
      this.showError('Gagal menyimpan data: ' + error.message);
    }
  }

  /**
   * Get config form data
   * @private
   */
  _getConfigFormData() {
    const form = document.getElementById('configForm');
    const pk = form.dataset.editId;

    return {
      ...(pk && { pk: parseInt(pk) }),
      incentive_type_id: parseInt(document.getElementById('configTypeId').value),
      periode: document.getElementById('configPeriod').value,
      default_value: document.getElementById('configDefaultValue').value.trim(),
      descriptions: document.getElementById('configDescription').value.trim(),
      is_active: document.getElementById('configActive').checked
    };
  }

  /**
   * Reset config form
   * @private
   */
  _resetConfigForm() {
    const form = document.getElementById('configForm');
    if (!form) return;

    form.reset();
    form.dataset.editId = '';
    document.getElementById('configActive').checked = true;

    // Update modal title and button
    const modalTitle = document.querySelector('#configModal .modal-title span');
    const submitBtn = form.querySelector('button[type="submit"]');

    if (modalTitle) modalTitle.textContent = 'Tambah Konfigurasi';
    if (submitBtn) submitBtn.innerHTML = '<i class="bi bi-save me-1"></i>Simpan';
  }

  /**
   * Populate config form with data
   * @private
   */
  _populateConfigForm(configData) {
    const form = document.getElementById('configForm');
    if (!form) return;

    form.dataset.editId = configData.pk;
    document.getElementById('configTypeId').value = configData.incentive_type_id || '';
    document.getElementById('configPeriod').value = configData.periode || '';
    document.getElementById('configDefaultValue').value = configData.default_value || '';
    document.getElementById('configDescription').value = configData.descriptions || '';
    document.getElementById('configActive').checked = configData.is_active || false;

    // Update modal title and button
    const modalTitle = document.querySelector('#configModal .modal-title span');
    const submitBtn = form.querySelector('button[type="submit"]');

    if (modalTitle) modalTitle.textContent = 'Edit Konfigurasi';
    if (submitBtn) submitBtn.innerHTML = '<i class="bi bi-save me-1"></i>Update';
  }

  /**
   * Bind form events
   * @private
   */
  _bindFormEvents() {
    const configForm = document.getElementById('configForm');
    if (configForm) {
      configForm.addEventListener('submit', this._handleConfigFormSubmit.bind(this));
    }
  }

  /**
   * Bind filter events
   * @private
   */
  _bindFilterEvents() {
    // Search input
    const searchInput = document.querySelector('input[placeholder*="Cari periode"]');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filters.search = e.target.value;
        this._debouncedLoadConfigs();
      });
    }

    // Filter selects
    const filterSelects = document.querySelectorAll('select');
    filterSelects.forEach(select => {
      select.addEventListener('change', (e) => {
        const filterMap = {
          'configTypeId': 'typeId',
          'configPeriod': 'period',
          'configStatus': 'status'
        };

        const filterKey = filterMap[select.id];
        if (filterKey) {
          this.filters[filterKey] = e.target.value;
          this._debouncedLoadConfigs();
        }
      });
    });
  }

  /**
   * Bind button events
   * @private
   */
  _bindButtonEvents() {
    // Create config button
    const createBtn = document.getElementById('createConfigBtn');
    if (createBtn) {
      createBtn.addEventListener('click', this.handleCreateConfig.bind(this));
    }
  }

  /**
   * Debounced config loading
   * @private
   */
  _debouncedLoadConfigs() {
    clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => {
      this._resetPaginationAndLoad();
    }, 300);
  }

  /**
   * Reset pagination and load data
   * @private
   */
  _resetPaginationAndLoad() {
    if (this.paginationComponent) {
      this.paginationComponent.goToPage(1);
    } else {
      this._loadConfigs();
    }
  }

  /**
   * Handle page change
   * @private
   */
  async _handlePageChange(page) {
    console.log('📄 IncentiveConfigPage: Changing to page', page);
    await this._loadConfigs();
  }

  /**
   * Handle limit change
   * @private
   */
  async _handleLimitChange(limit) {
    console.log('📄 IncentiveConfigPage: Changing limit to', limit);
    this._resetPaginationAndLoad();
  }

  /**
   * Show loading states
   * @private
   */
  _showLoadingStates() {
    const tbody = document.querySelector('#config-tab tbody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4">
            <div class="spinner-border text-primary mb-2" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="text-muted">Memuat data konfigurasi...</p>
          </td>
        </tr>
      `;
    }
  }

  /**
   * Hide loading states
   * @private
   */
  _hideLoadingStates() {
    // Loading states will be replaced by actual data
  }

  /**
   * Handle data loading event
   * @private
   */
  _handleDataLoading(data) {
    console.log('⏳ Loading data:', data);
    this._showLoadingStates();
  }

  /**
   * Handle data loaded event
   * @private
   */
  _handleDataLoaded(data) {
    console.log('✅ Data loaded:', data);
    // Data is already handled in specific methods
  }

  /**
   * Handle data error event
   * @private
   */
  _handleDataError(data) {
    console.error('❌ Data error:', data);
    this.showError(`Gagal memuat data: ${data.error}`);
  }

  /**
   * Handle config created event
   * @private
   */
  _handleConfigCreated(data) {
    console.log('✅ Config created:', data);
    this.showSuccess('Konfigurasi berhasil ditambahkan');

    // Close modal
    this.modalService.hide('configModal');

    // Reload data
    this._loadConfigs();
  }

  /**
   * Handle config updated event
   * @private
   */
  _handleConfigUpdated(data) {
    console.log('✅ Config updated:', data);
    this.showSuccess('Konfigurasi berhasil diperbarui');

    // Close modal
    this.modalService.hide('configModal');

    // Reload data
    this._loadConfigs();
  }

  /**
   * Handle config deleted event
   * @private
   */
  _handleConfigDeleted(data) {
    console.log('✅ Config deleted:', data);
    this.showSuccess('Konfigurasi berhasil dihapus');

    // Reload data
    this._loadConfigs();
  }

  /**
   * Show success notification
   * @param {string} message - Success message
   */
  showSuccess(message) {
    this._showNotification(message, 'success');
  }

  /**
   * Show error notification
   * @param {string} message - Error message
   */
  showError(message) {
    this._showNotification(message, 'danger');
  }

  /**
   * Show notification
   * @private
   */
  _showNotification(message, type) {
    const toastHtml = `
      <div class="toast align-items-center text-white bg-${type} border-0" role="alert">
        <div class="d-flex">
          <div class="toast-body">
            <i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i>${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>
    `;

    // Create toast container if not exists
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toastContainer';
      toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
      toastContainer.style.zIndex = '9999';
      document.body.appendChild(toastContainer);
    }

    // Create and show toast
    const toastElement = document.createElement('div');
    toastElement.innerHTML = toastHtml;
    toastContainer.appendChild(toastElement);

    const toast = new bootstrap.Toast(toastElement.querySelector('.toast'));
    toast.show();

    // Remove toast element after hidden
    toastElement.querySelector('.toast').addEventListener('hidden.bs.toast', () => {
      toastElement.remove();
    });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IncentiveConfigPage;
} else {
  window.IncentiveConfigPage = IncentiveConfigPage;
}