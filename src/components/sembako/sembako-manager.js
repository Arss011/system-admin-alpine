/**
 * Sembako Manager Component
 * Main coordinator for all sembako-related functionality
 * Extends BaseComponent and follows Single Responsibility Principle
 */

class SembakoManager extends BaseComponent {
  constructor(container, options = {}) {
    super(container, options);

    this.incentiveService = options.incentiveService || window.incentiveService;
    this.currentView = 'types';
    this.components = new Map();
    this.data = {
      types: [],
      configs: [],
      employees: []
    };

    console.log('🔧 SembakoManager: Initialized');
  }

  /**
   * Render component - Override from BaseComponent
   * @private
   */
  _render() {
    this.container.innerHTML = `
      <div class="sembako-manager" id="sembakoManager">
        <!-- Header Section -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 class="h4 mb-1">Incentive Management</h2>
            <p class="text-muted mb-0">Manage incentive types, configurations, and employee assignments</p>
          </div>
          <div class="btn-group" role="group">
            <button type="button" class="btn btn-outline-primary view-btn active" data-view="types">
              <i class="bi bi-tags me-2"></i>Types
            </button>
            <button type="button" class="btn btn-outline-primary view-btn" data-view="configs">
              <i class="bi bi-gear me-2"></i>Configs
            </button>
            <button type="button" class="btn btn-outline-primary view-btn" data-view="employees">
              <i class="bi bi-people me-2"></i>Employees
            </button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="d-flex gap-2 mb-4">
          <button type="button" class="btn btn-primary add-type-btn">
            <i class="bi bi-plus-circle me-2"></i>Add Type
          </button>
          <button type="button" class="btn btn-success add-config-btn">
            <i class="bi bi-plus-circle me-2"></i>Add Config
          </button>
          <button type="button" class="btn btn-info refresh-btn">
            <i class="bi bi-arrow-clockwise me-2"></i>Refresh
          </button>
        </div>

        <!-- Statistics Cards -->
        <div class="row mb-4" id="statsContainer">
          <div class="col-md-4">
            <div class="card border-primary">
              <div class="card-body">
                <div class="d-flex align-items-center">
                  <div class="flex-shrink-0">
                    <i class="bi bi-tags text-primary fs-3"></i>
                  </div>
                  <div class="flex-grow-1 ms-3">
                    <h5 class="card-title mb-1" id="totalTypes">0</h5>
                    <p class="card-text text-muted mb-0">Total Types</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card border-success">
              <div class="card-body">
                <div class="d-flex align-items-center">
                  <div class="flex-shrink-0">
                    <i class="bi bi-gear text-success fs-3"></i>
                  </div>
                  <div class="flex-grow-1 ms-3">
                    <h5 class="card-title mb-1" id="totalConfigs">0</h5>
                    <p class="card-text text-muted mb-0">Active Configs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card border-info">
              <div class="card-body">
                <div class="d-flex align-items-center">
                  <div class="flex-shrink-0">
                    <i class="bi bi-people text-info fs-3"></i>
                  </div>
                  <div class="flex-grow-1 ms-3">
                    <h5 class="card-title mb-1" id="totalEmployees">0</h5>
                    <p class="card-text text-muted mb-0">Employee Incentives</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Content Container -->
        <div id="contentContainer">
          <!-- Content will be rendered here based on current view -->
        </div>
      </div>
    `;
  }

  /**
   * Bind events - Override from BaseComponent
   * @private
   */
  _bindEvents() {
    // View switcher buttons
    this.querySelectorAll('.view-btn').forEach(btn => {
      this.addEventListener(btn, 'click', (e) => {
        e.preventDefault();
        this.switchView(e.target.dataset.view);
      });
    });

    // Action buttons
    this.addEventListener(this.find('.add-type-btn'), 'click', () => {
      this.showAddTypeModal();
    });

    this.addEventListener(this.find('.add-config-btn'), 'click', () => {
      this.showAddConfigModal();
    });

    this.addEventListener(this.find('.refresh-btn'), 'click', () => {
      this.refreshAllData();
    });

    // Subscribe to events
    this.setupEventListeners();
  }

  /**
   * Called when component is initialized - Override from BaseComponent
   * @private
   */
  _onInitialized() {
    console.log('✅ SembakoManager: Component initialized');

    // Load initial data
    this.loadInitialData();

    // Set initial view
    this.switchView('types');
  }

  /**
   * Setup event listeners for communication with other components
   * @private
   */
  setupEventListeners() {
    // Listen to incentive service events
    this.on(EventTypes.INCENTIVE_TYPE_CREATED, (data) => {
      console.log('📝 SembakoManager: Type created event received', data);
      this.refreshTypes();
      this.showNotification('success', 'Incentive type created successfully');
    });

    this.on(EventTypes.INCENTIVE_TYPE_UPDATED, (data) => {
      console.log('📝 SembakoManager: Type updated event received', data);
      this.refreshTypes();
      this.showNotification('success', 'Incentive type updated successfully');
    });

    this.on(EventTypes.INCENTIVE_TYPE_DELETED, (data) => {
      console.log('📝 SembakoManager: Type deleted event received', data);
      this.refreshTypes();
      this.showNotification('success', 'Incentive type deleted successfully');
    });

    this.on(EventTypes.INCENTIVE_CONFIG_CREATED, (data) => {
      console.log('📝 SembakoManager: Config created event received', data);
      this.refreshConfigs();
      this.showNotification('success', 'Incentive config created successfully');
    });

    this.on(EventTypes.INCENTIVE_CONFIG_UPDATED, (data) => {
      console.log('📝 SembakoManager: Config updated event received', data);
      this.refreshConfigs();
      this.showNotification('success', 'Incentive config updated successfully');
    });

    this.on(EventTypes.INCENTIVE_CONFIG_DELETED, (data) => {
      console.log('📝 SembakoManager: Config deleted event received', data);
      this.refreshConfigs();
      this.showNotification('success', 'Incentive config deleted successfully');
    });
  }

  /**
   * Load initial data from service
   * @private
   */
  async loadInitialData() {
    try {
      console.log('📋 SembakoManager: Loading initial data');

      const [types, configs, employees] = await Promise.all([
        this.incentiveService.getTypes(),
        this.incentiveService.getConfigs(),
        this.incentiveService.getEmployeeIncentives()
      ]);

      this.data.types = types || [];
      this.data.configs = configs || [];
      this.data.employees = employees?.data || employees || [];

      console.log('✅ SembakoManager: Initial data loaded', {
        types: this.data.types.length,
        configs: this.data.configs.length,
        employees: this.data.employees.length
      });

      // Update statistics
      this.updateStatistics();

      // Render current view
      this.renderCurrentView();

    } catch (error) {
      console.error('❌ SembakoManager: Error loading initial data', error);
      this.showNotification('error', 'Failed to load initial data: ' + error.message);
    }
  }

  /**
   * Switch between different views
   * @param {string} view - View name (types, configs, employees)
   */
  switchView(view) {
    console.log(`🔄 SembakoManager: Switching to ${view} view`);

    this.currentView = view;

    // Update button states
    this.querySelectorAll('.view-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    this.find(`.view-btn[data-view="${view}"]`).classList.add('active');

    // Render the view
    this.renderCurrentView();

    this.emit('viewChanged', { view });
  }

  /**
   * Render current view based on selected tab
   * @private
   */
  renderCurrentView() {
    const contentContainer = this.find('#contentContainer');

    switch (this.currentView) {
      case 'types':
        this.renderTypesView(contentContainer);
        break;
      case 'configs':
        this.renderConfigsView(contentContainer);
        break;
      case 'employees':
        this.renderEmployeesView(contentContainer);
        break;
      default:
        contentContainer.innerHTML = '<p>View not found</p>';
    }
  }

  /**
   * Render types view
   * @private
   * @param {HTMLElement} container - Container element
   */
  renderTypesView(container) {
    container.innerHTML = `
      <div class="types-view">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">Incentive Types</h5>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-striped table-hover">
                <thead class="table-dark">
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="typesTableBody">
                  ${this.renderTypesRows()}
                </tbody>
              </table>
            </div>
            ${this.data.types.length === 0 ? '<p class="text-center text-muted">No incentive types found</p>' : ''}
          </div>
        </div>
      </div>
    `;

    // Bind table actions
    this.bindTableActions();
  }

  /**
   * Render types table rows
   * @private
   * @returns {string} HTML for table rows
   */
  renderTypesRows() {
    return this.data.types.map(type => `
      <tr data-type-id="${type.pk}">
        <td>${type.name || '-'}</td>
        <td><span class="badge bg-secondary">${type.code || '-'}</span></td>
        <td>${type.descriptions || '-'}</td>
        <td>
          <span class="badge ${type.is_active ? 'bg-success' : 'bg-danger'}">
            ${type.is_active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>
          <div class="btn-group btn-group-sm" role="group">
            <button type="button" class="btn btn-outline-primary edit-type-btn" data-id="${type.pk}">
              <i class="bi bi-pencil"></i>
            </button>
            <button type="button" class="btn btn-outline-danger delete-type-btn" data-id="${type.pk}">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  /**
   * Render configs view
   * @private
   * @param {HTMLElement} container - Container element
   */
  renderConfigsView(container) {
    container.innerHTML = `
      <div class="configs-view">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">Incentive Configurations</h5>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-striped table-hover">
                <thead class="table-dark">
                  <tr>
                    <th>Type</th>
                    <th>Period</th>
                    <th>Default Value</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="configsTableBody">
                  ${this.renderConfigsRows()}
                </tbody>
              </table>
            </div>
            ${this.data.configs.length === 0 ? '<p class="text-center text-muted">No configurations found</p>' : ''}
          </div>
        </div>
      </div>
    `;

    // Bind table actions
    this.bindTableActions();
  }

  /**
   * Render configs table rows
   * @private
   * @returns {string} HTML for table rows
   */
  renderConfigsRows() {
    return this.data.configs.map(config => {
      const type = this.data.types.find(t => t.pk === config.incentive_type_id);
      return `
        <tr data-config-id="${config.pk}">
          <td>${type ? type.name : 'Unknown'}</td>
          <td>${config.periode || '-'}</td>
          <td>${config.default_value || '-'}</td>
          <td>
            <span class="badge ${config.is_active ? 'bg-success' : 'bg-danger'}">
              ${config.is_active ? 'Active' : 'Inactive'}
            </span>
          </td>
          <td>
            <div class="btn-group btn-group-sm" role="group">
              <button type="button" class="btn btn-outline-primary edit-config-btn" data-id="${config.pk}">
                <i class="bi bi-pencil"></i>
              </button>
              <button type="button" class="btn btn-outline-danger delete-config-btn" data-id="${config.pk}">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Render employees view
   * @private
   * @param {HTMLElement} container - Container element
   */
  renderEmployeesView(container) {
    const employees = this.data.employees;
    const totalCount = employees.length;

    container.innerHTML = `
      <div class="employees-view">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Employee Incentives</h5>
            <span class="badge bg-info">${totalCount} Total</span>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-striped table-hover">
                <thead class="table-dark">
                  <tr>
                    <th>Employee ID</th>
                    <th>Email</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="employeesTableBody">
                  ${this.renderEmployeesRows()}
                </tbody>
              </table>
            </div>
            ${totalCount === 0 ? '<p class="text-center text-muted">No employee incentives found</p>' : ''}
          </div>
        </div>
      </div>
    `;

    // Bind table actions
    this.bindTableActions();
  }

  /**
   * Render employees table rows
   * @private
   * @returns {string} HTML for table rows
   */
  renderEmployeesRows() {
    const employees = this.data.employees;

    if (employees.length === 0) {
      return '<tr><td colspan="5" class="text-center text-muted">No data available</td></tr>';
    }

    return employees.slice(0, 20).map(employee => {
      const type = this.data.types.find(t => t.pk === employee.incentive_type_id);
      return `
        <tr data-employee-id="${employee.pk}">
          <td>${employee.employee_id || '-'}</td>
          <td>${employee.email || '-'}</td>
          <td>${type ? type.name : 'Unknown'}</td>
          <td>
            <span class="badge ${employee.is_active ? 'bg-success' : 'bg-danger'}">
              ${employee.is_active ? 'Active' : 'Inactive'}
            </span>
          </td>
          <td>
            <div class="btn-group btn-group-sm" role="group">
              <button type="button" class="btn btn-outline-primary view-employee-btn" data-id="${employee.pk}">
                <i class="bi bi-eye"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Bind table action buttons
   * @private
   */
  bindTableActions() {
    // Type actions
    this.querySelectorAll('.edit-type-btn').forEach(btn => {
      this.addEventListener(btn, 'click', (e) => {
        e.preventDefault();
        const typeId = parseInt(e.currentTarget.dataset.id);
        this.editType(typeId);
      });
    });

    this.querySelectorAll('.delete-type-btn').forEach(btn => {
      this.addEventListener(btn, 'click', (e) => {
        e.preventDefault();
        const typeId = parseInt(e.currentTarget.dataset.id);
        this.deleteType(typeId);
      });
    });

    // Config actions
    this.querySelectorAll('.edit-config-btn').forEach(btn => {
      this.addEventListener(btn, 'click', (e) => {
        e.preventDefault();
        const configId = parseInt(e.currentTarget.dataset.id);
        this.editConfig(configId);
      });
    });

    this.querySelectorAll('.delete-config-btn').forEach(btn => {
      this.addEventListener(btn, 'click', (e) => {
        e.preventDefault();
        const configId = parseInt(e.currentTarget.dataset.id);
        this.deleteConfig(configId);
      });
    });

    // Employee actions
    this.querySelectorAll('.view-employee-btn').forEach(btn => {
      this.addEventListener(btn, 'click', (e) => {
        e.preventDefault();
        const employeeId = parseInt(e.currentTarget.dataset.id);
        this.viewEmployee(employeeId);
      });
    });
  }

  /**
   * Show add type modal
   */
  async showAddTypeModal() {
    console.log('➕ SembakoManager: Showing add type modal');

    try {
      const modalHtml = `
        <div class="modal fade" id="addTypeModal" tabindex="-1" data-bs-backdrop="static">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Add Incentive Type</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <form id="addTypeForm">
                  <div class="mb-3">
                    <label for="typeName" class="form-label">Name *</label>
                    <input type="text" class="form-control" id="typeName" name="name" required>
                  </div>
                  <div class="mb-3">
                    <label for="typeCode" class="form-label">Code *</label>
                    <input type="text" class="form-control" id="typeCode" name="code" required>
                  </div>
                  <div class="mb-3">
                    <label for="typeDescription" class="form-label">Description</label>
                    <textarea class="form-control" id="typeDescription" name="descriptions" rows="3"></textarea>
                  </div>
                  <div class="mb-3">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" id="typeActive" name="is_active" checked>
                      <label class="form-check-label" for="typeActive">
                        Active
                      </label>
                    </div>
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" id="saveTypeBtn">Save</button>
              </div>
            </div>
          </div>
        </div>
      `;

      // Show modal
      await this.showModal('addTypeModal', { content: modalHtml });

      // Bind form submission
      const saveBtn = document.getElementById('saveTypeBtn');
      const form = document.getElementById('addTypeForm');

      this.addEventListener(saveBtn, 'click', async () => {
        if (form.checkValidity()) {
          const formData = new FormData(form);
          const typeData = {
            name: formData.get('name'),
            code: formData.get('code'),
            descriptions: formData.get('descriptions'),
            is_active: formData.has('is_active')
          };

          await this.saveType(typeData);
          await this.hideModal('addTypeModal');
        } else {
          form.reportValidity();
        }
      });

    } catch (error) {
      console.error('❌ SembakoManager: Error showing add type modal', error);
      this.showNotification('error', 'Failed to open add type modal: ' + error.message);
    }
  }

  /**
   * Save new type
   * @private
   * @param {Object} typeData - Type data
   */
  async saveType(typeData) {
    try {
      console.log('💾 SembakoManager: Saving type', typeData);
      await this.incentiveService.createType(typeData);
    } catch (error) {
      console.error('❌ SembakoManager: Error saving type', error);
      this.showNotification('error', 'Failed to save type: ' + error.message);
    }
  }

  /**
   * Edit existing type
   * @param {number} typeId - Type ID
   */
  async editType(typeId) {
    console.log(`✏️ SembakoManager: Editing type ${typeId}`);

    try {
      const type = await this.incentiveService.getTypeById(typeId);

      const modalHtml = `
        <div class="modal fade" id="editTypeModal" tabindex="-1" data-bs-backdrop="static">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Edit Incentive Type</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <form id="editTypeForm">
                  <input type="hidden" name="pk" value="${type.pk}">
                  <div class="mb-3">
                    <label for="editTypeName" class="form-label">Name *</label>
                    <input type="text" class="form-control" id="editTypeName" name="name" value="${type.name || ''}" required>
                  </div>
                  <div class="mb-3">
                    <label for="editTypeCode" class="form-label">Code *</label>
                    <input type="text" class="form-control" id="editTypeCode" name="code" value="${type.code || ''}" required>
                  </div>
                  <div class="mb-3">
                    <label for="editTypeDescription" class="form-label">Description</label>
                    <textarea class="form-control" id="editTypeDescription" name="descriptions" rows="3">${type.descriptions || ''}</textarea>
                  </div>
                  <div class="mb-3">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" id="editTypeActive" name="is_active" ${type.is_active ? 'checked' : ''}>
                      <label class="form-check-label" for="editTypeActive">
                        Active
                      </label>
                    </div>
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" id="updateTypeBtn">Update</button>
              </div>
            </div>
          </div>
        </div>
      `;

      await this.showModal('editTypeModal', { content: modalHtml });

      // Bind form submission
      const updateBtn = document.getElementById('updateTypeBtn');
      const form = document.getElementById('editTypeForm');

      this.addEventListener(updateBtn, 'click', async () => {
        if (form.checkValidity()) {
          const formData = new FormData(form);
          const typeData = {
            name: formData.get('name'),
            code: formData.get('code'),
            descriptions: formData.get('descriptions'),
            is_active: formData.has('is_active')
          };

          await this.updateType(typeId, typeData);
          await this.hideModal('editTypeModal');
        } else {
          form.reportValidity();
        }
      });

    } catch (error) {
      console.error(`❌ SembakoManager: Error editing type ${typeId}`, error);
      this.showNotification('error', 'Failed to edit type: ' + error.message);
    }
  }

  /**
   * Update type
   * @private
   * @param {number} typeId - Type ID
   * @param {Object} typeData - Updated type data
   */
  async updateType(typeId, typeData) {
    try {
      console.log(`💾 SembakoManager: Updating type ${typeId}`, typeData);
      await this.incentiveService.updateType(typeId, typeData);
    } catch (error) {
      console.error(`❌ SembakoManager: Error updating type ${typeId}`, error);
      this.showNotification('error', 'Failed to update type: ' + error.message);
    }
  }

  /**
   * Delete type
   * @param {number} typeId - Type ID
   */
  async deleteType(typeId) {
    console.log(`🗑️ SembakoManager: Deleting type ${typeId}`);

    try {
      const confirmed = await this.showNotification('confirm',
        'Are you sure you want to delete this incentive type?',
        { title: 'Confirm Delete' }
      );

      if (confirmed) {
        await this.incentiveService.deleteType(typeId);
      }
    } catch (error) {
      console.error(`❌ SembakoManager: Error deleting type ${typeId}`, error);
      this.showNotification('error', 'Failed to delete type: ' + error.message);
    }
  }

  /**
   * Show add config modal
   */
  async showAddConfigModal() {
    console.log('➕ SembakoManager: Showing add config modal');

    if (this.data.types.length === 0) {
      this.showNotification('warning', 'Please create at least one incentive type first');
      return;
    }

    try {
      const typeOptions = this.data.types.map(type =>
        `<option value="${type.pk}">${type.name} (${type.code})</option>`
      ).join('');

      const modalHtml = `
        <div class="modal fade" id="addConfigModal" tabindex="-1" data-bs-backdrop="static">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Add Incentive Configuration</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <form id="addConfigForm">
                  <div class="mb-3">
                    <label for="configType" class="form-label">Incentive Type *</label>
                    <select class="form-select" id="configType" name="incentive_type_id" required>
                      <option value="">Select type...</option>
                      ${typeOptions}
                    </select>
                  </div>
                  <div class="mb-3">
                    <label for="configPeriod" class="form-label">Period (YYYY-MM) *</label>
                    <input type="month" class="form-control" id="configPeriod" name="periode" required>
                  </div>
                  <div class="mb-3">
                    <label for="configDefaultValue" class="form-label">Default Value *</label>
                    <input type="text" class="form-control" id="configDefaultValue" name="default_value" required>
                  </div>
                  <div class="mb-3">
                    <label for="configDescription" class="form-label">Description</label>
                    <textarea class="form-control" id="configDescription" name="descriptions" rows="3"></textarea>
                  </div>
                  <div class="mb-3">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" id="configActive" name="is_active" checked>
                      <label class="form-check-label" for="configActive">
                        Active
                      </label>
                    </div>
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" id="saveConfigBtn">Save</button>
              </div>
            </div>
          </div>
        </div>
      `;

      await this.showModal('addConfigModal', { content: modalHtml });

      // Bind form submission
      const saveBtn = document.getElementById('saveConfigBtn');
      const form = document.getElementById('addConfigForm');

      this.addEventListener(saveBtn, 'click', async () => {
        if (form.checkValidity()) {
          const formData = new FormData(form);
          const configData = {
            incentive_type_id: parseInt(formData.get('incentive_type_id')),
            periode: formData.get('periode'),
            default_value: formData.get('default_value'),
            descriptions: formData.get('descriptions'),
            is_active: formData.has('is_active')
          };

          await this.saveConfig(configData);
          await this.hideModal('addConfigModal');
        } else {
          form.reportValidity();
        }
      });

    } catch (error) {
      console.error('❌ SembakoManager: Error showing add config modal', error);
      this.showNotification('error', 'Failed to open add config modal: ' + error.message);
    }
  }

  /**
   * Save new configuration
   * @private
   * @param {Object} configData - Configuration data
   */
  async saveConfig(configData) {
    try {
      console.log('💾 SembakoManager: Saving config', configData);
      await this.incentiveService.createConfig(configData);
    } catch (error) {
      console.error('❌ SembakoManager: Error saving config', error);
      this.showNotification('error', 'Failed to save config: ' + error.message);
    }
  }

  /**
   * Edit existing configuration
   * @param {number} configId - Configuration ID
   */
  async editConfig(configId) {
    console.log(`✏️ SembakoManager: Editing config ${configId}`);

    try {
      const config = await this.incentiveService.getConfigById(configId);

      const typeOptions = this.data.types.map(type =>
        `<option value="${type.pk}" ${type.pk === config.incentive_type_id ? 'selected' : ''}>${type.name} (${type.code})</option>`
      ).join('');

      const modalHtml = `
        <div class="modal fade" id="editConfigModal" tabindex="-1" data-bs-backdrop="static">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Edit Incentive Configuration</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <form id="editConfigForm">
                  <input type="hidden" name="pk" value="${config.pk}">
                  <div class="mb-3">
                    <label for="editConfigType" class="form-label">Incentive Type *</label>
                    <select class="form-select" id="editConfigType" name="incentive_type_id" required>
                      <option value="">Select type...</option>
                      ${typeOptions}
                    </select>
                  </div>
                  <div class="mb-3">
                    <label for="editConfigPeriod" class="form-label">Period (YYYY-MM) *</label>
                    <input type="month" class="form-control" id="editConfigPeriod" name="periode" value="${config.periode}" required>
                  </div>
                  <div class="mb-3">
                    <label for="editConfigDefaultValue" class="form-label">Default Value *</label>
                    <input type="text" class="form-control" id="editConfigDefaultValue" name="default_value" value="${config.default_value}" required>
                  </div>
                  <div class="mb-3">
                    <label for="editConfigDescription" class="form-label">Description</label>
                    <textarea class="form-control" id="editConfigDescription" name="descriptions" rows="3">${config.descriptions || ''}</textarea>
                  </div>
                  <div class="mb-3">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" id="editConfigActive" name="is_active" ${config.is_active ? 'checked' : ''}>
                      <label class="form-check-label" for="editConfigActive">
                        Active
                      </label>
                    </div>
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" id="updateConfigBtn">Update</button>
              </div>
            </div>
          </div>
        </div>
      `;

      await this.showModal('editConfigModal', { content: modalHtml });

      // Bind form submission
      const updateBtn = document.getElementById('updateConfigBtn');
      const form = document.getElementById('editConfigForm');

      this.addEventListener(updateBtn, 'click', async () => {
        if (form.checkValidity()) {
          const formData = new FormData(form);
          const configData = {
            incentive_type_id: parseInt(formData.get('incentive_type_id')),
            periode: formData.get('periode'),
            default_value: formData.get('default_value'),
            descriptions: formData.get('descriptions'),
            is_active: formData.has('is_active')
          };

          await this.updateConfig(configId, configData);
          await this.hideModal('editConfigModal');
        } else {
          form.reportValidity();
        }
      });

    } catch (error) {
      console.error(`❌ SembakoManager: Error editing config ${configId}`, error);
      this.showNotification('error', 'Failed to edit config: ' + error.message);
    }
  }

  /**
   * Update configuration
   * @private
   * @param {number} configId - Configuration ID
   * @param {Object} configData - Updated configuration data
   */
  async updateConfig(configId, configData) {
    try {
      console.log(`💾 SembakoManager: Updating config ${configId}`, configData);
      await this.incentiveService.updateConfig(configId, configData);
    } catch (error) {
      console.error(`❌ SembakoManager: Error updating config ${configId}`, error);
      this.showNotification('error', 'Failed to update config: ' + error.message);
    }
  }

  /**
   * Delete configuration
   * @param {number} configId - Configuration ID
   */
  async deleteConfig(configId) {
    console.log(`🗑️ SembakoManager: Deleting config ${configId}`);

    try {
      const confirmed = await this.showNotification('confirm',
        'Are you sure you want to delete this configuration?',
        { title: 'Confirm Delete' }
      );

      if (confirmed) {
        await this.incentiveService.deleteConfig(configId);
      }
    } catch (error) {
      console.error(`❌ SembakoManager: Error deleting config ${configId}`, error);
      this.showNotification('error', 'Failed to delete config: ' + error.message);
    }
  }

  /**
   * View employee details
   * @param {number} employeeId - Employee ID
   */
  async viewEmployee(employeeId) {
    console.log(`👁️ SembakoManager: Viewing employee ${employeeId}`);

    try {
      // For now, show a simple info message
      this.showNotification('info', `Employee #${employeeId} details view coming soon!`);
    } catch (error) {
      console.error(`❌ SembakoManager: Error viewing employee ${employeeId}`, error);
      this.showNotification('error', 'Failed to view employee: ' + error.message);
    }
  }

  /**
   * Update statistics display
   * @private
   */
  updateStatistics() {
    const totalTypesEl = this.find('#totalTypes');
    const totalConfigsEl = this.find('#totalConfigs');
    const totalEmployeesEl = this.find('#totalEmployees');

    if (totalTypesEl) {
      totalTypesEl.textContent = this.data.types.length;
    }

    if (totalConfigsEl) {
      totalConfigsEl.textContent = this.data.configs.filter(c => c.is_active).length;
    }

    if (totalEmployeesEl) {
      totalEmployeesEl.textContent = this.data.employees.length;
    }
  }

  /**
   * Refresh all data
   */
  async refreshAllData() {
    console.log('🔄 SembakoManager: Refreshing all data');

    try {
      this.showNotification('info', 'Refreshing data...');

      await this.loadInitialData();

      this.showNotification('success', 'Data refreshed successfully');
    } catch (error) {
      console.error('❌ SembakoManager: Error refreshing data', error);
      this.showNotification('error', 'Failed to refresh data: ' + error.message);
    }
  }

  /**
   * Refresh types data
   * @private
   */
  async refreshTypes() {
    try {
      this.data.types = await this.incentiveService.getTypes();
      this.updateStatistics();
      if (this.currentView === 'types') {
        this.renderCurrentView();
      }
    } catch (error) {
      console.error('❌ SembakoManager: Error refreshing types', error);
    }
  }

  /**
   * Refresh configs data
   * @private
   */
  async refreshConfigs() {
    try {
      this.data.configs = await this.incentiveService.getConfigs();
      this.updateStatistics();
      if (this.currentView === 'configs') {
        this.renderCurrentView();
      }
    } catch (error) {
      console.error('❌ SembakoManager: Error refreshing configs', error);
    }
  }

  /**
   * Cleanup resources - Override from BaseComponent
   * @private
   */
  _cleanup() {
    // Clean up component map
    this.components.forEach(component => {
      if (component.destroy) {
        component.destroy();
      }
    });
    this.components.clear();

    // Clear data
    this.data = {
      types: [],
      configs: [],
      employees: []
    };
  }

  /**
   * Get current data state
   * @returns {Object} Current data
   */
  getData() {
    return { ...this.data };
  }

  /**
   * Set current view
   * @param {string} view - View name
   */
  setView(view) {
    this.switchView(view);
  }

  /**
   * Get current view
   * @returns {string} Current view name
   */
  getView() {
    return this.currentView;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SembakoManager;
} else {
  window.SembakoManager = SembakoManager;
}