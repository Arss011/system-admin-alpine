// ==================== MODULAR INITIALIZATION ====================

/**
 * Initialize the application with modular architecture
 * This sets up all the core services and initializes the main application
 */
async function initializeModularApp() {
  console.log('🚀 Initializing Modular Application...');

  try {
    // Wait for DOM to be ready
    if (document.readyState !== 'complete') {
      await new Promise(resolve => {
        window.addEventListener('load', resolve);
      });
    }

    console.log('📦 Loading modular components...');

    // Load core modules (assuming they're already loaded via script tags)
    const modules = [
      'src/core/event-bus.js',
      'src/core/config.js',
      'src/core/api-client.js',
      'src/core/modal-service.js',
      'src/services/notification-service.js',
      'src/services/incentive-service.js',
      'src/components/base/base-component.js',
      'src/components/sembako/sembako-manager.js'
    ];

    console.log('✅ All modules loaded');

    // Initialize core services
    await initializeCoreServices();

    // Initialize application
    await initializeApplication();

    console.log('✅ Modular application initialized successfully');

  } catch (error) {
    console.error('❌ Failed to initialize modular application:', error);

    // Fallback to legacy mode if modular initialization fails
    console.log('🔄 Falling back to legacy mode...');
    initializeLegacyApp();
  }
}

/**
 * Initialize core services
 * @private
 */
async function initializeCoreServices() {
  console.log('🔧 Initializing core services...');

  // Initialize configuration service
  window.configService = window.configService || new window.ConfigService();
  console.log('✅ Configuration service initialized');

  // Initialize event bus
  window.eventBus = window.eventBus || new window.EventBus();
  console.log('✅ Event bus initialized');

  // Initialize API client
  window.apiClient = window.apiClient || new window.ApiClient(window.configService);
  console.log('✅ API client initialized');

  // Initialize modal service
  window.modalService = window.modalService || new window.ModalService(window.eventBus, window.configService);
  console.log('✅ Modal service initialized');

  // Initialize notification service
  window.notificationService = window.notificationService || new window.NotificationService(window.eventBus, window.configService);
  console.log('✅ Notification service initialized');

  // Initialize incentive service
  window.incentiveService = window.incentiveService || new window.IncentiveService(window.apiClient, window.eventBus, window.configService);
  console.log('✅ Incentive service initialized');

  console.log('✅ All core services initialized');
}

/**
 * Initialize the main application
 * @private
 */
async function initializeApplication() {
  console.log('🖥️ Initializing main application...');

  // Store services globally for easy access
  window.services = {
    config: window.configService,
    eventBus: window.eventBus,
    apiClient: window.apiClient,
    modalService: window.modalService,
    notificationService: window.notificationService,
    incentiveService: window.incentiveService
  };

  // Initialize SembakoManager if we're on the sembako page
  if (document.querySelector('#sembakoManager') || document.querySelector('[data-sembako-container]')) {
    initializeSembakoManager();
  }

  console.log('✅ Main application initialized');
}

/**
 * Initialize SembakoManager component
 * @private
 */
function initializeSembakoManager() {
  console.log('🎯 Initializing SembakoManager...');

  const container = document.querySelector('#sembakoManager') || document.querySelector('[data-sembako-container]');

  if (container && window.SembakoManager) {
    try {
      window.sembakoManagerInstance = new window.SembakoManager(container, {
        eventBus: window.eventBus,
        modalService: window.modalService,
        notificationService: window.notificationService,
        incentiveService: window.incentiveService
      });

      console.log('✅ SembakoManager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize SembakoManager:', error);
    }
  }
}

/**
 * Fallback to legacy application initialization
 * @private
 */
function initializeLegacyApp() {
  console.log('🔄 Using legacy application mode...');

  // Keep existing functionality working
  if (typeof initializeSembakoInApp === 'function') {
    setTimeout(() => {
      initializeSembakoInApp();
    }, 1000);
  }
}

// ==================== LEGACY FUNCTIONS (FOR BACKWARD COMPATIBILITY) ====================

function portalApp() {
  return {
    username: "",
    userEmail: "",
    roles: [],

    async initPortal() {
      const baseUrl = window.env?.VITE_API_URL;
      const loginUrl = window.env?.VITE_LOGIN_URL;

      try {
        const res = await fetch(`${baseUrl}/auth/get-current-user`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) throw new Error(`Unauthorized: ${res.status}`);
        const data = await res.json();

        this.username = data.username;
        this.userEmail = data.email;
        this.roles = data.roles;
        // console.log("✅ Current user:", data);
      } catch (err) {
        console.error("Auth error:", err);
        Swal.fire({
          icon: "warning",
          title: "Sesi berakhir",
          text: "Silakan login kembali.",
          confirmButtonText: "Ke Halaman Login",
        }).then(() => {
          window.location.href = loginUrl;
        });
      }
    },

    async logout() {
      const baseUrl = window.env?.VITE_API_URL;
      const loginUrl = window.env?.VITE_LOGIN_URL;

      Swal.fire({
        title: "Konfirmasi Logout",
        text: "Apakah Anda yakin ingin keluar dari sistem?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Ya, Logout",
        cancelButtonText: "Batal",
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            await fetch(`${baseUrl}/auth/logout`, {
              method: "POST",
              credentials: "include",
            });

            Swal.fire({
              icon: "success",
              title: "Logout Berhasil",
              text: "Anda akan diarahkan ke halaman login...",
              timer: 1800,
              showConfirmButton: false,
            }).then(() => {
              window.location.href = loginUrl;
            });
          } catch (err) {
            console.error("Logout error:", err);
            Swal.fire({
              icon: "error",
              title: "Gagal Logout",
              text: "Terjadi kesalahan saat logout. Silakan coba lagi.",
            });
          }
        }
      });
    },
  };
}

function userRolesTable() {
  return {
    users: [],
    search: "",
    limit: 10,
    offset: 0,
    total: 0,
    loading: false,

    // Missing properties for the UI
    selectedEmployee: null,
    modalRole: { open: false },

    async loadData() {
      this.loading = true;
      try {
        const res = await fetch("./data/users.json");
        if (!res.ok) throw new Error("Gagal memuat users.json");
        const json = await res.json();

        let filtered = json.data;
        if (this.search) {
          const term = this.search.toLowerCase();
          filtered = filtered.filter(
            (u) =>
              u.name.toLowerCase().includes(term) ||
              u.email.toLowerCase().includes(term)
          );
        }

        this.total = filtered.length;
        const start = this.offset;
        const end = start + this.limit;
        this.users = filtered.slice(start, end);
      } catch (e) {
        console.error(e);
        this.users = [];
        this.total = 0;
      } finally {
        this.loading = false;
      }
    },

    // --- Pagination & search
    onSearch() {
      this.offset = 0;
      this.loadData();
    },
    changeLimit() {
      this.offset = 0;
      this.loadData();
    },
    nextPage() {
      if (this.offset + this.limit < this.total) {
        this.offset += this.limit;
        this.loadData();
      }
    },
    prevPage() {
      if (this.offset > 0) {
        this.offset -= this.limit;
        this.loadData();
      }
    },

    // --- Hapus user role dengan konfirmasi
    async removeUserRole(user) {
      Swal.fire({
        title: "Hapus Role?",
        text: `Apakah Anda yakin ingin menghapus semua role milik ${user.name}?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ya, hapus",
        cancelButtonText: "Batal",
      }).then((result) => {
        if (result.isConfirmed) {
          user.roles = [];
          Swal.fire({
            icon: "success",
            title: "Berhasil",
            text: `Semua role milik ${user.name} telah dihapus.`,
            timer: 2000,
            showConfirmButton: false,
          });
        }
      });
    },

    // --- Event listener: refresh data setelah tambah role
    init() {
      window.addEventListener("role-added", () => this.loadData());
    },
  };
}

function roleForm() {
  return {
    searchEmployee: "",
    filteredEmployees: [],
    selectedEmployee: null,
    applications: [
      {
        name: "Monitoring",
        modules: ["Monitoring Starlink", "PDU", "Modem4G", "STB"],
      },
      {
        name: "HRM",
        modules: ["Employee-DB", "Payroll", "Cuti", "SSP"],
      },
      {
        name: "Finance",
        modules: ["Pettycash-Dashboard", "Pettycash-Mobile"],
      },
      {
        name: "Survey",
        modules: ["Survey-FO", "Survey-VSAT", "Survey-AP"],
      },
    ],
    allRoles: ["Superadmin", "Admin", "User"],
    selectedApps: [],
    selectedRoles: [],
    employees: [],

    async initForm() {
      // bisa load employee dari API nanti
      const res = await fetch("./data/users.json");
      const json = await res.json();
      this.employees = json.data;
    },

    filterEmployees() {
      const term = this.searchEmployee.toLowerCase();
      this.filteredEmployees = this.employees.filter(
        (u) =>
          u.name.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term)
      );
    },

    selectEmployee(emp) {
      this.selectedEmployee = emp;
      this.searchEmployee = emp.name;
      this.filteredEmployees = [];
    },

    resetForm() {
      this.searchEmployee = "";
      this.selectedEmployee = null;
      this.selectedApps = [];
      this.selectedRoles = [];
      this.filteredEmployees = [];
    },

    saveNewRole() {
      if (!this.selectedEmployee) return;

      const newRoles = [];
      for (const app of this.selectedApps) {
        for (const role of this.selectedRoles) {
          newRoles.push(`${app}: ${role}`);
        }
      }

      // emit event ke table biar refresh
      window.dispatchEvent(new CustomEvent("role-added"));

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: `Role baru berhasil ditambahkan untuk ${this.selectedEmployee.name}.`,
        timer: 2000,
        showConfirmButton: false,
      });

      this.resetForm();

      // tutup modal
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("modalAddRole")
      );
      modal.hide();
    },

    confirmDelete(user) {
      Swal.fire({
        icon: "warning",
        title: "Konfirmasi Hapus",
        text: `Apakah Anda yakin ingin menghapus user ${user.name}?`,
        showCancelButton: true,
        confirmButtonText: "Ya, Hapus!",
        cancelButtonText: "Batal",
      }).then((result) => {
        if (result.isConfirmed) {
          this.users = this.users.filter((u) => u.id !== user.id);
          Swal.fire("Terhapus!", "User berhasil dihapus.", "success");
          this.modalRole.open = false;
        }
      });
    },
  };
}

// MODERN NAVIGATION COMPONENTS
function navigationHeader() {
  return {
    mobileMenuOpen: false,
    searchQuery: '',
    searchFocused: false,
    currentPageTitle: 'Dashboard',
    userRole: 'Administrator',
    currentActivePage: 'dashboard',

    initNavigation() {
      // Set page title based on active nav
      this.updatePageTitle('dashboard');

      // Restore state from URL if available
      this.restoreFromURLState();

      // Close mobile menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!this.$el.contains(e.target)) {
          this.mobileMenuOpen = false;
        }
      });

      // Handle escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.mobileMenuOpen = false;
        }
      });

      // Handle browser back/forward buttons
      window.addEventListener('popstate', (e) => {
        if (e.state && e.state.page) {
          this.currentActivePage = e.state.page;
          this.updatePageTitle(e.state.page);
          this.loadPageContent(e.state.page);
          // Restore navigation state after content loads
          setTimeout(() => {
            this.restoreActiveNavigation(e.state.page);
          }, 300);
        }
      });
    },

    setActiveNav(event, page) {
      // Remove active class from all nav items and dropdowns
      document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
      });
      document.querySelectorAll('.dropdown').forEach(dropdown => {
        dropdown.classList.remove('active');
      });

      // Handle special case for Sembako (incentive submenu)
      if (page === 'sembako') {
        // Find and activate the incentive dropdown parent
        const incentiveDropdown = document.getElementById('incentiveDropdown');
        if (incentiveDropdown) {
          // Add active to the dropdown container
          incentiveDropdown.closest('.dropdown').classList.add('active');

          // Add show class to display the dropdown menu
          const dropdownMenu = incentiveDropdown.nextElementSibling;
          if (dropdownMenu && dropdownMenu.classList.contains('dropdown-menu')) {
            dropdownMenu.classList.add('show');
          }
        }

        // Also add active to the clicked element if it's a dropdown-item
        if (event.currentTarget && event.currentTarget.classList.contains('dropdown-item')) {
          event.currentTarget.classList.add('active');
        }
      } else {
        // Add active class to clicked item for normal navigation
        if (event.currentTarget) {
          // Handle dropdown items
          if (event.currentTarget.classList.contains('dropdown-item')) {
            event.currentTarget.classList.add('active');
            // Also activate parent dropdown
            const parentDropdown = event.currentTarget.closest('.dropdown');
            if (parentDropdown) {
              parentDropdown.classList.add('active');
            }
          } else if (event.currentTarget.classList.contains('nav-item')) {
            event.currentTarget.classList.add('active');
          }
        }
      }

      // Track current page for refresh functionality
      this.currentActivePage = page;

      // Update page title
      this.updatePageTitle(page);

      // Store in URL for persistence
      this.updateURLState(page);

      // Close mobile menu if open
      this.mobileMenuOpen = false;

      // Load corresponding content
      this.loadPageContent(page);
    },

    updatePageTitle(page) {
      const titles = {
        dashboard: 'User Roles Management',
        users: 'User Management',
        settings: 'System Settings',
        reports: 'Reports & Analytics',
        incentive: 'Incentive Management',
        sembako: 'Sembako Management'
      };
      this.currentPageTitle = titles[page] || 'Dashboard';
    },

    updateURLState(page) {
      // Update URL without full page reload, replacing instead of pushing
      const url = new URL(window.location);
      url.searchParams.set('page', page);
      window.history.replaceState({ page }, '', url);
    },

    loadPageContent(page) {
      const mainContent = document.getElementById('main-content');

      console.log('📄 Loading page content for:', page);

      switch(page) {
        case 'dashboard':
          htmx.ajax('GET', './partials/set-roles.html', { target: '#main-content', swap: 'innerHTML' });
          break;
        case 'incentive':
          // Show incentive overview or first submenu
          this.updatePageTitle('incentive');
          break;
        case 'sembako':
          htmx.ajax('GET', './partials/sembako.html', { target: '#main-content', swap: 'innerHTML' });
          break;
        default:
          console.log(`Loading ${page} content...`);
      }
    },

    restoreFromURLState() {
      const urlParams = new URLSearchParams(window.location.search);
      const savedPage = urlParams.get('page');

      if (savedPage) {
        console.log('🔄 Restoring page from URL:', savedPage);

        // Simulate navigation event for the saved page
        setTimeout(() => {
          this.currentActivePage = savedPage;
          this.updatePageTitle(savedPage);
          this.loadPageContent(savedPage);

          // Use the helper to restore proper navigation state
          setTimeout(() => {
            this.restoreActiveNavigation(savedPage);
          }, 300);
        }, 500);
      }
    },

    
    refreshCurrentPage() {
      const mainContent = document.getElementById('main-content');
      const currentPage = this.currentActivePage || 'dashboard';

      console.log('🔄 Refreshing current page:', currentPage);

      // Show loading spinner
      mainContent.innerHTML = `
        <div class="text-center py-5">
          <div class="spinner-border text-success mb-3" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="text-muted">Refreshing ${currentPage} data...</p>
        </div>
      `;

      // Store current page state to prevent navigation change
      const storedPage = this.currentActivePage;

      // Reload the current page content after a short delay
      setTimeout(() => {
        // Ensure we don't change the current page during refresh
        this.currentActivePage = storedPage;
        this.loadPageContent(storedPage);

        // Restore active navigation state after content loads
        setTimeout(() => {
          this.restoreActiveNavigation(storedPage);
        }, 200);
      }, 500);
    },

    // Helper to restore active navigation state
    restoreActiveNavigation(page) {
      // Clear all active states first
      document.querySelectorAll('.nav-item, .dropdown').forEach(item => {
        item.classList.remove('active');
      });

      if (page === 'sembako') {
        // Activate incentive dropdown for sembako
        const incentiveDropdown = document.getElementById('incentiveDropdown');
        if (incentiveDropdown) {
          incentiveDropdown.closest('.dropdown').classList.add('active');

          // Also activate the specific sembako menu item
          const sembakoItem = document.querySelector('[hx-get*="sembako.html"]');
          if (sembakoItem) {
            sembakoItem.classList.add('active');
          }
        }
      } else {
        // Find and activate regular nav items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
          const href = item.getAttribute('href') || item.getAttribute('hx-get');
          if (href && href.includes(page)) {
            item.classList.add('active');
          }
        });
      }
    }
  };
}

function notificationDropdown() {
  return {
    isOpen: false,
    unreadCount: 3,
    notifications: [
      {
        id: 1,
        title: 'New user registration',
        time: '5 minutes ago',
        icon: 'bi bi-person-plus text-success',
        read: false
      },
      {
        id: 2,
        title: 'System update completed',
        time: '1 hour ago',
        icon: 'bi bi-arrow-repeat-circle text-info',
        read: false
      },
      {
        id: 3,
        title: 'Role permissions updated',
        time: '3 hours ago',
        icon: 'bi bi-shield-check text-warning',
        read: true
      }
    ],

    toggleNotifications() {
      this.isOpen = !this.isOpen;
      // Close other dropdowns
      document.querySelectorAll('.dropdown-panel').forEach(panel => {
        if (panel !== this.$el.querySelector('.dropdown-panel')) {
          panel.style.display = 'none';
        }
      });
    },

    markAllRead() {
      this.notifications.forEach(notif => notif.read = true);
      this.unreadCount = 0;
    }
  };
}

function userDropdown() {
  return {
    isOpen: false,

    toggleProfile() {
      this.isOpen = !this.isOpen;
      // Close other dropdowns
      document.querySelectorAll('.dropdown-panel').forEach(panel => {
        if (panel !== this.$el.querySelector('.dropdown-panel')) {
          panel.style.display = 'none';
        }
      });
    }
  };
}

// SEMBAKO MANAGEMENT COMPONENTS
window.sembakoManager = function sembakoManager() {
  return {
    // Data
    types: [],
    configs: [],
    employees: [],

    // Loading states
    loadingTypes: true,
    loadingConfigs: true,
    loadingEmployees: true,

    // Filters
    searchType: '',
    searchConfig: '',
    searchEmployee: '',
    filterStatus: '',
    filterPeriod: '',
    filterByType: '',

    // Filtered data
    filteredTypes: [],
    filteredConfigs: [],
    filteredEmployees: [],

    // Stats
    stats: {
      totalTypes: 0,
      activeConfigs: 0,
      totalEmployees: 0,
      thisMonth: 0
    },

    async initManager() {
      console.log('🚀 Initializing Sembako Manager...');
      try {
        await Promise.all([
          this.loadTypes(),
          this.loadConfigs(),
          this.loadEmployees()
        ]);

        this.calculateStats();
        this.applyAllFilters();
        console.log('✅ Sembako Manager initialized successfully');
      } catch (error) {
        console.error('❌ Error initializing Sembako Manager:', error);
        Swal.fire({
          icon: 'error',
          title: 'Initialization Error',
          text: 'Gagal memuat data sembako. Silakan refresh halaman.',
        });
      }
    },

    async loadTypes() {
      this.loadingTypes = true;
      console.log('📋 Loading incentive types...');
      try {
        const baseUrl = window.env?.VITE_API_URL || 'http://localhost:8000';
        const url = `${baseUrl}/incentive/incentive-types`;
        console.log('🔗 Fetching from:', url);

        const response = await fetch(url);
        const data = await response.json();

        if (response.ok) {
          this.types = data.data || [];
          console.log('✅ Types loaded:', this.types.length, 'items');
        } else {
          throw new Error(`HTTP ${response.status}: ${data.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('❌ Error loading types:', error);
        // Fallback to mock data for development
        console.log('📦 Using mock data for types');
        this.types = [
          {
            pk: 1,
            name: "Sembako",
            descriptions: "1 Karung Beras & 1 Liter Minyak",
            created_at: "2025-11-12T10:20:35.403Z",
            updated_at: null,
            is_active: true
          }
        ];
      } finally {
        this.loadingTypes = false;
      }
    },

    async loadConfigs() {
      this.loadingConfigs = true;
      console.log('⚙️ Loading incentive configs...');
      try {
        const baseUrl = window.env?.VITE_API_URL || 'http://localhost:8000';
        const url = `${baseUrl}/incentive/incentive-config`;
        console.log('🔗 Fetching from:', url);

        const response = await fetch(url);
        const data = await response.json();

        if (response.ok) {
          this.configs = data.data || [];
          console.log('✅ Configs loaded:', this.configs.length, 'items');
        } else {
          throw new Error(`HTTP ${response.status}: ${data.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('❌ Error loading configs:', error);
        // Fallback to mock data for development
        console.log('📦 Using mock data for configs');
        this.configs = [
          {
            pk: 7,
            incentive_type_id: 1,
            periode: "2025-10",
            default_value: "10000",
            created_at: "2025-11-12T15:51:36.810669Z",
            updated_at: null,
            created_by: 3065,
            updated_by: null,
            is_active: true,
            descriptions: "Nilai tunai pengganti Sembako jika tidak ada stok."
          },
          {
            pk: 8,
            incentive_type_id: 1,
            periode: "2025-11",
            default_value: "15000",
            created_at: "2025-11-12T15:51:36.810669Z",
            updated_at: null,
            created_by: 3123,
            updated_by: null,
            is_active: true,
            descriptions: "Nilai tunai pengganti Sembako untuk periode tahun berikutnya."
          }
        ];
      } finally {
        this.loadingConfigs = false;
      }
    },

    async loadEmployees() {
      this.loadingEmployees = true;
      try {
        const baseUrl = window.env?.VITE_API_URL;
        const response = await fetch(`${baseUrl}/incentive/employee-incentives`);
        const data = await response.json();
        this.employees = data.data || [];
      } catch (error) {
        console.error('Error loading employees:', error);
        // Fallback to mock data for development
        this.employees = [
          {
            pk: 12,
            employee_id: null,
            email: "yuga@fiber.net.id",
            notes: null,
            incentive_type_id: 1,
            created_at: "2025-11-13T14:41:48.673263Z",
            updated_at: null,
            created_by: 3065,
            updated_by: null,
            descriptions: null,
            is_active: true
          },
          {
            pk: 13,
            employee_id: null,
            email: "daris@fiber.net.id",
            notes: null,
            incentive_type_id: 1,
            created_at: "2025-11-13T14:41:48.673263Z",
            updated_at: null,
            created_by: 3065,
            updated_by: null,
            descriptions: null,
            is_active: true
          }
        ];
      } finally {
        this.loadingEmployees = false;
      }
    },

    applyAllFilters() {
      this.filterTypes();
      this.filterConfigs();
      this.filterEmployees();
    },

    filterTypes() {
      this.filteredTypes = this.types.filter(type => {
        const matchesSearch = !this.searchType ||
          type.name.toLowerCase().includes(this.searchType.toLowerCase()) ||
          (type.descriptions && type.descriptions.toLowerCase().includes(this.searchType.toLowerCase()));

        const matchesStatus = this.filterStatus === '' ||
          type.is_active.toString() === this.filterStatus;

        return matchesSearch && matchesStatus;
      });
    },

    filterConfigs() {
      this.filteredConfigs = this.configs.filter(config => {
        const matchesSearch = !this.searchConfig ||
          config.default_value.toLowerCase().includes(this.searchConfig.toLowerCase()) ||
          config.periode.includes(this.searchConfig);

        const matchesPeriod = !this.filterPeriod || config.periode === this.filterPeriod;

        return matchesSearch && matchesPeriod;
      });
    },

    filterEmployees() {
      this.filteredEmployees = this.employees.filter(employee => {
        const matchesSearch = !this.searchEmployee ||
          employee.email.toLowerCase().includes(this.searchEmployee.toLowerCase());

        const matchesType = !this.filterByType ||
          employee.incentive_type_id.toString() === this.filterByType;

        return matchesSearch && matchesType;
      });
    },

    calculateStats() {
      this.stats.totalTypes = this.types.length;
      this.stats.activeConfigs = this.configs.filter(c => c.is_active).length;
      this.stats.totalEmployees = this.employees.filter(e => e.is_active).length;

      // Calculate this month
      const currentMonth = new Date().toISOString().slice(0, 7);
      this.stats.thisMonth = this.employees.filter(e => {
        return e.created_at && e.created_at.startsWith(currentMonth.replace('-', '-'));
      }).length;
    },

    // Helper functions
    getTypeName(typeId) {
      const type = this.types.find(t => t.pk === typeId);
      return type ? type.name : 'Unknown';
    },

    formatPeriode(periode) {
      const [year, month] = periode.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    },

    get availablePeriods() {
      return [...new Set(this.configs.map(c => c.periode))].sort();
    },

    // Edit functions
    editType(type) {
      Swal.fire({
        title: 'Edit Jenis Sembako',
        text: `Edit ${type.name}`,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Edit'
      });
    },

    editConfig(config) {
      Swal.fire({
        title: 'Edit Konfigurasi',
        text: `Edit konfigurasi periode ${config.periode}`,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Edit'
      });
    },

    editEmployee(employee) {
      Swal.fire({
        title: 'Edit Karyawan',
        text: `Edit data ${employee.email}`,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Edit'
      });
    },

    deleteType(type) {
      Swal.fire({
        title: 'Hapus Jenis Sembako?',
        text: `Apakah Anda yakin ingin menghapus ${type.name}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, hapus!'
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire('Terhapus!', 'Jenis sembako berhasil dihapus.', 'success');
        }
      });
    }
  };
}

window.typeForm = function typeForm() {
  return {
    formData: {
      name: '',
      descriptions: '',
      is_active: true
    },

    saveType() {
      Swal.fire({
        title: 'Success!',
        text: 'Jenis sembako berhasil ditambahkan',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    }
  };
}

window.configForm = function configForm() {
  return {
    formData: {
      incentive_type_id: '',
      periode: '',
      default_value: '',
      descriptions: '',
      is_active: true
    },

    saveConfig() {
      Swal.fire({
        title: 'Success!',
        text: 'Konfigurasi berhasil disimpan',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    }
  };
}

window.employeeForm = function employeeForm() {
  return {
    formData: {
      email: '',
      employee_id: '',
      incentive_type_id: '',
      notes: '',
      is_active: true
    },

    saveEmployee() {
      Swal.fire({
        title: 'Success!',
        text: 'Sembako berhasil diberikan kepada karyawan',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    }
  };
}

// SEMBAKO MANAGEMENT COMPONENTS
function sembakoManager() {
  return {
    // Data
    types: [],
    configs: [],
    employees: [],

    // Loading states
    loadingTypes: true,
    loadingConfigs: true,
    loadingEmployees: true,

    // Filters
    searchType: '',
    searchConfig: '',
    searchEmployee: '',
    filterStatus: '',
    filterPeriod: '',
    filterByType: '',

    // Filtered data
    filteredTypes: [],
    filteredConfigs: [],
    filteredEmployees: [],

    // Stats
    stats: {
      totalTypes: 0,
      activeConfigs: 0,
      totalEmployees: 0,
      thisMonth: 0
    },

    async initManager() {
      // For demo, load mock data instead of API calls
      await this.loadMockData();
      this.calculateStats();
      this.applyAllFilters();
    },

    async loadMockData() {
      // Mock data for demonstration
      this.types = [
        {
          pk: 1,
          name: "Sembako",
          descriptions: "1 Karung Beras & 1 Liter Minyak",
          created_at: "2025-11-12T10:20:35.403Z",
          updated_at: null,
          is_active: true
        }
      ];

      this.configs = [
        {
          pk: 7,
          incentive_type_id: 1,
          periode: "2025-10",
          default_value: "10000",
          created_at: "2025-11-12T15:51:36.810669Z",
          updated_at: null,
          created_by: 3065,
          updated_by: null,
          is_active: true,
          descriptions: "Nilai tunai pengganti Sembako jika tidak ada stok."
        }
      ];

      this.employees = [
        {
          pk: 12,
          employee_id: null,
          email: "yuga@fiber.net.id",
          notes: null,
          incentive_type_id: 1,
          created_at: "2025-11-13T14:41:48.673263Z",
          updated_at: null,
          created_by: 3065,
          updated_by: null,
          descriptions: null,
          is_active: true
        }
      ];

      this.loadingTypes = false;
      this.loadingConfigs = false;
      this.loadingEmployees = false;
    },

    applyAllFilters() {
      this.filterTypes();
      this.filterConfigs();
      this.filterEmployees();
    },

    filterTypes() {
      this.filteredTypes = this.types.filter(type => {
        const matchesSearch = !this.searchType ||
          type.name.toLowerCase().includes(this.searchType.toLowerCase()) ||
          (type.descriptions && type.descriptions.toLowerCase().includes(this.searchType.toLowerCase()));

        const matchesStatus = this.filterStatus === '' ||
          type.is_active.toString() === this.filterStatus;

        return matchesSearch && matchesStatus;
      });
    },

    filterConfigs() {
      this.filteredConfigs = this.configs.filter(config => {
        const matchesSearch = !this.searchConfig ||
          config.default_value.toLowerCase().includes(this.searchConfig.toLowerCase()) ||
          config.periode.includes(this.searchConfig);

        const matchesPeriod = !this.filterPeriod || config.periode === this.filterPeriod;

        return matchesSearch && matchesPeriod;
      });
    },

    filterEmployees() {
      this.filteredEmployees = this.employees.filter(employee => {
        const matchesSearch = !this.searchEmployee ||
          employee.email.toLowerCase().includes(this.searchEmployee.toLowerCase());

        const matchesType = !this.filterByType ||
          employee.incentive_type_id.toString() === this.filterByType;

        return matchesSearch && matchesType;
      });
    },

    calculateStats() {
      this.stats.totalTypes = this.types.length;
      this.stats.activeConfigs = this.configs.filter(c => c.is_active).length;
      this.stats.totalEmployees = this.employees.filter(e => e.is_active).length;

      // Calculate this month
      const currentMonth = new Date().toISOString().slice(0, 7);
      this.stats.thisMonth = this.employees.filter(e => {
        return e.created_at && e.created_at.startsWith(currentMonth.replace('-', '-'));
      }).length;
    },

    // Helper functions
    getTypeName(typeId) {
      const type = this.types.find(t => t.pk === typeId);
      return type ? type.name : 'Unknown';
    },

    formatPeriode(periode) {
      const [year, month] = periode.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    },

    get availablePeriods() {
      return [...new Set(this.configs.map(c => c.periode))].sort();
    },

    // Edit functions
    editType(type) {
      console.log('Edit type:', type);
    },

    editConfig(config) {
      console.log('Edit config:', config);
    },

    editEmployee(employee) {
      console.log('Edit employee:', employee);
    },

    // Delete functions
    deleteType(type) {
      console.log('Delete type:', type);
    }
  };
}

function typeForm() {
  return {
    formData: {
      name: '',
      descriptions: '',
      is_active: true
    },

    saveType() {
      console.log('Saving type:', this.formData);
    }
  };
}

function configForm() {
  return {
    formData: {
      incentive_type_id: '',
      periode: '',
      default_value: '',
      descriptions: '',
      is_active: true
    },

    saveConfig() {
      console.log('Saving config:', this.formData);
    }
  };
}

function employeeForm() {
  return {
    formData: {
      email: '',
      employee_id: '',
      incentive_type_id: '',
      notes: '',
      is_active: true
    },

    saveEmployee() {
      console.log('Saving employee:', this.formData);
    }
  };
}

function modalRoleData() {
  return {
    user: null,
    isDelete: false,
    openModal(user, isDelete = false) {
      this.user = user;
      this.isDelete = isDelete;
      // Show modal logic here
    },

    deleteRole() {
      if (this.user) {
        console.log('Deleting role for:', this.user);
        // Delete logic here
      }
    }
  };
}

// SEMBAKO PAGE DATA (Simple approach for HTMX compatibility)
window.sembakoPageData = {
  types: [],
  configs: [],
  employees: [],
  loadingTypes: true,
  loadingConfigs: true,
  loadingEmployees: true,
  searchType: '',
  searchConfig: '',
  searchEmployee: '',
  filterStatus: '',
  filterPeriod: '',
  filterByType: '',
  filteredTypes: [],
  filteredConfigs: [],
  filteredEmployees: [],
  stats: {
    totalTypes: 0,
    activeConfigs: 0,
    totalEmployees: 0,
    thisMonth: 0
  },

  async initSembakoPage() {
    // Load mock data immediately
    this.loadMockData();
    this.calculateStats();
    this.applyAllFilters();
  },

  loadMockData() {
    this.types = [
      {
        pk: 1,
        name: "Sembako",
        descriptions: "1 Karung Beras & 1 Liter Minyak",
        created_at: "2025-11-12T10:20:35.403Z",
        updated_at: null,
        is_active: true
      }
    ];

    this.configs = [
      {
        pk: 7,
        incentive_type_id: 1,
        periode: "2025-10",
        default_value: "10000",
        created_at: "2025-11-12T15:51:36.810669Z",
        updated_at: null,
        created_by: 3065,
        updated_by: null,
        is_active: true,
        descriptions: "Nilai tunai pengganti Sembako jika tidak ada stok."
      },
      {
        pk: 8,
        incentive_type_id: 1,
        periode: "2025-11",
        default_value: "15000",
        created_at: "2025-11-12T15:51:36.810669Z",
        updated_at: null,
        created_by: 3123,
        updated_by: null,
        is_active: true,
        descriptions: "Nilai tunai pengganti Sembako untuk periode tahun berikutnya."
      }
    ];

    this.employees = [
      {
        pk: 12,
        employee_id: null,
        email: "yuga@fiber.net.id",
        notes: null,
        incentive_type_id: 1,
        created_at: "2025-11-13T14:41:48.673263Z",
        updated_at: null,
        created_by: 3065,
        updated_by: null,
        descriptions: null,
        is_active: true
      },
      {
        pk: 13,
        employee_id: null,
        email: "daris@fiber.net.id",
        notes: null,
        incentive_type_id: 1,
        created_at: "2025-11-13T14:41:48.673263Z",
        updated_at: null,
        created_by: 3065,
        updated_by: null,
        descriptions: null,
        is_active: true
      }
    ];

    this.loadingTypes = false;
    this.loadingConfigs = false;
    this.loadingEmployees = false;
  },

  applyAllFilters() {
    this.filterTypes();
    this.filterConfigs();
    this.filterEmployees();
  },

  filterTypes() {
    this.filteredTypes = this.types.filter(type => {
      const matchesSearch = !this.searchType ||
        type.name.toLowerCase().includes(this.searchType.toLowerCase()) ||
        (type.descriptions && type.descriptions.toLowerCase().includes(this.searchType.toLowerCase()));

      const matchesStatus = this.filterStatus === '' ||
        type.is_active.toString() === this.filterStatus;

      return matchesSearch && matchesStatus;
    });
  },

  filterConfigs() {
    this.filteredConfigs = this.configs.filter(config => {
      const matchesSearch = !this.searchConfig ||
        config.default_value.toLowerCase().includes(this.searchConfig.toLowerCase()) ||
        config.periode.includes(this.searchConfig);

      const matchesPeriod = !this.filterPeriod || config.periode === this.filterPeriod;

      return matchesSearch && matchesPeriod;
    });
  },

  filterEmployees() {
    this.filteredEmployees = this.employees.filter(employee => {
      const matchesSearch = !this.searchEmployee ||
        employee.email.toLowerCase().includes(this.searchEmployee.toLowerCase());

      const matchesType = !this.filterByType ||
        employee.incentive_type_id.toString() === this.filterByType;

      return matchesSearch && matchesType;
    });
  },

  calculateStats() {
    this.stats.totalTypes = this.types.length;
    this.stats.activeConfigs = this.configs.filter(c => c.is_active).length;
    this.stats.totalEmployees = this.employees.filter(e => e.is_active).length;

    // Calculate this month
    const currentMonth = new Date().toISOString().slice(0, 7);
    this.stats.thisMonth = this.employees.filter(e => {
      return e.created_at && e.created_at.startsWith(currentMonth.replace('-', '-'));
    }).length;
  },

  // Helper functions
  getTypeName(typeId) {
    const type = this.types.find(t => t.pk === typeId);
    return type ? type.name : 'Unknown';
  },

  formatPeriode(periode) {
    const [year, month] = periode.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  },

  get availablePeriods() {
    return [...new Set(this.configs.map(c => c.periode))].sort();
  },

  // Edit functions
  editType(type) {
    console.log('Edit type:', type);
  },

  editConfig(config) {
    console.log('Edit config:', config);
  },

  editEmployee(employee) {
    console.log('Edit employee:', employee);
  },

  deleteType(type) {
    console.log('Delete type:', type);
  }
};

// SEMBAKO FORM COMPONENTS
window.sembakoTypeForm = {
  formData: {
    name: '',
    descriptions: '',
    is_active: true
  },
  saveType() {
    console.log('Saving type:', this.formData);
  }
};

window.sembakoConfigForm = {
  formData: {
    incentive_type_id: '',
    periode: '',
    default_value: '',
    descriptions: '',
    is_active: true
  },
  saveConfig() {
    console.log('Saving config:', this.formData);
  }
};

window.sembakoEmployeeForm = {
  formData: {
    email: '',
    employee_id: '',
    incentive_type_id: '',
    notes: '',
    is_active: true
  },
  saveEmployee() {
    console.log('Saving employee:', this.formData);
  }
};

// ==================== APPLICATION INITIALIZATION ====================

// Initialize the modular application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log('🚀 DOM Content Loaded - Initializing Application...');

  // Initialize modular application
  initializeModularApp();

  // Re-init Alpine setelah HTMX swap konten baru
  if (document.body) {
    document.body.addEventListener("htmx:afterSwap", handleHtmxSwap);
  }

  function handleHtmxSwap(e) {
    if (e.detail.target.id === "main-content") {
      Alpine.flushAndStopDeferringMutations();
      Alpine.initTree(e.detail.target);

      // Initialize sembako functionality if needed
      if (e.detail.target.innerHTML.includes('Sembako Management')) {
        console.log('🔄 Sembako content detected, initializing...');

        // Try modular initialization first
        if (window.SembakoManager && !window.sembakoManagerInstance) {
          setTimeout(() => {
            initializeSembakoManager();
          }, 100);
        } else {
          // Fallback to legacy
          initializeSembakoInApp();
        }
      }
    }
  }

  // Store Alpine instances globally for onclick access
  setTimeout(() => {
    window.portalAppInstance = Alpine.data('portalApp');
    window.navigationHeaderInstance = Alpine.data('navigationHeader');
    console.log('✅ Alpine instances stored globally');
  }, 1000);
});

// ==================== SEMBAKO FUNCTIONS ====================
// Global variables to track current operations
let currentEditType = null;
let currentDeleteId = null;
let currentDeleteType = null; // 'type', 'config', or 'employee'

function initializeSembakoInApp() {
  console.log('🚀 Initializing sembako functions in app.js...');

  // Check Bootstrap availability
  console.log('🔍 Bootstrap check:', {
    bootstrap: typeof bootstrap,
    Modal: typeof bootstrap !== 'undefined' ? typeof bootstrap.Modal : 'N/A',
    Toast: typeof bootstrap !== 'undefined' ? typeof bootstrap.Toast : 'N/A'
  });

  // Test button functions exist
  console.log('🔍 Function check:', {
    openCreateTypeModal: typeof openCreateTypeModal,
    testBootstrapModal: typeof testBootstrapModal,
    handleEditClick: typeof handleEditClick,
    handleDeleteClick: typeof handleDeleteClick
  });

  // Load data when content is ready
  loadSembakoData();
}

function openCreateTypeModal() {
  console.log('🔧 CREATE BUTTON CLICKED!');
  alert('Create button clicked! Check console for details.');

  console.log('🔧 Opening create type modal...');
  console.log('🔍 Checking Bootstrap:', typeof bootstrap);
  console.log('🔍 Modal element:', document.getElementById('typeModal'));

  // Check if Bootstrap is loaded
  if (typeof bootstrap === 'undefined') {
    console.error('❌ Bootstrap is not loaded!');
    alert('Bootstrap tidak terload. Silakan refresh halaman.');
    return;
  }

  currentEditType = null;

  // Reset form
  document.getElementById('modalTitle').textContent = 'Tambah Jenis Sembako';
  document.getElementById('submitButtonText').textContent = 'Simpan';
  document.getElementById('typeForm').reset();
  document.getElementById('typeActive').checked = true;

  // Show modal
  try {
    const modalElement = document.getElementById('typeModal');
    console.log('🔍 Modal element found:', modalElement);

    if (!modalElement) {
      console.error('❌ Modal element not found!');
      alert('Modal element not found!');
      return;
    }

    const modal = new bootstrap.Modal(modalElement);
    console.log('🔍 Modal instance created:', modal);

    modal.show();
    console.log('✅ Modal opened successfully');
  } catch (error) {
    console.error('❌ Error opening modal:', error);
    console.error('❌ Error details:', error.stack);
    alert('Modal error: ' + error.message);
  }
}

function editType(type) {
  console.log('✏️ Editing type:', type);
  currentEditType = type;
  currentDeleteId = type.pk;
  currentDeleteType = 'type';

  // Update modal title and button
  document.getElementById('modalTitle').textContent = 'Edit Jenis Sembako';
  document.getElementById('submitButtonText').textContent = 'Update';

  // Populate form with existing data
  document.getElementById('typeName').value = type.name || '';
  document.getElementById('typeCode').value = type.code || '';
  document.getElementById('typeDescription').value = type.descriptions || '';
  document.getElementById('typeActive').checked = type.is_active || false;

  // Show modal
  try {
    const modal = new bootstrap.Modal(document.getElementById('typeModal'));
    modal.show();
    console.log('✅ Edit modal opened successfully');
  } catch (error) {
    console.error('❌ Error opening edit modal:', error);
    // Fallback
    document.getElementById('typeModal').style.display = 'block';
    document.getElementById('typeModal').classList.add('show');
    document.body.classList.add('modal-open');
  }
}

function deleteType(id, typeName = 'Jenis Sembako') {
  console.log('🗑️ Requesting delete for:', id, typeName);
  currentDeleteId = id;
  currentDeleteType = 'type';

  // Set item name in confirmation modal
  document.getElementById('deleteItemName').textContent = `Item: ${typeName}`;

  // Show delete confirmation modal
  try {
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
    console.log('✅ Delete confirmation modal opened');
  } catch (error) {
    console.error('❌ Error opening delete modal:', error);
    // Fallback to simple confirmation
    if (confirm(`Apakah Anda yakin ingin menghapus ${typeName}?`)) {
      performDelete();
    }
  }
}

async function confirmDelete() {
  console.log('🔄 Confirming delete...');
  await performDelete();
}

async function performDelete() {
  if (!currentDeleteId) {
    console.error('❌ No delete ID set');
    return;
  }

  const baseUrl = window.env?.VITE_API_URL || 'http://localhost:8000';
  let url = '';

  // Set URL based on delete type
  switch (currentDeleteType) {
    case 'type':
      url = `${baseUrl}/incentive/incentive-types/${currentDeleteId}`;
      break;
    default:
      console.error('❌ Unknown delete type:', currentDeleteType);
      return;
  }

  console.log('🗑️ Deleting:', currentDeleteType, 'ID:', currentDeleteId, 'URL:', url);

  try {
    // Close delete modal
    const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
    if (deleteModal) deleteModal.hide();

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    console.log('Delete response status:', response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('Delete response:', result);

      // Show success notification
      showSuccessNotification(result.message || 'Data berhasil dihapus');

      // Reload data
      loadSembakoData();
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('❌ Error deleting:', error);
    showErrorNotification(error.message || 'Terjadi kesalahan saat menghapus data');
  } finally {
    // Clear delete state
    currentDeleteId = null;
    currentDeleteType = null;
  }
}

function showSuccessNotification(message) {
  // Create Bootstrap toast notification
  const toastHtml = `
    <div class="toast align-items-center text-white bg-success border-0" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">
          <i class="bi bi-check-circle me-2"></i>${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  showToast(toastHtml);
}

function showErrorNotification(message) {
  const toastHtml = `
    <div class="toast align-items-center text-white bg-danger border-0" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">
          <i class="bi bi-exclamation-triangle me-2"></i>${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  showToast(toastHtml);
}

function showToast(html) {
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
  toastElement.innerHTML = html;
  toastContainer.appendChild(toastElement);

  const toast = new bootstrap.Toast(toastElement.querySelector('.toast'));
  toast.show();

  // Remove toast element after hidden
  toastElement.querySelector('.toast').addEventListener('hidden.bs.toast', () => {
    toastElement.remove();
  });
}

// Safe button click handlers
function handleEditClick(button) {
  const typeId = button.getAttribute('data-type-id');
  const typeName = button.getAttribute('data-type-name');
  const typeCode = button.getAttribute('data-type-code');
  const typeDesc = button.getAttribute('data-type-desc');
  const typeActive = button.getAttribute('data-type-active') === 'true';

  console.log('📝 Edit button clicked:', { typeId, typeName, typeCode, typeDesc, typeActive });

  const typeData = {
    pk: parseInt(typeId),
    name: typeName,
    code: typeCode,
    descriptions: typeDesc,
    is_active: typeActive
  };

  editType(typeData);
}

function handleDeleteClick(button) {
  const typeId = button.getAttribute('data-type-id');
  const typeName = button.getAttribute('data-type-name');

  console.log('🗑️ Delete button clicked:', { typeId, typeName });

  deleteType(parseInt(typeId), typeName);
}

// Test function for debugging modal
function testBootstrapModal() {
  console.log('🧪 TEST BUTTON CLICKED!');

  // Simple test first
  alert('Test button clicked! Check console for details.');

  console.log('🧪 Testing Bootstrap modal...');
  console.log('🔍 Bootstrap availability:', typeof bootstrap);

  if (typeof bootstrap === 'undefined') {
    console.error('❌ Bootstrap not loaded!');
    alert('Bootstrap tidak terload! Cek console untuk detail.');
    return;
  }

  try {
    const modalEl = document.getElementById('typeModal');
    console.log('🔍 Modal element:', modalEl);

    if (!modalEl) {
      console.error('❌ Modal element not found!');
      alert('Modal element not found!');
      return;
    }

    const modal = new bootstrap.Modal(modalEl);
    console.log('🔍 Modal instance created:', modal);

    modal.show();
    console.log('✅ Test modal opened successfully');
  } catch (error) {
    console.error('❌ Test modal failed:', error);
    alert('Modal test failed: ' + error.message);
  }
}

async function saveType(event) {
  event.preventDefault();

  const baseUrl = window.env?.VITE_API_URL || 'http://localhost:8000';
  const formData = {
    name: document.getElementById('typeName').value,
    code: document.getElementById('typeCode').value,
    descriptions: document.getElementById('typeDescription').value,
    is_active: document.getElementById('typeActive').checked
  };

  console.log('💾 Saving type:', formData);

  try {
    let url = `${baseUrl}/incentive/incentive-types`;
    let method = 'POST';
    let successMessage = 'Jenis sembako berhasil ditambahkan';

    // If editing, use PUT method with ID
    if (currentEditType) {
      url = `${baseUrl}/incentive/incentive-types/${currentEditType.pk}`;
      method = 'PUT';
      successMessage = 'Jenis sembako berhasil diperbarui';
    }

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
      credentials: 'include'
    });

    console.log(`${method} response status:`, response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('Save response:', result);

      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('typeModal'));
      if (modal) modal.hide();

      // Show success notification
      showSuccessNotification(result.message || successMessage);

      // Reload data
      loadSembakoData();
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('❌ Error saving type:', error);
    showErrorNotification(error.message || 'Terjadi kesalahan saat menyimpan data');
  }
}

async function loadSembakoData() {
  const baseUrl = window.env?.VITE_API_URL || 'http://localhost:8000';

  console.log('🚀 Starting API calls to:', baseUrl);

  try {
    // Construct endpoint URLs
    const endpoints = [
      `${baseUrl}/incentive/incentive-types`,
      `${baseUrl}/incentive/incentive-config`,
      `${baseUrl}/incentive/employee-incentives`
    ];

    console.log('🔄 Making parallel fetch requests...');
    const startTime = Date.now();

    // Fetch all data in parallel
    const [typesResponse, configsResponse, employeesResponse] = await Promise.all([
      fetch(endpoints[0]),
      fetch(endpoints[1]),
      fetch(endpoints[2])
    ]);

    const endTime = Date.now();
    console.log(`⏱️ Fetch requests completed in ${endTime - startTime}ms`);

    // Parse responses with error handling
    let types, configs, employees;

    try {
      types = typesResponse.ok ? await typesResponse.json() : { data: [] };
      console.log('✅ Types data parsed:', types);
    } catch (e) {
      console.error('❌ Error parsing types response:', e);
      types = { data: [] };
    }

    // Update tables with real data
    setTimeout(() => {
      updateTypesTable(types.data || []);
    }, 100);

  } catch (error) {
    console.error('❌ Network error loading sembako data:', error);
  }
}

function updateTypesTable(types) {
  const tbody = document.querySelector('#types-tab tbody');
  if (!tbody) {
    console.warn('❌ Types table tbody not found in DOM');
    return;
  }

  if (!types || types.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Tidak ada data jenis sembako</td></tr>';
    return;
  }

  tbody.innerHTML = types.map((type, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>
        <strong>${type.name || 'Unknown'}</strong>
      </td>
      <td>
        <small>${type.descriptions || 'Tidak ada deskripsi'}</small>
      </td>
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
                  data-type-active="${type.is_active || false}"
                  onclick="handleEditClick(this)">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-outline-danger btn-sm delete-btn"
                  data-type-id="${type.pk}"
                  data-type-name="${type.name || 'Unknown'}"
                  onclick="handleDeleteClick(this)">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}
