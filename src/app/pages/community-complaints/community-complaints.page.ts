import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ComplaintService } from '../../services/complaint.service';
import { AuthService } from '../../services/auth.service';
import { Complaint } from '../../models';

@Component({
  selector: 'app-community-complaints-page',
  imports: [DatePipe],
  templateUrl: './community-complaints.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityComplaintsPage implements OnInit {
  private readonly complaintService = inject(ComplaintService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly complaints = signal<Complaint[]>([]);
  readonly listLoading = signal(false);
  readonly listError = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly busyIds = signal<string[]>([]);
  readonly likedIds = signal<Record<string, boolean>>({});

  readonly communityComplaints = computed(() => {
    const userId = this.auth.user()?.id;
    return this.complaints().filter((complaint) => complaint.userId !== userId);
  });

  ngOnInit(): void {
    this.loadComplaints();
  }

  loadComplaints(): void {
    this.listLoading.set(true);
    this.listError.set(null);

    this.complaintService
      .getComplaints('approved')
      .pipe(
        finalize(() => this.listLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (complaints) => this.complaints.set(complaints ?? []),
        error: (err: Error) => this.listError.set(err.message || 'Failed to load complaints.'),
      });
  }

  toggleLike(complaint: Complaint): void {
    if (this.isOwnComplaint(complaint) || this.isBusy(complaint.id)) {
      return;
    }

    this.actionError.set(null);
    this.busyIds.update((ids) => [...ids, complaint.id]);

    const isLiked = this.isLiked(complaint.id);
    const nextLikeState = !isLiked;
    const nextLikesCount = this.getNextLikesCount(complaint.likeCount, nextLikeState);

    const optimistic = {
      ...complaint,
      likeCount: nextLikesCount,
    };

    this.complaints.update((items) =>
      items.map((item) => (item.id === complaint.id ? optimistic : item)),
    );

    const request$ = nextLikeState
      ? this.complaintService.likeComplaint(complaint.id)
      : this.complaintService.unlikeComplaint(complaint.id);

    request$
      .pipe(
        finalize(() => {
          this.busyIds.update((ids) => ids.filter((id) => id !== complaint.id));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.likedIds.update((state) => ({ ...state, [complaint.id]: nextLikeState }));
          this.loadComplaints();
        },
        error: (err: Error) => {
          this.actionError.set(err.message || 'Update failed.');
          this.complaints.update((items) =>
            items.map((item) => (item.id === complaint.id ? complaint : item)),
          );
        },
      });
  }

  isOwnComplaint(complaint: Complaint): boolean {
    return complaint.userId === this.auth.user()?.id;
  }

  isBusy(id: string): boolean {
    return this.busyIds().includes(id);
  }

  isLiked(id: string): boolean {
    return !!this.likedIds()[id];
  }

  likesLabel(complaint: Complaint): string {
    const count = complaint.likeCount;
    if (typeof count !== 'number') {
      return 'Likes';
    }
    return count === 1 ? '1 Like' : `${count} Likes`;
  }

  private getNextLikesCount(count: number | undefined, isLiking: boolean): number | undefined {
    if (typeof count !== 'number') {
      return count;
    }

    const delta = isLiking ? 1 : -1;
    return Math.max(0, count + delta);
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
