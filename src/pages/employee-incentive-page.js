/**
 * Employee Incentive Page Controller
 * Manages CRUD operations for employee incentives with pagination and search
 */

class EmployeeIncentivePage {
  constructor() {
    this.services = {};
    this.currentData = [];
    this.pagination = null;
    this.paginationComponent = null;
    this.filters = {
      search: '',
      email: '',
      typeId: '',
      period: '',
      status: ''
    };
    this.isLoading = false;
    this.employeeSuggestions = [];
    this.selectedEmployee = null;

    console.log('🔧 EmployeeIncentivePage: Initialized');
  }

  /**
   * Initialize the page
   */
  async initialize() {
    try {
      console.log('🚀 EmployeeIncentivePage: Starting initialization...');

      // Initialize services
      await this._initializeServices();

      // Bind event listeners
      this._bindEventListeners();

      // Setup pagination
      this._setupPagination();

      // Load initial data
      await this._loadInitialData();

      console.log('✅ EmployeeIncentivePage: Initialization complete');

    } catch (error) {
      console.error('❌ EmployeeIncentivePage: Initialization failed:', error);
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

      console.log('🔧 EmployeeIncentivePage: Services initialized successfully');

    } catch (error) {
      console.error('❌ EmployeeIncentivePage: Service initialization failed:', error);
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

    this.eventBus.on(EventTypes.INCENTIVE_EMPLOYEE_CREATED, this._handleEmployeeCreated.bind(this));
    this.eventBus.on(EventTypes.INCENTIVE_EMPLOYEE_UPDATED, this._handleEmployeeUpdated.bind(this));
    this.eventBus.on(EventTypes.INCENTIVE_EMPLOYEE_DELETED, this._handleEmployeeDeleted.bind(this));

    // Bind form events
    this._bindFormEvents();

    // Bind filter events
    this._bindFilterEvents();

    // Bind button events
    this._bindButtonEvents();

    console.log('🔧 EmployeeIncentivePage: Event listeners bound');
  }

  /**
   * Setup pagination component
   * @private
   */
  _setupPagination() {
    const paginationContainer = document.getElementById('employeePagination');
    if (paginationContainer) {
      this.paginationComponent = new PaginationComponent(paginationContainer, {
        limit: 10,
        onPageChange: (page) => this._handlePageChange(page),
        onLimitChange: (limit) => this._handleLimitChange(limit),
        showLimitSelector: true,
        showInfo: true
      });

      console.log('🔧 EmployeeIncentivePage: Pagination component initialized');
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

      // Load employee incentives with pagination
      await this._loadEmployeeIncentives();

      console.log('✅ EmployeeIncentivePage: Initial data loaded');

    } catch (error) {
      console.error('❌ EmployeeIncentivePage: Failed to load initial data:', error);
      this.showError('Gagal memuat data: ' + error.message);
    } finally {
      this.isLoading = false;
      this._hideLoadingStates();
    }
  }

  /**
   * Load employee incentives with pagination
   * @private
   */
  async _loadEmployeeIncentives() {
    const params = {
      limit: this.paginationComponent?.getState().currentLimit || 10,
      page: this.paginationComponent?.getState().currentPage || 1,
      ...this._buildFilterParams()
    };

    console.log('📋 EmployeeIncentivePage: Loading employee incentives with params:', params);

    const response = await this.incentiveService.getEmployeeIncentives(params);

    // Store current data
    this.currentData = response.data || [];
    this.pagination = response.pagination || {};

    // Update UI
    this._updateEmployeeTable();
    this._updatePagination();

    console.log('✅ EmployeeIncentivePage: Employee incentives loaded', {
      dataCount: this.currentData.length,
      pagination: this.pagination
    });
  }

  /**
   * Search employees by email or name
   * @private
   */
  async _searchEmployees(query) {
    if (!query || query.length < 2) {
      this.employeeSuggestions = [];
      this._updateEmployeeSuggestions();
      return;
    }

    try {
      console.log('🔍 EmployeeIncentivePage: Searching employees:', query);

      // Use a generic employee search endpoint if available
      // For now, we'll create a mock search based on existing data
      const mockEmployees = [
        { email: 'budi.santoso@perusahaan.com', employee_id: 3123, fullname: 'Budi Santoso' },
        { email: 'siti.nurhaliza@perusahaan.com', employee_id: 4567, fullname: 'Siti Nurhaliza' },
        { email: 'ahmad.fauzi@perusahaan.com', employee_id: 8901, fullname: 'Ahmad Fauzi' },
        { email: 'dewi.pertiwi@perusahaan.com', employee_id: 2345, fullname: 'Dewi Pertiwi' }
      ];

      this.employeeSuggestions = mockEmployees.filter(emp =>
        emp.email.toLowerCase().includes(query.toLowerCase()) ||
        emp.fullname.toLowerCase().includes(query.toLowerCase())
      );

      this._updateEmployeeSuggestions();

    } catch (error) {
      console.error('❌ EmployeeIncentivePage: Error searching employees:', error);
      this.employeeSuggestions = [];
      this._updateEmployeeSuggestions();
    }
  }

  /**
   * Update employee suggestions dropdown
   * @private
   */
  _updateEmployeeSuggestions() {
    const suggestionsContainer = document.getElementById('employeeSuggestions');
    if (!suggestionsContainer) return;

    if (this.employeeSuggestions.length === 0) {
      suggestionsContainer.style.display = 'none';
      return;
    }

    suggestionsContainer.style.display = 'block';
    suggestionsContainer.innerHTML = `
      <ul class="list-unstyled mb-0">
        ${this.employeeSuggestions.map(emp => `
          <li class="suggestion-item p-2 border-bottom cursor-pointer hover-bg-light"
              onclick="window.employeeIncentivePage.selectEmployee(${JSON.stringify(emp).replace(/"/g, '&quot;')})">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <div class="fw-semibold">${emp.fullname}</div>
                <small class="text-muted">${emp.email}</small>
              </div>
              <small class="text-muted">ID: ${emp.employee_id}</small>
            </div>
          </li>
        `).join('')}
      </ul>
    `;
  }

  /**
   * Select an employee from suggestions
   * @param {Object} employee - Employee data
   */
  selectEmployee(employee) {
    console.log('👤 EmployeeIncentivePage: Selected employee:', employee);

    this.selectedEmployee = employee;

    // Update form fields
    const employeeIdField = document.getElementById('employeeId');
    const employeeEmailField = document.getElementById('employeeEmail');
    const employeeNameField = document.getElementById('employeeName');

    if (employeeIdField) employeeIdField.value = employee.employee_id;
    if (employeeEmailField) employeeEmailField.value = employee.email;
    if (employeeNameField) employeeNameField.value = employee.fullname;

    // Clear suggestions
    this.employeeSuggestions = [];
    this._updateEmployeeSuggestions();

    // Hide search input if it exists
    const searchInput = document.getElementById('employeeSearchInput');
    if (searchInput) {
      searchInput.style.display = 'none';
    }

    // Show selected employee display
    const selectedDisplay = document.getElementById('selectedEmployeeDisplay');
    if (selectedDisplay) {
      selectedDisplay.style.display = 'block';
      selectedDisplay.innerHTML = `
        <div class="d-flex justify-content-between align-items-center p-2 bg-light rounded">
          <div>
            <div class="fw-semibold">${employee.fullname}</div>
            <small class="text-muted">${employee.email}</small>
            <small class="text-muted">ID: ${employee.employee_id}</small>
          </div>
          <button type="button" class="btn btn-outline-secondary btn-sm"
                  onclick="window.employeeIncentivePage.clearSelectedEmployee()">
            <i class="bi bi-x"></i>
          </button>
        </div>
      `;
    }
  }

  /**
   * Clear selected employee
   */
  clearSelectedEmployee() {
    console.log('🔄 EmployeeIncentivePage: Clearing selected employee');

    this.selectedEmployee = null;

    // Clear form fields
    const employeeIdField = document.getElementById('employeeId');
    const employeeEmailField = document.getElementById('employeeEmail');
    const employeeNameField = document.getElementById('employeeName');

    if (employeeIdField) employeeIdField.value = '';
    if (employeeEmailField) employeeEmailField.value = '';
    if (employeeNameField) employeeNameField.value = '';

    // Clear selected display
    const selectedDisplay = document.getElementById('selectedEmployeeDisplay');
    if (selectedDisplay) {
      selectedDisplay.style.display = 'none';
    }

    // Show search input
    const searchInput = document.getElementById('employeeSearchInput');
    if (searchInput) {
      searchInput.style.display = 'block';
      searchInput.value = '';
      searchInput.focus();
    }

    this.employeeSuggestions = [];
    this._updateEmployeeSuggestions();
  }

  /**
   * Update employee table
   * @private
   */
  _updateEmployeeTable() {
    const tbody = document.querySelector('#employee-tab tbody');
    if (!tbody) {
      console.warn('❌ Employee table tbody not found in DOM');
      return;
    }

    if (!this.currentData || this.currentData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-muted py-4">
            <i class="bi bi-people fs-1 d-block mb-2"></i>
            <p>Belum ada data karyawan</p>
            <button class="btn btn-primary btn-sm" onclick="window.employeeIncentivePage.handleCreateEmployee()">
              <i class="bi bi-person-plus-lg me-1"></i>Berikan Incentive
            </button>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.currentData.map((employee, index) => `
      <tr>
        <td>${this._calculateRowNumber(index)}</td>
        <td>
          <strong>${employee.fullname || 'Tidak diketahui'}</strong>
          ${employee.employee_id ? `<br><small class="text-muted">ID: ${employee.employee_id}</small>` : ''}
        </td>
        <td>
          <span>${employee.email || 'N/A'}</span>
        </td>
        <td>
          <span class="badge bg-primary">${employee.incentive_type_id ? this._getTypeName(employee.incentive_type_id) : 'Unknown'}</span>
        </td>
        <td>
          <span class="badge bg-info">${this._formatPeriode(employee.periode) || 'N/A'}</span>
        </td>
        <td>
          <small>${employee.notes || 'Tidak ada catatan'}</small>
        </td>
        <td class="text-center">
          <span class="badge ${employee.is_active ? 'bg-success' : 'bg-danger'}">
            ${employee.is_active ? 'Aktif' : 'Non Aktif'}
          </span>
        </td>
        <td class="text-center">
          <div class="btn-group">
            <button class="btn btn-outline-primary btn-sm edit-btn"
                    data-employee-id="${employee.pk}"
                    data-employee='${JSON.stringify(employee).replace(/'/g, '&apos;')}'
                    onclick="window.employeeIncentivePage.handleEditEmployee(this)">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-outline-danger btn-sm delete-btn"
                    data-employee-id="${employee.pk}"
                    data-employee-name="${employee.fullname || 'Karyawan'}"
                    onclick="window.employeeIncentivePage.handleDeleteEmployee(this)">
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
   * Get type name by ID
   * @private
   */
  _getTypeName(typeId) {
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

    if (this.filters.email) {
      params.email = this.filters.email;
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
   * Handle create employee button click
   */
  async handleCreateEmployee() {
    try {
      console.log('➕ EmployeeIncentivePage: Opening create employee modal');

      // Reset form
      this._resetEmployeeForm();

      // Show modal
      await this.modalService.show('employeeModal', {
        title: 'Berikan Incentive Karyawan'
      });

    } catch (error) {
      console.error('❌ EmployeeIncentivePage: Error opening create modal:', error);
      this.showError('Gagal membuka form: ' + error.message);
    }
  }

  /**
   * Handle edit button click
   * @param {HTMLElement} button - Edit button element
   */
  async handleEditEmployee(button) {
    try {
      const employeeData = JSON.parse(button.dataset.employee || '{}');

      console.log('✏️ EmployeeIncentivePage: Editing employee incentive:', employeeData);

      // Populate form
      this._populateEmployeeForm(employeeData);

      // Show modal
      await this.modalService.show('employeeModal', {
        title: 'Edit Incentive Karyawan'
      });

    } catch (error) {
      console.error('❌ EmployeeIncentivePage: Error opening edit modal:', error);
      this.showError('Gagal membuka form edit: ' + error.message);
    }
  }

  /**
   * Handle delete button click
   * @param {HTMLElement} button - Delete button element
   */
  async handleDeleteEmployee(button) {
    try {
      const employeeId = parseInt(button.dataset.employeeId);
      const employeeName = button.dataset.employeeName;

      console.log('🗑️ EmployeeIncentivePage: Requesting delete for:', employeeId, employeeName);

      // Show confirmation
      const confirmed = await this.modalService.confirm(
        'Konfirmasi Hapus',
        `Apakah Anda yakin ingin menghapus incentive untuk "${employeeName}"?`,
        {
          confirmButtonText: 'Hapus',
          confirmClass: 'btn-danger',
          cancelButtonText: 'Batal'
        }
      );

      if (confirmed) {
        await this.incentiveService.deleteEmployeeIncentive(employeeId);
      }

    } catch (error) {
      console.error('❌ EmployeeIncentivePage: Error deleting employee:', error);
      this.showError('Gagal menghapus data: ' + error.message);
    }
  }

  /**
   * Handle form submission
   * @param {Event} event - Submit event
   */
  async _handleEmployeeFormSubmit(event) {
    event.preventDefault();

    try {
      const formData = this._getEmployeeFormData();
      const isEdit = formData.pk !== undefined;

      console.log('💾 EmployeeIncentivePage: Saving employee incentive:', formData);

      if (isEdit) {
        await this.incentiveService.updateEmployeeIncentive(formData.pk, formData);
      } else {
        await this.incentiveService.assignIncentiveToEmployee(formData);
      }

      // Modal will be closed by event handlers

    } catch (error) {
      console.error('❌ EmployeeIncentivePage: Error saving employee incentive:', error);
      this.showError('Gagal menyimpan data: ' + error.message);
    }
  }

  /**
   * Get employee form data
   * @private
   */
  _getEmployeeFormData() {
    const form = document.getElementById('employeeForm');
    const pk = form.dataset.editId;

    return {
      ...(pk && { pk: parseInt(pk) }),
      employee_id: parseInt(document.getElementById('employeeId').value),
      email: document.getElementById('employeeEmail').value.trim(),
      fullname: document.getElementById('employeeName').value.trim(),
      incentive_type_id: parseInt(document.getElementById('employeeTypeId').value),
      periode: document.getElementById('employeePeriod').value,
      notes: document.getElementById('employeeNotes').value.trim(),
      descriptions: document.getElementById('employeeDescription').value.trim(),
      is_active: document.getElementById('employeeActive').checked
    };
  }

  /**
   * Reset employee form
   * @private
   */
  _resetEmployeeForm() {
    const form = document.getElementById('employeeForm');
    if (!form) return;

    form.reset();
    form.dataset.editId = '';
    document.getElementById('employeeActive').checked = true;

    // Clear selected employee
    this.clearSelectedEmployee();

    // Update modal title and button
    const modalTitle = document.querySelector('#employeeModal .modal-title span');
    const submitBtn = form.querySelector('button[type="submit"]');

    if (modalTitle) modalTitle.textContent = 'Berikan Incentive Karyawan';
    if (submitBtn) submitBtn.innerHTML = '<i class="bi bi-save me-1"></i>Berikan';
  }

  /**
   * Populate employee form with data
   * @private
   */
  _populateEmployeeForm(employeeData) {
    const form = document.getElementById('employeeForm');
    if (!form) return;

    form.dataset.editId = employeeData.pk;
    document.getElementById('employeeId').value = employeeData.employee_id || '';
    document.getElementById('employeeEmail').value = employeeData.email || '';
    document.getElementById('employeeName').value = employeeData.fullname || '';
    document.getElementById('employeeTypeId').value = employeeData.incentive_type_id || '';
    document.getElementById('employeePeriod').value = employeeData.periode || '';
    document.getElementById('employeeNotes').value = employeeData.notes || '';
    document.getElementById('employeeDescription').value = employeeData.descriptions || '';
    document.getElementById('employeeActive').checked = employeeData.is_active || false;

    // Update modal title and button
    const modalTitle = document.querySelector('#employeeModal .modal-title span');
    const submitBtn = form.querySelector('button[type="submit"]');

    if (modalTitle) modalTitle.textContent = 'Edit Incentive Karyawan';
    if (submitBtn) submitBtn.innerHTML = '<i class="bi bi-save me-1"></i>Update';

    // Pre-select employee if data exists
    if (employeeData.email) {
      this.selectEmployee({
        email: employeeData.email,
        employee_id: employeeData.employee_id,
        fullname: employeeData.fullname
      });
    }
  }

  /**
   * Bind form events
   * @private
   */
  _bindFormEvents() {
    const employeeForm = document.getElementById('employeeForm');
    if (employeeForm) {
      employeeForm.addEventListener('submit', this._handleEmployeeFormSubmit.bind(this));
    }

    // Employee search input
    const searchInput = document.getElementById('employeeSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        this._searchEmployees(query);
      });
    }

    // Click outside to hide suggestions
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.suggestion-container') &&
          !e.target.closest('#employeeSearchInput')) {
        this.employeeSuggestions = [];
        this._updateEmployeeSuggestions();
      }
    });
  }

  /**
   * Bind filter events
   * @private
   */
  _bindFilterEvents() {
    // Search input
    const searchInput = document.querySelector('input[placeholder*="Cari nama atau email karyawan"]');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filters.search = e.target.value;
        this._debouncedLoadEmployeeIncentives();
      });
    }

    // Filter selects
    const filterSelects = document.querySelectorAll('select');
    filterSelects.forEach(select => {
      select.addEventListener('change', (e) => {
        const filterMap = {
          'employeeTypeId': 'typeId',
          'employeePeriod': 'period',
          'employeeStatus': 'status'
        };

        const filterKey = filterMap[select.id];
        if (filterKey) {
          this.filters[filterKey] = e.target.value;
          this._debouncedLoadEmployeeIncentives();
        }
      });
    });
  }

  /**
   * Bind button events
   * @private
   */
  _bindButtonEvents() {
    // Create employee button
    const createBtn = document.getElementById('createEmployeeBtn');
    if (createBtn) {
      createBtn.addEventListener('click', this.handleCreateEmployee.bind(this));
    }
  }

  /**
   * Debounced employee incentives loading
   * @private
   */
  _debouncedLoadEmployeeIncentives() {
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
      this._loadEmployeeIncentives();
    }
  }

  /**
   * Handle page change
   * @private
   */
  async _handlePageChange(page) {
    console.log('📄 EmployeeIncentivePage: Changing to page', page);
    await this._loadEmployeeIncentives();
  }

  /**
   * Handle limit change
   * @private
   */
  async _handleLimitChange(limit) {
    console.log('📄 EmployeeIncentivePage: Changing limit to', limit);
    this._resetPaginationAndLoad();
  }

  /**
   * Show loading states
   * @private
   */
  _showLoadingStates() {
    const tbody = document.querySelector('#employee-tab tbody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-4">
            <div class="spinner-border text-primary mb-2" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="text-muted">Memuat data karyawan...</p>
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
   * Handle employee created event
   * @private
   */
  _handleEmployeeCreated(data) {
    console.log('✅ Employee created:', data);
    this.showSuccess('Incentive berhasil diberikan kepada karyawan');

    // Close modal
    this.modalService.hide('employeeModal');

    // Reload data
    this._loadEmployeeIncentives();
  }

  /**
   * Handle employee updated event
   * @private
   */
  _handleEmployeeUpdated(data) {
    console.log('✅ Employee updated:', data);
    this.showSuccess('Incentive karyawan berhasil diperbarui');

    // Close modal
    this.modalService.hide('employeeModal');

    // Reload data
    this._loadEmployeeIncentives();
  }

  /**
   * Handle employee deleted event
   * @private
   */
  _handleEmployeeDeleted(data) {
    console.log('✅ Employee deleted:', data);
    this.showSuccess('Incentive karyawan berhasil dihapus');

    // Reload data
    this._loadEmployeeIncentives();
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
  module.exports = EmployeeIncentivePage;
} else {
  window.EmployeeIncentivePage = EmployeeIncentivePage;
}