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
    this.workspaceService.getWorkspaces().subscribe({
      next: (data) => {
        // Si el backend responde { data: [...] }
        this.workspaces = Array.isArray(data) ? data : (data.data || []);
      },
      error: () => {
        this.error = 'Error al cargar los workspaces.';
      }
    });
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
    return created_by.toString();
  }

  onLogout() {
    this.auth.logout();
  }
}
