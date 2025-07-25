import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.scss']
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  loading = false;
  message = '';
  error = '';
  token = '';
  email = '';

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    // Obtener token y email de los query parameters
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      this.email = params['email'];
      
      if (!this.token || !this.email) {
        this.error = 'Enlace de recuperación inválido o expirado.';
      }
    });
  }

  get password() {
    return this.resetPasswordForm.get('password');
  }

  get passwordConfirmation() {
    return this.resetPasswordForm.get('password_confirmation');
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('password_confirmation');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit() {
    if (this.resetPasswordForm.valid && this.token && this.email) {
      this.loading = true;
      this.error = '';
      this.message = '';

      const resetData = {
        email: this.email,
        token: this.token,
        password: this.resetPasswordForm.value.password,
        password_confirmation: this.resetPasswordForm.value.password_confirmation
      };

      this.auth.resetPassword(resetData).subscribe({
        next: (response: any) => {
          this.loading = false;
          this.message = 'Tu contraseña ha sido restablecida exitosamente.';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        },
        error: (error: any) => {
          this.loading = false;
          this.error = error.error?.message || 'Error al restablecer la contraseña.';
        }
      });
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
