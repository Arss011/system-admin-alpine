/**
 * Sembako Page Controller
 * Integrates UI with service layer for sembako management
 * Follows MVC pattern with proper separation of concerns
 */

class SembakoPage {
  constructor() {
    this.services = {};
    this.currentData = {
      types: [],
      configs: [],
      employees: []
    };
    this.isLoading = false;

    console.log('🔧 SembakoPage: Initialized');
  }

  /**
   * Initialize the page
   */
  async initialize() {
    try {
      console.log('🚀 SembakoPage: Starting initialization...');

      // Initialize services
      await this._initializeServices();

      // Bind event listeners
      this._bindEventListeners();

      // Load initial data
      await this._loadInitialData();

      console.log('✅ SembakoPage: Initialization complete');

    } catch (error) {
      console.error('❌ SembakoPage: Initialization failed:', error);
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
        null // configService - not needed for basic operations
      );

      console.log('🔧 SembakoPage: Services initialized successfully');

    } catch (error) {
      console.error('❌ SembakoPage: Service initialization failed:', error);
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

    this.eventBus.on(EventTypes.INCENTIVE_TYPE_CREATED, this._handleTypeCreated.bind(this));
    this.eventBus.on(EventTypes.INCENTIVE_TYPE_UPDATED, this._handleTypeUpdated.bind(this));
    this.eventBus.on(EventTypes.INCENTIVE_TYPE_DELETED, this._handleTypeDeleted.bind(this));

    // Bind form submissions
    this._bindFormEvents();

    // Bind button clicks
    this._bindButtonEvents();

    console.log('🔧 SembakoPage: Event listeners bound');
  }

  /**
   * Bind form events
   * @private
   */
  _bindFormEvents() {
    const typeForm = document.getElementById('typeForm');
    if (typeForm) {
      typeForm.addEventListener('submit', this._handleTypeFormSubmit.bind(this));
    }

    // Search/filter inputs
    const searchInputs = document.querySelectorAll('input[placeholder*="Cari"]');
    searchInputs.forEach(input => {
      input.addEventListener('input', this._handleSearch.bind(this));
    });

    const filterSelects = document.querySelectorAll('select');
    filterSelects.forEach(select => {
      select.addEventListener('change', this._handleFilter.bind(this));
    });
  }

  /**
   * Bind button events
   * @private
   */
  _bindButtonEvents() {
    // Create type button
    const createBtn = document.getElementById('createTypeBtn');
    if (createBtn) {
      createBtn.addEventListener('click', this.handleCreateType.bind(this));
    }

    // Test button - keep for debugging
    const testBtn = document.getElementById('testModalBtn');
    if (testBtn) {
      testBtn.addEventListener('click', this.testModal.bind(this));
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

      // Load all data in parallel
      const [types, configs, employees] = await Promise.all([
        this.incentiveService.getTypes(),
        this.incentiveService.getConfigs(),
        this.incentiveService.getEmployeeIncentives()
      ]);

      // Store current data
      this.currentData = {
        types,
        configs: configs.data || configs,
        employees: employees.data || employees
      };

      // Update UI
      this._updateUI();

      console.log('✅ SembakoPage: Initial data loaded');

    } catch (error) {
      console.error('❌ SembakoPage: Failed to load initial data:', error);
      this.showError('Gagal memuat data: ' + error.message);
    } finally {
      this.isLoading = false;
      this._hideLoadingStates();
    }
  }

  /**
   * Handle create type button click
   */
  async handleCreateType() {
    try {
      console.log('➕ SembakoPage: Opening create type modal');

      // Reset form
      this._resetTypeForm();

      // Show modal
      await this.modalService.show('typeModal', {
        title: 'Tambah Jenis Sembako'
      });

    } catch (error) {
      console.error('❌ SembakoPage: Error opening create modal:', error);
      this.showError('Gagal membuka form: ' + error.message);
    }
  }

  /**
   * Handle edit button click
   * @param {HTMLElement} button - Edit button element
   */
  async handleEditType(button) {
    try {
      const typeId = parseInt(button.dataset.typeId);
      const typeData = this.currentData.types.find(t => t.pk === typeId);

      if (!typeData) {
        throw new Error('Data tidak ditemukan');
      }

      console.log('✏️ SembakoPage: Editing type:', typeData);

      // Populate form
      this._populateTypeForm(typeData);

      // Show modal
      await this.modalService.show('typeModal', {
        title: 'Edit Jenis Sembako'
      });

    } catch (error) {
      console.error('❌ SembakoPage: Error opening edit modal:', error);
      this.showError('Gagal membuka form edit: ' + error.message);
    }
  }

  /**
   * Handle delete button click
   * @param {HTMLElement} button - Delete button element
   */
  async handleDeleteType(button) {
    try {
      const typeId = parseInt(button.dataset.typeId);
      const typeName = button.dataset.typeName;

      console.log('🗑️ SembakoPage: Requesting delete for:', typeId, typeName);

      // Show confirmation
      const confirmed = await this.modalService.confirm(
        'Konfirmasi Hapus',
        `Apakah Anda yakin ingin menghapus "${typeName}"?`,
        {
          confirmButtonText: 'Hapus',
          confirmClass: 'btn-danger',
          cancelButtonText: 'Batal'
        }
      );

      if (confirmed) {
        await this.incentiveService.deleteType(typeId);
      }

    } catch (error) {
      console.error('❌ SembakoPage: Error deleting type:', error);
      this.showError('Gagal menghapus data: ' + error.message);
    }
  }

  /**
   * Handle type form submission
   * @param {Event} event - Submit event
   */
  async _handleTypeFormSubmit(event) {
    event.preventDefault();

    try {
      const formData = this._getTypeFormData();
      const isEdit = formData.pk !== undefined;

      console.log('💾 SembakoPage: Saving type:', formData);

      if (isEdit) {
        await this.incentiveService.updateType(formData.pk, formData);
      } else {
        await this.incentiveService.createType(formData);
      }

      // Modal will be closed by event handlers

    } catch (error) {
      console.error('❌ SembakoPage: Error saving type:', error);
      this.showError('Gagal menyimpan data: ' + error.message);
    }
  }

  /**
   * Get type form data
   * @private
   * @returns {Object} Form data
   */
  _getTypeFormData() {
    const form = document.getElementById('typeForm');
    const pk = form.dataset.editId;

    return {
      ...(pk && { pk: parseInt(pk) }),
      name: document.getElementById('typeName').value.trim(),
      code: document.getElementById('typeCode').value.trim(),
      descriptions: document.getElementById('typeDescription').value.trim(),
      is_active: document.getElementById('typeActive').checked
    };
  }

  /**
   * Reset type form
   * @private
   */
  _resetTypeForm() {
    const form = document.getElementById('typeForm');
    form.reset();
    form.dataset.editId = '';

    document.getElementById('typeActive').checked = true;

    // Update modal title and button
    const modalTitle = document.querySelector('#typeModal .modal-title span');
    const submitBtn = form.querySelector('button[type="submit"]');

    if (modalTitle) modalTitle.textContent = 'Tambah Jenis Sembako';
    if (submitBtn) submitBtn.innerHTML = '<i class="bi bi-save me-1"></i>Simpan';
  }

  /**
   * Populate type form with data
   * @private
   * @param {Object} typeData - Type data
   */
  _populateTypeForm(typeData) {
    const form = document.getElementById('typeForm');

    form.dataset.editId = typeData.pk;
    document.getElementById('typeName').value = typeData.name || '';
    document.getElementById('typeCode').value = typeData.code || '';
    document.getElementById('typeDescription').value = typeData.descriptions || '';
    document.getElementById('typeActive').checked = typeData.is_active || false;

    // Update modal title and button
    const modalTitle = document.querySelector('#typeModal .modal-title span');
    const submitBtn = form.querySelector('button[type="submit"]');

    if (modalTitle) modalTitle.textContent = 'Edit Jenis Sembako';
    if (submitBtn) submitBtn.innerHTML = '<i class="bi bi-save me-1"></i>Update';
  }

  /**
   * Update UI with current data
   * @private
   */
  _updateUI() {
    this._updateTypesTable();
    this._updateConfigTable();
    this._updateEmployeeTable();
    this._updateStatsCards();
  }

  /**
   * Update types table
   * @private
   */
  _updateTypesTable() {
    const tbody = document.querySelector('#types-tab tbody');
    if (!tbody) return;

    if (!this.currentData.types || this.currentData.types.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">Tidak ada data jenis sembako</td></tr>';
      return;
    }

    tbody.innerHTML = this.currentData.types.map((type, index) => `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${type.name || 'Unknown'}</strong></td>
        <td><small>${type.descriptions || 'Tidak ada deskripsi'}</small></td>
        <td class="text-center">
          <span class="badge ${type.is_active ? 'bg-success' : 'bg-danger'}">
            ${type.is_active ? 'Aktif' : 'Non Aktif'}
          </span>
        </td>
        <td class="text-center">
          <div class="btn-group">
            <button class="btn btn-outline-primary btn-sm edit-btn"
                    data-type-id="${type.pk}"
                    data-type-name="${type.name || 'Unknown'}"
                    data-type-code="${type.code || ''}"
                    data-type-desc="${type.descriptions || ''}"
                    data-type-active="${type.is_active || false}">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-outline-danger btn-sm delete-btn"
                    data-type-id="${type.pk}"
                    data-type-name="${type.name || 'Unknown'}">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    // Re-bind button events
    tbody.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => this.handleEditType(btn));
    });

    tbody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => this.handleDeleteType(btn));
    });
  }

  /**
   * Update config table
   * @private
   */
  _updateConfigTable() {
    const tbody = document.querySelector('#config-tab tbody');
    if (!tbody) return;

    if (!this.currentData.configs || this.currentData.configs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada data konfigurasi</td></tr>';
      return;
    }

    tbody.innerHTML = this.currentData.configs.map((config, index) => {
      const periodeFormatted = this._formatPeriode(config.periode);
      return `
      <tr>
        <td>${index + 1}</td>
        <td><span>${config.incentive_type_id ? this._getTypeName(config.incentive_type_id) : 'Unknown'}</span></td>
        <td><span class="badge bg-info">${periodeFormatted}</span></td>
        <td><strong>${config.default_value || 'N/A'}</strong></td>
        <td><small>${config.descriptions || 'Tidak ada deskripsi'}</small></td>
        <td class="text-center">
          <span class="badge ${config.is_active ? 'bg-success' : 'bg-danger'}">
            ${config.is_active ? 'Aktif' : 'Non Aktif'}
          </span>
        </td>
        <td class="text-center">
          <button class="btn btn-outline-primary btn-sm" onclick="editConfig(${JSON.stringify(config).replace(/"/g, '&quot;')})">
            <i class="bi bi-pencil"></i>
          </button>
        </td>
      </tr>
    `;
    }).join('');
  }

  /**
   * Update employee table
   * @private
   */
  _updateEmployeeTable() {
    const tbody = document.querySelector('#employee-tab tbody');
    if (!tbody) return;

    if (!this.currentData.employees || this.currentData.employees.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada data karyawan</td></tr>';
      return;
    }

    tbody.innerHTML = this.currentData.employees.map((employee, index) => `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${employee.employee_id ? `ID: ${employee.employee_id}` : 'Tidak diketahui'}</strong></td>
        <td><span>${employee.email || 'N/A'}</span></td>
        <td><span class="badge bg-primary">${employee.incentive_type_id ? 'Sembako' : 'Unknown'}</span></td>
        <td><small>${employee.notes || 'Tidak ada catatan'}</small></td>
        <td class="text-center">
          <span class="badge ${employee.is_active ? 'bg-success' : 'bg-danger'}">
            ${employee.is_active ? 'Aktif' : 'Non Aktif'}
          </span>
        </td>
        <td class="text-center">
          <button class="btn btn-outline-primary btn-sm" onclick="editEmployee(${JSON.stringify(employee).replace(/"/g, '&quot;')})">
            <i class="bi bi-pencil"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  /**
   * Update stats cards
   * @private
   */
  _updateStatsCards() {
    const totalTypes = this.currentData.types.length;
    const activeConfigs = this.currentData.configs.filter(c => c.is_active).length;
    const totalEmployees = this.currentData.employees.filter(e => e.is_active).length;

    // Calculate this month
    const currentMonth = new Date().toISOString().slice(0, 7);
    const thisMonth = this.currentData.employees.filter(e => {
      return e.created_at && e.created_at.startsWith(currentMonth);
    }).length;

    // Update stat cards
    const statCards = document.querySelectorAll('.card h3');
    if (statCards.length >= 4) {
      statCards[0].textContent = totalTypes;
      statCards[1].textContent = activeConfigs;
      statCards[2].textContent = totalEmployees;
      statCards[3].textContent = thisMonth;
    }
  }

  /**
   * Format periode string
   * @private
   * @param {string} periode - Period string (YYYY-MM)
   * @returns {string} Formatted period
   */
  _formatPeriode(periode) {
    if (!periode) return 'N/A';
    const [year, month] = periode.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }

  /**
   * Get type name by ID
   * @private
   * @param {number} typeId - Type ID
   * @returns {string} Type name
   */
  _getTypeName(typeId) {
    const type = this.currentData.types.find(t => t.pk === typeId);
    return type ? type.name : `Type ${typeId}`;
  }

  /**
   * Show loading states
   * @private
   */
  _showLoadingStates() {
    document.querySelectorAll('.card h3').forEach(el => {
      el.textContent = '...';
    });
  }

  /**
   * Hide loading states
   * @private
   */
  _hideLoadingStates() {
    // Loading states will be replaced by actual data
  }

  /**
   * Handle search
   * @private
   * @param {Event} event - Input event
   */
  _handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    // Implement search logic
    console.log('🔍 Search:', searchTerm);
  }

  /**
   * Handle filter
   * @private
   * @param {Event} event - Change event
   */
  _handleFilter(event) {
    const filterValue = event.target.value;
    // Implement filter logic
    console.log('🔍 Filter:', filterValue);
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

    // Update current data based on type
    switch (data.type) {
      case 'types':
        this.currentData.types = data.data;
        break;
      case 'configs':
        this.currentData.configs = data.data;
        break;
      case 'employees':
        this.currentData.employees = data.data;
        break;
    }

    this._updateUI();
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
   * Handle type created event
   * @private
   */
  _handleTypeCreated(data) {
    console.log('✅ Type created:', data);
    this.showSuccess('Jenis sembako berhasil ditambahkan');

    // Close modal
    this.modalService.hide('typeModal');

    // Reload data
    this._loadInitialData();
  }

  /**
   * Handle type updated event
   * @private
   */
  _handleTypeUpdated(data) {
    console.log('✅ Type updated:', data);
    this.showSuccess('Jenis sembako berhasil diperbarui');

    // Close modal
    this.modalService.hide('typeModal');

    // Reload data
    this._loadInitialData();
  }

  /**
   * Handle type deleted event
   * @private
   */
  _handleTypeDeleted(data) {
    console.log('✅ Type deleted:', data);
    this.showSuccess('Jenis sembako berhasil dihapus');

    // Reload data
    this._loadInitialData();
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
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, danger, warning, info)
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

    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toastContainer';
      toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
      toastContainer.style.zIndex = '9999';
      document.body.appendChild(toastContainer);
    }

    const toastElement = document.createElement('div');
    toastElement.innerHTML = toastHtml;
    toastContainer.appendChild(toastElement);

    const toast = new bootstrap.Toast(toastElement.querySelector('.toast'));
    toast.show();

    toastElement.querySelector('.toast').addEventListener('hidden.bs.toast', () => {
      toastElement.remove();
    });
  }

  /**
   * Test modal functionality
   */
  async testModal() {
    console.log('🧪 Testing modal functionality...');

    try {
      await this.modalService.show('typeModal', {
        title: 'Test Modal'
      });
      console.log('✅ Modal test successful');
    } catch (error) {
      console.error('❌ Modal test failed:', error);
      this.showError('Modal test failed: ' + error.message);
    }
  }

  // Global functions for backward compatibility
  editConfig(config) {
    console.log('Edit config:', config);
    this.showWarning('Fitur edit konfigurasi akan segera tersedia');
  }

  editEmployee(employee) {
    console.log('Edit employee:', employee);
    this.showWarning('Fitur edit karyawan akan segera tersedia');
  }

  showWarning(message) {
    this._showNotification(message, 'warning');
  }
}

// Make global functions available for inline event handlers
window.editConfig = function(config) {
  if (window.sembakoPage) {
    window.sembakoPage.editConfig(config);
  } else {
    console.log('Edit config:', config);
    alert('Fitur edit konfigurasi akan segera tersedia');
  }
};

window.editEmployee = function(employee) {
  if (window.sembakoPage) {
    window.sembakoPage.editEmployee(employee);
  } else {
    console.log('Edit employee:', employee);
    alert('Fitur edit karyawan akan segera tersedia');
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SembakoPage;
} else {
  window.SembakoPage = SembakoPage;
}