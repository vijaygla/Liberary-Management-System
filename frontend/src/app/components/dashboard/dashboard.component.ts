import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardStats, BorrowRecord } from '../../models/library.models';
import { LibraryService } from '../../services/library.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-page">
      <!-- Header -->
      <div class="dash-header">
        <div>
          <h2>Executive Intelligence & Operations</h2>
          <p class="dash-subtitle">Real-time circulation metrics, inventory turnover, and member activity.</p>
        </div>
        <button class="btn btn-secondary btn-sm" (click)="loadStats()">
          <span>↻</span> Refresh Live Metrics
        </button>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Compiling library telemetry...</p>
        </div>
      } @else if (stats()) {
        <!-- KPI Cards Grid -->
        <div class="kpi-grid">
          <div class="kpi-card glass-panel">
            <div class="kpi-icon icon-indigo">📚</div>
            <div class="kpi-data">
              <span class="kpi-label">Unique Titles</span>
              <span class="kpi-value">{{ stats()?.totalBooks }}</span>
              <span class="kpi-sub">{{ stats()?.totalCopies }} Physical Copies</span>
            </div>
          </div>

          <div class="kpi-card glass-panel">
            <div class="kpi-icon icon-emerald">✓</div>
            <div class="kpi-data">
              <span class="kpi-label">Available on Shelves</span>
              <span class="kpi-value text-emerald">{{ stats()?.availableCopies }}</span>
              <span class="kpi-sub">{{ ((stats()?.availableCopies || 0) / (stats()?.totalCopies || 1) * 100) | number:'1.0-0' }}% Availability Rate</span>
            </div>
          </div>

          <div class="kpi-card glass-panel">
            <div class="kpi-icon icon-cyan">⇄</div>
            <div class="kpi-data">
              <span class="kpi-label">Active Loans</span>
              <span class="kpi-value text-cyan">{{ stats()?.activeLoansCount }}</span>
              <span class="kpi-sub">Currently Checked Out</span>
            </div>
          </div>

          <div class="kpi-card glass-panel">
            <div class="kpi-icon icon-rose">⚠</div>
            <div class="kpi-data">
              <span class="kpi-label">Overdue Loans</span>
              <span class="kpi-value text-rose">{{ stats()?.overdueLoansCount }}</span>
              <span class="kpi-sub text-rose">Requires Notice</span>
            </div>
          </div>

          <div class="kpi-card glass-panel">
            <div class="kpi-icon icon-purple">👥</div>
            <div class="kpi-data">
              <span class="kpi-label">Active Members</span>
              <span class="kpi-value text-purple">{{ stats()?.activeMembersCount }}</span>
              <span class="kpi-sub">Patrons with Good Standing</span>
            </div>
          </div>

          <div class="kpi-card glass-panel">
            <div class="kpi-icon icon-amber">$</div>
            <div class="kpi-data">
              <span class="kpi-label">Pending Fines</span>
              <span class="kpi-value text-amber">\${{ stats()?.totalPendingFines | number:'1.2-2' }}</span>
              <span class="kpi-sub">Uncollected Overdue Fees</span>
            </div>
          </div>
        </div>

        <!-- Analytics Two-Column -->
        <div class="analytics-row">
          <!-- Category Breakdown -->
          <div class="glass-panel analytics-card">
            <div class="card-title-row">
              <h3>Category Inventory Distribution</h3>
              <span class="badge badge-primary">Catalog Proportions</span>
            </div>
            <div class="category-list">
              @for (cat of stats()?.categoryDistribution; track cat.categoryName) {
                <div class="cat-progress-item">
                  <div class="cat-progress-header">
                    <span class="cat-name">{{ cat.categoryName }}</span>
                    <span class="cat-count font-mono">{{ cat.bookCount }} titles</span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill" [style.width.%]="getCategoryPercent(cat.bookCount)"></div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Monthly Trends -->
          <div class="glass-panel analytics-card">
            <div class="card-title-row">
              <h3>Monthly Circulation Activity</h3>
              <span class="badge badge-info">Trailing 6 Months</span>
            </div>
            <div class="trends-bar-chart">
              @for (item of stats()?.monthlyBorrowTrends; track item.month) {
                <div class="chart-col">
                  <div class="bar-value">{{ item.count }}</div>
                  <div class="bar-track">
                    <div class="bar-fill" [style.height.%]="getTrendHeight(item.count)"></div>
                  </div>
                  <div class="bar-label">{{ item.month }}</div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Recent Circulation Feed -->
        <div class="glass-panel recent-section">
          <div class="card-title-row">
            <div>
              <h3>Recent Borrow & Return Activity</h3>
              <p class="table-subtitle">Audit stream of the latest book transactions across the library.</p>
            </div>
          </div>

          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Member Name</th>
                  <th>Card #</th>
                  <th>Checkout Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Fine</th>
                  @if (authService.isStaff()) {
                    <th>Circulation Action</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (borrow of stats()?.recentBorrows; track borrow.id) {
                  <tr>
                    <td>
                      <div class="book-cell">
                        <img [src]="borrow.bookCoverUrl || defaultCover" class="thumb-mini" alt="Book cover" />
                        <div>
                          <div class="b-title">{{ borrow.bookTitle }}</div>
                          <div class="b-isbn font-mono">{{ borrow.bookIsbn }}</div>
                        </div>
                      </div>
                    </td>
                    <td>{{ borrow.userName }}</td>
                    <td><span class="font-mono">{{ borrow.membershipCardNumber }}</span></td>
                    <td>{{ borrow.borrowDate | date:'mediumDate' }}</td>
                    <td>{{ borrow.dueDate | date:'mediumDate' }}</td>
                    <td>
                      <span class="badge" [ngClass]="getStatusBadge(borrow.status)">
                        {{ borrow.status }}
                      </span>
                    </td>
                    <td>
                      @if (borrow.fineAmount > 0) {
                        <span [class.text-amber]="!borrow.finePaid" [class.text-emerald]="borrow.finePaid">
                          \${{ borrow.fineAmount | number:'1.2-2' }} ({{ borrow.finePaid ? 'Paid' : 'Unpaid' }})
                        </span>
                      } @else {
                        <span class="text-muted">—</span>
                      }
                    </td>
                    @if (authService.isStaff()) {
                      <td>
                        @if (borrow.status !== 'Returned') {
                          <button class="btn btn-outline btn-sm" (click)="quickReturn(borrow)">
                            Check In
                          </button>
                        } @else {
                          <span class="text-muted">Completed</span>
                        }
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }
    .dash-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .dash-subtitle {
      color: var(--text-secondary);
      font-size: 0.9rem;
      margin-top: 0.25rem;
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
      gap: 1.25rem;
    }
    .kpi-card {
      padding: 1.35rem;
      display: flex;
      align-items: flex-start;
      gap: 1.15rem;
    }
    .kpi-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
      flex-shrink: 0;
    }
    .icon-indigo { background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3); }
    .icon-emerald { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .icon-cyan { background: rgba(6, 182, 212, 0.15); color: #22d3ee; border: 1px solid rgba(6, 182, 212, 0.3); }
    .icon-rose { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    .icon-purple { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }
    .icon-amber { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }

    .kpi-data {
      display: flex;
      flex-direction: column;
    }
    .kpi-label {
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .kpi-value {
      font-size: 1.85rem;
      font-weight: 800;
      line-height: 1.2;
      color: #fff;
      margin: 0.2rem 0;
    }
    .kpi-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .text-emerald { color: #34d399; }
    .text-cyan { color: #22d3ee; }
    .text-rose { color: #f87171; }
    .text-purple { color: #c084fc; }
    .text-amber { color: #fbbf24; }

    /* Analytics row */
    .analytics-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    @media (max-width: 900px) {
      .analytics-row { grid-template-columns: 1fr; }
    }
    .analytics-card {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .card-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    /* Category progress */
    .category-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .cat-progress-item {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .cat-progress-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.825rem;
    }
    .cat-name { color: var(--text-primary); font-weight: 500; }
    .cat-count { color: var(--text-secondary); font-size: 0.75rem; }
    .progress-track {
      height: 8px;
      background: rgba(255, 255, 255, 0.06);
      border-radius: var(--radius-full);
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #6366f1 0%, #06b6d4 100%);
      border-radius: var(--radius-full);
      transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Bar chart */
    .trends-bar-chart {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 0.75rem;
      height: 220px;
      padding-top: 1rem;
    }
    .chart-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      gap: 0.5rem;
    }
    .bar-value {
      font-size: 0.75rem;
      font-weight: 700;
      color: #a5b4fc;
    }
    .bar-track {
      flex: 1;
      width: 100%;
      max-width: 36px;
      background: rgba(255, 255, 255, 0.04);
      border-radius: 6px;
      display: flex;
      align-items: flex-end;
      overflow: hidden;
    }
    .bar-fill {
      width: 100%;
      background: linear-gradient(180deg, #6366f1 0%, #4338ca 100%);
      border-radius: 6px 6px 0 0;
      transition: height 0.6s ease;
      min-height: 4px;
    }
    .bar-label {
      font-size: 0.7rem;
      color: var(--text-muted);
      white-space: nowrap;
    }

    /* Recent Section */
    .recent-section {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .table-subtitle {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-top: 0.2rem;
    }
    .book-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .thumb-mini {
      width: 32px;
      height: 44px;
      object-fit: cover;
      border-radius: 4px;
    }
    .b-title {
      font-weight: 600;
      color: #fff;
      font-size: 0.85rem;
    }
    .b-isbn {
      font-size: 0.7rem;
      color: var(--text-muted);
    }
    .loading-state {
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
  `]
})
export class DashboardComponent implements OnInit {
  libraryService = inject(LibraryService);
  toastService = inject(ToastService);
  authService = inject(AuthService);

  stats = signal<DashboardStats | null>(null);
  loading = signal<boolean>(false);

  defaultCover = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60';

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading.set(true);
    this.libraryService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Failed to load dashboard metrics.');
        this.loading.set(false);
      }
    });
  }

  getCategoryPercent(count: number): number {
    const total = this.stats()?.totalBooks || 1;
    return Math.max(5, Math.min(100, Math.round((count / total) * 100)));
  }

  getTrendHeight(count: number): number {
    const maxVal = Math.max(...(this.stats()?.monthlyBorrowTrends.map(t => t.count) || [1]), 1);
    return Math.max(8, Math.round((count / maxVal) * 100));
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'Active': return 'badge-info';
      case 'Overdue': return 'badge-danger';
      case 'Returned': return 'badge-success';
      default: return 'badge-primary';
    }
  }

  quickReturn(borrow: BorrowRecord): void {
    this.libraryService.returnBook({ borrowRecordId: borrow.id }).subscribe({
      next: (res) => {
        this.toastService.success(`"${borrow.bookTitle}" marked as returned.`);
        this.loadStats();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Could not return book.');
      }
    });
  }
}
