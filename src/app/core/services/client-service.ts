
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ClientListDto,
  ClientDetailDto,
  ClientCreateDto,
  ClientUpdateDto
} from '../../models/client.model';

@Injectable({
  providedIn: 'root'
})
export class ClientService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.api.clients;

  getAll(): Observable<ClientListDto[]> {
    return this.http.get<ClientListDto[]>(this.apiUrl);
  }

  getById(id: number): Observable<ClientDetailDto> {
  return this.http.get<ClientDetailDto>(
    `${this.apiUrl}/${id}`
  );
}

  getByClientTypeId(
    clientTypeId: number
  ): Observable<ClientListDto[]> {
    return this.http.get<ClientListDto[]>(
      `${this.apiUrl}/by-client-type/${clientTypeId}`
    );
  }

  getCount(): Observable<number> {
    return this.http.get<number>(
      `${this.apiUrl}/count`
    );
  }

  create(dto: ClientCreateDto): Observable<ClientDetailDto> {
    return this.http.post<ClientDetailDto>(
      this.apiUrl,
      dto
    );
  }

  update(
    id: number,
    dto: ClientUpdateDto
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
