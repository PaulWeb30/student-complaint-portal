import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  Complaint,
  CreateComplaintRequest,
  UpdateComplaintRequest,
  ComplaintStatus,
} from '../models';

@Injectable({ providedIn: 'root' })
export class ComplaintService {
  private readonly http = inject(HttpClient);

  getComplaints(status?: ComplaintStatus | 'all') {
    if (!status || status === 'all') {
      return this.http.get<Complaint[]>(`${environment.apiBaseUrl}/complaints`);
    }
    if (status === 'approved') {
      return this.http.get<Complaint[]>(`${environment.apiBaseUrl}/complaints/approved`);
    }
    return this.http.get<Complaint[]>(`${environment.apiBaseUrl}/complaints`, {
      params: { status },
    });
  }

  getAdminComplaints(status?: ComplaintStatus | 'all') {
    if (!status || status === 'all') {
      return this.http.get<Complaint[]>(`${environment.apiBaseUrl}/admin/complaints`);
    }
    return this.http.get<Complaint[]>(`${environment.apiBaseUrl}/admin/complaints`, {
      params: { status },
    });
  }

  createComplaint(payload: CreateComplaintRequest) {
    return this.http.post<Complaint>(`${environment.apiBaseUrl}/complaints`, payload);
  }

  updateComplaint(id: string, payload: UpdateComplaintRequest) {
    return this.http.put<Complaint>(`${environment.apiBaseUrl}/complaints/${id}`, payload);
  }

  likeComplaint(id: string) {
    return this.http.post<void>(`${environment.apiBaseUrl}/complaints/${id}/like`, {});
  }

  unlikeComplaint(id: string) {
    return this.http.delete<void>(`${environment.apiBaseUrl}/complaints/${id}/like`);
  }

  deleteComplaint(id: string) {
    return this.http.delete<void>(`${environment.apiBaseUrl}/complaints/${id}`);
  }
}
