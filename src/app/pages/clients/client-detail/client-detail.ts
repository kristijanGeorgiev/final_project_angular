
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  DestroyRef,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, timeout } from 'rxjs';

import { ClientService } from '../../../core/services/client-service';
import { ClientDetailDto } from '../../../models/client.model';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-detail.html',
  styleUrl: './client-detail.scss'
})
export class ClientDetail implements OnInit {

  private readonly clientService = inject(ClientService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  client: ClientDetailDto | null = null;

  clientId: number | null = null;

  isLoading = false;
  errorMessage = '';

  // INITIALIZATION

  ngOnInit(): void {

    const idParam = this.route.snapshot.paramMap.get('id');

    const id = Number(idParam);

    if (
      !idParam ||
      !Number.isInteger(id) ||
      id <= 0
    ) {
      this.errorMessage = 'Invalid client ID.';
      this.cdr.markForCheck();
      return;
    }

    this.clientId = id;

    this.loadClient(id);
  }

  // LOAD CLIENT DETAILS

  loadClient(id: number): void {

    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.client = null;

    this.cdr.markForCheck();

    this.clientService
      .getById(id)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.isLoading = false;

          if (!this.destroyRef.destroyed) {
            this.cdr.markForCheck();
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({

        next: (response: ClientDetailDto) => {

          console.log('Client Details API response:', response);

          if (!response || response.id !== id) {

            this.errorMessage =
              'The Client API returned invalid client details.';

            this.client = null;
            this.cdr.markForCheck();
            return;
          }

          this.client = response;
          this.errorMessage = '';

          this.cdr.markForCheck();
        },

        error: (error: unknown) => {

          console.error('Error loading client details:', error);

          this.client = null;
          this.errorMessage = this.getErrorMessage(error);

          this.cdr.markForCheck();
        }
      });
  }

  // ERROR HANDLING

  private getErrorMessage(error: unknown): string {

    if (error instanceof HttpErrorResponse) {

      if (error.status === 0) {
        return (
          'Cannot connect to ClientService. ' +
          'Check that the API is running, ' +
          'the HTTPS certificate is trusted, ' +
          'and CORS allows http://localhost:4200.'
        );
      }

      if (error.status === 400) {
        return 'Invalid client request.';
      }

      if (error.status === 401) {
        return 'You are not authorized to view this client.';
      }

      if (error.status === 403) {
        return 'Access to this client is forbidden.';
      }

      if (error.status === 404) {
        return 'Client not found.';
      }

      if (error.status >= 500) {
        return 'ClientService encountered a server error.';
      }

      return `Failed to load client details. HTTP ${error.status}.`;
    }

    if (
      error instanceof Error &&
      error.name === 'TimeoutError'
    ) {
      return 'ClientService did not respond within 15 seconds.';
    }

    return 'An unexpected error occurred while loading client details.';
  }

  // NAVIGATION

  backToClients(): void {
    this.router.navigate(['/clients']);
  }
}