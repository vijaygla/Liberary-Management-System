import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-wrapper">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-item" [ngClass]="'toast-' + toast.type">
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') { <span>✓</span> }
              @case ('error') { <span>✕</span> }
              @case ('warning') { <span>⚠</span> }
              @default { <span>ℹ</span> }
            }
          </div>
          <div class="toast-content">
            @if (toast.title) {
              <div class="toast-title">{{ toast.title }}</div>
            }
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button class="toast-close" (click)="toastService.remove(toast.id)">&times;</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-wrapper {
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 400px;
      pointer-events: none;
    }
    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 0.85rem;
      padding: 0.9rem 1.15rem;
      border-radius: var(--radius-md);
      background: #111827;
      border: 1px solid var(--border-subtle);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.6);
      animation: slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .toast-success { border-color: rgba(16, 185, 129, 0.5); background: rgba(6, 78, 59, 0.9); }
    .toast-error { border-color: rgba(239, 68, 68, 0.5); background: rgba(127, 29, 29, 0.9); }
    .toast-warning { border-color: rgba(245, 158, 11, 0.5); background: rgba(120, 53, 15, 0.9); }
    .toast-info { border-color: rgba(59, 130, 246, 0.5); background: rgba(30, 58, 138, 0.9); }
    .toast-icon {
      font-weight: 800;
      font-size: 1.1rem;
      line-height: 1;
      padding-top: 2px;
    }
    .toast-content { flex: 1; }
    .toast-title { font-weight: 700; font-size: 0.875rem; color: #fff; margin-bottom: 0.2rem; }
    .toast-message { font-size: 0.825rem; color: #e2e8f0; line-height: 1.4; }
    .toast-close {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 1.25rem;
      cursor: pointer;
      line-height: 1;
    }
    .toast-close:hover { color: #fff; }
    @keyframes slideInRight {
      from { transform: translateX(50px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}
