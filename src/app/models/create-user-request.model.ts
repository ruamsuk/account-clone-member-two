export interface CreateUserRequest {
  displayName: string;
  password: string;
  email: string;
  role: string;
}

export interface UpdateUserRequest extends CreateUserRequest {
  uid: string;
}
