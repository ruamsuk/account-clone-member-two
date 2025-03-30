export type Role = 'admin' | 'manager' | 'user';

export interface User {
  uid: string;
  displayName: string;
  role?: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string;
  emailVerified?: boolean;
}

export interface UserProfile {
  displayName: string | null;
  email: string | null;
  role: string;
  createdAt?: Date; // Optional field
}
