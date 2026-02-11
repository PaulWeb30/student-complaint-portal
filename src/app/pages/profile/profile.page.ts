import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile-page',
  imports: [ReactiveFormsModule],
  templateUrl: './profile.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly seeded = signal(false);

  readonly user = this.auth.user;
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: [{ value: '', disabled: true }],
    name: ['', [Validators.required]],
    username: ['', [Validators.required]],
  });

  constructor() {
    effect(() => {
      const user = this.user();
      if (!user) {
        return;
      }

      const shouldSeed = !this.seeded() || this.form.pristine;
      if (!shouldSeed) {
        return;
      }

      this.form.controls.email.setValue(user.email ?? '');
      this.form.controls.name.setValue(user.name ?? '');
      this.form.controls.username.setValue(user.username ?? '');
      this.form.markAsPristine();
      this.seeded.set(true);
    });
  }

  ngOnInit(): void {
    if (!this.user()) {
      this.auth.loadCurrentUser().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    }
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.success.set(false);

    const { name, username } = this.form.getRawValue();
    this.auth
      .updateProfile({ name, username })
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.success.set(true);
          this.form.markAsPristine();
        },
        error: (err: Error) => this.error.set(err.message || 'Profile update failed.'),
      });
  }
}
