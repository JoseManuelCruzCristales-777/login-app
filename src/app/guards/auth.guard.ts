import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean | UrlTree {
    const hasLocalStorage = typeof window !== 'undefined' && typeof localStorage !== 'undefined';
    const token = hasLocalStorage ? localStorage.getItem('token') : null;
    if (token) {
      return true;
    }
    // Si no hay token, redirige a login y limpia historial
    return this.router.createUrlTree(['/login']);
  }
}
