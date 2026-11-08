
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { ClientService } from '../../../core/services/client-service';
import { ClientTypeService } from '../../../core/services/client-type-service';
import { ClientCreateDto } from '../../../models/client.model';

interface ClientTypeOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './client-form.html',
  styleUrl: './client-form.scss'
})
export class ClientForm implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly clientService = inject(ClientService);
  private readonly clientTypeService = inject(ClientTypeService);
  private readonly router = inject(Router);

  clientTypes: ClientTypeOption[] = [];

  isLoadingTypes = false;
  isSaving = false;
  submitted = false;
  errorMessage = '';

  clientForm = this.fb.nonNullable.group({
    clientTypeId: [0, [Validators.required, Validators.min(1)]],
    name: ['', [Validators.required, Validators.maxLength(200)]],
    address: ['', [Validators.required, Validators.maxLength(250)]],
    city: ['', [Validators.required, Validators.maxLength(100)]],
    phone: ['', [Validators.required, Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    taxNumber: ['', [Validators.required, Validators.maxLength(50)]]
  });

  ngOnInit(): void {
    this.loadClientTypes();
  }

  loadClientTypes(): void {
    this.isLoadingTypes = true;
    this.errorMessage = '';

    this.clientTypeService
      .getAll()
      .pipe(finalize(() => this.isLoadingTypes = false))
      .subscribe({
        next: (response) => {
          this.clientTypes = response.map(type => ({
            id: type.id,
            name: type.name
          }));
        },
        error: (error) => {
          console.error('Error loading client types:', error);
          this.errorMessage =
            'Unable to load client types. Please check the Client Type API.';
        }
      });
  }

  isInvalid(controlName: keyof ClientCreateDto): boolean {
    const control = this.clientForm.controls[controlName];

    return control.invalid &&
      (control.touched || this.submitted);
  }

  saveClient(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.isSaving) {
      return;
    }

    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }

    const value = this.clientForm.getRawValue();

    const dto: ClientCreateDto = {
      clientTypeId: value.clientTypeId,
      name: value.name.trim(),
      address: value.address.trim(),
      city: value.city.trim(),
      phone: value.phone.trim(),
      email: value.email.trim(),
      taxNumber: value.taxNumber.trim()
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
      return;
    }

    this.isSaving = true;

    this.clientService
      .create(dto)
      .pipe(finalize(() => this.isSaving = false))
      .subscribe({
        next: () => {
          this.router.navigate(['/clients']);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error creating client:', error);

          if (error.status === 0) {
            this.errorMessage =
              'Cannot connect to ClientService. Check API availability and CORS.';
          } else if (error.status === 400) {
            this.errorMessage =
              'The submitted client data is invalid. Please check the fields.';
          } else if (error.status === 409) {
            this.errorMessage =
              'A client with conflicting information already exists.';
          } else {
            this.errorMessage =
              'Unable to save the client. Please try again.';
          }
        }
      });
  }

  backToClients(): void {
    this.router.navigate(['/clients']);
  }
}