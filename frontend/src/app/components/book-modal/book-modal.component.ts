import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Author, Book, Category } from '../../models/library.models';
import { LibraryService } from '../../services/library.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-book-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="onOverlayClick($event)">
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <h3>{{ book ? 'Edit Book Details' : 'Add New Book to Catalog' }}</h3>
            <p class="subtitle">{{ book ? 'Update inventory and catalog metadata' : 'Fill in the book details to expand library collection' }}</p>
          </div>
          <button class="close-btn" (click)="close.emit()">&times;</button>
        </div>

        <div class="modal-body">
          <form (ngSubmit)="saveBook()">
            <div class="form-row">
              <div class="form-group flex-2">
                <label class="form-label">Book Title *</label>
                <input type="text" class="form-input" [(ngModel)]="formData.title" name="title" required placeholder="e.g. Clean Code" />
              </div>
              <div class="form-group flex-1">
                <label class="form-label">ISBN *</label>
                <input type="text" class="form-input" [(ngModel)]="formData.isbn" name="isbn" required placeholder="978-0132350884" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label">Author *</label>
                <select class="form-select" [(ngModel)]="formData.authorId" name="authorId" required>
                  <option [ngValue]="undefined" disabled>Select Author</option>
                  @for (author of authors(); track author.id) {
                    <option [ngValue]="author.id">{{ author.name }}</option>
                  }
                </select>
              </div>
              <div class="form-group flex-1">
                <label class="form-label">Category *</label>
                <select class="form-select" [(ngModel)]="formData.categoryId" name="categoryId" required>
                  <option [ngValue]="undefined" disabled>Select Category</option>
                  @for (cat of categories(); track cat.id) {
                    <option [ngValue]="cat.id">{{ cat.name }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea class="form-textarea" rows="3" [(ngModel)]="formData.description" name="description" placeholder="Summary and key themes..."></textarea>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label">Published Year</label>
                <input type="number" class="form-input" [(ngModel)]="formData.publishedYear" name="publishedYear" />
              </div>
              <div class="form-group flex-1">
                <label class="form-label">Edition</label>
                <input type="text" class="form-input" [(ngModel)]="formData.edition" name="edition" placeholder="e.g. 2nd Edition" />
              </div>
              <div class="form-group flex-1">
                <label class="form-label">Shelf Location</label>
                <input type="text" class="form-input" [(ngModel)]="formData.shelfLocation" name="shelfLocation" placeholder="Stack A-12" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label">Total Copies</label>
                <input type="number" class="form-input" min="1" [(ngModel)]="formData.totalCopies" name="totalCopies" (change)="onTotalCopiesChange()" />
              </div>
              @if (book) {
                <div class="form-group flex-1">
                  <label class="form-label">Available Copies</label>
                  <input type="number" class="form-input" min="0" [(ngModel)]="formData.availableCopies" name="availableCopies" />
                </div>
              }
            </div>

            <div class="form-group">
              <label class="form-label">Cover Image URL</label>
              <input type="url" class="form-input" [(ngModel)]="formData.coverImageUrl" name="coverImageUrl" placeholder="https://images.unsplash.com/..." />
            </div>

            @if (formData.coverImageUrl) {
              <div class="preview-box">
                <span class="preview-label">Image Preview:</span>
                <img [src]="formData.coverImageUrl" alt="Cover Preview" class="preview-img" (error)="onImageError($event)" />
              </div>
            }

            <div class="modal-footer" style="padding-right:0; padding-bottom:0;">
              <button type="button" class="btn btn-secondary" (click)="close.emit()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving()">
                {{ saving() ? 'Saving...' : (book ? 'Update Book' : 'Add Book') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .subtitle { font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.2rem; }
    .close-btn { background: none; border: none; color: var(--text-secondary); font-size: 1.5rem; cursor: pointer; }
    .close-btn:hover { color: #fff; }
    .form-row { display: flex; gap: 1rem; }
    .flex-1 { flex: 1; }
    .flex-2 { flex: 2; }
    .preview-box {
      margin-bottom: 1.25rem;
      padding: 0.75rem;
      background: rgba(0, 0, 0, 0.3);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .preview-label { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }
    .preview-img { width: 45px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-subtle); }
  `]
})
export class BookModalComponent implements OnInit {
  @Input() book: Book | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private libraryService = inject(LibraryService);
  private toastService = inject(ToastService);

  categories = signal<Category[]>([]);
  authors = signal<Author[]>([]);
  saving = signal<boolean>(false);

  formData: Partial<Book> = {
    title: '',
    isbn: '',
    description: '',
    authorId: undefined,
    categoryId: undefined,
    publishedYear: 2026,
    edition: '1st Edition',
    shelfLocation: 'Stack A-01',
    coverImageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60',
    totalCopies: 3,
    availableCopies: 3
  };

  ngOnInit(): void {
    this.loadDropdownData();
    if (this.book) {
      this.formData = { ...this.book };
    }
  }

  loadDropdownData(): void {
    this.libraryService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats)
    });
    this.libraryService.getAuthors().subscribe({
      next: (auths) => this.authors.set(auths)
    });
  }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close.emit();
    }
  }

  onTotalCopiesChange(): void {
    if (!this.book && this.formData.totalCopies) {
      this.formData.availableCopies = this.formData.totalCopies;
    }
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop&q=60';
  }

  saveBook(): void {
    if (!this.formData.title || !this.formData.isbn || !this.formData.authorId || !this.formData.categoryId) {
      this.toastService.warning('Please complete all required fields (*)');
      return;
    }

    this.saving.set(true);

    if (this.book) {
      this.libraryService.updateBook(this.book.id, this.formData).subscribe({
        next: () => {
          this.saving.set(false);
          this.toastService.success(`"${this.formData.title}" updated successfully.`);
          this.saved.emit();
          this.close.emit();
        },
        error: (err) => {
          this.saving.set(false);
          this.toastService.error(err.error?.message || 'Failed to update book.');
        }
      });
    } else {
      this.libraryService.createBook(this.formData).subscribe({
        next: () => {
          this.saving.set(false);
          this.toastService.success(`"${this.formData.title}" added to library catalog.`);
          this.saved.emit();
          this.close.emit();
        },
        error: (err) => {
          this.saving.set(false);
          this.toastService.error(err.error?.message || 'Failed to create book.');
        }
      });
    }
  }
}
