import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  avatar?: string;
}

@Component({
  selector: 'app-home-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-selector.html',
  styleUrls: ['./home-selector.scss']
})
export class HomeSelectorComponent implements OnInit {
  user: User | null = null;

  constructor(
    private authService: Auth,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    this.authService.getUser().subscribe({
      next: (user: any) => {
        this.user = user;
      },
      error: (error: any) => {
        console.error('Error loading user data:', error);
      }
    });
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']); // Navegar a Mis tareas
  }

  goToWorkspaces() {
    this.router.navigate(['/workspace-list']);
  }

  onLogout() {
    this.authService.logout();
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}
