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
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ComplaintService } from '../../services/complaint.service';
import { Complaint } from '../../models';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import {
  ComplaintStatusFilterComponent,
  StatusFilter,
} from '../../components/complaint-status-filter/complaint-status-filter.component';

@Component({
  selector: 'app-admin-complaints-page',
  imports: [DatePipe, ComplaintStatusFilterComponent, ConfirmDialogComponent],
  templateUrl: './admin-complaints.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminComplaintsPage implements OnInit {
  private readonly complaintService = inject(ComplaintService);
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
  readonly busyIds = signal<string[]>([]);
  readonly deleteBusyIds = signal<string[]>([]);
  readonly pendingDelete = signal<Complaint | null>(null);
  readonly commentDrafts = signal<Record<string, string>>({});
  readonly commentsOpen = signal<Record<string, boolean>>({});

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

    const status =
      this.statusFilter() === 'all'
        ? undefined
        : (this.statusFilter() as Exclude<'all', StatusFilter>);
    this.complaintService
      .getAdminComplaints(status)
      .pipe(
        finalize(() => this.listLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (complaints) => this.complaints.set(complaints ?? []),
        error: (err: Error) => this.listError.set(err.message || 'Failed to load complaints.'),
      });
  }

  updateStatus(complaint: Complaint, status: 'approved' | 'rejected'): void {
    if (this.busyIds().includes(complaint.id)) {
      return;
    }

    this.actionError.set(null);
    this.busyIds.update((ids) => [...ids, complaint.id]);

    const comment = this.commentDraft(complaint.id).trim();
    const payload = comment ? { status, comment } : { status };

    this.complaintService
      .updateComplaint(complaint.id, payload)
      .pipe(
        finalize(() => {
          this.busyIds.update((ids) => ids.filter((id) => id !== complaint.id));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updated) => {
          this.complaints.update((items) =>
            items.map((item) => (item.id === complaint.id ? updated : item)),
          );
          this.clearCommentDraft(complaint.id);
          this.loadComplaints();
        },
        error: (err: Error) => {
          this.actionError.set(err.message || 'Update failed.');
        },
      });
  }

  submitComment(complaint: Complaint): void {
    const comment = this.commentDraft(complaint.id).trim();
    if (!comment || this.isBusy(complaint.id)) {
      return;
    }

    this.actionError.set(null);
    this.busyIds.update((ids) => [...ids, complaint.id]);

    this.complaintService
      .updateComplaint(complaint.id, { status: complaint.status, comment })
      .pipe(
        finalize(() => {
          this.busyIds.update((ids) => ids.filter((id) => id !== complaint.id));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updated) => {
          this.complaints.update((items) =>
            items.map((item) => (item.id === complaint.id ? updated : item)),
          );
          this.clearCommentDraft(complaint.id);
          this.loadComplaints();
        },
        error: (err: Error) => {
          this.actionError.set(err.message || 'Comment failed.');
        },
      });
  }

  handleCommentKeydown(event: KeyboardEvent, complaint: Complaint): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.submitComment(complaint);
    }
  }

  requestDelete(complaint: Complaint): void {
    if (this.deleteBusyIds().includes(complaint.id)) {
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
        error: (err: Error) => {
          this.actionError.set(err.message || 'Delete failed.');
        },
      });
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  isDeleting(id: string): boolean {
    return this.deleteBusyIds().includes(id);
  }

  isBusy(id: string): boolean {
    return this.busyIds().includes(id);
  }

  commentDraft(id: string): string {
    return this.commentDrafts()[id] ?? '';
  }

  setCommentDraft(id: string, value: string): void {
    this.commentDrafts.update((drafts) => ({ ...drafts, [id]: value }));
  }

  clearCommentDraft(id: string): void {
    this.commentDrafts.update((drafts) => {
      const next = { ...drafts };
      delete next[id];
      return next;
    });
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
