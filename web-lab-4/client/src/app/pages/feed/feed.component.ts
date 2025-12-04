import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { RealtimeService } from '../../services/realtime.service';
import { AuthService } from '../../services/auth.service';
import { Message, User } from '../../models/types';
import { HighlightDirective } from '../../directives/highlight.directive';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, RouterLink, HighlightDirective],
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.scss']
})
export class FeedComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  users: User[] = [];
  friends: string[] = [];
  private subscriptions: Subscription[] = [];

  constructor(
    private readonly api: ApiService,
    private readonly realtime: RealtimeService,
    private readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.setupRealtime();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadData(): void {
    // Load messages
    if (this.auth.currentUser) {
      this.subscriptions.push(
        this.api.fetchFeed(this.auth.currentUser.id).subscribe({
          next: (response) => {
            this.messages = response.messages || [];
            this.enrichMessagesWithUserData();
          },
          error: (error) => console.error('Failed to load messages:', error)
        })
      );
    }

    // Load users
    this.subscriptions.push(
      this.api.fetchAllUsers().subscribe({
        next: (users) => {
          this.users = users;
          this.enrichMessagesWithUserData();
        },
        error: (error) => console.error('Failed to load users:', error)
      })
    );

    // Load friends
    if (this.auth.currentUser) {
      this.subscriptions.push(
        this.api.fetchFriends(this.auth.currentUser.id).subscribe({
          next: (friends) => {
            this.friends = friends.map(f => f.id);
          },
          error: (error) => console.error('Failed to load friends:', error)
        })
      );
    }
  }

  private setupRealtime(): void {
    // Listen for new messages
    this.subscriptions.push(
      this.realtime.onMessage().subscribe((message: Message) => {
        this.messages.unshift(message);
        this.enrichMessagesWithUserData();
      })
    );

    // Listen for friend updates
    this.subscriptions.push(
      this.realtime.onFriendsUpdated().subscribe((update) => {
        if (update.userId === this.auth.currentUser?.id) {
          this.friends = update.friends;
        }
      })
    );
  }

  private enrichMessagesWithUserData(): void {
    this.messages.forEach(message => {
      const author = this.users.find(u => u.id === message.authorId);
      if (author) {
        message.authorName = author.fullName;
        message.authorPhoto = author.photo;
      }
    });
  }

  isFriend(userId: string): boolean {
    return this.friends.includes(userId);
  }

  addFriend(userId: string): void {
    if (this.auth.currentUser) {
      this.api.addFriend(this.auth.currentUser.id, userId).subscribe({
        error: (error) => console.error('Failed to add friend:', error)
      });
    }
  }

  removeFriend(userId: string): void {
    if (this.auth.currentUser) {
      this.api.removeFriend(this.auth.currentUser.id, userId).subscribe({
        error: (error) => console.error('Failed to remove friend:', error)
      });
    }
  }

  logout(): void {
    this.auth.logout();
  }
}
