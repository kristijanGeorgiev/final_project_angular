
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

import { ClientService } from '../../../core/services/client-service';
import { ClientTypeService } from '../../../core/services/client-type-service';

import {
  ClientDetailDto,
  ClientUpdateDto
} from '../../../models/client.model';

import { ClientTypeListDto } from '../../../models/client-type.model';

@Component({
  selector: 'app-client-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './client-edit.html',
  styleUrl: './client-edit.scss'
})
export class ClientEdit implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly clientService = inject(ClientService);
  private readonly clientTypeService = inject(ClientTypeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  clientId: number | null = null;

  clientTypes: ClientTypeListDto[] = [];

  isLoading = false;
  isLoadingTypes = false;
  isSaving = false;
  submitted = false;

  errorMessage = '';
  successMessage = '';

  // REACTIVE FORM

  clientForm = this.fb.nonNullable.group({
    clientTypeId: [
      0,
      [
        Validators.required,
        Validators.min(1)
      ]
    ],
    name: [
      '',
      [
        Validators.required,
        Validators.maxLength(200)
      ]
    ],
    address: [
      '',
      [
        Validators.required,
        Validators.maxLength(250)
      ]
    ],
    city: [
      '',
      [
        Validators.required,
        Validators.maxLength(100)
      ]
    ],
    phone: [
      '',
      [
        Validators.required,
        Validators.maxLength(50)
      ]
    ],
    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.maxLength(200)
      ]
    ],
    taxNumber: [
      '',
      [
        Validators.required,
        Validators.maxLength(50)
      ]
    ]
  });

  // INITIALIZATION

  ngOnInit(): void {

    const idParam = this.route.snapshot.paramMap.get('id');
    const id = Number(idParam);

    if (!idParam || !Number.isInteger(id) || id <= 0) {
      this.errorMessage = 'Invalid client ID.';
      this.cdr.markForCheck();
      return;
    }

    this.clientId = id;

    this.loadClientTypes();
    this.loadClient(id);
  }

  // LOAD CLIENT TYPES

  loadClientTypes(): void {

    if (this.isLoadingTypes) {
      return;
    }

    this.isLoadingTypes = true;
    this.cdr.markForCheck();

    this.clientTypeService
      .getAll()
      .pipe(
        timeout(15000),
        finalize(() => {
          this.isLoadingTypes = false;

          if (!this.destroyRef.destroyed) {
            this.cdr.markForCheck();
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({

        next: (response: ClientTypeListDto[]) => {

          console.log('Client Types API response:', response);

          if (!Array.isArray(response)) {
            this.clientTypes = [];
            this.errorMessage =
              'The Client Type API returned an invalid response.';
          } else {
            this.clientTypes = response;
          }

          this.cdr.markForCheck();
        },

        error: (error: unknown) => {

          console.error('Error loading client types:', error);

          this.clientTypes = [];
          this.errorMessage = this.getErrorMessage(error);

          this.cdr.markForCheck();
        }
      });
  }

  // LOAD EXISTING CLIENT

  loadClient(id: number): void {

    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

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

        next: (client: ClientDetailDto) => {

          console.log('Client loaded for editing:', client);

          if (!client) {
            this.errorMessage = 'Client not found.';
            this.cdr.markForCheck();
            return;
          }

          if (client.id !== id) {
            this.errorMessage =
              'The Client API returned an unexpected client record.';

            this.cdr.markForCheck();
            return;
          }

          this.clientForm.patchValue({
            clientTypeId: client.clientTypeId,
            name: client.name ?? '',
            address: client.address ?? '',
            city: client.city ?? '',
            phone: client.phone ?? '',
            email: client.email ?? '',
            taxNumber: client.taxNumber ?? ''
          });

          this.errorMessage = '';

          this.cdr.markForCheck();
        },

        error: (error: unknown) => {

          console.error('Error loading client:', error);

          this.errorMessage = this.getErrorMessage(error);

          this.cdr.markForCheck();
        }
      });
  }

  // VALIDATION

  isInvalid(controlName: keyof ClientUpdateDto): boolean {

    const control = this.clientForm.controls[controlName];

    return (
      control.invalid &&
      (control.touched || this.submitted)
    );
  }

  // SAVE UPDATED CLIENT

  saveClient(): void {

    if (
      this.clientId === null ||
      this.isSaving ||
      this.isLoading ||
      this.isLoadingTypes
    ) {
      return;
    }

    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    const formValue = this.clientForm.getRawValue();

    const dto: ClientUpdateDto = {
      clientTypeId: formValue.clientTypeId,
      name: formValue.name.trim(),
      address: formValue.address.trim(),
      city: formValue.city.trim(),
      phone: formValue.phone.trim(),
      email: formValue.email.trim(),
      taxNumber: formValue.taxNumber.trim()
    };

    if (
      !dto.name ||
      !dto.address ||
      !dto.city ||
      !dto.phone ||
      !dto.email ||
      !dto.taxNumber
    ) {
      this.errorMessage = 'All fields are required.';
      this.cdr.markForCheck();
      return;
    }

    this.isSaving = true;
    this.cdr.markForCheck();

    this.clientService
      .update(this.clientId, dto)
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

          this.successMessage =
            'Client updated successfully.';

          this.cdr.markForCheck();

          this.router.navigate(['/clients']);
        },

        error: (error: unknown) => {

          console.error('Error updating client:', error);

          this.errorMessage = this.getErrorMessage(error);

          this.cdr.markForCheck();
        }
      });
  }

  // BACK TO CLIENTS

  backToClients(): void {
    this.router.navigate(['/clients']);
  }

  // ERROR HANDLING

  private getErrorMessage(error: unknown): string {

    if (error instanceof HttpErrorResponse) {

      if (error.status === 0) {
        return (
          'Cannot connect to the API. ' +
          'Check that the services are running, ' +
          'the HTTPS certificates are trusted, ' +
          'and CORS allows http://localhost:4200.'
        );
      }

      if (error.status === 400) {
        return 'Invalid client data. Please check the fields.';
      }

      if (error.status === 401) {
        return 'You are not authorized to perform this operation.';
      }

      if (error.status === 403) {
        return 'Access to this operation is forbidden.';
      }

      if (error.status === 404) {
        return 'The requested client or API endpoint was not found.';
      }

      if (error.status === 409) {
        return 'The update conflicts with an existing record.';
      }

      if (error.status >= 500) {
        return 'The server encountered an error while processing the request.';
      }

      return `Request failed with HTTP ${error.status}.`;
    }

    if (
      error instanceof Error &&
      error.name === 'TimeoutError'
    ) {
      return 'The request timed out after 15 seconds. Please try again.';
    }

    return 'An unexpected error occurred.';
  }
}