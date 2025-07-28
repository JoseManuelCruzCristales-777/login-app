import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient, private router: Router) {}

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  // Método para verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    console.log('🔐 Verificando autenticación. Token existe:', !!token);
    
    if (!token || token === 'null' || token === 'undefined') {
      console.log('🔐 Token inválido o inexistente');
      return false;
    }
    
    // Verificar formato básico del token (debería ser una cadena larga)
    if (token.length < 20) {
      console.log('🔐 Token demasiado corto, posiblemente inválido');
      localStorage.removeItem('token'); // Limpiar token inválido
      return false;
    }
    
    console.log('🔐 Token válido encontrado:', token.substring(0, 20) + '...');
    return true;
  }

  // Método mejorado para el login que asegura el guardado del token
  login(credentials: any): Observable<any> {
    console.log('Auth service - Login called with:', credentials);
    
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        console.log('Auth service - Login response:', response);
        
        // Extraer el token de la respuesta
        if (response && response.token) {
          console.log('Auth service - Saving token:', response.token);
          localStorage.setItem('token', response.token);
          
          // Verificar que se guardó correctamente
          const savedToken = localStorage.getItem('token');
          console.log('Auth service - Token saved successfully:', savedToken);
        } else {
          console.error('Auth service - No token in response');
        }
        
        // Guardar información del usuario si viene en la respuesta
        if (response && response.user) {
          console.log('Auth service - Saving user info:', response.user);
          localStorage.setItem('user', JSON.stringify(response.user));
        }
      })
    );
  }

  forgotPassword(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, data);
  }

  resetPassword(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, data);
  }

  getUser(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/user`, { headers });
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  setToken(token: string) {
    localStorage.setItem('token', token);
  }

  // Método para obtener el token actual
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  removeToken() {
    localStorage.removeItem('token');
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // Método auxiliar para debugging del auth guard
  checkAuthGuard(): boolean {
    const token = this.getToken();
    const isAuth = this.isAuthenticated();
    
    console.log('Auth Guard Check:');
    console.log('- Token exists:', !!token);
    console.log('- Token value:', token);
    console.log('- Is authenticated:', isAuth);
    
    return isAuth;
  }
}
