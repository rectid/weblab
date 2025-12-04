import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { AuthPayload, AuthResponse, User } from '../models/types';

const STORAGE_KEY = 'social-user-app.currentUser';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userSubject = new BehaviorSubject<User | null>(null);
  readonly currentUser$ = this.userSubject.asObservable();

  constructor(private readonly api: ApiService, private readonly router: Router) {
    this.restoreFromStorage();
  }

  get currentUser(): User | null {
    return this.userSubject.value;
  }

  register(payload: AuthPayload): Observable<AuthResponse> {
    return this.api.register(payload).pipe(tap((response) => this.persistUser(response.user)));
  }

  login(payload: AuthPayload): Observable<AuthResponse> {
    return this.api.login(payload).pipe(tap((response) => this.persistUser(response.user)));
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.userSubject.next(null);
    this.router.navigate(['/register']);
  }

  updateUser(user: User): void {
    this.persistUser(user);
  }

  private persistUser(user: User): void {
    this.userSubject.next(user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  private restoreFromStorage(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const user: User = JSON.parse(raw);
        this.userSubject.next(user);
      } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }
}
