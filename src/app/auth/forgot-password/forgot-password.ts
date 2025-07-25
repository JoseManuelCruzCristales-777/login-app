import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.scss']
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  loading = false;
  message = '';
  error = '';

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private router: Router
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get email() {
    return this.forgotPasswordForm.get('email');
  }

  onSubmit() {
    if (this.forgotPasswordForm.valid) {
      this.loading = true;
      this.error = '';
      this.message = '';

      console.log('Sending forgot password request for email:', this.forgotPasswordForm.value.email);

      this.auth.forgotPassword(this.forgotPasswordForm.value).subscribe({
        next: (response: any) => {
          this.loading = false;
          this.message = 'Se ha enviado un enlace de recuperación a tu correo electrónico.';
          console.log('✅ Forgot password response:', response);
          // Opcional: redirigir después de un tiempo
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        },
        error: (error: any) => {
          this.loading = false;
          this.error = error.error?.message || 'Error al enviar el correo de recuperación.';
          console.error('❌ Forgot password error:', error);
        }
      });
    } else {
      console.log('Form is invalid:', this.forgotPasswordForm.errors);
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
