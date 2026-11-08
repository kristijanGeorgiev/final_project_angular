
import {
  Component,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  Router,
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  NavigationEnd
} from '@angular/router';

import { filter } from 'rxjs';

import { AuthService } from './core/services/auth-service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {

  private readonly router = inject(Router);

  readonly authService = inject(AuthService);

  // Reactive current route.
  private readonly currentUrl = signal(this.router.url);

  // Detect public pages.
  readonly isAuthPage = computed(() => {
    const path = this.currentUrl()
      .split('?')[0]
      .split('#')[0];

    return (
      path === '/login' ||
      path === '/unauthorized'
    );
  });

  // Show layout only for authenticated application pages.
  readonly showLayout = computed(() => {
    return (
      this.authService.isAuthenticated() &&
      !this.isAuthPage()
    );
  });

  constructor() {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd =>
            event instanceof NavigationEnd
        )
      )
      .subscribe(event => {
        this.currentUrl.set(event.urlAfterRedirects);
      });
  }

  logout(): void {
    this.authService.logout();

    this.router.navigateByUrl('/login');
  }
}