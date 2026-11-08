
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ClientTypeListDto,
  ClientTypeDetailDto,
  ClientTypeCreateDto,
  ClientTypeUpdateDto
} from '../../models/client-type.model';

@Injectable({
  providedIn: 'root'
})
export class ClientTypeService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.api.clientTypes;

  getAll(): Observable<ClientTypeListDto[]> {
    return this.http.get<ClientTypeListDto[]>(
      this.apiUrl
    );
  }

  getById(id: number): Observable<ClientTypeDetailDto> {
    return this.http.get<ClientTypeDetailDto>(
      `${this.apiUrl}/${id}`
    );
  }

  getCount(): Observable<number> {
    return this.http.get<number>(
      `${this.apiUrl}/count`
    );
  }

  create(
    dto: ClientTypeCreateDto
  ): Observable<ClientTypeDetailDto> {
    return this.http.post<ClientTypeDetailDto>(
      this.apiUrl,
      dto
    );
  }

  update(
    id: number,
    dto: ClientTypeUpdateDto
  ): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/${id}`,
      dto
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
}