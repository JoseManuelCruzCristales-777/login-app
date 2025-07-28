import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TaskService, TaskData } from '../../services/task';
import { TeamService } from '../../services/team';

@Component({
  selector: 'app-workspace-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workspace-viewer.html',
  styleUrl: './workspace-viewer.scss'
})
export class WorkspaceViewerComponent implements OnInit {
  workspaceId: number = 0;
  user: any = null;
  tasks: TaskData[] = [];
  teams: any[] = [];
  loading: boolean = true;
  error: string = '';
  readOnlyMessage: string = '👁️ Modo solo lectura - Solo puedes ver las tareas asignadas a ti';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService,
    private teamService: TeamService
  ) {}

  ngOnInit(): void {
    this.workspaceId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadUserData();
  }

  loadUserData(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      this.user = JSON.parse(userData);
      console.log('Usuario viewer cargado:', this.user);
      this.loadUserTasks();
    } else {
      this.error = 'No se pudo cargar la información del usuario';
    }
  }

  // Método corregido para cargar tareas del usuario
  loadUserTasks(): void {
    this.loading = true;
    this.error = '';
    
    this.taskService.getTasks().subscribe({
      next: (tasks: TaskData[]) => {
        // Filtrar tareas del workspace actual asignadas al usuario
        this.tasks = tasks.filter((task: TaskData) => task.workspace_id === this.workspaceId);
        this.loading = false;
        console.log('Tareas del usuario en este workspace:', this.tasks.length);
      },
      error: (error: any) => {
        console.error('Error al cargar tareas:', error);
        this.error = 'Error al cargar las tareas';
        this.loading = false;
      }
    });
  }

  // Obtener estado de una tarea individual
  getTaskStatus(task: TaskData): string {
    if (task.is_done || task.progress === 100) return 'done';
    if (task.progress > 0) return 'in-progress';
    return 'todo';
  }

  // Obtener tareas por estado (para mostrar en columnas) - CORREGIDO para HTML
  getTasksByStatus(status: string): TaskData[] {
    return this.tasks.filter(task => this.getTaskStatus(task) === status);
  }

  // Navegar de vuelta
  goBack(): void {
    this.router.navigate(['/workspace-list']);
  }

  // Actualizar progreso de tarea (única acción permitida)
  updateTaskProgress(task: TaskData, newProgress: number): void {
    if (newProgress < 0 || newProgress > 100) return;
    
    const updateData = {
      progress: newProgress,
      is_done: newProgress === 100
    };

    this.taskService.updateTask(task.id!, updateData as any).subscribe({
      next: () => {
        task.progress = newProgress;
        task.is_done = newProgress === 100;
        console.log('Progreso actualizado:', task.title, newProgress + '%');
      },
      error: (error) => {
        console.error('Error al actualizar progreso:', error);
        this.error = 'Error al actualizar el progreso de la tarea';
      }
    });
  }

  updateProgress(task: TaskData, event: Event): void {
  const target = event.target as HTMLInputElement;
  const newProgress = parseInt(target.value, 10) || 0;
  this.updateTaskProgress(task, newProgress);
}
}