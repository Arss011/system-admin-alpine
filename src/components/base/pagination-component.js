/**
 * Base Pagination Component
 * Reusable pagination functionality for all tables
 * Supports server-side and client-side pagination
 */

class PaginationComponent {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      limit: options.limit || 10,
      page: options.page || 1,
      totalItems: options.totalItems || 0,
      totalPages: options.totalPages || 0,
      hasPrev: options.hasPrev || false,
      hasNext: options.hasNext || false,
      onPageChange: options.onPageChange || (() => {}),
      onLimitChange: options.onLimitChange || (() => {}),
      showLimitSelector: options.showLimitSelector !== false,
      showInfo: options.showInfo !== false,
      ...options
    };

    this.paginationInfo = {
      currentPage: this.options.page,
      currentLimit: this.options.limit,
      startItem: 0,
      endItem: 0,
      totalItems: this.options.totalItems,
      totalPages: this.options.totalPages
    };

    console.log('🔧 PaginationComponent: Initialized', this.options);
    this.render();
  }

  /**
   * Update pagination data and re-render
   * @param {Object} paginationData - Pagination data from API
   */
  update(paginationData) {
    console.log('📄 Updating pagination with data:', paginationData);

    this.paginationInfo = {
      currentPage: paginationData.page || paginationData.pagination?.page || this.paginationInfo.currentPage,
      currentLimit: paginationData.limit || paginationData.pagination?.limit || this.paginationInfo.currentLimit,
      startItem: this.calculateStartItem(paginationData),
      endItem: this.calculateEndItem(paginationData),
      totalItems: paginationData.total_items || paginationData.pagination?.total_items || 0,
      totalPages: paginationData.total_pages || paginationData.pagination?.total_pages || 0
    };

    this.options = {
      ...this.options,
      ...paginationData,
      limit: this.paginationInfo.currentLimit,
      page: this.paginationInfo.currentPage
    };

    this.render();
  }

  /**
   * Render pagination component
   */
  render() {
    const { showLimitSelector, showInfo } = this.options;
    const { currentPage, totalPages, totalItems } = this.paginationInfo;

    if (totalPages <= 1 && !showLimitSelector && !showInfo) {
      this.container.innerHTML = '';
      return;
    }

    const html = `
      <div class="pagination-wrapper d-flex justify-content-between align-items-center flex-wrap gap-3">
        ${showInfo ? this.renderInfo() : ''}
        ${showLimitSelector ? this.renderLimitSelector() : ''}
        ${this.renderPageNumbers()}
      </div>
    `;

    this.container.innerHTML = html;
    this.bindEvents();
  }

  /**
   * Render pagination info
   * @private
   */
  renderInfo() {
    const { startItem, endItem, totalItems, currentPage } = this.paginationInfo;

    if (totalItems === 0) {
      return `
        <div class="pagination-info text-muted">
          <small>Tidak ada data</small>
        </div>
      `;
    }

    return `
      <div class="pagination-info text-muted">
        <small>
          Menampilkan ${startItem}-${endItem} dari ${totalItems} data
          ${totalPages > 1 ? `(Halaman ${currentPage} dari ${totalPages})` : ''}
        </small>
      </div>
    `;
  }

  /**
   * Render limit selector
   * @private
   */
  renderLimitSelector() {
    const { currentLimit } = this.paginationInfo;
    const limits = [5, 10, 20, 50, 100];

    return `
      <div class="pagination-limit d-flex align-items-center gap-2">
        <label class="form-label mb-0 small">Tampilkan:</label>
        <select class="form-select form-select-sm" style="width: auto;">
          ${limits.map(limit => `
            <option value="${limit}" ${limit === currentLimit ? 'selected' : ''}>
              ${limit}
            </option>
          `).join('')}
        </select>
      </div>
    `;
  }

  /**
   * Render page numbers
   * @private
   */
  renderPageNumbers() {
    const { currentPage, totalPages } = this.paginationInfo;

    if (totalPages <= 1) {
      return '';
    }

    let pages = this.generatePageNumbers(currentPage, totalPages);

    return `
      <nav aria-label="Page navigation">
        <ul class="pagination pagination-sm mb-0">
          ${this.renderPreviousButton(currentPage)}
          ${pages.map(page => this.renderPageButton(page, currentPage)).join('')}
          ${this.renderNextButton(currentPage, totalPages)}
        </ul>
      </nav>
    `;
  }

  /**
   * Generate page numbers array with ellipsis
   * @private
   * @param {number} currentPage
   * @param {number} totalPages
   * @returns {Array}
   */
  generatePageNumbers(currentPage, totalPages) {
    const pages = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always include first page
      pages.push(1);

      // Calculate range around current page
      const start = Math.max(2, currentPage - 2);
      const end = Math.min(totalPages - 1, currentPage + 2);

      // Add ellipsis if needed before range
      if (start > 2) {
        pages.push('...');
      }

      // Add range around current page
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis if needed after range
      if (end < totalPages - 1) {
        pages.push('...');
      }

      // Always include last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  }

  /**
   * Render previous button
   * @private
   */
  renderPreviousButton(currentPage) {
    const disabled = currentPage <= 1;

    return `
      <li class="page-item ${disabled ? 'disabled' : ''}">
        <a class="page-link" href="#" ${disabled ? 'tabindex="-1" aria-disabled="true"' : ''}>
          <i class="bi bi-chevron-left"></i>
          <span class="sr-only">Previous</span>
        </a>
      </li>
    `;
  }

  /**
   * Render next button
   * @private
   */
  renderNextButton(currentPage, totalPages) {
    const disabled = currentPage >= totalPages;

    return `
      <li class="page-item ${disabled ? 'disabled' : ''}">
        <a class="page-link" href="#" ${disabled ? 'tabindex="-1" aria-disabled="true"' : ''}>
          <span class="sr-only">Next</span>
          <i class="bi bi-chevron-right"></i>
        </a>
      </li>
    `;
  }

  /**
   * Render page button
   * @private
   */
  renderPageButton(page, currentPage) {
    if (page === '...') {
      return `
        <li class="page-item disabled">
          <span class="page-link">...</span>
        </li>
      `;
    }

    const active = page === currentPage;

    return `
      <li class="page-item ${active ? 'active' : ''}">
        <a class="page-link" href="#" ${active ? 'aria-current="page"' : ''}>
          ${page}
        </a>
      </li>
    `;
  }

  /**
   * Calculate start item number
   * @private
   */
  calculateStartItem(paginationData) {
    const page = paginationData.page || paginationData.pagination?.page || this.paginationInfo.currentPage;
    const limit = paginationData.limit || paginationData.pagination?.limit || this.paginationInfo.currentLimit;
    const totalItems = paginationData.total_items || paginationData.pagination?.total_items || 0;

    if (totalItems === 0) return 0;

    return ((page - 1) * limit) + 1;
  }

  /**
   * Calculate end item number
   * @private
   */
  calculateEndItem(paginationData) {
    const page = paginationData.page || paginationData.pagination?.page || this.paginationInfo.currentPage;
    const limit = paginationData.limit || paginationData.pagination?.limit || this.paginationInfo.currentLimit;
    const totalItems = paginationData.total_items || paginationData.pagination?.total_items || 0;

    if (totalItems === 0) return 0;

    const end = page * limit;
    return Math.min(end, totalItems);
  }

  /**
   * Bind event listeners
   * @private
   */
  bindEvents() {
    // Page number clicks
    this.container.addEventListener('click', (e) => {
      e.preventDefault();

      const pageLink = e.target.closest('.page-link');
      if (!pageLink) return;

      const pageItem = pageLink.closest('.page-item');
      if (!pageItem || pageItem.classList.contains('disabled') || pageItem.classList.contains('active')) {
        return;
      }

      // Handle previous/next buttons
      if (e.target.closest('.bi-chevron-left')) {
        this.goToPage(this.paginationInfo.currentPage - 1);
        return;
      }

      if (e.target.closest('.bi-chevron-right')) {
        this.goToPage(this.paginationInfo.currentPage + 1);
        return;
      }

      // Handle page number clicks
      const pageText = pageLink.textContent.trim();
      const pageNum = parseInt(pageText);

      if (!isNaN(pageNum)) {
        this.goToPage(pageNum);
      }
    });

    // Limit selector change
    const limitSelect = this.container.querySelector('.form-select');
    if (limitSelect) {
      limitSelect.addEventListener('change', (e) => {
        const newLimit = parseInt(e.target.value);
        this.changeLimit(newLimit);
      });
    }
  }

  /**
   * Go to specific page
   * @param {number} page - Page number
   */
  goToPage(page) {
    if (page < 1 || page > this.paginationInfo.totalPages) {
      return;
    }

    console.log('📄 Going to page:', page);
    this.options.onPageChange(page);
  }

  /**
   * Change page limit
   * @param {number} limit - New limit
   */
  changeLimit(limit) {
    if (limit === this.paginationInfo.currentLimit) {
      return;
    }

    console.log('📄 Changing limit to:', limit);
    this.options.onLimitChange(limit);
  }

  /**
   * Get current pagination state
   * @returns {Object} Current pagination state
   */
  getState() {
    return {
      ...this.paginationInfo,
      hasPrev: this.paginationInfo.currentPage > 1,
      hasNext: this.paginationInfo.currentPage < this.paginationInfo.totalPages
    };
  }

  /**
   * Reset pagination to first page
   */
  reset() {
    this.goToPage(1);
  }

  /**
   * Destroy component
   */
  destroy() {
    this.container.innerHTML = '';
  }

  /**
   * Static method to create pagination instance
   * @param {string|HTMLElement} container - Container element or selector
   * @param {Object} options - Configuration options
   * @returns {PaginationComponent} Pagination instance
   */
  static create(container, options = {}) {
    const element = typeof container === 'string' ? document.querySelector(container) : container;
    if (!element) {
      throw new Error('Pagination container not found');
    }

    return new PaginationComponent(element, options);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PaginationComponent;
} else {
  window.PaginationComponent = PaginationComponent;
}