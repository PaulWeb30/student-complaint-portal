export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export type ComplaintStatus = 'pending' | 'approved' | 'rejected';

export interface Complaint {
  id: string;
  description: string;
  status: ComplaintStatus;
  createdAt: string;
  userId: string;
}

export interface CreateComplaintRequest {
  description: string;
}

export interface UpdateComplaintRequest {
  status: 'approved' | 'rejected';
}
