import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-compose-message',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './compose-message.component.html',
  styleUrls: ['./compose-message.component.scss']
})
export class ComposeMessageComponent {
  readonly messageForm;

  isSubmitting = false;
  error: string | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly api: ApiService,
    private readonly auth: AuthService,
    private readonly router: Router
  ) {
    this.messageForm = this.fb.nonNullable.group({
      text: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(500)]]
    });
  }

  submit(): void {
    if (this.messageForm.invalid || !this.auth.currentUser) {
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    const { text } = this.messageForm.getRawValue();

    this.api.createMessage(this.auth.currentUser.id, text)
      .pipe(
        catchError((error) => {
          this.error = error?.error?.message ?? 'Не удалось опубликовать сообщение';
          return of(null);
        })
      )
      .subscribe((response) => {
        this.isSubmitting = false;
        if (response) {
          this.router.navigate(['/feed']);
        }
      });
  }

  get characterCount(): number {
    return this.messageForm.get('text')?.value?.length || 0;
  }

  get maxLength(): number {
    return 500;
  }
}
