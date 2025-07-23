import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Auth } from '../../services/auth'; // importa tu servicio Auth

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterComponent {
  // Modelo que se alinea con la base de datos
  form = {
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  };

  error: string = '';

  constructor(private router: Router, private auth: Auth) {}

  onRegister() {
    this.error = '';

    // Validaciones
    if (!this.form.acceptTerms) {
      this.error = 'Debes aceptar los términos y condiciones.';
      return;
    }

    if (this.form.password !== this.form.confirmPassword) {
      this.error = 'Las contraseñas no coinciden.';
      return;
    }

    if (
      !this.form.first_name ||
      !this.form.last_name ||
      !this.form.email ||
      !this.form.password
    ) {
      this.error = 'Por favor completa todos los campos obligatorios.';
      return;
    }

    // Preparar datos para envío al backend
    const payload = {
      first_name: this.form.first_name,
      last_name: this.form.last_name,
      phone: this.form.phone,
      email: this.form.email,
      password: this.form.password,
      password_confirmation: this.form.confirmPassword // importante para el backend
    };

    this.auth.register(payload).subscribe({
      next: (res) => {
        if (res.token) {
          this.auth.setToken(res.token);
          alert(`¡Registro exitoso de ${this.form.first_name} ${this.form.last_name}!`);
          this.router.navigate(['/workspace-list']);
        } else {
          alert('Respuesta inesperada del servidor');
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Error en el registro';
      }
    });
  }
}
