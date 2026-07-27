export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  email: string;
  fullName: string;
  role: string;
  expiresInMillis: number;
}

export interface CurrentUser {
  email: string;
  fullName: string;
  role: string;
}
