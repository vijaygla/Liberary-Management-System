import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Book, BorrowRecord, User } from '../../models/library.models';
import { LibraryService } from '../../services/library.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-circulation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="circulation-page">
      <div class="circ-header">
        <div>
          <h2>Circulation & Loans Desk</h2>
          <p class="subtitle">Issue, return, track overdue books, and settle member fines.</p>
        </div>
        <div class="circ-actions">
          <button class="btn btn-primary" (click)="openIssueModal()">
            <span>⇄</span> Issue Book to Member
          </button>
        </div>
      </div>

      <!-- Filter Tabs & Search -->
      <div class="glass-panel filter-bar">
        <div class="tab-group">
          <button class="tab-btn" [class.active]="selectedTab() === 'all'" (click)="setTab('all')">
            All Loans
          </button>
          <button class="tab-btn" [class.active]="selectedTab() === 'Active'" (click)="setTab('Active')">
            Active Loans
          </button>
          <button class="tab-btn" [class.active]="selectedTab() === 'Overdue'" (click)="setTab('Overdue')">
            Overdue Loans ⚠
          </button>
          <button class="tab-btn" [class.active]="selectedTab() === 'Returned'" (click)="setTab('Returned')">
            Returned Log
          </button>
        </div>

        <div class="search-wrap">
          <input 
            type="text" 
            class="form-input search-input" 
            placeholder="Search by patron, title, or card #..." 
            [(ngModel)]="searchQuery" />
        </div>
      </div>

      <!-- Table -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading circulation records...</p>
        </div>
      } @else if (filteredRecords().length === 0) {
        <div class="empty-state glass-panel">
          <div class="empty-icon">📋</div>
          <h3>No records found</h3>
          <p>There are no loan records matching the current filter criteria.</p>
        </div>
      } @else {
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Record ID</th>
                <th>Book Details</th>
                <th>Member / Patron</th>
                <th>Checkout Date</th>
                <th>Due Date</th>
                <th>Return Date</th>
                <th>Status</th>
                <th>Fine Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (record of filteredRecords(); track record.id) {
                <tr>
                  <td><span class="font-mono record-id">#{{ record.id }}</span></td>
                  <td>
                    <div class="book-info-col">
                      <div class="book-title-cell">{{ record.bookTitle }}</div>
                      <div class="book-isbn-cell font-mono">{{ record.bookIsbn }}</div>
                    </div>
                  </td>
                  <td>
                    <div class="patron-info">
                      <div class="patron-name">{{ record.userName }}</div>
                      <div class="patron-card font-mono">{{ record.membershipCardNumber }}</div>
                    </div>
                  </td>
                  <td>{{ record.borrowDate | date:'mediumDate' }}</td>
                  <td>
                    <span [class.text-danger]="record.status === 'Overdue'">
                      {{ record.dueDate | date:'mediumDate' }}
                    </span>
                  </td>
                  <td>
                    {{ record.returnDate ? (record.returnDate | date:'mediumDate') : '—' }}
                  </td>
                  <td>
                    <span class="badge" [ngClass]="getStatusBadge(record.status)">
                      {{ record.status }}
                    </span>
                  </td>
                  <td>
                    @if (record.fineAmount > 0) {
                      <div class="fine-cell">
                        <span [class.text-amber]="!record.finePaid" [class.text-emerald]="record.finePaid">
                          \${{ record.fineAmount | number:'1.2-2' }}
                        </span>
                        @if (!record.finePaid) {
                          <button class="btn btn-sm btn-outline btn-pay" (click)="payFine(record)">
                            Collect
                          </button>
                        } @else {
                          <span class="badge badge-success">Settled</span>
                        }
                      </div>
                    } @else {
                      <span class="text-muted">None</span>
                    }
                  </td>
                  <td>
                    @if (record.status !== 'Returned') {
                      <button class="btn btn-success btn-sm" (click)="returnBook(record)">
                        Check In
                      </button>
                    } @else {
                      <span class="text-muted">Archived</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Issue Book Modal -->
      @if (showIssueModal()) {
        <div class="modal-overlay" (click)="onIssueOverlay($event)">
          <div class="modal-card">
            <div class="modal-header">
              <div>
                <h3>Issue Book to Patron</h3>
                <p class="subtitle">Create an official circulation record and loan transaction</p>
              </div>
              <button class="close-btn" (click)="showIssueModal.set(false)">&times;</button>
            </div>
            <div class="modal-body">
              <form (ngSubmit)="submitIssue()">
                <div class="form-group">
                  <label class="form-label">Select Book (In-Stock) *</label>
                  <select class="form-select" [(ngModel)]="issueBookId" name="bookId" required>
                    <option [ngValue]="undefined" disabled>Choose a book from inventory</option>
                    @for (b of availableBooks(); track b.id) {
                      <option [ngValue]="b.id">{{ b.title }} ({{ b.availableCopies }} copies available)</option>
                    }
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Select Member / Patron *</label>
                  <select class="form-select" [(ngModel)]="issueUserId" name="userId" required>
                    <option [ngValue]="undefined" disabled>Select active member</option>
                    @for (u of members(); track u.id) {
                      <option [ngValue]="u.id">{{ u.fullName }} ({{ u.membershipCardNumber }})</option>
                    }
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Loan Duration (Days)</label>
                  <input type="number" class="form-input" min="1" max="60" [(ngModel)]="issueDueDays" name="dueDays" />
                </div>

                <div class="form-group">
                  <label class="form-label">Circulation Desk Notes</label>
                  <input type="text" class="form-input" [(ngModel)]="issueNotes" name="notes" placeholder="e.g. Verified photo ID and card" />
                </div>

                <div class="modal-footer" style="padding-right:0; padding-bottom:0;">
                  <button type="button" class="btn btn-secondary" (click)="showIssueModal.set(false)">Cancel</button>
                  <button type="submit" class="btn btn-primary" [disabled]="issuing()">
                    {{ issuing() ? 'Processing Loan...' : 'Confirm Loan Issue' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .circulation-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .circ-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .subtitle {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin-top: 0.2rem;
    }
    .filter-bar {
      padding: 0.75rem 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .tab-group {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .tab-btn {
      background: none;
      border: 1px solid transparent;
      color: var(--text-secondary);
      padding: 0.45rem 0.9rem;
      border-radius: var(--radius-md);
      font-weight: 600;
      font-size: 0.825rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .tab-btn:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.05);
    }
    .tab-btn.active {
      background: rgba(99, 102, 241, 0.15);
      border-color: rgba(99, 102, 241, 0.35);
      color: #a5b4fc;
    }
    .search-wrap {
      min-width: 280px;
    }
    .search-input {
      padding: 0.45rem 0.85rem;
      font-size: 0.85rem;
    }
    .record-id { color: var(--text-muted); font-size: 0.75rem; }
    .book-title-cell { font-weight: 600; color: #fff; font-size: 0.85rem; }
    .book-isbn-cell { font-size: 0.7rem; color: var(--text-muted); }
    .patron-name { font-weight: 500; font-size: 0.85rem; color: #e2e8f0; }
    .patron-card { font-size: 0.7rem; color: var(--text-muted); }
    .text-danger { color: #f87171; font-weight: 600; }
    .fine-cell { display: flex; align-items: center; gap: 0.5rem; }
    .btn-pay { padding: 0.2rem 0.5rem; font-size: 0.72rem; }
    .close-btn { background: none; border: none; color: var(--text-secondary); font-size: 1.5rem; cursor: pointer; }
    .close-btn:hover { color: #fff; }
    .loading-state, .empty-state { text-align: center; padding: 4rem 2rem; }
    .spinner {
      width: 40px; height: 40px; border: 3px solid rgba(99, 102, 241, 0.2);
      border-top-color: var(--primary); border-radius: 50%; margin: 0 auto 1rem;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
  `]
})
export class CirculationComponent implements OnInit {
  libraryService = inject(LibraryService);
  toastService = inject(ToastService);
  authService = inject(AuthService);

  records = signal<BorrowRecord[]>([]);
  availableBooks = signal<Book[]>([]);
  members = signal<User[]>([]);

  selectedTab = signal<string>('all');
  searchQuery = '';
  loading = signal<boolean>(false);

  showIssueModal = signal<boolean>(false);
  issuing = signal<boolean>(false);
  issueBookId: number | undefined = undefined;
  issueUserId: number | undefined = undefined;
  issueDueDays = 14;
  issueNotes = '';

  ngOnInit(): void {
    this.loadBorrows();
  }

  loadBorrows(): void {
    this.loading.set(true);
    const statusParam = this.selectedTab() === 'all' ? undefined : this.selectedTab();
    this.libraryService.getAllBorrows(statusParam).subscribe({
      next: (data) => {
        this.records.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Failed to load circulation records.');
        this.loading.set(false);
      }
    });
  }

  setTab(tab: string): void {
    this.selectedTab.set(tab);
    this.loadBorrows();
  }

  filteredRecords(): BorrowRecord[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.records();
    return this.records().filter(r =>
      r.bookTitle.toLowerCase().includes(q) ||
      r.userName.toLowerCase().includes(q) ||
      r.membershipCardNumber.toLowerCase().includes(q) ||
      r.bookIsbn.toLowerCase().includes(q)
    );
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'Active': return 'badge-info';
      case 'Overdue': return 'badge-danger';
      case 'Returned': return 'badge-success';
      default: return 'badge-primary';
    }
  }

  returnBook(record: BorrowRecord): void {
    this.libraryService.returnBook({ borrowRecordId: record.id }).subscribe({
      next: (res) => {
        if (res.fineAmount > 0) {
          this.toastService.warning(`Book checked in. Overdue fine calculated: $${res.fineAmount.toFixed(2)}.`);
        } else {
          this.toastService.success(`"${record.bookTitle}" checked in successfully.`);
        }
        this.loadBorrows();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Could not process book return.');
      }
    });
  }

  payFine(record: BorrowRecord): void {
    this.libraryService.payFine(record.id).subscribe({
      next: () => {
        this.toastService.success(`Fine for record #${record.id} settled in full.`);
        this.loadBorrows();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Could not process fine payment.');
      }
    });
  }

  openIssueModal(): void {
    this.libraryService.getBooks({ availableOnly: true, pageSize: 50 }).subscribe({
      next: (res) => this.availableBooks.set(res.items)
    });
    this.libraryService.getUsers('Member').subscribe({
      next: (users) => this.members.set(users)
    });
    this.issueBookId = undefined;
    this.issueUserId = undefined;
    this.issueDueDays = 14;
    this.issueNotes = '';
    this.showIssueModal.set(true);
  }

  onIssueOverlay(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.showIssueModal.set(false);
    }
  }

  submitIssue(): void {
    if (!this.issueBookId || !this.issueUserId) {
      this.toastService.warning('Please select both a book and a member.');
      return;
    }

    this.issuing.set(true);
    this.libraryService.borrowBook({
      bookId: this.issueBookId,
      userId: this.issueUserId,
      dueDays: this.issueDueDays,
      notes: this.issueNotes
    }).subscribe({
      next: (res) => {
        this.issuing.set(false);
        this.toastService.success(`"${res.bookTitle}" issued to ${res.userName} (Due: ${new Date(res.dueDate).toLocaleDateString()}).`);
        this.showIssueModal.set(false);
        this.loadBorrows();
      },
      error: (err) => {
        this.issuing.set(false);
        this.toastService.error(err.error?.message || 'Failed to issue book.');
      }
    });
  }
}
