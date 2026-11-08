import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth-service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  loading = false;
  errorMessage = '';

  loginForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const credentials = this.loginForm.getRawValue();

    this.authService.login(credentials).subscribe({
      next: () => {
        this.loading = false;

        const returnUrl =
          this.route.snapshot.queryParamMap.get('returnUrl');

        const destination =
          returnUrl?.startsWith('/') &&
          !returnUrl.startsWith('//') &&
          !returnUrl.startsWith('/\\')
            ? returnUrl
            : '/dashboard';

        this.router.navigateByUrl(destination);
      },
      error: (error) => {
        this.loading = false;

        this.errorMessage =
          error.status === 401
            ? 'Invalid username or password.'
            : 'Login failed. Please try again.';
      }
    });
  }
}