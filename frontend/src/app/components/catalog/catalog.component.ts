import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Book, Category, BookQueryParams } from '../../models/library.models';
import { LibraryService } from '../../services/library.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { BookModalComponent } from '../book-modal/book-modal.component';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, BookModalComponent],
  template: `
    <div class="catalog-page">
      <!-- Hero Search Banner -->
      <div class="hero-banner glass-panel">
        <div class="hero-content">
          <div class="hero-badge">
            <span class="sparkle">✦</span> Comprehensive Digital Catalog
          </div>
          <h1>Explore Knowledge & Literature</h1>
          <p class="hero-desc">Discover curated collections, system architectures, scientific classics, and bestsellers.</p>
          
          <div class="search-bar-wrap">
            <input 
              type="text" 
              class="hero-search-input" 
              placeholder="Search by title, author name, or ISBN..." 
              [(ngModel)]="searchTerm" 
              (keyup.enter)="applyFilters()" />
            <button class="btn btn-primary search-submit-btn" (click)="applyFilters()">
              Search Catalog
            </button>
          </div>
        </div>
      </div>

      <!-- Filters & Toolbar -->
      <div class="toolbar-section">
        <!-- Category Pills -->
        <div class="category-pills">
          <button 
            class="pill-btn" 
            [class.active]="selectedCategoryId() === undefined" 
            (click)="selectCategory(undefined)">
            All Categories
          </button>
          @for (cat of categories(); track cat.id) {
            <button 
              class="pill-btn" 
              [class.active]="selectedCategoryId() === cat.id" 
              (click)="selectCategory(cat.id)">
              {{ cat.name }} <span class="pill-count">({{ cat.bookCount }})</span>
            </button>
          }
        </div>

        <!-- Controls Row -->
        <div class="controls-row">
          <div class="filters-left">
            <label class="toggle-control">
              <input type="checkbox" [(ngModel)]="availableOnly" (change)="applyFilters()" />
              <span class="toggle-label">In-Stock Only</span>
            </label>

            <select class="form-select select-compact" [(ngModel)]="sortBy" (change)="applyFilters()">
              <option value="title">Sort: Title</option>
              <option value="author">Sort: Author</option>
              <option value="year">Sort: Published Year</option>
              <option value="available">Sort: Availability</option>
            </select>
          </div>

          <div class="actions-right">
            @if (authService.isStaff()) {
              <button class="btn btn-primary btn-sm" (click)="openAddModal()">
                <span>+</span> Add New Book
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Catalog Grid -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading library collection...</p>
        </div>
      } @else if (books().length === 0) {
        <div class="empty-state glass-panel">
          <div class="empty-icon">📖</div>
          <h3>No books match your search</h3>
          <p>Try searching with another keyword or resetting the category filter.</p>
          <button class="btn btn-secondary btn-sm" (click)="resetFilters()">Clear Filters</button>
        </div>
      } @else {
        <div class="books-grid">
          @for (book of books(); track book.id) {
            <div class="book-card glass-panel glass-panel-hover">
              <div class="card-cover-wrap">
                <img [src]="book.coverImageUrl || defaultCover" [alt]="book.title" class="book-cover-img" (error)="onImageFallback($event)" />
                <div class="stock-badge" [ngClass]="book.availableCopies > 0 ? 'in-stock' : 'out-of-stock'">
                  {{ book.availableCopies > 0 ? book.availableCopies + ' / ' + book.totalCopies + ' Available' : 'On Loan' }}
                </div>
                <div class="category-tag">{{ book.categoryName }}</div>
              </div>

              <div class="card-body">
                <h3 class="book-title" [title]="book.title">{{ book.title }}</h3>
                <p class="book-author">by {{ book.authorName }}</p>
                <p class="book-desc">{{ book.description }}</p>

                <div class="book-meta">
                  <div class="meta-item">
                    <span class="meta-key">ISBN:</span>
                    <span class="meta-val font-mono">{{ book.isbn }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-key">Location:</span>
                    <span class="meta-val">{{ book.shelfLocation }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-key">Year:</span>
                    <span class="meta-val">{{ book.publishedYear }}</span>
                  </div>
                </div>

                <div class="card-actions">
                  @if (book.availableCopies > 0) {
                    <button class="btn btn-primary btn-sm flex-1" (click)="handleBorrow(book)">
                      Borrow Book
                    </button>
                  } @else {
                    <button class="btn btn-secondary btn-sm flex-1" (click)="handleReserve(book)">
                      Reserve Hold
                    </button>
                  }

                  @if (authService.isStaff()) {
                    <button class="btn btn-outline btn-sm" title="Edit book" (click)="openEditModal(book)">
                      ✎
                    </button>
                  }

                  @if (authService.isAdmin()) {
                    <button class="btn btn-outline btn-sm btn-trash" title="Delete book" (click)="handleDelete(book)">
                      ✕
                    </button>
                  }
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Pagination Controls -->
        @if (totalPages() > 1) {
          <div class="pagination-wrap">
            <button class="btn btn-secondary btn-sm" [disabled]="currentPage() === 1" (click)="goToPage(currentPage() - 1)">
              Previous
            </button>
            <span class="page-indicator">
              Page {{ currentPage() }} of {{ totalPages() }} ({{ totalCount() }} Books)
            </span>
            <button class="btn btn-secondary btn-sm" [disabled]="currentPage() === totalPages()" (click)="goToPage(currentPage() + 1)">
              Next
            </button>
          </div>
        }
      }

      <!-- Book Modal Component -->
      @if (showBookModal()) {
        <app-book-modal 
          [book]="editingBook()" 
          (close)="showBookModal.set(false)" 
          (saved)="onBookSaved()" />
      }
    </div>
  `,
  styles: [`
    .catalog-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .hero-banner {
      padding: 3rem 2rem;
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(99, 102, 241, 0.25);
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.7) 100%);
    }
    .hero-content {
      max-width: 720px;
      margin: 0 auto;
      text-align: center;
      position: relative;
      z-index: 1;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3);
      padding: 0.35rem 0.85rem;
      border-radius: var(--radius-full);
      font-size: 0.8rem;
      font-weight: 600;
      color: #a5b4fc;
      margin-bottom: 1rem;
    }
    .sparkle { color: #f59e0b; }
    .hero-content h1 {
      font-size: 2.5rem;
      line-height: 1.15;
      margin-bottom: 0.75rem;
      background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-desc {
      color: var(--text-secondary);
      font-size: 1.05rem;
      margin-bottom: 2rem;
    }
    .search-bar-wrap {
      display: flex;
      gap: 0.75rem;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(99, 102, 241, 0.4);
      padding: 0.5rem;
      border-radius: var(--radius-xl);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(99, 102, 241, 0.2);
    }
    .hero-search-input {
      flex: 1;
      background: transparent;
      border: none;
      color: #fff;
      font-size: 1rem;
      padding: 0.5rem 1rem;
      outline: none;
      font-family: inherit;
    }
    .search-submit-btn {
      border-radius: var(--radius-lg);
    }

    /* Toolbar */
    .toolbar-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .category-pills {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
    }
    .pill-btn {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      padding: 0.45rem 0.95rem;
      border-radius: var(--radius-full);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
    }
    .pill-btn:hover {
      background: rgba(99, 102, 241, 0.15);
      color: #fff;
      border-color: rgba(99, 102, 241, 0.3);
    }
    .pill-btn.active {
      background: var(--primary);
      color: #fff;
      border-color: var(--primary);
      box-shadow: 0 2px 10px var(--primary-glow);
    }
    .pill-count {
      opacity: 0.75;
      font-size: 0.72rem;
    }

    .controls-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .filters-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .toggle-control {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.825rem;
      color: var(--text-secondary);
      cursor: pointer;
    }
    .toggle-control input {
      accent-color: var(--primary);
      cursor: pointer;
    }
    .select-compact {
      width: auto;
      padding: 0.4rem 0.8rem;
      font-size: 0.8rem;
    }

    /* Grid */
    .books-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    .book-card {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .card-cover-wrap {
      position: relative;
      height: 200px;
      overflow: hidden;
      background: #0f172a;
    }
    .book-cover-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    .book-card:hover .book-cover-img {
      transform: scale(1.05);
    }
    .stock-badge {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.25rem 0.6rem;
      border-radius: var(--radius-full);
      backdrop-filter: blur(8px);
    }
    .stock-badge.in-stock {
      background: rgba(16, 185, 129, 0.85);
      color: #fff;
    }
    .stock-badge.out-of-stock {
      background: rgba(239, 68, 68, 0.85);
      color: #fff;
    }
    .category-tag {
      position: absolute;
      bottom: 0.75rem;
      left: 0.75rem;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
    }

    .card-body {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .book-title {
      font-size: 1.05rem;
      line-height: 1.35;
      margin-bottom: 0.25rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .book-author {
      font-size: 0.825rem;
      color: var(--secondary);
      font-weight: 600;
      margin-bottom: 0.65rem;
    }
    .book-desc {
      font-size: 0.8rem;
      color: var(--text-secondary);
      line-height: 1.45;
      margin-bottom: 1rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      flex: 1;
    }
    .book-meta {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-subtle);
      margin-bottom: 1rem;
      font-size: 0.75rem;
    }
    .meta-item {
      display: flex;
      justify-content: space-between;
    }
    .meta-key { color: var(--text-muted); }
    .meta-val { color: var(--text-primary); font-weight: 500; }
    .font-mono { font-family: var(--font-mono); font-size: 0.7rem; }
    .card-actions {
      display: flex;
      gap: 0.5rem;
    }
    .flex-1 { flex: 1; }
    .btn-trash:hover {
      border-color: var(--danger);
      color: #f87171;
    }

    /* Empty & Loading states */
    .loading-state, .empty-state {
      text-align: center;
      padding: 4rem 2rem;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(99, 102, 241, 0.2);
      border-top-color: var(--primary);
      border-radius: 50%;
      margin: 0 auto 1rem;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
    .empty-state h3 { font-size: 1.25rem; margin-bottom: 0.5rem; }
    .empty-state p { color: var(--text-secondary); margin-bottom: 1.25rem; }

    /* Pagination */
    .pagination-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
      margin-top: 1rem;
    }
    .page-indicator {
      font-size: 0.85rem;
      color: var(--text-secondary);
      font-weight: 500;
    }
  `]
})
export class CatalogComponent implements OnInit {
  libraryService = inject(LibraryService);
  authService = inject(AuthService);
  toastService = inject(ToastService);

  books = signal<Book[]>([]);
  categories = signal<Category[]>([]);
  loading = signal<boolean>(false);

  searchTerm = '';
  selectedCategoryId = signal<number | undefined>(undefined);
  availableOnly = false;
  sortBy = 'title';
  currentPage = signal<number>(1);
  pageSize = 12;
  totalCount = signal<number>(0);
  totalPages = signal<number>(1);

  showBookModal = signal<boolean>(false);
  editingBook = signal<Book | null>(null);

  defaultCover = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60';

  ngOnInit(): void {
    this.loadCategories();
    this.loadBooks();
  }

  loadCategories(): void {
    this.libraryService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats)
    });
  }

  loadBooks(): void {
    this.loading.set(true);
    const params: BookQueryParams = {
      search: this.searchTerm.trim() || undefined,
      categoryId: this.selectedCategoryId(),
      availableOnly: this.availableOnly ? true : undefined,
      sortBy: this.sortBy,
      pageNumber: this.currentPage(),
      pageSize: this.pageSize
    };

    this.libraryService.getBooks(params).subscribe({
      next: (res) => {
        this.books.set(res.items);
        this.totalCount.set(res.totalCount);
        this.totalPages.set(res.totalPages || 1);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Failed to load catalog books.');
        this.loading.set(false);
      }
    });
  }

  selectCategory(catId: number | undefined): void {
    this.selectedCategoryId.set(catId);
    this.currentPage.set(1);
    this.loadBooks();
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadBooks();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedCategoryId.set(undefined);
    this.availableOnly = false;
    this.sortBy = 'title';
    this.currentPage.set(1);
    this.loadBooks();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadBooks();
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }
  }

  onImageFallback(event: Event): void {
    (event.target as HTMLImageElement).src = this.defaultCover;
  }

  handleBorrow(book: Book): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.toastService.info('Please sign in or use 1-click Demo Account to borrow books.');
      return;
    }

    this.libraryService.borrowBook({ bookId: book.id, userId: user.id, dueDays: 14 }).subscribe({
      next: () => {
        this.toastService.success(`"${book.title}" successfully borrowed! Due in 14 days.`);
        this.loadBooks();
        this.loadCategories();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Could not borrow book.');
      }
    });
  }

  handleReserve(book: Book): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.toastService.info('Please sign in or use 1-click Demo Account to place hold reservations.');
      return;
    }

    this.libraryService.reserveBook({ bookId: book.id, userId: user.id }).subscribe({
      next: () => {
        this.toastService.success(`Reservation placed for "${book.title}". You will be notified upon return.`);
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Could not place reservation.');
      }
    });
  }

  openAddModal(): void {
    this.editingBook.set(null);
    this.showBookModal.set(true);
  }

  openEditModal(book: Book): void {
    this.editingBook.set(book);
    this.showBookModal.set(true);
  }

  onBookSaved(): void {
    this.loadBooks();
    this.loadCategories();
  }

  handleDelete(book: Book): void {
    if (confirm(`Are you sure you want to delete "${book.title}"?`)) {
      this.libraryService.deleteBook(book.id).subscribe({
        next: () => {
          this.toastService.success(`"${book.title}" deleted.`);
          this.loadBooks();
          this.loadCategories();
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Could not delete book.');
        }
      });
    }
  }
}
