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
          this.setActiveNav({ currentTarget: document.querySelector(`[data-page="${e.state.page}"]`) }, e.state.page);
        }
      });
    },

    setActiveNav(event, page) {
      // Remove active class from all nav items
      document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
      });

      // Handle special case for Sembako (incentive submenu)
      if (page === 'sembako') {
        // Find and activate the incentive dropdown parent
        const incentiveDropdown = document.getElementById('incentiveDropdown').closest('.nav-item');
        if (incentiveDropdown) {
          incentiveDropdown.classList.add('active');
        }

        // Also add active to the clicked element if it's a nav item
        if (event.currentTarget && event.currentTarget.classList.contains('nav-item')) {
          event.currentTarget.classList.add('active');
        }
      } else {
        // Add active class to clicked item for normal navigation
        if (event.currentTarget) {
          event.currentTarget.classList.add('active');
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
      // Update URL without full page reload
      const url = new URL(window.location);
      url.searchParams.set('page', page);
      window.history.pushState({ page }, '', url);
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

          // Set active indicator
          if (savedPage === 'sembako') {
            const incentiveDropdown = document.getElementById('incentiveDropdown').closest('.nav-item');
            if (incentiveDropdown) {
              incentiveDropdown.classList.add('active');
            }
          } else {
            // Find the nav item for this page and activate it
            document.querySelectorAll('.nav-item').forEach(item => {
              const href = item.getAttribute('href') || item.getAttribute('hx-get');
              if (href && href.includes(savedPage)) {
                item.classList.add('active');
              }
            });
          }
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

      // Reload the current page content after a short delay
      setTimeout(() => {
        this.loadPageContent(currentPage);

        // Restore active indicator after content loads
        setTimeout(() => {
          if (currentPage === 'sembako') {
            const incentiveDropdown = document.getElementById('incentiveDropdown').closest('.nav-item');
            if (incentiveDropdown) {
              incentiveDropdown.classList.add('active');
            }
          }
        }, 100);
      }, 500);
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

// Re-init Alpine setelah HTMX swap konten baru
document.addEventListener("DOMContentLoaded", () => {
  if (document.body) {
    document.body.addEventListener("htmx:afterSwap", handleHtmxSwap);
  }

  function handleHtmxSwap(e) {
    if (e.detail.target.id === "main-content") {
      Alpine.flushAndStopDeferringMutations();
      Alpine.initTree(e.detail.target);
    }
  }

  // Store Alpine instances globally for onclick access
  setTimeout(() => {
    window.portalAppInstance = Alpine.data('portalApp');
    window.navigationHeaderInstance = Alpine.data('navigationHeader');
    console.log('✅ Alpine instances stored globally');
  }, 1000);
});
