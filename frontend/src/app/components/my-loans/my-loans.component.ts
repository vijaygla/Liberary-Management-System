import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BorrowRecord, Reservation } from '../../models/library.models';
import { LibraryService } from '../../services/library.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-my-loans',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="my-loans-page">
      <!-- Digital Library Card -->
      <div class="library-card-wrap">
        <div class="digital-card">
          <div class="card-glass-glow"></div>
          <div class="card-top">
            <div class="card-logo">
              <span class="card-chip"></span>
              <span class="card-brand">ATHENA LIBRARY</span>
            </div>
            <span class="card-status badge badge-success">ACTIVE MEMBER</span>
          </div>

          <div class="card-mid">
            <div class="member-card-num font-mono">{{ authService.currentUser()?.membershipCardNumber || 'LIB-MEM-0000' }}</div>
          </div>

          <div class="card-bot">
            <div>
              <div class="c-label">CARDHOLDER</div>
              <div class="c-val">{{ authService.currentUser()?.fullName }}</div>
            </div>
            <div>
              <div class="c-label">PRIVILEGE</div>
              <div class="c-val">{{ authService.currentUser()?.role }}</div>
            </div>
            <div>
              <div class="c-label">MEMBER SINCE</div>
              <div class="c-val">{{ authService.currentUser()?.membershipDate | date:'mediumDate' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="tab-row glass-panel">
        <button class="nav-tab-btn" [class.active]="activeTab() === 'loans'" (click)="activeTab.set('loans')">
          My Active Loans ({{ activeLoans().length }})
        </button>
        <button class="nav-tab-btn" [class.active]="activeTab() === 'reservations'" (click)="activeTab.set('reservations')">
          Hold Reservations ({{ reservations().length }})
        </button>
        <button class="nav-tab-btn" [class.active]="activeTab() === 'history'" (click)="activeTab.set('history')">
          Borrowing History ({{ history().length }})
        </button>
      </div>

      <!-- Content Area -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Fetching your account records...</p>
        </div>
      } @else if (activeTab() === 'loans') {
        @if (activeLoans().length === 0) {
          <div class="empty-state glass-panel">
            <div class="empty-icon">🎉</div>
            <h3>No active loans currently</h3>
            <p>You have returned all borrowed materials. Explore our catalog to find your next great read!</p>
          </div>
        } @else {
          <div class="loans-grid">
            @for (loan of activeLoans(); track loan.id) {
              <div class="loan-card glass-panel">
                <img [src]="loan.bookCoverUrl || defaultCover" class="loan-thumb" alt="Book cover" />
                <div class="loan-info">
                  <div class="loan-title">{{ loan.bookTitle }}</div>
                  <div class="loan-isbn font-mono">{{ loan.bookIsbn }}</div>
                  <div class="loan-dates">
                    <div>Borrowed: <strong>{{ loan.borrowDate | date:'mediumDate' }}</strong></div>
                    <div>Due: <strong [class.text-danger]="loan.status === 'Overdue'">{{ loan.dueDate | date:'mediumDate' }}</strong></div>
                  </div>
                  <div class="loan-footer">
                    <span class="badge" [ngClass]="loan.status === 'Overdue' ? 'badge-danger' : 'badge-info'">
                      {{ loan.status === 'Overdue' ? 'Overdue - Return Soon' : 'On Loan' }}
                    </span>
                    @if (loan.fineAmount > 0) {
                      <span class="fine-tag">Fine: \${{ loan.fineAmount | number:'1.2-2' }}</span>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        }
      } @else if (activeTab() === 'reservations') {
        @if (reservations().length === 0) {
          <div class="empty-state glass-panel">
            <div class="empty-icon">📌</div>
            <h3>No pending reservations</h3>
            <p>When high-demand books are loaned out, reserve them to be placed next in line.</p>
          </div>
        } @else {
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Reserved On</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                @for (res of reservations(); track res.id) {
                  <tr>
                    <td class="font-bold">{{ res.bookTitle }}</td>
                    <td>{{ res.reservationDate | date:'mediumDate' }}</td>
                    <td>
                      <span class="badge" [ngClass]="res.status === 'Pending' ? 'badge-warning' : (res.status === 'Fulfilled' ? 'badge-success' : 'badge-danger')">
                        {{ res.status }}
                      </span>
                    </td>
                    <td>{{ res.notes || '—' }}</td>
                    <td>
                      @if (res.status === 'Pending') {
                        <button class="btn btn-sm btn-outline btn-cancel" (click)="cancelHold(res.id)">
                          Cancel Hold
                        </button>
                      } @else {
                        <span class="text-muted">—</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      } @else {
        <!-- History Tab -->
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Book Title</th>
                <th>Borrowed</th>
                <th>Due</th>
                <th>Returned</th>
                <th>Status</th>
                <th>Fine</th>
              </tr>
            </thead>
            <tbody>
              @for (item of history(); track item.id) {
                <tr>
                  <td class="font-bold">{{ item.bookTitle }}</td>
                  <td>{{ item.borrowDate | date:'mediumDate' }}</td>
                  <td>{{ item.dueDate | date:'mediumDate' }}</td>
                  <td>{{ item.returnDate ? (item.returnDate | date:'mediumDate') : '—' }}</td>
                  <td>
                    <span class="badge" [ngClass]="item.status === 'Returned' ? 'badge-success' : 'badge-info'">
                      {{ item.status }}
                    </span>
                  </td>
                  <td>
                    @if (item.fineAmount > 0) {
                      <span [class.text-amber]="!item.finePaid" [class.text-emerald]="item.finePaid">
                        \${{ item.fineAmount | number:'1.2-2' }} ({{ item.finePaid ? 'Settled' : 'Unpaid' }})
                      </span>
                    } @else {
                      <span class="text-muted">$0.00</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .my-loans-page {
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }
    .library-card-wrap {
      display: flex;
      justify-content: center;
      padding: 1rem 0;
    }
    .digital-card {
      position: relative;
      width: 100%;
      max-width: 480px;
      height: 240px;
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0f172a 100%);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: var(--radius-xl);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 35px rgba(99, 102, 241, 0.25);
      overflow: hidden;
    }
    .card-glass-glow {
      position: absolute;
      top: -50%;
      right: -20%;
      width: 250px;
      height: 250px;
      background: radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, transparent 70%);
      pointer-events: none;
    }
    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .card-logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .card-chip {
      width: 32px;
      height: 24px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      border-radius: 4px;
      box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.3);
    }
    .card-brand {
      font-size: 0.85rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      color: #fff;
    }
    .card-mid {
      margin: 1rem 0;
    }
    .member-card-num {
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: 0.15em;
      color: #e0e7ff;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
    }
    .card-bot {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .c-label {
      font-size: 0.65rem;
      font-weight: 600;
      color: #94a3b8;
      letter-spacing: 0.05em;
    }
    .c-val {
      font-size: 0.875rem;
      font-weight: 700;
      color: #ffffff;
    }

    /* Tabs */
    .tab-row {
      display: flex;
      gap: 0.5rem;
      padding: 0.5rem;
    }
    .nav-tab-btn {
      flex: 1;
      padding: 0.65rem 1rem;
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-weight: 600;
      font-size: 0.85rem;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .nav-tab-btn:hover {
      background: rgba(255, 255, 255, 0.04);
      color: #fff;
    }
    .nav-tab-btn.active {
      background: var(--primary);
      color: #fff;
      box-shadow: 0 4px 12px var(--primary-glow);
    }

    /* Loans grid */
    .loans-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
    }
    .loan-card {
      padding: 1rem;
      display: flex;
      gap: 1rem;
      align-items: center;
    }
    .loan-thumb {
      width: 70px;
      height: 100px;
      object-fit: cover;
      border-radius: var(--radius-sm);
      flex-shrink: 0;
    }
    .loan-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .loan-title {
      font-weight: 700;
      font-size: 0.95rem;
      color: #fff;
      line-height: 1.3;
    }
    .loan-isbn {
      font-size: 0.72rem;
      color: var(--text-muted);
    }
    .loan-dates {
      font-size: 0.775rem;
      color: var(--text-secondary);
      margin: 0.25rem 0;
    }
    .loan-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .fine-tag {
      font-size: 0.75rem;
      font-weight: 700;
      color: #f87171;
    }
    .btn-cancel:hover {
      border-color: var(--danger);
      color: #f87171;
    }
    .font-bold { font-weight: 600; color: #fff; }
    .text-danger { color: #f87171; }
    .text-amber { color: #fbbf24; }
    .text-emerald { color: #34d399; }
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
export class MyLoansComponent implements OnInit {
  libraryService = inject(LibraryService);
  authService = inject(AuthService);
  toastService = inject(ToastService);

  activeTab = signal<'loans' | 'reservations' | 'history'>('loans');
  loading = signal<boolean>(false);

  history = signal<BorrowRecord[]>([]);
  activeLoans = signal<BorrowRecord[]>([]);
  reservations = signal<Reservation[]>([]);

  defaultCover = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60';

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData(): void {
    this.loading.set(true);
    this.libraryService.getMyBorrowHistory().subscribe({
      next: (data) => {
        this.history.set(data);
        this.activeLoans.set(data.filter(d => d.status === 'Active' || d.status === 'Overdue'));
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Failed to load your borrow records.');
        this.loading.set(false);
      }
    });

    this.libraryService.getMyReservations().subscribe({
      next: (res) => this.reservations.set(res)
    });
  }

  cancelHold(id: number): void {
    this.libraryService.cancelReservation(id).subscribe({
      next: () => {
        this.toastService.info('Reservation cancelled.');
        this.loadUserData();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Could not cancel reservation.');
      }
    });
  }
}
