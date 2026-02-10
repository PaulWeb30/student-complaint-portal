import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ComplaintStatus } from '../../models';

export type StatusFilter = 'all' | ComplaintStatus;

@Component({
  selector: 'app-complaint-status-filter',
  template: `
    <div class="flex items-center gap-2">
      <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Status</span>
      <select
        class="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100"
        [value]="selected()"
        (change)="onChange($event)"
        aria-label="Filter complaints by status"
      >
        @for (option of options; track option.value) {
          <option [value]="option.value">{{ option.label }}</option>
        }
      </select>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComplaintStatusFilterComponent {
  readonly selected = input<StatusFilter>('all');
  readonly change = output<StatusFilter>();

  readonly options: Array<{ value: StatusFilter; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  onChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.change.emit(this.coerce(value));
  }

  private coerce(value: string): StatusFilter {
    switch (value) {
      case 'pending':
      case 'approved':
      case 'rejected':
        return value;
      default:
        return 'all';
    }
  }
}
