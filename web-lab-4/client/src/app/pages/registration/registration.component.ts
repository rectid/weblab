import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-registration-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss']
})
export class RegistrationComponent {
  readonly registerForm;
  readonly loginForm;

  authError: string | null = null;
  mode: 'register' | 'login' = 'register';

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router
  ) {
    this.registerForm = this.fb.nonNullable.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      birthDate: [''],
      photo: ['']
    });

    this.loginForm = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  switchMode(mode: 'register' | 'login'): void {
    this.mode = mode;
    this.authError = null;
  }

  submit(): void {
    this.authError = null;
    if (this.mode === 'register') {
      if (this.registerForm.invalid) {
        this.registerForm.markAllAsTouched();
        return;
      }
      this.auth
        .register(this.registerForm.getRawValue())
        .pipe(
          catchError((error) => {
            this.authError = error?.error?.message ?? 'Не удалось зарегистрироваться';
            return of(null);
          })
        )
        .subscribe((response) => {
          if (response) {
            this.router.navigate(['/feed']);
          }
        });
    } else {
      if (this.loginForm.invalid) {
        this.loginForm.markAllAsTouched();
        return;
      }
      this.auth
        .login(this.loginForm.getRawValue())
        .pipe(
          catchError((error) => {
            this.authError = error?.error?.message ?? 'Не удалось выполнить вход';
            return of(null);
          })
        )
        .subscribe((response) => {
          if (response) {
            this.router.navigate(['/feed']);
          }
        });
    }
  }
}
