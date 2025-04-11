import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { doc, Firestore, setDoc, updateDoc } from '@angular/fire/firestore';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { from, map, Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { CreateUserRequest, UpdateUserRequest } from '../models/create-user-request.model';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  auth = inject(Auth);
  authService = inject(AuthService);
  firestore = inject(Firestore);
  http = inject(HttpClient);

  // baseUrl = environment.production
  //   ? `https://us-central1-${environment.firebaseConfig.projectId}.cloudfunctions.net/apiFunction/users`
  //   : `http://localhost:5001/${environment.firebaseConfig.projectId}/us-central1/apiFunction/users`;
  baseUrl = `https://us-central1-${environment.firebaseConfig.projectId}.cloudfunctions.net/apiFunction/users`;

  form = new FormGroup({
    uid: new FormControl(''),
    email: new FormControl('', [Validators.required, Validators.email]),
    displayName: new FormControl(''),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
    ]),
    role: new FormControl('', [Validators.required]),
  });
  private userUpdated = new Subject<void>();

  constructor() {
  }

  get users$(): Observable<User[]> {
    return this.http.get<{ users: User[] }>(`${this.baseUrl}`).pipe(
      map((result) => {
        return result.users;
      }),
    );
  }

  create(user: CreateUserRequest) {
    console.log('create user ', user);
    return this.http
      .post<{ uid: string }>(`${this.baseUrl}`, user)
      .pipe(map((res) => res));
  }

  edit(user: UpdateUserRequest) {
    return this.http.patch(`${this.baseUrl}/${user.uid}`, user).pipe(
      map((res) => {
        this.userUpdated.next();
        return res;
      }),
    );
  }

  updatePhotoURL(uid: string, photoURL: string) {
    return this.http
      .patch(`${this.baseUrl}/${uid}/photo`, {photoURL: photoURL})
      .pipe(
        map((res) => {
          this.userUpdated.next();
          return res;
        }),
      );
  }

  delete(user: UpdateUserRequest) {
    return this.http.delete(`${this.baseUrl}/${user.uid}`);
  }

  update(user: any) {
    const ref = doc(this.firestore, 'users', `${user.uid}`);
    return from(updateDoc(ref, {...user}));
  }

  newUser(user: any) {
    const email = this.auth.currentUser?.email;
    const userRole =
      typeof user.role === 'object' && user.role !== null
        ? (user.role as { name: string }).name
        : user.role;

    const dataSave = {
      ...user,
      email: email || '',
      role: userRole,
    };
    const ref = doc(this.firestore, 'users', `${user?.uid}`);
    return from(setDoc(ref, dataSave));
  }
}
