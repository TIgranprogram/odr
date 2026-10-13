import { Component, inject, ChangeDetectionStrategy } from '@angular/core';

import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  imports: [],
  template: `
    <div class="toast-host">
      @for (t of toast.toasts(); track t) {
        <div
          class="toast"
          [class.toast-success]="t.type === 'success'"
          [class.toast-error]="t.type === 'error'"
          [class.toast-info]="t.type === 'info'"
          role="status"
          (click)="toast.dismiss(t.id)"
        >
          <span class="toast-icon">
            {{ t.type === 'success' ? '✅' : t.type === 'error' ? '⚠️' : 'ℹ️' }}
          </span>
          <span class="toast-msg">{{ t.message }}</span>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [
    `
      .toast-host {
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-width: 360px;
      }
      .toast {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 12px 14px;
        border-radius: 8px;
        cursor: pointer;
        background: #fff;
        border: 1px solid var(--border);
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.14);
        font-size: 13.5px;
        animation: slide-in 0.2s ease-out;
      }
      .toast-success {
        border-left: 4px solid var(--success);
      }
      .toast-error {
        border-left: 4px solid var(--danger);
      }
      .toast-info {
        border-left: 4px solid var(--primary);
      }
      .toast-icon {
        flex: 0 0 auto;
      }
      .toast-msg {
        flex: 1 1 auto;
      }
      @keyframes slide-in {
        from {
          opacity: 0;
          transform: translateX(12px);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
    `,
  ],
})
export class ToastComponent {
  readonly toast = inject(ToastService);
}
