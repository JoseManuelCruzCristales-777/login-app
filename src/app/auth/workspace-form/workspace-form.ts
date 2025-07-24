import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkspaceService } from '../../services/workspace';
import { Router } from '@angular/router';

@Component({
  selector: 'app-workspace-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workspace-form.html',
  styleUrls: ['./workspace-form.scss']
})
export class WorkspaceFormComponent implements OnInit {
  @Input() workspaceId?: number; // Si viene, es edición

  name: string = '';
  description: string = '';
  isEditing = false;
  loading = false;
  error = '';

  constructor(private workspaceService: WorkspaceService, private router: Router) {}

  ngOnInit(): void {
    if (this.workspaceId) {
      this.isEditing = true;
      this.workspaceService.getWorkspace(this.workspaceId).subscribe({
        next: (data: any) => {
          this.name = data.name;
          this.description = data.description;
        },
        error: () => this.error = 'Error al cargar el workspace.'
      });
    }
  }

  saveWorkspace() {
    this.error = '';
    if (!this.name.trim()) {
      this.error = 'El nombre del workspace es obligatorio.';
      return;
    }
    this.loading = true;
    const workspace = { name: this.name, description: this.description };

    const request = this.isEditing
      ? this.workspaceService.updateWorkspace(this.workspaceId!, workspace)
      : this.workspaceService.createWorkspace(workspace);

    request.subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/workspace-list']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || 'Error al guardar el workspace.';
      }
    });
  }
}
