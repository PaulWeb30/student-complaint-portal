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
import {
  ComplaintStatusFilterComponent,
  StatusFilter,
} from '../../components/complaint-status-filter/complaint-status-filter.component';

@Component({
  selector: 'app-admin-complaints-page',
  imports: [DatePipe, ComplaintStatusFilterComponent],
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

    this.complaintService
      .updateComplaint(complaint.id, { status })
      .pipe(
        finalize(() => {
          this.busyIds.update((ids) => ids.filter((id) => id !== complaint.id));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.complaints.update((items) =>
            items.map((item) => (item.id === complaint.id ? { ...item, status } : item)),
          );
        },
        error: (err: Error) => {
          this.actionError.set(err.message || 'Update failed.');
        },
      });
  }

  isBusy(id: string): boolean {
    return this.busyIds().includes(id);
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
