import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthPayload, AuthResponse, FeedResponse, Message, UpdatePhotoPayload, User } from '../models/types';

const joinUrl = (base: string, endpoint: string) => {
  if (!base) {
    return endpoint;
  }
  return `${base.replace(/\/$/, '')}${endpoint}`;
};

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiUrl ? environment.apiUrl.replace(/\/$/, '') : '';

  constructor(private readonly http: HttpClient) {}

  register(payload: AuthPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(joinUrl(this.baseUrl, '/api/auth/register'), payload);
  }

  login(payload: AuthPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(joinUrl(this.baseUrl, '/api/auth/login'), payload);
  }

  fetchAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(joinUrl(this.baseUrl, '/api/users'));
  }

  fetchUser(userId: string): Observable<User> {
    return this.http.get<User>(joinUrl(this.baseUrl, `/api/users/${userId}`));
  }

  updatePhoto(userId: string, payload: UpdatePhotoPayload): Observable<User> {
    return this.http.put<User>(joinUrl(this.baseUrl, `/api/users/${userId}/photo`), payload);
  }

  fetchFeed(userId: string): Observable<FeedResponse> {
    return this.http.get<FeedResponse>(joinUrl(this.baseUrl, `/api/feed/${userId}`));
  }

  createMessage(authorId: string, text: string): Observable<Message> {
    return this.http.post<Message>(joinUrl(this.baseUrl, '/api/messages'), {
      authorId,
      text
    });
  }

  fetchFriends(userId: string): Observable<User[]> {
    return this.http.get<User[]>(joinUrl(this.baseUrl, `/api/friends/${userId}`));
  }

  addFriend(userId: string, friendId: string): Observable<void> {
    return this.http.post<void>(joinUrl(this.baseUrl, `/api/friends/${userId}`), {
      friendId
    });
  }

  removeFriend(userId: string, friendId: string): Observable<void> {
    return this.http.delete<void>(joinUrl(this.baseUrl, `/api/friends/${userId}/${friendId}`));
  }
}
