import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { StatisticsDto } from '../../models/statistics.model';

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = environment.api.statistics;

  getStatistics(): Observable<StatisticsDto> {
    return this.http.get<StatisticsDto>(this.apiUrl);
  }
}