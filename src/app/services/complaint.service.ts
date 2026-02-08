import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Complaint, CreateComplaintRequest, UpdateComplaintRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class ComplaintService {
  private readonly http = inject(HttpClient);

  getComplaints() {
    return this.http.get<Complaint[]>(`${environment.apiBaseUrl}/complaints`);
  }

  createComplaint(payload: CreateComplaintRequest) {
    return this.http.post<Complaint>(`${environment.apiBaseUrl}/complaints`, payload);
  }

  updateComplaint(id: string, payload: UpdateComplaintRequest) {
    return this.http.put<Complaint>(`${environment.apiBaseUrl}/complaints/${id}`, payload);
  }
}
