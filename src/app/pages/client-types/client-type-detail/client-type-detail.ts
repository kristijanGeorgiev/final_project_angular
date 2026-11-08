
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

import { ClientTypeService } from '../../../core/services/client-type-service';
import { ClientTypeDetailDto } from '../../../models/client-type.model';

@Component({
  selector: 'app-client-type-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-type-detail.html',
  styleUrl: './client-type-detail.scss'
})
export class ClientTypeDetail implements OnInit {

  private readonly clientTypeService = inject(ClientTypeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  clientType: ClientTypeDetailDto | null = null;

  clientTypeId: number | null = null;

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
      this.errorMessage = 'Invalid client type ID.';
      this.cdr.markForCheck();
      return;
    }

    this.clientTypeId = id;
    this.loadClientType(id);
  }

  // LOAD CLIENT TYPE DETAILS

  loadClientType(id: number): void {

    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.clientType = null;

    this.cdr.markForCheck();

    this.clientTypeService
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

        next: (response: ClientTypeDetailDto) => {

          console.log('Client Type Details API response:', response);

          if (!response || response.id !== id) {

            this.errorMessage =
              'The Client Type API returned an invalid response.';

            this.clientType = null;
            this.cdr.markForCheck();
            return;
          }

          this.clientType = response;
          this.errorMessage = '';

          this.cdr.markForCheck();
        },

        error: (error: unknown) => {

          console.error(
            'Error loading client type details:',
            error
          );

          this.clientType = null;
          this.errorMessage = this.getErrorMessage(error);

          this.cdr.markForCheck();
        }
      });
  }

  // BACK TO CLIENT TYPES

  backToClientTypes(): void {
    this.router.navigate(['/client-types']);
  }

  // ERROR HANDLING

  private getErrorMessage(error: unknown): string {

    if (error instanceof HttpErrorResponse) {

      if (error.status === 0) {
        return (
          'Cannot connect to ClientTypeService. ' +
          'Check that the API is running, ' +
          'the HTTPS certificate is trusted, ' +
          'and CORS allows http://localhost:4200.'
        );
      }

      if (error.status === 400) {
        return 'Invalid client type request.';
      }

      if (error.status === 401) {
        return 'You are not authorized to view this client type.';
      }

      if (error.status === 403) {
        return 'Access to this client type is forbidden.';
      }

      if (error.status === 404) {
        return 'Client type not found.';
      }

      if (error.status >= 500) {
        return 'The server encountered an error while loading the client type.';
      }

      return `Request failed with HTTP ${error.status}.`;
    }

    if (
      error instanceof Error &&
      error.name === 'TimeoutError'
    ) {
      return 'The request timed out after 15 seconds. Please try again.';
    }

    return 'An unexpected error occurred while loading the client type.';
  }
}
