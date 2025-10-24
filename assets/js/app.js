function portalApp() {
    return {
        role: "",

        initPortal() {
            this.role = localStorage.getItem("user_roles");
            this.username = localStorage.getItem("username");
            this.userEmail = localStorage.getItem("email");

            // Cek dulu localStorage
            if (!this.role) {
                Swal.fire({
                    title: "Sesi Habis",
                    text: "Data login tidak ditemukan. Silakan login kembali.",
                    icon: "warning",
                    confirmButtonText: "Login Sekarang"
                }).then(() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = "index.html";
                });
                return;
            }

            // Lanjut cek session valid lewat API (bukan document.cookie)
            axios.get(`${env.API_URL}/auth/get-current-user`, { withCredentials: true })
                .then(res => {
                    const user = res.data;
                    this.username = user.username;
                    this.userEmail = user.email;
                    this.role = user.roles.join(",");
                })
                .catch(() => {
                    Swal.fire({
                        title: "Sesi Habis",
                        text: "Sesi Anda sudah berakhir. Silakan login kembali.",
                        icon: "warning",
                        confirmButtonText: "Login Sekarang"
                    }).then(() => {
                        localStorage.clear();
                        sessionStorage.clear();
                        window.location.href = "index.html";
                    });
                });
        },

        logout() {
            Swal.fire({
                title: "Konfirmasi Logout",
                text: "Apakah Anda yakin ingin keluar dari sistem?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#3085d6",
                confirmButtonText: "Ya, Logout",
                cancelButtonText: "Batal"
            }).then((result) => {
                if (result.isConfirmed) {
                    // Hapus localStorage & sessionStorage
                    localStorage.clear();
                    sessionStorage.clear();

                    // Hapus semua cookies termasuk access_token
                    document.cookie.split(";").forEach((c) => {
                        const eqPos = c.indexOf("=");
                        const name = eqPos > -1 ? c.substr(0, eqPos) : c;
                        document.cookie = `${name}=;expires=${new Date(0).toUTCString()};path=/`;
                    });

                    // Redirect ke halaman login
                    Swal.fire({
                        title: "Berhasil Logout",
                        text: "Anda telah keluar dari sistem.",
                        icon: "success",
                        timer: 1500,
                        showConfirmButton: false
                    }).then(() => {
                        window.location.href = "index.html";
                    });
                }
            });
        },

        canView(requiredRole) {
            if (this.role === "admin") return true;
            return this.role === requiredRole;
        },
    };
}

function userRolesTable() {
    return {
        users: [],
        search: '',
        limit: 10,
        offset: 0,
        total: 0,
        loading: false,

        searchEmployee: '',
        filteredEmployees: [],
        selectedEmployee: null,

        // --- DATA DUMMY APLIKASI + MODULES ---
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

        // --- DATA DUMMY ROLES ---
        allRoles: ["Superadmin", "Admin", "User"],

        // --- STATE TERPILIH ---
        selectedApps: [],
        selectedRoles: [],

        // --- LOAD USERS ---
        async loadData() {
            this.loading = true;
            try {
                const res = await fetch('./data/users.json');
                if (!res.ok) throw new Error('Gagal memuat users.json');
                const json = await res.json();

                let filtered = json.data;
                if (this.search) {
                    const term = this.search.toLowerCase();
                    filtered = filtered.filter(u =>
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

        // --- FILTER EMPLOYEE UNTUK FORM TAMBAH ---
        filterEmployees() {
            const term = this.searchEmployee.toLowerCase();
            this.filteredEmployees = this.users.filter(u =>
                u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
            );
        },

        selectEmployee(emp) {
            this.selectedEmployee = emp;
            this.searchEmployee = emp.name;
            this.filteredEmployees = [];
        },

        // --- SIMPAN ROLE BARU ---
        saveNewRole() {
            if (!this.selectedEmployee) return;
            const index = this.users.findIndex(u => u.id === this.selectedEmployee.id);
            if (index >= 0) {
                const newRoles = [];
                for (const app of this.selectedApps) {
                    for (const role of this.selectedRoles) {
                        newRoles.push(`${app}: ${role}`);
                    }
                }
                this.users[index].roles = Array.from(new Set([...this.users[index].roles, ...newRoles]));
            }
            alert(`Role baru berhasil ditambahkan untuk ${this.selectedEmployee.name}.`);
            this.resetForm();
        },

        // --- RESET FORM ---
        resetForm() {
            this.selectedEmployee = null;
            this.searchEmployee = '';
            this.selectedApps = [];
            this.selectedRoles = [];
        },

        // --- PAGINATION DAN SEARCH ---
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
        }
    }

}


// Re-init Alpine setelah HTMX swap konten baru
document.body.addEventListener('htmx:afterSwap', (e) => {
    if (e.detail.target.id === "main-content") {
        // Biar Alpine aktif di konten baru
        Alpine.flushAndStopDeferringMutations();
        Alpine.initTree(e.detail.target);
    }
});
