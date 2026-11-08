

import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';

import { ClientTypeService } from '../../../core/services/client-type-service';
import { ClientTypeListDto } from '../../../models/client-type.model';

type SortDirection = 'asc' | 'desc';

interface ClientTypeFilters {
  name: string;
  description: string;
}

@Component({
  selector: 'app-client-type-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-type-list.html',
  styleUrl: './client-type-list.scss'
})
export class ClientTypeList implements OnInit {

  private readonly clientTypeService = inject(ClientTypeService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  clientTypes: ClientTypeListDto[] = [];
  filteredClientTypes: ClientTypeListDto[] = [];
  paginatedClientTypes: ClientTypeListDto[] = [];

  filters: ClientTypeFilters = {
    name: '',
    description: ''
  };

  sortDirection: SortDirection = 'asc';

  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [5, 10, 20, 50];

  totalItems = 0;
  totalPages = 1;

  isLoading = false;
  isDeleting = false;
  deletingClientTypeId: number | null = null;

  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.loadClientTypes();
  }

  // LOAD CLIENT TYPES

  loadClientTypes(): void {

    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.cdr.markForCheck();

    this.clientTypeService
      .getAll()
      .pipe(
        timeout(15000),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({

        next: (response: ClientTypeListDto[]) => {

          console.log('Client Types API response:', response);

          if (!Array.isArray(response)) {

            this.errorMessage =
              'The Client Type API returned an invalid response.';

            this.clientTypes = [];
            this.applyFilters();

            this.cdr.markForCheck();
            return;
          }

          this.clientTypes = response;
          this.applyFilters();

          this.cdr.markForCheck();
        },

        error: (error: unknown) => {

          console.error('Error loading client types:', error);

          this.errorMessage = this.getErrorMessage(error);

          this.clientTypes = [];
          this.applyFilters();

          this.cdr.markForCheck();
        }
      });
  }

  // ERROR HANDLING

  private getErrorMessage(error: unknown): string {

    if (error instanceof HttpErrorResponse) {

      if (error.status === 0) {
        return (
          'Cannot connect to ClientTypeService. ' +
          'Check that the API is running and CORS allows http://localhost:4200.'
        );
      }

      if (error.status === 400) {
        return 'Invalid request to ClientTypeService.';
      }

      if (error.status === 401) {
        return 'You are not authorized to access client types.';
      }

      if (error.status === 403) {
        return 'Access to client types is forbidden.';
      }

      if (error.status === 404) {
        return 'The Client Type API endpoint was not found.';
      }

      if (error.status === 409) {
        return 'This operation conflicts with existing data.';
      }

      if (error.status >= 500) {
        return 'ClientTypeService encountered a server error.';
      }

      return `Client Type API returned HTTP ${error.status}.`;
    }

    if (error instanceof Error && error.name === 'TimeoutError') {
      return 'ClientTypeService did not respond within 15 seconds.';
    }

    return 'An unexpected error occurred.';
  }

  // FILTERING

  applyFilters(): void {

    const normalize = (
      value: string | null | undefined
    ): string => {
      return (value ?? '').toLowerCase().trim();
    };

    this.filteredClientTypes = this.clientTypes.filter(type => {

      return (
        normalize(type.name)
          .includes(normalize(this.filters.name)) &&

        normalize(type.description)
          .includes(normalize(this.filters.description))
      );
    });

    this.sortClientTypes();

    this.currentPage = 1;
    this.updatePagination();

    this.cdr.markForCheck();
  }

  clearFilters(): void {

    this.filters = {
      name: '',
      description: ''
    };

    this.applyFilters();
  }

  // SORTING BY ID

  sortById(): void {

    this.sortDirection =
      this.sortDirection === 'asc'
        ? 'desc'
        : 'asc';

    this.sortClientTypes();
    this.updatePagination();

    this.cdr.markForCheck();
  }

  private sortClientTypes(): void {

    const multiplier =
      this.sortDirection === 'asc' ? 1 : -1;

    this.filteredClientTypes.sort(
      (a, b) => (a.id - b.id) * multiplier
    );
  }

  // PAGINATION

  updatePagination(): void {

    this.totalItems = this.filteredClientTypes.length;

    this.totalPages = Math.max(
      1,
      Math.ceil(this.totalItems / this.pageSize)
    );

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    if (this.currentPage < 1) {
      this.currentPage = 1;
    }

    const startIndex =
      (this.currentPage - 1) * this.pageSize;

    const endIndex = startIndex + this.pageSize;

    this.paginatedClientTypes =
      this.filteredClientTypes.slice(startIndex, endIndex);

    this.cdr.markForCheck();
  }

  changePage(page: number): void {

    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
    this.updatePagination();
  }

  changePageSize(): void {

    this.currentPage = 1;
    this.updatePagination();
  }

  get visiblePages(): number[] {

    const pages: number[] = [];

    const end = Math.min(
      this.totalPages,
      Math.max(5, this.currentPage + 2)
    );

    const start = Math.max(1, end - 4);

    for (let page = start; page <= end; page++) {
      pages.push(page);
    }

    return pages;
  }

  get startItem(): number {

    if (this.totalItems === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {

    return Math.min(
      this.currentPage * this.pageSize,
      this.totalItems
    );
  }

  // CRUD NAVIGATION

  addClientType(): void {
    this.router.navigate(['/client-types/create']);
  }

  viewClientType(id: number): void {
    this.router.navigate(['/client-types', id]);
  }

  editClientType(id: number): void {
    this.router.navigate(['/client-types', id, 'edit']);
  }

  // DELETE CLIENT TYPE

  deleteClientType(clientType: ClientTypeListDto): void {

    if (this.isDeleting) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete client type "${clientType.name}" (ID: ${clientType.id})?`
    );

    if (!confirmed) {
      return;
    }

    this.isDeleting = true;
    this.deletingClientTypeId = clientType.id;

    this.errorMessage = '';
    this.successMessage = '';

    this.cdr.markForCheck();

    this.clientTypeService
      .delete(clientType.id)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.isDeleting = false;
          this.deletingClientTypeId = null;

          this.cdr.markForCheck();
        })
      )
      .subscribe({

        next: () => {

          this.clientTypes = this.clientTypes.filter(
            item => item.id !== clientType.id
          );

          this.applyFilters();

          this.successMessage =
            `Client type "${clientType.name}" was deleted successfully.`;

          this.cdr.markForCheck();
        },

        error: (error: unknown) => {

          console.error('Error deleting client type:', error);

          if (
            error instanceof HttpErrorResponse &&
            error.status === 409
          ) {
            this.errorMessage =
              'This client type cannot be deleted because it is in use.';
          } else {
            this.errorMessage = this.getErrorMessage(error);
          }

          this.cdr.markForCheck();
        }
      });
  }

  // TRACK BY

  trackByClientTypeId(
    index: number,
    clientType: ClientTypeListDto
  ): number {
    return clientType.id;
  }
}
