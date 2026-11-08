
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  DestroyRef,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, timeout } from 'rxjs';

import { ClientService } from '../../../core/services/client-service';
import { ClientListDto } from '../../../models/client.model';

type SortDirection = 'asc' | 'desc';

interface ClientFilters {
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  taxNumber: string;
}

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-list.html',
  styleUrl: './client-list.scss'
})
export class ClientList implements OnInit {

  private readonly clientService = inject(ClientService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  clients: ClientListDto[] = [];
  filteredClients: ClientListDto[] = [];
  paginatedClients: ClientListDto[] = [];

  filters: ClientFilters = {
    name: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    taxNumber: ''
  };

  sortDirection: SortDirection = 'asc';

  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [5, 10, 20, 50];

  totalItems = 0;
  totalPages = 1;

  isLoading = false;
  isDeleting = false;
  deletingClientId: number | null = null;

  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.loadClients();
  }

  // LOAD CLIENTS

  loadClients(): void {

    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.cdr.markForCheck();

    this.clientService
      .getAll()
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

        next: (response: ClientListDto[]) => {

          console.log('Clients API response:', response);

          if (!Array.isArray(response)) {
            this.errorMessage =
              'The Client API returned an invalid response.';

            this.clients = [];
            this.applyFilters();
            return;
          }

          this.clients = response;
          this.applyFilters();
        },

        error: (error: unknown) => {

          console.error('Error loading clients:', error);

          this.errorMessage = this.getErrorMessage(error);

          this.clients = [];
          this.applyFilters();
        }
      });
  }

  // HTTP ERROR HANDLING

  private getErrorMessage(error: unknown): string {

    if (error instanceof HttpErrorResponse) {

      switch (error.status) {
        case 0:
          return (
            'Cannot connect to ClientService. ' +
            'Check that the API is running, the HTTPS certificate is trusted, ' +
            'and CORS allows http://localhost:4200.'
          );

        case 400:
          return 'Invalid request to ClientService.';

        case 401:
          return 'You are not authorized to access clients.';

        case 403:
          return 'Access to client records is forbidden.';

        case 404:
          return 'The requested Client API endpoint was not found.';

        case 409:
          return 'The operation conflicts with existing data.';

        default:
          if (error.status >= 500) {
            return 'ClientService encountered a server error.';
          }

          return `Client API returned HTTP ${error.status}.`;
      }
    }

    if (error instanceof Error && error.name === 'TimeoutError') {
      return 'ClientService did not respond within 15 seconds.';
    }

    return 'An unexpected error occurred while processing clients.';
  }

  // FILTERING

  applyFilters(): void {

    const normalize = (
      value: string | null | undefined
    ): string => (value ?? '').toLowerCase().trim();

    this.filteredClients = this.clients.filter(client =>
      normalize(client.name).includes(normalize(this.filters.name)) &&
      normalize(client.address).includes(normalize(this.filters.address)) &&
      normalize(client.city).includes(normalize(this.filters.city)) &&
      normalize(client.phone).includes(normalize(this.filters.phone)) &&
      normalize(client.email).includes(normalize(this.filters.email)) &&
      normalize(client.taxNumber).includes(normalize(this.filters.taxNumber))
    );

    this.sortClients();
    this.currentPage = 1;
    this.updatePagination();
  }

  clearFilters(): void {

    this.filters = {
      name: '',
      address: '',
      city: '',
      phone: '',
      email: '',
      taxNumber: ''
    };

    this.applyFilters();
  }

  // SORTING BY ID

  sortById(): void {

    this.sortDirection =
      this.sortDirection === 'asc' ? 'desc' : 'asc';

    this.sortClients();
    this.updatePagination();
  }

  private sortClients(): void {

    const multiplier =
      this.sortDirection === 'asc' ? 1 : -1;

    this.filteredClients.sort(
      (a, b) => (a.id - b.id) * multiplier
    );
  }

  // PAGINATION

  updatePagination(): void {

    this.totalItems = this.filteredClients.length;

    this.totalPages = Math.max(
      1,
      Math.ceil(this.totalItems / this.pageSize)
    );

    this.currentPage = Math.min(
      Math.max(this.currentPage, 1),
      this.totalPages
    );

    const startIndex =
      (this.currentPage - 1) * this.pageSize;

    const endIndex = startIndex + this.pageSize;

    this.paginatedClients =
      this.filteredClients.slice(startIndex, endIndex);

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

  addClient(): void {
    this.router.navigate(['/clients/create']);
  }

  viewClient(id: number): void {
    this.router.navigate(['/clients', id]);
  }

  editClient(id: number): void {
    this.router.navigate(['/clients', id, 'edit']);
  }

  // DELETE CLIENT

  deleteClient(client: ClientListDto): void {

    if (this.isDeleting) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete client "${client.name}" (ID: ${client.id})?`
    );

    if (!confirmed) {
      return;
    }

    this.isDeleting = true;
    this.deletingClientId = client.id;
    this.errorMessage = '';
    this.successMessage = '';

    this.cdr.markForCheck();

    this.clientService
      .delete(client.id)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.isDeleting = false;
          this.deletingClientId = null;

          if (!this.destroyRef.destroyed) {
            this.cdr.markForCheck();
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({

        next: () => {

          this.clients = this.clients.filter(
            item => item.id !== client.id
          );

          this.applyFilters();

          this.successMessage =
            `Client "${client.name}" was deleted successfully.`;

          this.cdr.markForCheck();
        },

        error: (error: unknown) => {

          console.error('Error deleting client:', error);

          this.errorMessage = this.getErrorMessage(error);

          this.cdr.markForCheck();
        }
      });
  }

  // TRACK BY

  trackByClientId(
    index: number,
    client: ClientListDto
  ): number {
    return client.id;
  }
}