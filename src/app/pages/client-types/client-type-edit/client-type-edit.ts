
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  DestroyRef,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, timeout } from 'rxjs';

import { ClientTypeService } from '../../../core/services/client-type-service';

import {
  ClientTypeDetailDto,
  ClientTypeUpdateDto
} from '../../../models/client-type.model';

@Component({
  selector: 'app-client-type-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './client-type-edit.html',
  styleUrl: './client-type-edit.scss'
})
export class ClientTypeEdit implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly clientTypeService = inject(ClientTypeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  clientTypeId: number | null = null;

  isLoading = false;
  isSaving = false;
  isLoaded = false;
  submitted = false;

  errorMessage = '';

  // REACTIVE FORM

  clientTypeForm = this.fb.nonNullable.group({
    name: [
      '',
      [
        Validators.required,
        Validators.maxLength(200)
      ]
    ],
    description: [
      '',
      [
        Validators.required,
        Validators.maxLength(1000)
      ]
    ]
  });

  // INITIALIZATION

  ngOnInit(): void {

    const idParam = this.route.snapshot.paramMap.get('id');
    const id = Number(idParam);

    if (!idParam || !Number.isInteger(id) || id <= 0) {
      this.errorMessage = 'Invalid client type ID.';
      this.cdr.markForCheck();
      return;
    }

    this.clientTypeId = id;
    this.loadClientType(id);
  }

  // LOAD EXISTING CLIENT TYPE

  loadClientType(id: number): void {

    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.isLoaded = false;
    this.errorMessage = '';

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

          console.log(
            'Client Type loaded for editing:',
            response
          );

          if (!response || response.id !== id) {

            this.errorMessage =
              'The Client Type API returned an invalid response.';

            this.isLoaded = false;
            this.cdr.markForCheck();
            return;
          }

          this.clientTypeForm.patchValue({
            name: response.name ?? '',
            description: response.description ?? ''
          });

          this.isLoaded = true;
          this.errorMessage = '';

          this.cdr.markForCheck();
        },

        error: (error: unknown) => {

          console.error('Error loading client type:', error);

          this.isLoaded = false;
          this.errorMessage = this.getErrorMessage(error);

          this.cdr.markForCheck();
        }
      });
  }

  // FIELD VALIDATION

  isInvalid(controlName: keyof ClientTypeUpdateDto): boolean {

    const control = this.clientTypeForm.controls[controlName];

    return (
      control.invalid &&
      (control.touched || this.submitted)
    );
  }

  // SAVE UPDATED CLIENT TYPE

  saveClientType(): void {

    if (
      this.clientTypeId === null ||
      !this.isLoaded ||
      this.isLoading ||
      this.isSaving
    ) {
      return;
    }

    this.submitted = true;
    this.errorMessage = '';

    if (this.clientTypeForm.invalid) {
      this.clientTypeForm.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    const formValue = this.clientTypeForm.getRawValue();

    const dto: ClientTypeUpdateDto = {
      name: formValue.name.trim(),
      description: formValue.description.trim()
    };

    if (!dto.name || !dto.description) {
      this.errorMessage =
        'Name and Description are required.';

      this.cdr.markForCheck();
      return;
    }

    this.isSaving = true;
    this.cdr.markForCheck();

    this.clientTypeService
      .update(this.clientTypeId, dto)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.isSaving = false;

          if (!this.destroyRef.destroyed) {
            this.cdr.markForCheck();
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({

        next: () => {

          console.log('Client Type updated successfully.');

          this.router.navigate(['/client-types']);
        },

        error: (error: unknown) => {

          console.error('Error updating client type:', error);

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
        return 'Invalid client type data. Please check the fields.';
      }

      if (error.status === 401) {
        return 'You are not authorized to update this client type.';
      }

      if (error.status === 403) {
        return 'Access to this client type is forbidden.';
      }

      if (error.status === 404) {
        return 'Client type not found.';
      }

      if (error.status === 409) {
        return 'A client type with this name already exists.';
      }

      if (error.status >= 500) {
        return 'The server encountered an error while updating the client type.';
      }

      return `Request failed with HTTP ${error.status}.`;
    }

    if (
      error instanceof Error &&
      error.name === 'TimeoutError'
    ) {
      return 'The request timed out after 15 seconds. Please try again.';
    }

    return 'An unexpected error occurred while processing the client type.';
  }
}