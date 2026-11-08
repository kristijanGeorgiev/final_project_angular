
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth-service';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="unauthorized-page">
      <div class="content">
        <div class="icon">!</div>

        <h1>403</h1>
        <h2>Access Denied</h2>

        <p>
          You do not have permission to access this page.
          Please contact your administrator if you believe
          this is a mistake.
        </p>

        <div class="actions">
          <a routerLink="/dashboard" class="primary-button">
            Back to Dashboard
          </a>

          <button type="button"
                  class="secondary-button"
                  (click)="logout()">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }

    .unauthorized-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      padding: 24px;
    }

    .content {
      max-width: 460px;
      text-align: center;
    }

    .icon {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: #fee2e2;
      color: #dc2626;
      font-size: 40px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
    }

    h1 {
      font-size: 76px;
      color: #dc2626;
      margin: 0;
      line-height: 1.1;
    }

    h2 {
      font-size: 26px;
      color: #0f172a;
      margin: 12px 0;
    }

    p {
      font-size: 15px;
      line-height: 1.7;
      color: #64748b;
      margin-bottom: 28px;
    }

    .actions {
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .primary-button,
    .secondary-button {
      padding: 12px 20px;
      border-radius: 9px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
    }

    .primary-button {
      background: #2563eb;
      color: white;
      border: 1px solid #2563eb;
    }

    .secondary-button {
      background: white;
      color: #334155;
      border: 1px solid #cbd5e1;
    }
  `]
})
export class Unauthorized {
  private readonly authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}