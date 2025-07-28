import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;

  // Propiedades para mostrar mensajes de error y éxito
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private router: Router, private auth: Auth) {} // inyecta Auth

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(8)])
    });
  }

  onSubmit(): void {
    console.log('=== onSubmit() method called ===');
    console.log('Form valid:', this.loginForm.valid);
    console.log('Form value:', this.loginForm.value);
    console.log('Form errors:', this.loginForm.errors);
    
    // Prevenir el comportamiento por defecto
    event?.preventDefault();
    
    if (this.loginForm.valid) {
      // Limpiar mensajes anteriores
      this.errorMessage = '';
      this.successMessage = '';
      
      const formData = this.loginForm.value;
      console.log('Sending login request with data:', formData);
      
      this.auth.login(formData).subscribe({
        next: (response: any) => {
          console.log('=== Login successful ===');
          console.log('Response:', response);
          
          // Verificar que el token se guardó correctamente
          console.log('Token guardado:', localStorage.getItem('token'));
          console.log('Usuario autenticado:', this.auth.isAuthenticated());
          
          // Método simplificado de redirección
          console.log('Iniciando redirección...');
          
          // Primero intentar con navigate
          this.router.navigate(['/home']).then(navigationResult => {
            console.log('Resultado de navegación:', navigationResult);
            if (!navigationResult) {
              console.log('Navegación falló, intentando window.location...');
              // Si falla, usar window.location
              window.location.href = '/home';
            }
          }).catch(error => {
            console.error('Error en navigate, usando window.location:', error);
            window.location.href = '/home';
          });
        },
        error: (error: any) => {
          console.error('=== Login error ===');
          console.error('Error details:', error);
          console.error('Error status:', error.status);
          console.error('Error message:', error.message);
          
          // Mostrar mensaje de error específico dentro del formulario
          if (error.status === 401) {
            this.errorMessage = 'Credenciales incorrectas. Verifica tu correo y contraseña.';
          } else if (error.status === 422) {
            this.errorMessage = 'Datos inválidos. Revisa la información ingresada.';
          } else if (error.status === 500) {
            this.errorMessage = 'Error del servidor. Intenta nuevamente más tarde.';
          } else if (error.status === 0) {
            this.errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
          } else {
            this.errorMessage = error.error?.message || 'Error al iniciar sesión. Intenta nuevamente.';
          }
          
          // Limpiar el mensaje de error después de 5 segundos
          setTimeout(() => {
            this.errorMessage = '';
          }, 5000);
        }
      });
    } else {
      console.log('=== Form is invalid ===');
      console.log('Email errors:', this.email?.errors);
      console.log('Password errors:', this.password?.errors);
      
      // Mostrar error si el formulario no es válido
      this.errorMessage = 'Por favor, completa todos los campos correctamente.';
      
      // Marcar todos los campos como tocados para mostrar errores
      this.loginForm.markAllAsTouched();
      
      // Limpiar el mensaje después de 3 segundos
      setTimeout(() => {
        this.errorMessage = '';
      }, 3000);
    }
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
  
}
