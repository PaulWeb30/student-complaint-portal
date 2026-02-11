import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ComplaintService } from '../../services/complaint.service';
import { Complaint } from '../../models';
import { AuthService } from '../../services/auth.service';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import {
  ComplaintStatusFilterComponent,
  StatusFilter,
} from '../../components/complaint-status-filter/complaint-status-filter.component';

@Component({
  selector: 'app-complaints-page',
  imports: [ReactiveFormsModule, DatePipe, ComplaintStatusFilterComponent, ConfirmDialogComponent],
  templateUrl: './complaints.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComplaintsPage implements OnInit {
  private readonly complaintService = inject(ComplaintService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly complaints = signal<Complaint[]>([]);
  readonly statusFilter = signal<StatusFilter>('all');
  readonly filteredComplaints = computed(() => {
    const filter = this.statusFilter();
    const complaints = this.complaints();
    if (filter === 'all') {
      return complaints;
    }
    return complaints.filter((complaint) => complaint.status === filter);
  });
  readonly listLoading = signal(false);
  readonly listError = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly deleteBusyIds = signal<string[]>([]);
  readonly pendingDelete = signal<Complaint | null>(null);
  readonly submitLoading = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly submitSuccess = signal(false);
  readonly commentsOpen = signal<Record<string, boolean>>({});

  readonly form = this.fb.nonNullable.group({
    description: ['', [Validators.required, Validators.minLength(10)]],
  });

  constructor() {
    effect(() => {
      const filter = this.statusFilter();
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: filter === 'all' ? {} : { status: filter },
        queryParamsHandling: 'merge',
      });
    });
  }

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const status = params['status'];
      if (status === 'pending' || status === 'approved' || status === 'rejected') {
        this.statusFilter.set(status);
      } else if (!params['status']) {
        this.statusFilter.set('all');
      }
    });
    this.loadComplaints();
  }

  setStatusFilter(filter: StatusFilter): void {
    if (typeof filter === 'string') {
      this.statusFilter.set(filter);
      this.loadComplaints();
    }
  }

  loadComplaints(): void {
    this.listLoading.set(true);
    this.listError.set(null);
    this.actionError.set(null);

    const filter = this.statusFilter();
    const status = filter === 'all' ? undefined : (filter as Exclude<StatusFilter, 'all'>);
    this.complaintService
      .getComplaints(status)
      .pipe(
        finalize(() => this.listLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (complaints) => this.complaints.set(complaints ?? []),
        error: (err: Error) => this.listError.set(err.message || 'Failed to load complaints.'),
      });
  }

  requestDelete(complaint: Complaint): void {
    if (this.deleteBusyIds().includes(complaint.id) || !this.canDeleteComplaint(complaint)) {
      return;
    }

    this.pendingDelete.set(complaint);
  }

  confirmDelete(): void {
    const complaint = this.pendingDelete();
    if (!complaint || this.deleteBusyIds().includes(complaint.id)) {
      return;
    }

    this.actionError.set(null);
    this.deleteBusyIds.update((ids) => [...ids, complaint.id]);

    this.complaintService
      .deleteComplaint(complaint.id)
      .pipe(
        finalize(() => {
          this.deleteBusyIds.update((ids) => ids.filter((id) => id !== complaint.id));
          this.pendingDelete.set(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.complaints.update((items) => items.filter((item) => item.id !== complaint.id));
        },
        error: (err: Error) => this.actionError.set(err.message || 'Delete failed.'),
      });
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  canDeleteComplaint(complaint: Complaint): boolean {
    const user = this.auth.user();
    if (!user) {
      return false;
    }
    return this.auth.isAdmin() || complaint.userId === user.id;
  }

  isDeleting(id: string): boolean {
    return this.deleteBusyIds().includes(id);
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

  toggleComments(id: string): void {
    this.commentsOpen.update((state) => ({ ...state, [id]: !state[id] }));
  }

  areCommentsOpen(id: string): boolean {
    return !!this.commentsOpen()[id];
  }

  commentsCount(complaint: Complaint): number {
    return complaint.comments?.length ?? 0;
  }
}
