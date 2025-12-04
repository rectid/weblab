import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Message, User } from '../models/types';

@Injectable({ providedIn: 'root' })
export class RealtimeService implements OnDestroy {
  private socket?: Socket;

  private ensureSocket(): Socket {
    if (!this.socket) {
      this.socket = io(environment.apiUrl || window.location.origin, {
        transports: ['websocket']
      });
    }
    return this.socket;
  }

  onMessage(): Observable<Message> {
    return new Observable((subscriber) => {
      const socket = this.ensureSocket();
      const handler = (payload: Message) => subscriber.next(payload);
      socket.on('message:new', handler);
      return () => socket.off('message:new', handler);
    });
  }

  onUserUpdated(): Observable<User> {
    return new Observable((subscriber) => {
      const socket = this.ensureSocket();
      const handler = (payload: User) => subscriber.next(payload);
      socket.on('user:updated', handler);
      return () => socket.off('user:updated', handler);
    });
  }

  onFriendsUpdated(): Observable<{ userId: string; friends: string[] }> {
    return new Observable((subscriber) => {
      const socket = this.ensureSocket();
      const handler = (payload: { userId: string; friends: string[] }) => subscriber.next(payload);
      socket.on('friends:updated', handler);
      return () => socket.off('friends:updated', handler);
    });
  }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
