
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';

import { ClientTypeService } from '../../../core/services/client-type-service';
import { ClientTypeCreateDto } from '../../../models/client-type.model';

@Component({
  selector: 'app-client-type-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './client-type-form.html',
  styleUrl: './client-type-form.scss'
})
export class ClientTypeForm {

  private readonly fb = inject(FormBuilder);
  private readonly clientTypeService = inject(ClientTypeService);
  private readonly router = inject(Router);

  isSaving = false;
  submitted = false;

  errorMessage = '';

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

  // FIELD VALIDATION

  isInvalid(
    controlName: keyof ClientTypeCreateDto
  ): boolean {

    const control = this.clientTypeForm.controls[controlName];

    return (
      control.invalid &&
      (control.touched || this.submitted)
    );
  }

  // SAVE CLIENT TYPE

  saveClientType(): void {

    this.submitted = true;
    this.errorMessage = '';

    if (this.clientTypeForm.invalid) {
      this.clientTypeForm.markAllAsTouched();
      return;
    }

    if (this.isSaving) {
      return;
    }

    const formValue = this.clientTypeForm.getRawValue();

    const dto: ClientTypeCreateDto = {
      name: formValue.name.trim(),
      description: formValue.description.trim()
    };

    if (!dto.name || !dto.description) {
      this.errorMessage =
        'Name and Description are required.';
      return;
    }

    this.isSaving = true;

    this.clientTypeService
      .create(dto)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/client-types']);
        },
        error: (error: unknown) => {
          console.error('Error creating client type:', error);
          this.errorMessage = this.getErrorMessage(error);
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
          'Check that the API is running and CORS is configured.'
        );
      }

      if (error.status === 400) {
        return 'Invalid client type data. Please check the fields.';
      }

      if (error.status === 409) {
        return 'A client type with this name already exists.';
      }

      if (error.status >= 500) {
        return 'The server encountered an error while saving the client type.';
      }

      return `Request failed with HTTP ${error.status}.`;
    }

    if (error instanceof Error && error.name === 'TimeoutError') {
      return 'The request timed out. Please try again.';
    }

    return 'An unexpected error occurred while saving the client type.';
  }
}