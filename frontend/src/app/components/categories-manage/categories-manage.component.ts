import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Author, Category } from '../../models/library.models';
import { LibraryService } from '../../services/library.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-categories-manage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="manage-page">
      <div class="page-title-row">
        <div>
          <h2>Taxonomy & Author Directory</h2>
          <p class="subtitle">Organize classification categories and manage world author biographies.</p>
        </div>
      </div>

      <div class="dual-grid">
        <!-- Categories Column -->
        <div class="glass-panel col-box">
          <div class="col-header">
            <h3>Classification Categories</h3>
            <button class="btn btn-primary btn-sm" (click)="openAddCategory()">+ Add Category</button>
          </div>

          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Description</th>
                  <th>Books</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (cat of categories(); track cat.id) {
                  <tr>
                    <td class="font-bold">{{ cat.name }}</td>
                    <td class="desc-cell">{{ cat.description || '—' }}</td>
                    <td><span class="badge badge-primary">{{ cat.bookCount }} titles</span></td>
                    <td>
                      <div class="row-actions">
                        <button class="btn btn-outline btn-sm" (click)="openEditCategory(cat)">Edit</button>
                        @if (authService.isAdmin() && cat.bookCount === 0) {
                          <button class="btn btn-outline btn-sm btn-trash" (click)="deleteCategory(cat)">✕</button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Authors Column -->
        <div class="glass-panel col-box">
          <div class="col-header">
            <h3>Author Directory</h3>
            <button class="btn btn-secondary btn-sm" (click)="openAddAuthor()">+ Add Author</button>
          </div>

          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Author Name</th>
                  <th>Nationality</th>
                  <th>Catalog Books</th>
                </tr>
              </thead>
              <tbody>
                @for (author of authors(); track author.id) {
                  <tr>
                    <td class="font-bold">{{ author.name }}</td>
                    <td>{{ author.nationality || '—' }}</td>
                    <td><span class="badge badge-info">{{ author.bookCount }} titles</span></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Category Modal -->
      @if (showCategoryModal()) {
        <div class="modal-overlay" (click)="onCatOverlay($event)">
          <div class="modal-card">
            <div class="modal-header">
              <h3>{{ editingCat ? 'Edit Category' : 'New Classification Category' }}</h3>
              <button class="close-btn" (click)="showCategoryModal.set(false)">&times;</button>
            </div>
            <div class="modal-body">
              <form (ngSubmit)="saveCategory()">
                <div class="form-group">
                  <label class="form-label">Category Name *</label>
                  <input type="text" class="form-input" [(ngModel)]="catName" name="name" required placeholder="e.g. Distributed Systems" />
                </div>
                <div class="form-group">
                  <label class="form-label">Description</label>
                  <textarea class="form-textarea" rows="3" [(ngModel)]="catDesc" name="desc" placeholder="Scope and subject boundaries..."></textarea>
                </div>
                <div class="modal-footer" style="padding-right:0; padding-bottom:0;">
                  <button type="button" class="btn btn-secondary" (click)="showCategoryModal.set(false)">Cancel</button>
                  <button type="submit" class="btn btn-primary">Save Category</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }

      <!-- Author Modal -->
      @if (showAuthorModal()) {
        <div class="modal-overlay" (click)="onAuthorOverlay($event)">
          <div class="modal-card">
            <div class="modal-header">
              <h3>Add New Author</h3>
              <button class="close-btn" (click)="showAuthorModal.set(false)">&times;</button>
            </div>
            <div class="modal-body">
              <form (ngSubmit)="saveAuthor()">
                <div class="form-group">
                  <label class="form-label">Author Name *</label>
                  <input type="text" class="form-input" [(ngModel)]="authorName" name="name" required placeholder="e.g. Donald Knuth" />
                </div>
                <div class="form-group">
                  <label class="form-label">Nationality</label>
                  <input type="text" class="form-input" [(ngModel)]="authorNat" name="nat" placeholder="e.g. American" />
                </div>
                <div class="form-group">
                  <label class="form-label">Biography</label>
                  <textarea class="form-textarea" rows="3" [(ngModel)]="authorBio" name="bio" placeholder="Academic background and key works..."></textarea>
                </div>
                <div class="modal-footer" style="padding-right:0; padding-bottom:0;">
                  <button type="button" class="btn btn-secondary" (click)="showAuthorModal.set(false)">Cancel</button>
                  <button type="submit" class="btn btn-primary">Save Author</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .manage-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .subtitle { color: var(--text-secondary); font-size: 0.85rem; margin-top: 0.2rem; }
    .dual-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    @media (max-width: 900px) {
      .dual-grid { grid-template-columns: 1fr; }
    }
    .col-box {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .col-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .font-bold { font-weight: 600; color: #fff; }
    .desc-cell {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 0.8rem;
      color: var(--text-secondary);
    }
    .row-actions { display: flex; gap: 0.35rem; }
    .btn-trash:hover { border-color: var(--danger); color: #f87171; }
    .close-btn { background: none; border: none; color: var(--text-secondary); font-size: 1.5rem; cursor: pointer; }
    .close-btn:hover { color: #fff; }
  `]
})
export class CategoriesManageComponent implements OnInit {
  libraryService = inject(LibraryService);
  toastService = inject(ToastService);
  authService = inject(AuthService);

  categories = signal<Category[]>([]);
  authors = signal<Author[]>([]);

  showCategoryModal = signal<boolean>(false);
  editingCat: Category | null = null;
  catName = '';
  catDesc = '';

  showAuthorModal = signal<boolean>(false);
  authorName = '';
  authorNat = '';
  authorBio = '';

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.libraryService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats)
    });
    this.libraryService.getAuthors().subscribe({
      next: (auths) => this.authors.set(auths)
    });
  }

  openAddCategory(): void {
    this.editingCat = null;
    this.catName = '';
    this.catDesc = '';
    this.showCategoryModal.set(true);
  }

  openEditCategory(cat: Category): void {
    this.editingCat = cat;
    this.catName = cat.name;
    this.catDesc = cat.description || '';
    this.showCategoryModal.set(true);
  }

  onCatOverlay(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.showCategoryModal.set(false);
    }
  }

  saveCategory(): void {
    if (!this.catName) {
      this.toastService.warning('Category name is required.');
      return;
    }

    if (this.editingCat) {
      this.libraryService.updateCategory(this.editingCat.id, { name: this.catName, description: this.catDesc }).subscribe({
        next: () => {
          this.toastService.success(`Category "${this.catName}" updated.`);
          this.showCategoryModal.set(false);
          this.loadData();
        },
        error: (err) => this.toastService.error(err.error?.message || 'Failed to update category.')
      });
    } else {
      this.libraryService.createCategory({ name: this.catName, description: this.catDesc }).subscribe({
        next: () => {
          this.toastService.success(`Category "${this.catName}" created.`);
          this.showCategoryModal.set(false);
          this.loadData();
        },
        error: (err) => this.toastService.error(err.error?.message || 'Failed to create category.')
      });
    }
  }

  deleteCategory(cat: Category): void {
    if (confirm(`Delete category "${cat.name}"?`)) {
      this.libraryService.deleteCategory(cat.id).subscribe({
        next: () => {
          this.toastService.success(`Category deleted.`);
          this.loadData();
        },
        error: (err) => this.toastService.error(err.error?.message || 'Failed to delete category.')
      });
    }
  }

  openAddAuthor(): void {
    this.authorName = '';
    this.authorNat = '';
    this.authorBio = '';
    this.showAuthorModal.set(true);
  }

  onAuthorOverlay(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.showAuthorModal.set(false);
    }
  }

  saveAuthor(): void {
    if (!this.authorName) {
      this.toastService.warning('Author name is required.');
      return;
    }

    this.libraryService.createAuthor({ name: this.authorName, nationality: this.authorNat, biography: this.authorBio }).subscribe({
      next: () => {
        this.toastService.success(`Author "${this.authorName}" added.`);
        this.showAuthorModal.set(false);
        this.loadData();
      },
      error: (err) => this.toastService.error(err.error?.message || 'Failed to create author.')
    });
  }
}
