import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { ToastService } from './services/toast.service';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { AuthModalComponent } from './components/auth-modal/auth-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ToastContainerComponent,
    AuthModalComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  authService = inject(AuthService);
  toastService = inject(ToastService);

  showAuthModal = signal<boolean>(false);

  openSignIn(): void {
    this.showAuthModal.set(true);
  }

  logout(): void {
    this.authService.logout();
    this.toastService.info('You have been signed out.');
  }

  quickDemo(role: 'admin' | 'librarian' | 'member'): void {
    const creds = {
      admin: { email: 'admin@library.com', pass: 'Admin@123' },
      librarian: { email: 'librarian@library.com', pass: 'Librarian@123' },
      member: { email: 'member@library.com', pass: 'Member@123' }
    }[role];

    this.authService.login({ email: creds.email, password: creds.pass }).subscribe({
      next: (res) => {
        this.toastService.success(`Switched to ${res.user.role} profile: ${res.user.fullName}`);
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Login failed.');
      }
    });
  }
}
