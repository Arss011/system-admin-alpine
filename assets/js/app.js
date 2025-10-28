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

// Re-init Alpine setelah HTMX swap konten baru
document.body.addEventListener("htmx:afterSwap", (e) => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      document.body?.addEventListener("htmx:afterSwap", handleHtmxSwap);
    });
  } else {
    document.body?.addEventListener("htmx:afterSwap", handleHtmxSwap);
  }

  function handleHtmxSwap(e) {
    if (e.detail.target.id === "main-content") {
      Alpine.flushAndStopDeferringMutations();
      Alpine.initTree(e.detail.target);
    }
  }
});
