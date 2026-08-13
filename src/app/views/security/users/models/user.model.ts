export interface Role {
  id: number;
  name: string;
}

export interface User {
  id: number;
  fullName: string | null;
  email: string;
  roleId: number;
  role: string;
  active: boolean;
  createdAt: string;
  createdBy: number | null;
  updatedAt: string | null;
  updatedBy: number | null;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  roleId: number;
}

export interface UpdateUserRequest {
  fullName: string;
  roleId: number;
}
