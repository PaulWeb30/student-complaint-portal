import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-8 backdrop-blur"
        (click)="cancel.emit()"
      >
        <div
          class="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="dialogId() + '-title'"
          [attr.aria-describedby]="dialogId() + '-description'"
          (click)="$event.stopPropagation()"
        >
          <div class="space-y-2">
            <p class="text-xs uppercase tracking-[0.3em] text-slate-500">Confirmation</p>
            <h2 class="text-xl font-semibold text-white" [attr.id]="dialogId() + '-title'">
              {{ title() }}
            </h2>
            <p class="text-sm text-slate-400" [attr.id]="dialogId() + '-description'">
              {{ message() }}
            </p>
          </div>
          <div class="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              class="flex-1 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
              (click)="cancel.emit()"
            >
              {{ cancelLabel() }}
            </button>
            <button
              type="button"
              class="flex-1 rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400"
              (click)="confirm.emit()"
            >
              {{ confirmLabel() }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  readonly open = input(false);
  readonly title = input('Confirm action');
  readonly message = input('Are you sure you want to continue?');
  readonly confirmLabel = input('Confirm');
  readonly cancelLabel = input('Cancel');
  readonly dialogId = input('confirm-dialog');

  readonly confirm = output<void>();
  readonly cancel = output<void>();
}
