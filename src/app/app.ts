import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly isAuthenticated = this.auth.isAuthenticated;
  readonly isAdmin = this.auth.isAdmin;
  readonly user = this.auth.user;

  ngOnInit(): void {
    this.auth.loadCurrentUser().subscribe();
  }

  logout(): void {
    this.auth
      .logout()
      .pipe(finalize(() => this.router.navigateByUrl('/login')))
      .subscribe();
  }
}
