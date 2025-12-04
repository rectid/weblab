import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { RegistrationComponent } from './pages/registration/registration.component';
import { FeedComponent } from './pages/feed/feed.component';
import { ComposeMessageComponent } from './pages/compose-message/compose-message.component';

const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.currentUser; // getter returning value
  if (user) {
    return true;
  }
  router.navigate(['/register']);
  return false;
};

export const APP_ROUTES: Routes = [
  { path: '', redirectTo: 'feed', pathMatch: 'full' },
  { path: 'register', component: RegistrationComponent },
  { path: 'feed', component: FeedComponent, canActivate: [authGuard] },
  { path: 'compose', component: ComposeMessageComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'feed' }
];
