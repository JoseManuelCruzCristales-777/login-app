import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TaskService, TaskData } from '../../services/task';
import { Auth } from '../../services/auth';
import { TeamService } from '../../services/team';

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
  loading = true;
  error: string | null = null;

  // Modal states
  showTaskModal: boolean = false;
  selectedTask: TaskData | null = null;
  updatedProgress: number = 0;
  updatedIsDone: boolean = false;

  // Filtros
  filterStatus: 'all' | 'todo' | 'in-progress' | 'done' = 'all';
  searchTerm = '';

  teams: any[] = []; // Para almacenar equipos y poder mostrar nombres

  constructor(
    private taskService: TaskService,
    private authService: Auth,
    private router: Router,
    private teamService: TeamService // Inyectar TeamService
  ) {}

  ngOnInit() {
    this.loadUserData();
    this.loadMyTasks();
    this.loadTeams(); // Cargar equipos para mostrar nombres
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

    this.taskService.getTasks().subscribe({
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

  // Método para cargar equipos (necesario para mostrar nombres)
  loadTeams(): void {
    this.teamService.getTeams().subscribe({
      next: (teams: any[]) => {
        this.teams = teams;
      },
      error: (error: any) => {
        console.error('Error al cargar equipos:', error);
        this.teams = [];
      }
    });
  }

  // Métodos para filtros y estadísticas
  getFilteredTasks(): TaskData[] {
    let filtered = this.myTasks;

    // Filtrar por término de búsqueda
    if (this.searchTerm.trim()) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(this.searchTerm.toLowerCase()))
      );
    }

    // Filtrar por estado
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(task => this.getTaskStatus(task) === this.filterStatus);
    }

    return filtered;
  }

  getTaskStatus(task: TaskData): string {
    if (task.is_done) return 'done';
    if (task.progress > 0) return 'in-progress';
    return 'todo';
  }

  // Obtener clase CSS para el progreso
  getProgressClass(progress: number): string {
    if (progress === 0) return 'progress-none';
    if (progress <= 25) return 'progress-low';
    if (progress <= 50) return 'progress-medium';
    if (progress <= 75) return 'progress-high';
    return 'progress-complete';
  }

  // Métodos auxiliares para obtener nombres
  getWorkspaceName(task: TaskData): string {
    if (task.workspace && task.workspace.name) {
      return task.workspace.name;
    }
    // Si no tiene la relación cargada, mostrar ID como fallback
    return `Workspace ${task.workspace_id}`;
  }

  getTeamName(teamId: number): string {
    // Si tenemos equipos cargados, buscar el nombre
    if (this.teams && this.teams.length > 0) {
      const team = this.teams.find(t => t.id === teamId);
      if (team) {
        return team.name;
      }
    }
    // Fallback si no encontramos el equipo
    return `Equipo ${teamId}`;
  }

  // Métodos auxiliares para el modal
  openTaskModal(task: TaskData): void {
    this.selectedTask = task;
    this.updatedProgress = task.progress;
    this.updatedIsDone = task.is_done;
    this.showTaskModal = true;
  }

  closeTaskModal(): void {
    this.showTaskModal = false;
    this.selectedTask = null;
    this.updatedProgress = 0;
    this.updatedIsDone = false;
  }

  updateTaskProgress(): void {
    if (!this.selectedTask) return;

    // Si está al 100%, marcar automáticamente como completada
    if (this.updatedProgress === 100) {
      this.updatedIsDone = true;
    }

    const updateData = {
      progress: this.updatedProgress,
      is_done: this.updatedIsDone
    };

    this.taskService.updateTask(this.selectedTask.id!, updateData).subscribe({
      next: () => {
        // Actualizar la tarea local
        this.selectedTask!.progress = this.updatedProgress;
        this.selectedTask!.is_done = this.updatedIsDone;
        
        // Recargar todas las tareas para asegurar consistencia
        this.loadMyTasks();
        this.closeTaskModal();
      },
      error: (error: any) => {
        console.error('Error al actualizar progreso:', error);
        this.error = 'Error al actualizar el progreso de la tarea';
      }
    });
  }

  // Métodos auxiliares para navegación
  goToWorkspace(workspaceId: number): void {
    this.router.navigate(['/workspace', workspaceId]);
  }

  goToHome(): void {
    this.router.navigate(['/home']);
  }

  goToWorkspaces(): void {
    this.router.navigate(['/workspace-list']);
  }

  refresh(): void {
    this.loadMyTasks();
  }

  // Métodos auxiliares para las estadísticas
  getTodoTasksCount(): number {
    return this.myTasks.filter(task => this.getTaskStatus(task) === 'todo').length;
  }

  getInProgressTasksCount(): number {
    return this.myTasks.filter(task => this.getTaskStatus(task) === 'in-progress').length;
  }

  getDoneTasksCount(): number {
    return this.myTasks.filter(task => this.getTaskStatus(task) === 'done').length;
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Verificar permisos simplificados para workspaces nuevos
  canManageWorkspace(workspace: any): boolean {
    if (!this.user) return false;
    
    // El creador siempre puede gestionar el workspace
    return workspace.created_by === this.user.id;
  }

  // Verificar si puede agregar equipos (siempre true para el creador)
  canAddTeamToWorkspace(workspace: any): boolean {
    return this.canManageWorkspace(workspace);
  }

  // Verificar si puede agregar tareas (true para creador, incluso sin equipos)
  canAddTaskToWorkspace(workspace: any): boolean {
    if (!this.user) return false;
    
    // El creador puede agregar tareas incluso sin equipos
    if (workspace.created_by === this.user.id) {
      return true;
    }
    
    // Miembros de equipos también pueden agregar tareas
    if (workspace.teams && workspace.teams.length > 0) {
      return workspace.teams.some((team: any) => 
        team.members && team.members.some((member: any) => member.id === this.user?.id)
      );
    }
    
    return false;
  }

  // Método de debug para workspaces nuevos
  debugWorkspacePermissions(workspace: any): void {
    console.log('🔍 Debug Workspace:', workspace.name);
    console.log('👤 Usuario actual:', this.user?.id);
    console.log('👑 Creador workspace:', workspace.created_by);
    console.log('🏢 Equipos:', workspace.teams?.length || 0);
    console.log('✅ Puede agregar equipos:', this.canAddTeamToWorkspace(workspace));
    console.log('✅ Puede agregar tareas:', this.canAddTaskToWorkspace(workspace));
    console.log('📊 Workspace completo:', workspace);
  }

  // Método temporal para mostrar siempre los botones en workspaces nuevos
  showWorkspaceButtons(workspace: any): boolean {
    if (!this.user) return false;
    
    // Si es el creador, siempre mostrar botones
    if (workspace.created_by === this.user.id) {
      return true;
    }
    
    // Debug para workspaces problemáticos
    if (!workspace.teams || workspace.teams.length === 0) {
      console.log('⚠️ Workspace sin equipos:', workspace.name);
      this.debugWorkspacePermissions(workspace);
    }
    
    return workspace.created_by === this.user.id;
  }
}
