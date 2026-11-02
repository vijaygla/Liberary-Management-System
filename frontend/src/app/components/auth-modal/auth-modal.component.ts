import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="onOverlayClick($event)">
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <h3>{{ isRegister() ? 'Create Athena Account' : 'Welcome to Athena LMS' }}</h3>
            <p class="subtitle">{{ isRegister() ? 'Join our digital library today' : 'Sign in to access your library privileges' }}</p>
          </div>
          <button class="close-btn" (click)="close.emit()">&times;</button>
        </div>

        <div class="modal-body">
          <!-- 1-Click Quick Demo Sign In -->
          <div class="demo-box">
            <span class="demo-tag">One-Click Demo Access</span>
            <div class="demo-buttons">
              <button type="button" class="btn btn-sm btn-secondary" (click)="quickLogin('admin@library.com', 'Admin@123')">
                <span class="role-dot admin-dot"></span> Admin
              </button>
              <button type="button" class="btn btn-sm btn-secondary" (click)="quickLogin('librarian@library.com', 'Librarian@123')">
                <span class="role-dot librarian-dot"></span> Librarian
              </button>
              <button type="button" class="btn btn-sm btn-secondary" (click)="quickLogin('member@library.com', 'Member@123')">
                <span class="role-dot member-dot"></span> Member
              </button>
            </div>
          </div>

          <div class="divider"><span>OR</span></div>

          <!-- Login Form -->
          @if (!isRegister()) {
            <form (ngSubmit)="handleLogin()">
              <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" class="form-input" [(ngModel)]="loginEmail" name="email" required placeholder="name@example.com" />
              </div>
              <div class="form-group">
                <label class="form-label">Password</label>
                <input type="password" class="form-input" [(ngModel)]="loginPassword" name="password" required placeholder="••••••••" />
              </div>
              <button type="submit" class="btn btn-primary btn-block" [disabled]="loading()">
                {{ loading() ? 'Signing In...' : 'Sign In' }}
              </button>
            </form>
          } @else {
            <!-- Register Form -->
            <form (ngSubmit)="handleRegister()">
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-input" [(ngModel)]="regFullName" name="fullName" required placeholder="Jane Doe" />
              </div>
              <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" class="form-input" [(ngModel)]="regEmail" name="email" required placeholder="name@example.com" />
              </div>
              <div class="form-group">
                <label class="form-label">Password</label>
                <input type="password" class="form-input" [(ngModel)]="regPassword" name="password" required placeholder="Minimum 6 characters" />
              </div>
              <div class="form-group">
                <label class="form-label">Phone Number (Optional)</label>
                <input type="tel" class="form-input" [(ngModel)]="regPhone" name="phone" placeholder="+1 (555) 000-0000" />
              </div>
              <div class="form-group">
                <label class="form-label">Role</label>
                <select class="form-select" [(ngModel)]="regRole" name="role">
                  <option value="Member">Member</option>
                  <option value="Librarian">Librarian</option>
                  <option value="Admin">Administrator</option>
                </select>
              </div>
              <button type="submit" class="btn btn-primary btn-block" [disabled]="loading()">
                {{ loading() ? 'Creating Account...' : 'Register Account' }}
              </button>
            </form>
          }

          <div class="toggle-auth">
            @if (!isRegister()) {
              <span>Don't have an account? </span>
              <button class="link-btn" (click)="isRegister.set(true)">Register Now</button>
            } @else {
              <span>Already have an account? </span>
              <button class="link-btn" (click)="isRegister.set(false)">Sign In</button>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .subtitle {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-top: 0.2rem;
    }
    .close-btn {
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 1.5rem;
      cursor: pointer;
    }
    .close-btn:hover { color: #fff; }
    .demo-box {
      background: rgba(99, 102, 241, 0.08);
      border: 1px dashed rgba(99, 102, 241, 0.35);
      border-radius: var(--radius-md);
      padding: 0.85rem;
      margin-bottom: 1.25rem;
    }
    .demo-tag {
      display: block;
      font-size: 0.72rem;
      font-weight: 700;
      color: #a5b4fc;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }
    .demo-buttons {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .role-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .admin-dot { background: #ef4444; }
    .librarian-dot { background: #f59e0b; }
    .member-dot { background: #10b981; }
    .divider {
      position: relative;
      text-align: center;
      margin: 1.25rem 0;
    }
    .divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: var(--border-subtle);
    }
    .divider span {
      position: relative;
      background: #111827;
      padding: 0 0.75rem;
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 600;
    }
    .btn-block {
      width: 100%;
      margin-top: 0.5rem;
      padding: 0.75rem;
    }
    .toggle-auth {
      margin-top: 1.25rem;
      text-align: center;
      font-size: 0.825rem;
      color: var(--text-secondary);
    }
    .link-btn {
      background: none;
      border: none;
      color: var(--primary);
      font-weight: 600;
      cursor: pointer;
      text-decoration: underline;
    }
  `]
})
export class AuthModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() authenticated = new EventEmitter<void>();

  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  isRegister = signal<boolean>(false);
  loading = signal<boolean>(false);

  loginEmail = 'admin@library.com';
  loginPassword = 'Admin@123';

  regFullName = '';
  regEmail = '';
  regPassword = '';
  regPhone = '';
  regRole = 'Member';

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close.emit();
    }
  }

  quickLogin(email: string, pass: string): void {
    this.loginEmail = email;
    this.loginPassword = pass;
    this.handleLogin();
  }

  handleLogin(): void {
    if (!this.loginEmail || !this.loginPassword) {
      this.toastService.warning('Please enter both email and password.');
      return;
    }

    this.loading.set(true);
    this.authService.login({ email: this.loginEmail, password: this.loginPassword }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.toastService.success(`Welcome back, ${res.user.fullName}!`, 'Signed In');
        this.authenticated.emit();
        this.close.emit();
      },
      error: (err) => {
        this.loading.set(false);
        this.toastService.error(err.error?.message || 'Login failed. Check your credentials.');
      }
    });
  }

  handleRegister(): void {
    if (!this.regFullName || !this.regEmail || !this.regPassword) {
      this.toastService.warning('Please complete all required fields.');
      return;
    }

    this.loading.set(true);
    this.authService.register({
      fullName: this.regFullName,
      email: this.regEmail,
      password: this.regPassword,
      phoneNumber: this.regPhone,
      role: this.regRole
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.toastService.success(`Account created! Welcome, ${res.user.fullName}.`, 'Registered');
        this.authenticated.emit();
        this.close.emit();
      },
      error: (err) => {
        this.loading.set(false);
        this.toastService.error(err.error?.message || 'Registration failed.');
      }
    });
  }
}
