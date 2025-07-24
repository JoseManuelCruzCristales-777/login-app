import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { WorkspaceService, Workspace } from '../../services/workspace';
import { Auth } from '../../services/auth';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-workspace-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './workspace-list.html',
  styleUrls: ['./workspace-list.scss']
})
export class WorkspaceListComponent implements OnInit {
  workspaces: Workspace[] = [];
  error = '';
  showDropdown = false;
  user: any = null;

  constructor(
    private router: Router,
    private workspaceService: WorkspaceService,
    private auth: Auth,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadWorkspaces();
    this.loadUser();
  }

  loadWorkspaces(): void {
    this.workspaceService.getWorkspaces().subscribe({
      next: (workspaces) => {
        this.workspaces = workspaces;
      },
      error: (error) => {
        console.error('Error al cargar workspaces:', error);
        this.error = 'Error al cargar los workspaces.';
      }
    });
  }

  loadUser(): void {
    this.userService.getUser().subscribe({
      next: (user) => this.user = user,
      error: () => this.user = null
    });
  }

  createWorkspace() {
    this.router.navigate(['/workspace-form']);
  }

  goToWorkspace(id: number) {
    this.router.navigate(['/workspace', id]);
  }

  getCreatorName(created_by: any): string {
    if (!created_by) return '';
    if (typeof created_by === 'object' && created_by.first_name) {
      return `${created_by.first_name} ${created_by.last_name}`;
    }
    return `Usuario ${created_by}`;
  }

  deleteWorkspace(workspace: Workspace, event: Event): void {
    event.stopPropagation();
    if (confirm(`¿Estás seguro de que quieres eliminar el workspace "${workspace.name}"?`)) {
      this.workspaceService.deleteWorkspace(workspace.id).subscribe({
        next: () => {
          this.loadWorkspaces(); // Recargar la lista
        },
        error: (error) => {
          console.error('Error al eliminar workspace:', error);
          this.error = 'Error al eliminar el workspace';
        }
      });
    }
  }

  onLogout() {
    this.auth.logout();
  }

  // Navegar a home selector
  goToHome() {
    this.router.navigate(['/home']);
  }

  // Navegar a dashboard
  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  // Refrescar datos
  refresh() {
    this.loadWorkspaces();
    this.loadUser();
  }

  // Métodos auxiliares para las estadísticas
  getCreatedByMeCount(): number {
    if (!this.user) return 0;
    return this.workspaces.filter(workspace => workspace.created_by === this.user.id).length;
  }

  getSharedWithMeCount(): number {
    if (!this.user) return 0;
    return this.workspaces.filter(workspace => workspace.created_by !== this.user.id).length;
  }
}
