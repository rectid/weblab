import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../models/types';

@Component({
  selector: 'app-friend-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './friend-manager.component.html',
  styleUrls: ['./friend-manager.component.scss']
})
export class FriendManagerComponent {
  @Input({ required: true }) friends: User[] = [];
  @Input({ required: true }) availableUsers: User[] = [];
  @Output() addFriend = new EventEmitter<string>();
  @Output() removeFriend = new EventEmitter<string>();

  selectedFriendId: string | null = null;

  onAddFriend(): void {
    if (this.selectedFriendId) {
      this.addFriend.emit(this.selectedFriendId);
      this.selectedFriendId = null;
    }
  }

  onRemoveFriend(friendId: string): void {
    this.removeFriend.emit(friendId);
  }

  trackByUserId(_index: number, user: User): string {
    return user.id;
  }
}
