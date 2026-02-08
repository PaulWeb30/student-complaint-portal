import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ComplaintService } from '../../services/complaint.service';
import { Complaint } from '../../models';

@Component({
  selector: 'app-complaints-page',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './complaints.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComplaintsPage implements OnInit {
  private readonly complaintService = inject(ComplaintService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly complaints = signal<Complaint[]>([]);
  readonly listLoading = signal(false);
  readonly listError = signal<string | null>(null);
  readonly submitLoading = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly submitSuccess = signal(false);

  readonly form = this.fb.nonNullable.group({
    description: ['', [Validators.required, Validators.minLength(10)]],
  });

  ngOnInit(): void {
    this.loadComplaints();
  }

  loadComplaints(): void {
    this.listLoading.set(true);
    this.listError.set(null);

    this.complaintService
      .getComplaints()
      .pipe(
        finalize(() => this.listLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (complaints) => this.complaints.set(complaints),
        error: (err: Error) => this.listError.set(err.message || 'Failed to load complaints.'),
      });
  }

  submitComplaint(): void {
    if (this.form.invalid || this.submitLoading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitLoading.set(true);
    this.submitError.set(null);
    this.submitSuccess.set(false);

    this.complaintService
      .createComplaint(this.form.getRawValue())
      .pipe(
        finalize(() => this.submitLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.submitSuccess.set(true);
          this.form.controls.description.setValue('');
          this.form.markAsPristine();
          this.form.markAsUntouched();
          this.loadComplaints();
        },
        error: (err: Error) => this.submitError.set(err.message || 'Failed to submit complaint.'),
      });
  }

  statusClass(status: Complaint['status']): string {
    switch (status) {
      case 'approved':
        return 'bg-emerald-400/20 text-emerald-200 border-emerald-400/40';
      case 'rejected':
        return 'bg-rose-400/20 text-rose-200 border-rose-400/40';
      default:
        return 'bg-amber-400/20 text-amber-200 border-amber-400/40';
    }
  }
}
