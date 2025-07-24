import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TaskService, TaskData } from '../../services/task';
import { TeamService, Team } from '../../services/team';
import { Auth } from '../../services/auth';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  avatar?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  myTasks: TaskData[] = [];
  myTeams: Team[] = [];
  loading = true;
  error: string | null = null;

  // Modal states
  showTaskModal = false;
  selectedTask: TaskData | null = null;
  updatedProgress = 0;
  updatedIsDone = false;

  // Filtros
  filterStatus: 'all' | 'todo' | 'in-progress' | 'done' = 'all';
  searchTerm = '';

  constructor(
    private taskService: TaskService,
    private teamService: TeamService,
    private authService: Auth,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUserData();
    this.loadMyTasks();
    this.loadMyTeams();
  }

  loadUserData() {
    this.authService.getUser().subscribe({
      next: (user) => {
        this.user = user;
      },
      error: (error) => {
        console.error('Error loading user data:', error);
      }
    });
  }

  loadMyTasks() {
    this.loading = true;
    this.error = null;

    this.taskService.getUserTasks().subscribe({
      next: (tasks) => {
        this.myTasks = tasks;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.error = 'Error al cargar las tareas';
        this.loading = false;
      }
    });
  }

  loadMyTeams() {
    this.teamService.getUserTeams().subscribe({
      next: (teams) => {
        this.myTeams = teams;
      },
      error: (error) => {
        console.error('Error loading teams:', error);
      }
    });
  }

  // Filtrar tareas
  getFilteredTasks(): TaskData[] {
    let filtered = this.myTasks;

    // Filtrar por estado
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(task => {
        if (this.filterStatus === 'todo') return !task.is_done && task.progress < 100;
        if (this.filterStatus === 'in-progress') return !task.is_done && task.progress > 0 && task.progress < 100;
        if (this.filterStatus === 'done') return task.is_done || task.progress === 100;
        return true;
      });
    }

    // Filtrar por término de búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(term) ||
        (task.description && task.description.toLowerCase().includes(term))
      );
    }

    return filtered;
  }

  // Obtener estado de la tarea
  getTaskStatus(task: TaskData): 'todo' | 'in-progress' | 'done' {
    if (task.is_done || task.progress === 100) return 'done';
    if (task.progress > 0) return 'in-progress';
    return 'todo';
  }

  // Obtener clase CSS para el progreso
  getProgressClass(progress: number): string {
    if (progress === 100) return 'complete';
    if (progress >= 75) return 'high';
    if (progress >= 50) return 'medium';
    if (progress >= 25) return 'low';
    return 'none';
  }

  // Abrir modal para editar tarea
  openTaskModal(task: TaskData) {
    this.selectedTask = task;
    this.updatedProgress = task.progress;
    this.updatedIsDone = task.is_done;
    this.showTaskModal = true;
  }

  // Cerrar modal
  closeTaskModal() {
    this.showTaskModal = false;
    this.selectedTask = null;
  }

  // Actualizar progreso de tarea
  updateTaskProgress() {
    if (!this.selectedTask) return;

    const updateData = {
      progress: this.updatedProgress,
      is_done: this.updatedIsDone || this.updatedProgress === 100
    };

    this.taskService.updateTaskProgress(this.selectedTask.id!, updateData).subscribe({
      next: (updatedTask) => {
        // Actualizar la tarea en la lista local
        const index = this.myTasks.findIndex(t => t.id === updatedTask.id);
        if (index !== -1) {
          this.myTasks[index] = updatedTask;
        }
        this.closeTaskModal();
      },
      error: (error) => {
        console.error('Error updating task:', error);
        this.error = 'Error al actualizar la tarea';
      }
    });
  }

  // Navegar a home selector
  goToHome() {
    this.router.navigate(['/home']);
  }

  // Navegar a workspace específico
  goToWorkspace(workspaceId: number) {
    this.router.navigate(['/workspace', workspaceId]);
  }

  // Navegar a lista de workspaces
  goToWorkspaces() {
    this.router.navigate(['/workspace-list']);
  }

  // Obtener nombre del equipo de una tarea
  getTeamName(teamId: number): string {
    const team = this.myTeams.find(t => t.id === teamId);
    return team ? team.name : 'Equipo no encontrado';
  }

  // Obtener nombre del workspace de una tarea
  getWorkspaceName(task: TaskData): string {
    return task.workspace?.name || 'Workspace no encontrado';
  }

  // Cerrar sesión
  onLogout() {
    this.authService.logout();
  }

  // Refrescar datos
  refresh() {
    this.loadMyTasks();
    this.loadMyTeams();
  }

  // Métodos auxiliares para las estadísticas
  getTodoTasksCount(): number {
    return this.getFilteredTasks().filter(task => this.getTaskStatus(task) === 'todo').length;
  }

  getInProgressTasksCount(): number {
    return this.getFilteredTasks().filter(task => this.getTaskStatus(task) === 'in-progress').length;
  }

  getDoneTasksCount(): number {
    return this.getFilteredTasks().filter(task => this.getTaskStatus(task) === 'done').length;
  }
}
