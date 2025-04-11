import { HttpClient } from '@angular/common/http';
import { inject, Injectable, NgZone } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Auth,
  authState,
  getAuth,
  getIdTokenResult,
  IdTokenResult,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateEmail,
  updateProfile,
  user,
  User,
  UserCredential,
} from '@angular/fire/auth';
import { doc, docData, Firestore, getDoc, setDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { GoogleAuthProvider } from '@firebase/auth';
import { concatMap, from, map, Observable, of, switchMap } from 'rxjs';
import { ProfileUser } from '../models/profile-user.model';
import { UserProfile } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  auth = inject(Auth);
  firestore = inject(Firestore);
  router = inject(Router);
  ngZone: NgZone = inject(NgZone);
  http = inject(HttpClient);
  //
  currentUser$: Observable<User | null> = authState(this.auth);
  currentUser = toSignal<User | null>(this.currentUser$);
  private timeout: any;

  constructor() {
    this.startTimer();
    this.getUserState().subscribe((user) => {
      if (user) {
        this.resetTimer();
      }
    });
  }

  get userProfile$(): Observable<ProfileUser | null> {
    const user = this.auth.currentUser;
    const ref = doc(this.firestore, 'users', `${user?.uid}`);
    if (ref) {
      return docData(ref) as Observable<ProfileUser | null>;
    } else {
      return of(null);
    }
  }

  getTranslations(): Observable<any> {
    return this.http.get<any>('/assets/i18n/th.json');
  }

  startTimer() {
    this.timeout = setTimeout(
      () => {
        this.logout().then(() => {
          console.log('logout');
          this.router.navigateByUrl('/auth/login');
        });
      },
      30 * 60 * 1000,
    ); // 30 นาที
  }

  resetTimer() {
    clearTimeout(this.timeout);
    this.startTimer();
  }

  login(email: string, password: string): Observable<UserCredential> {
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }

  async googleSignIn(): Promise<void> {
    const provider = new GoogleAuthProvider();
    const {user} = await this.ngZone.run(() => signInWithPopup(this.auth, provider));
    await this.saveUserToFirestore(user, '');
    await this.saveToLocal(user);
  }

  async saveUserToFirestore(user: User, displayName: string): Promise<void> {
    const userRef = doc(this.firestore, 'users', user.uid);
    const userSnapShot = await getDoc(userRef);

    if (!userSnapShot.exists()) {
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || displayName,
        role: 'user',
        createdAt: new Date(),
      };
      await setDoc(userRef, userData);
    }
  }

  async saveToLocal(user: User) {
    const userProfile = await this.getUserProfile(user.uid) as UserProfile;

    if (userProfile) {
      const userData = {
        ...userProfile,
      };
      delete userData.createdAt;
      localStorage.setItem('user', JSON.stringify(userData));
    }
  }

  async getUserProfile(uid: string) {
    const userDocRef = doc(this.firestore, 'users', uid);
    const userDocSnapshot = await getDoc(userDocRef);

    if (userDocSnapshot.exists()) {
      return userDocSnapshot.data();
    } else {
      return null;
    }
  }

  forgotPassword(email: string) {
    return from(sendPasswordResetEmail(this.auth, email));
  }

  async logout(): Promise<void> {
    return await signOut(this.auth);
  }

  async sendEmailVerification(): Promise<void | undefined> {
    return await sendEmailVerification(<User>this.auth.currentUser);
  }

  isLoggedIn(): boolean {
    return !!this.auth.currentUser;
  }

  getUserState(): Observable<any> {
    return user(this.auth);
  }

  getIdTokenResult(): Promise<IdTokenResult> | any {
    return getAuth().currentUser?.getIdTokenResult();
  }

  isAdmin(): Observable<boolean> {
    return this.currentUser$.pipe(
      switchMap(user => user ? getIdTokenResult(user, true) : of(null)),
      map(tokenResult =>
        tokenResult?.claims['role'] === 'admin' ||
        tokenResult?.claims['role'] === 'manager'),
    );
  }

  getRole(): Observable<string | null> {
    return this.currentUser$.pipe(
      switchMap(user => user ? getIdTokenResult(user, true) : of(null)),
      map(tokenResult => tokenResult ? (tokenResult.claims['role'] as string) : null),
    );
  }

  updateProfile(profileData: { uid: string; photoURL: string }): Observable<any> {
    const user = this.auth.currentUser;

    return of(user).pipe(
      concatMap((user) => {
        if (!user) throw new Error('Not Authenticated');
        return updateProfile(user, profileData);
      }),
    );
  }

  async newUser(user: any) {
    const currentUser = this.auth.currentUser;

    if (currentUser) {
      const updateProfilePromise = this.ngZone.run(() => updateProfile(currentUser, {
        displayName: user.displayName,
        photoURL: user.photoURL,
      }));

      const updateEmailPromise = user.email ? await this.ngZone.run(() => updateEmail(currentUser, user.email)) : await Promise.resolve();

      return await Promise.all([updateProfilePromise, updateEmailPromise])
        .then(() => {
          const userRole = typeof user.role === 'object' && user.role !== null
            ? (user.role as { name: string; }).name
            : user.role;

          const fakeData = {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email || currentUser.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            address: user.address,
            role: userRole,
          };

          const ref = doc(this.firestore, 'users', `${user.uid}`);
          return setDoc(ref, fakeData);
        })
        .catch(error => {
          if (error instanceof Error) {
            console.error('Error updating user profile:', error.message);
          }
          throw error;
        });
    } else {
      return Promise.reject(new Error('No authenticated user found'));
    }
  }
}
