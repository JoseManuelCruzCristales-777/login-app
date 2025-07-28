import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Obtener el token del localStorage
    const token = localStorage.getItem('token');
    
    console.log('🔗 Interceptor - Token encontrado:', !!token);
    
    if (token) {
      // Clonar la petición y agregar el header Authorization
      const authReq = req.clone({
        setHeaders: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🔗 Interceptor - Headers agregados:', {
        'Authorization': `Bearer ${token.substring(0, 20)}...`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });
      
      return next.handle(authReq);
    }
    
    // Si no hay token, enviar la petición original
    console.log('🔗 Interceptor - Sin token, petición original');
    return next.handle(req);
  }
}