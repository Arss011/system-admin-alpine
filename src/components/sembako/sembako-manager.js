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

    // Employee incentive events
    this.on(EventTypes.INCENTIVE_EMPLOYEE_CREATED, (data) => {
      console.log('📝 SembakoManager: Employee incentive created event received', data);
      this.refreshEmployees();
      this.showNotification('success', 'Incentive assigned to employee successfully');
    });

    this.on(EventTypes.INCENTIVE_EMPLOYEE_UPDATED, (data) => {
      console.log('📝 SembakoManager: Employee incentive updated event received', data);
      this.refreshEmployees();
      this.showNotification('success', 'Employee incentive updated successfully');
    });

    this.on(EventTypes.INCENTIVE_EMPLOYEE_DELETED, (data) => {
      console.log('📝 SembakoManager: Employee incentive deleted event received', data);
      this.refreshEmployees();
      this.showNotification('success', 'Employee incentive deleted successfully');
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
            <div class="d-flex align-items-center gap-3">
              <div class="input-group input-group-sm" style="width: 200px;">
                <input type="number" class="form-control" placeholder="Employee ID" id="searchEmployeeId">
                <button class="btn btn-outline-secondary" type="button" id="searchEmployeeBtn">
                  <i class="bi bi-search"></i>
                </button>
              </div>
              <button type="button" class="btn btn-primary btn-sm add-employee-btn">
                <i class="bi bi-plus-circle me-2"></i>Assign Incentive
              </button>
            </div>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-striped table-hover">
                <thead class="table-dark">
                  <tr>
                    <th>Employee ID</th>
                    <th>Full Name</th>
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

            <!-- Pagination -->
            ${this.renderPagination()}
          </div>
        </div>
      </div>
    `;

    // Bind table actions
    this.bindTableActions();

    // Bind search and add buttons
    this.bindEmployeeActions();
  }

  /**
   * Render employees table rows
   * @private
   * @returns {string} HTML for table rows
   */
  renderEmployeesRows() {
    const employees = this.data.employees;

    if (employees.length === 0) {
      return '<tr><td colspan="6" class="text-center text-muted">No data available</td></tr>';
    }

    return employees.map(employee => {
      const type = this.data.types.find(t => t.pk === employee.incentive_type_id);
      return `
        <tr data-employee-id="${employee.pk}">
          <td>${employee.employee_id || '-'}</td>
          <td>${employee.fullname || '-'}</td>
          <td>${employee.email || '-'}</td>
          <td>
            <span class="badge bg-secondary">${type ? type.name : 'Unknown'}</span>
          </td>
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
              <button type="button" class="btn btn-outline-warning edit-employee-btn" data-id="${employee.pk}">
                <i class="bi bi-pencil"></i>
              </button>
              <button type="button" class="btn btn-outline-danger delete-employee-btn" data-id="${employee.pk}">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Render pagination controls
   * @private
   * @returns {string} HTML for pagination
   */
  renderPagination() {
    const pagination = this.data.employeesPagination;
    if (!pagination || pagination.total <= pagination.limit) {
      return '';
    }

    const totalPages = Math.ceil(pagination.total / pagination.limit);
    const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

    return `
      <nav aria-label="Employee pagination" class="mt-3">
        <ul class="pagination justify-content-center">
          <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <button class="page-link" data-page="${currentPage - 1}" data-action="prev">Previous</button>
          </li>
          ${Array.from({ length: totalPages }, (_, i) => i + 1).map(page => `
            <li class="page-item ${page === currentPage ? 'active' : ''}">
              <button class="page-link" data-page="${page}">${page}</button>
            </li>
          `).join('')}
          <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <button class="page-link" data-page="${currentPage + 1}" data-action="next">Next</button>
          </li>
        </ul>
        <div class="text-center mt-2">
          <small class="text-muted">Showing ${pagination.offset + 1}-${Math.min(pagination.offset + pagination.limit, pagination.total)} of ${pagination.total} employees</small>
        </div>
      </nav>
    `;
  }

  /**
   * Bind employee-specific actions
   * @private
   */
  bindEmployeeActions() {
    // Search by employee ID
    const searchBtn = this.find('#searchEmployeeBtn');
    const searchInput = this.find('#searchEmployeeId');

    if (searchBtn && searchInput) {
      this.addEventListener(searchBtn, 'click', () => {
        this.searchEmployeeById();
      });

      this.addEventListener(searchInput, 'keypress', (e) => {
        if (e.key === 'Enter') {
          this.searchEmployeeById();
        }
      });
    }

    // Add employee incentive button
    const addBtn = this.find('.add-employee-btn');
    if (addBtn) {
      this.addEventListener(addBtn, 'click', () => {
        this.showAssignIncentiveModal();
      });
    }

    // Pagination buttons
    this.querySelectorAll('.pagination button').forEach(btn => {
      this.addEventListener(btn, 'click', (e) => {
        e.preventDefault();
        const page = parseInt(e.target.dataset.page);
        if (page && !isNaN(page)) {
          this.loadEmployeesPage(page);
        }
      });
    });
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

    this.querySelectorAll('.edit-employee-btn').forEach(btn => {
      this.addEventListener(btn, 'click', (e) => {
        e.preventDefault();
        const employeeId = parseInt(e.currentTarget.dataset.id);
        this.editEmployee(employeeId);
      });
    });

    this.querySelectorAll('.delete-employee-btn').forEach(btn => {
      this.addEventListener(btn, 'click', (e) => {
        e.preventDefault();
        const employeeId = parseInt(e.currentTarget.dataset.id);
        this.deleteEmployee(employeeId);
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
      const employee = await this.incentiveService.getEmployeeIncentiveById(employeeId);
      const type = this.data.types.find(t => t.pk === employee.incentive_type_id);

      const modalHtml = `
        <div class="modal fade" id="viewEmployeeModal" tabindex="-1">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Employee Incentive Details</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <div class="row mb-3">
                  <div class="col-sm-4"><strong>Employee ID:</strong></div>
                  <div class="col-sm-8">${employee.employee_id || '-'}</div>
                </div>
                <div class="row mb-3">
                  <div class="col-sm-4"><strong>Full Name:</strong></div>
                  <div class="col-sm-8">${employee.fullname || '-'}</div>
                </div>
                <div class="row mb-3">
                  <div class="col-sm-4"><strong>Email:</strong></div>
                  <div class="col-sm-8">${employee.email || '-'}</div>
                </div>
                <div class="row mb-3">
                  <div class="col-sm-4"><strong>Incentive Type:</strong></div>
                  <div class="col-sm-8">${type ? type.name : 'Unknown'}</div>
                </div>
                <div class="row mb-3">
                  <div class="col-sm-4"><strong>Created:</strong></div>
                  <div class="col-sm-8">${employee.created_at ? new Date(employee.created_at).toLocaleString() : '-'}</div>
                </div>
                <div class="row mb-3">
                  <div class="col-sm-4"><strong>Notes:</strong></div>
                  <div class="col-sm-8">${employee.notes || '-'}</div>
                </div>
                <div class="row mb-3">
                  <div class="col-sm-4"><strong>Status:</strong></div>
                  <div class="col-sm-8">
                    <span class="badge ${employee.is_active ? 'bg-success' : 'bg-danger'}">
                      ${employee.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              </div>
            </div>
          </div>
        </div>
      `;

      await this.showModal('viewEmployeeModal', { content: modalHtml });
    } catch (error) {
      console.error(`❌ SembakoManager: Error viewing employee ${employeeId}`, error);
      this.showNotification('error', 'Failed to view employee: ' + error.message);
    }
  }

  /**
   * Edit employee incentive
   * @param {number} employeeId - Employee ID
   */
  async editEmployee(employeeId) {
    console.log(`✏️ SembakoManager: Editing employee ${employeeId}`);

    try {
      const employee = await this.incentiveService.getEmployeeIncentiveById(employeeId);

      const typeOptions = this.data.types.map(type =>
        `<option value="${type.pk}" ${type.pk === employee.incentive_type_id ? 'selected' : ''}>${type.name} (${type.code})</option>`
      ).join('');

      const modalHtml = `
        <div class="modal fade" id="editEmployeeModal" tabindex="-1" data-bs-backdrop="static">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Edit Employee Incentive</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <form id="editEmployeeForm">
                  <input type="hidden" name="pk" value="${employee.pk}">
                  <div class="mb-3">
                    <label for="editEmployeeId" class="form-label">Employee ID</label>
                    <input type="number" class="form-control" id="editEmployeeId" name="employee_id" value="${employee.employee_id || ''}" required>
                  </div>
                  <div class="mb-3">
                    <label for="editEmployeeEmail" class="form-label">Email *</label>
                    <input type="email" class="form-control" id="editEmployeeEmail" name="email" value="${employee.email || ''}" required>
                  </div>
                  <div class="mb-3">
                    <label for="editEmployeeFullname" class="form-label">Full Name</label>
                    <input type="text" class="form-control" id="editEmployeeFullname" name="fullname" value="${employee.fullname || ''}">
                  </div>
                  <div class="mb-3">
                    <label for="editEmployeeType" class="form-label">Incentive Type *</label>
                    <select class="form-select" id="editEmployeeType" name="incentive_type_id" required>
                      <option value="">Select type...</option>
                      ${typeOptions}
                    </select>
                  </div>
                  <div class="mb-3">
                    <label for="editEmployeeNotes" class="form-label">Notes</label>
                    <textarea class="form-control" id="editEmployeeNotes" name="notes" rows="3">${employee.notes || ''}</textarea>
                  </div>
                  <div class="mb-3">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" id="editEmployeeActive" name="is_active" ${employee.is_active ? 'checked' : ''}>
                      <label class="form-check-label" for="editEmployeeActive">
                        Active
                      </label>
                    </div>
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" id="updateEmployeeBtn">Update</button>
              </div>
            </div>
          </div>
        </div>
      `;

      await this.showModal('editEmployeeModal', { content: modalHtml });

      // Bind form submission
      const updateBtn = document.getElementById('updateEmployeeBtn');
      const form = document.getElementById('editEmployeeForm');

      this.addEventListener(updateBtn, 'click', async () => {
        if (form.checkValidity()) {
          const formData = new FormData(form);
          const employeeData = {
            employee_id: parseInt(formData.get('employee_id')),
            email: formData.get('email'),
            fullname: formData.get('fullname'),
            incentive_type_id: parseInt(formData.get('incentive_type_id')),
            notes: formData.get('notes'),
            is_active: formData.has('is_active')
          };

          await this.updateEmployee(employeeId, employeeData);
          await this.hideModal('editEmployeeModal');
        } else {
          form.reportValidity();
        }
      });

    } catch (error) {
      console.error(`❌ SembakoManager: Error editing employee ${employeeId}`, error);
      this.showNotification('error', 'Failed to edit employee: ' + error.message);
    }
  }

  /**
   * Delete employee incentive
   * @param {number} employeeId - Employee ID
   */
  async deleteEmployee(employeeId) {
    console.log(`🗑️ SembakoManager: Deleting employee ${employeeId}`);

    try {
      const confirmed = await this.showNotification('confirm',
        'Are you sure you want to delete this employee incentive?',
        { title: 'Confirm Delete' }
      );

      if (confirmed) {
        await this.incentiveService.deleteEmployeeIncentive(employeeId);
      }
    } catch (error) {
      console.error(`❌ SembakoManager: Error deleting employee ${employeeId}`, error);
      this.showNotification('error', 'Failed to delete employee: ' + error.message);
    }
  }

  /**
   * Show assign incentive modal
   */
  async showAssignIncentiveModal() {
    console.log('➕ SembakoManager: Showing assign incentive modal');

    if (this.data.types.length === 0) {
      this.showNotification('warning', 'Please create at least one incentive type first');
      return;
    }

    try {
      const typeOptions = this.data.types.map(type =>
        `<option value="${type.pk}">${type.name} (${type.code})</option>`
      ).join('');

      const modalHtml = `
        <div class="modal fade" id="assignIncentiveModal" tabindex="-1" data-bs-backdrop="static">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Assign Incentive to Employee</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <form id="assignIncentiveForm">
                  <div class="mb-3">
                    <label for="assignEmployeeId" class="form-label">Employee ID *</label>
                    <input type="number" class="form-control" id="assignEmployeeId" name="employee_id" required>
                  </div>
                  <div class="mb-3">
                    <label for="assignEmployeeEmail" class="form-label">Email *</label>
                    <input type="email" class="form-control" id="assignEmployeeEmail" name="email" required>
                  </div>
                  <div class="mb-3">
                    <label for="assignEmployeeFullname" class="form-label">Full Name</label>
                    <input type="text" class="form-control" id="assignEmployeeFullname" name="fullname">
                  </div>
                  <div class="mb-3">
                    <label for="assignEmployeeType" class="form-label">Incentive Type *</label>
                    <select class="form-select" id="assignEmployeeType" name="incentive_type_id" required>
                      <option value="">Select type...</option>
                      ${typeOptions}
                    </select>
                  </div>
                  <div class="mb-3">
                    <label for="assignEmployeePeriod" class="form-label">Period (YYYY-MM) *</label>
                    <input type="month" class="form-control" id="assignEmployeePeriod" name="periode" required>
                  </div>
                  <div class="mb-3">
                    <label for="assignEmployeeNotes" class="form-label">Notes</label>
                    <textarea class="form-control" id="assignEmployeeNotes" name="notes" rows="3"></textarea>
                  </div>
                  <div class="mb-3">
                    <label for="assignEmployeeDesc" class="form-label">Description</label>
                    <textarea class="form-control" id="assignEmployeeDesc" name="descriptions" rows="3"></textarea>
                  </div>
                  <div class="mb-3">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" id="assignEmployeeActive" name="is_active" checked>
                      <label class="form-check-label" for="assignEmployeeActive">
                        Active
                      </label>
                    </div>
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" id="assignIncentiveBtn">Assign</button>
              </div>
            </div>
          </div>
        </div>
      `;

      await this.showModal('assignIncentiveModal', { content: modalHtml });

      // Bind form submission
      const assignBtn = document.getElementById('assignIncentiveBtn');
      const form = document.getElementById('assignIncentiveForm');

      this.addEventListener(assignBtn, 'click', async () => {
        if (form.checkValidity()) {
          const formData = new FormData(form);
          const employeeData = {
            employee_id: parseInt(formData.get('employee_id')),
            email: formData.get('email'),
            fullname: formData.get('fullname'),
            incentive_type_id: parseInt(formData.get('incentive_type_id')),
            periode: formData.get('periode'),
            notes: formData.get('notes'),
            descriptions: formData.get('descriptions'),
            is_active: formData.has('is_active')
          };

          await this.assignIncentive(employeeData);
          await this.hideModal('assignIncentiveModal');
        } else {
          form.reportValidity();
        }
      });

    } catch (error) {
      console.error('❌ SembakoManager: Error showing assign incentive modal', error);
      this.showNotification('error', 'Failed to open assign incentive modal: ' + error.message);
    }
  }

  /**
   * Search employee by ID
   */
  async searchEmployeeById() {
    const searchInput = this.find('#searchEmployeeId');
    const employeeId = searchInput ? parseInt(searchInput.value) : null;

    if (!employeeId || isNaN(employeeId)) {
      this.showNotification('warning', 'Please enter a valid employee ID');
      return;
    }

    try {
      console.log(`🔍 SembakoManager: Searching for employee ${employeeId}`);
      const response = await this.incentiveService.getEmployeeIncentivesByEmployeeId(employeeId);

      if (response.data && response.data.length > 0) {
        this.data.employees = response.data;
        this.data.employeesPagination = null; // Clear pagination for search results
        this.renderCurrentView();
        this.showNotification('success', `Found ${response.data.length} incentive(s) for employee ${employeeId}`);
      } else {
        this.showNotification('info', `No incentives found for employee ${employeeId}`);
      }
    } catch (error) {
      console.error(`❌ SembakoManager: Error searching employee ${employeeId}`, error);
      this.showNotification('error', 'Failed to search employee: ' + error.message);
    }
  }

  /**
   * Load employees page
   * @param {number} page - Page number
   */
  async loadEmployeesPage(page) {
    const limit = 20;
    const offset = (page - 1) * limit;

    try {
      console.log(`📄 SembakoManager: Loading employee page ${page}`);
      const response = await this.incentiveService.getEmployeeIncentives({
        limit,
        offset
      });

      this.data.employees = response.data || [];
      this.data.employeesPagination = {
        limit,
        offset,
        total: response.total || 0,
        currentPage: page
      };

      this.renderCurrentView();
    } catch (error) {
      console.error(`❌ SembakoManager: Error loading employee page ${page}`, error);
      this.showNotification('error', 'Failed to load employee page: ' + error.message);
    }
  }

  /**
   * Update employee incentive
   * @private
   * @param {number} employeeId - Employee ID
   * @param {Object} employeeData - Updated employee data
   */
  async updateEmployee(employeeId, employeeData) {
    try {
      console.log(`💾 SembakoManager: Updating employee ${employeeId}`, employeeData);
      await this.incentiveService.updateEmployeeIncentive(employeeId, employeeData);
    } catch (error) {
      console.error(`❌ SembakoManager: Error updating employee ${employeeId}`, error);
      this.showNotification('error', 'Failed to update employee: ' + error.message);
    }
  }

  /**
   * Assign incentive to employee
   * @private
   * @param {Object} employeeData - Employee incentive data
   */
  async assignIncentive(employeeData) {
    try {
      console.log('💾 SembakoManager: Assigning incentive to employee', employeeData);
      await this.incentiveService.assignIncentiveToEmployee(employeeData);
    } catch (error) {
      console.error('❌ SembakoManager: Error assigning incentive', error);
      this.showNotification('error', 'Failed to assign incentive: ' + error.message);
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