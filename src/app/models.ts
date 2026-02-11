export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  email: string;
  name?: string;
  username?: string;
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
  name: string;
  username: string;
  password: string;
}

export interface UpdateProfileRequest {
  name: string;
  username: string;
}

export type ComplaintStatus = 'pending' | 'approved' | 'rejected';

export interface Complaint {
  id: string;
  description: string;
  status: ComplaintStatus;
  createdAt: string;
  userId: string;
  comments?: ComplaintComment[];
  likeCount?: number;
}

export interface ComplaintComment {
  id?: string;
  adminId: string;
  content: string;
  createdAt: string;
}

export interface CreateComplaintRequest {
  description: string;
}

export interface UpdateComplaintRequest {
  status: ComplaintStatus;
  comment?: string;
}
