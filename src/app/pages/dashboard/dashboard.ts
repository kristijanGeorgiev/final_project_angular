
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, timeout } from 'rxjs';

import { StatisticsService } from '../../core/services/statistics-service';
import { StatisticsDto } from '../../models/statistics.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {

  private readonly statisticsService = inject(StatisticsService);
  private readonly cdr = inject(ChangeDetectorRef);

  statistics: StatisticsDto = {
    totalClients: 0,
    totalClientTypes: 0
  };

  isLoading = false;
  errorMessage = '';
  lastUpdated: Date | null = null;

  // INITIALIZATION

  ngOnInit(): void {
    this.loadStatistics();
  }

  // LOAD DASHBOARD STATISTICS

  loadStatistics(): void {

    // Prevent multiple simultaneous requests
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.cdr.markForCheck();

    this.statisticsService
      .getStatistics()
      .pipe(
        timeout(15000),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({

        next: (response: StatisticsDto) => {

          console.log('Statistics API response:', response);

          if (
            !response ||
            typeof response.totalClients !== 'number' ||
            typeof response.totalClientTypes !== 'number'
          ) {
            this.errorMessage =
              'Statistics API returned an invalid response.';

            this.cdr.markForCheck();
            return;
          }

          this.statistics = {
            totalClients: response.totalClients,
            totalClientTypes: response.totalClientTypes
          };

          // Update timestamp after successful response
          this.lastUpdated = new Date();

          this.cdr.markForCheck();
        },

        error: (error: unknown) => {

          console.error('Statistics API error:', error);

          if (error instanceof HttpErrorResponse) {

            if (error.status === 0) {
              this.errorMessage =
                'Cannot connect to StatisticsService. Check the API, HTTPS certificate, and CORS configuration.';
            } else if (error.status === 404) {
              this.errorMessage =
                'Statistics API endpoint was not found.';
            } else if (error.status >= 500) {
              this.errorMessage =
                'StatisticsService encountered a server error.';
            } else {
              this.errorMessage =
                `Failed to load statistics. HTTP ${error.status}.`;
            }

          } else if (
            error instanceof Error &&
            error.name === 'TimeoutError'
          ) {
            this.errorMessage =
              'StatisticsService did not respond within 15 seconds.';
          } else {
            this.errorMessage =
              'Failed to refresh dashboard statistics.';
          }

          this.cdr.markForCheck();
        }
      });
  }
}