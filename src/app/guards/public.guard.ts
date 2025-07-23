import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class PublicGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean | UrlTree {
    const hasLocalStorage = typeof window !== 'undefined' && typeof localStorage !== 'undefined';
    const token = hasLocalStorage ? localStorage.getItem('token') : null;
    if (token) {
      // Si ya está autenticado, redirige a workspace-list
      return this.router.createUrlTree(['/workspace-list']);
    }
    return true;
  }
}
