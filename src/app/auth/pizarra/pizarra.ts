import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TaskService, TaskData } from '../../services/task';
import { WorkspaceService, Workspace } from '../../services/workspace';
import { TeamService, Team, TeamUser } from '../../services/team';
import { Auth } from '../../services/auth';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-pizarra',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './pizarra.html',
  styleUrls: ['./pizarra.scss']
})
export class PizarraComponent implements OnInit {
  workspaceId: number = 0;
  workspace: Workspace | null = null;
  tasks: TaskData[] = [];
  teams: Team[] = [];
  availableUsers: TeamUser[] = [];
  user: any = null;
  showTaskModal = false;
  showTeamModal = false;
  showMembersModal = false;
  editingTask: TaskData | null = null;
  selectedTeam: Team | null = null;
  availableUsersForTeam: any[] = [];
  loadingUsers: boolean = false;
  error: string = '';
  loading: boolean = false;
  canCreateTasks: boolean = false;
  
  // Formulario para nueva tarea
  newTask: Partial<TaskData> = {
    title: '',
    description: '',
    progress: 0,
    is_done: false,
    workspace_id: 0,
    team_id: undefined,
    assigned_to: undefined
  };

  // Formulario para nuevo equipo
  newTeam = {
    name: '',
    workspace_id: 0
  };

  // Formulario para agregar miembro
  newMember = {
    user_id: 0,
    role: 'member' as 'leader' | 'member'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService,
    private workspaceService: WorkspaceService,
    private teamService: TeamService,
    private auth: Auth,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.workspaceId = +params['id'];
      this.newTask.workspace_id = this.workspaceId;
      this.newTeam.workspace_id = this.workspaceId;
      this.loadWorkspace();
      this.loadTeams();
      this.loadTasks();
    });

    this.userService.getUser().subscribe({
      next: (user) => this.user = user,
      error: () => this.user = null
    });
  }

  loadWorkspace(): void {
    this.workspaceService.getWorkspace(this.workspaceId).subscribe({
      next: (workspace) => {
        this.workspace = workspace;
      },
      error: (error) => {
        console.error('Error al cargar workspace:', error);
        this.error = 'Error al cargar el workspace';
      }
    });
  }

  loadTeams(): void {
    this.teamService.getTeams().subscribe({
      next: (teams) => {
        this.teams = teams.filter(team => team.workspace_id === this.workspaceId);
        this.checkCanCreateTasks();
        this.loadAvailableUsers();
        
        // Cargar detalles completos de cada equipo para obtener sus miembros
        this.loadTeamDetails();
      },
      error: (error) => {
        console.error('Error al cargar equipos:', error);
      }
    });
  }

  loadTeamDetails(): void {
    // Cargar detalles completos de cada equipo con sus miembros usando la ruta específica
    this.teams.forEach((team, index) => {
      // Usar la ruta específica para obtener el equipo completo con miembros
      this.teamService.getTeam(team.id).subscribe({
        next: (teamDetails) => {
          this.teams[index] = teamDetails;
          this.checkCanCreateTasks(); // Verificar permisos después de cargar miembros
        },
        error: (error) => {
          console.error(`Error al cargar detalles del equipo ${team.id}:`, error);
          // Si falla, intentar cargar solo los miembros con la nueva ruta
          this.loadTeamMembersOnly(team.id, index);
        }
      });
    });
  }

  loadTeamMembersOnly(teamId: number, teamIndex: number): void {
    // Método alternativo usando la nueva ruta específica para miembros
    this.teamService.getTeamMembers(teamId).subscribe({
      next: (members) => {
        this.teams[teamIndex].users = members;
        this.checkCanCreateTasks();
        console.log(`Miembros cargados para equipo ${teamId}:`, members);
      },
      error: (error) => {
        console.error(`Error al cargar miembros del equipo ${teamId}:`, error);
      }
    });
  }

  loadAvailableUsers(): void {
    this.availableUsers = [];
    this.teams.forEach(team => {
      if (team.users) {
        team.users.forEach(user => {
          if (!this.availableUsers.find(u => u.id === user.id)) {
            this.availableUsers.push(user);
          }
        });
      }
    });
  }

  checkCanCreateTasks(): void {
    // Verificar si el usuario es líder de algún equipo en este workspace
    this.canCreateTasks = this.teams.some(team => 
      team.users?.some(user => 
        user.id === this.user?.id && user.pivot.role === 'leader'
      )
    );
  }

  loadTasks(): void {
    this.loading = true;
    this.error = '';
    
    this.taskService.getWorkspaceTasks(this.workspaceId).subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar tareas:', error);
        
        // Si es error 404, intentar con método alternativo
        if (error.status === 404) {
          this.loadTasksAlternative();
        } else {
          this.error = 'Error al cargar las tareas';
          this.loading = false;
          this.tasks = [];
        }
      }
    });
  }

  loadTasksAlternative(): void {
    console.log('Intentando cargar tareas con método alternativo...');
    
    this.taskService.getTasksByWorkspaceAlternative(this.workspaceId).subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.loading = false;
        console.log('Tareas cargadas con método alternativo:', tasks);
      },
      error: (error) => {
        console.error('Error con método alternativo:', error);
        
        // Si ambos métodos fallan, usar getTasks() y filtrar localmente
        this.loadAllTasksAndFilter();
      }
    });
  }

  loadAllTasksAndFilter(): void {
    console.log('Cargando todas las tareas y filtrando localmente...');
    
    this.taskService.getTasks().subscribe({
      next: (allTasks) => {
        // Filtrar tareas por workspace_id localmente
        this.tasks = allTasks.filter(task => task.workspace_id === this.workspaceId);
        this.loading = false;
        console.log('Tareas filtradas localmente:', this.tasks);
      },
      error: (error) => {
        console.error('Error al cargar todas las tareas:', error);
        this.error = 'Error al cargar las tareas. Verifica que la ruta /api/workspaces/{id}/tasks esté configurada en tu backend.';
        this.loading = false;
        this.tasks = [];
      }
    });
  }

  getTasksByStatus(status: string): TaskData[] {
    switch (status) {
      case 'todo':
        return this.tasks.filter(task => !task.is_done && task.progress === 0);
      case 'in-progress':
        return this.tasks.filter(task => !task.is_done && task.progress > 0);
      case 'done':
        return this.tasks.filter(task => task.is_done);
      default:
        return [];
    }
  }

  openTaskModal(task?: TaskData): void {
    if (!this.canCreateTasks && !task) {
      this.error = 'No puedes crear tareas. Necesitas ser líder de un equipo y tener miembros en tu equipo.';
      return;
    }

    if (task) {
      this.editingTask = { ...task };
      this.newTask = { ...task };
    } else {
      this.editingTask = null;
      this.newTask = {
        title: '',
        description: '',
        progress: 0,
        is_done: false,
        workspace_id: this.workspaceId,
        team_id: this.teams.find(t => t.users?.some(u => u.id === this.user?.id && u.pivot.role === 'leader'))?.id,
        created_by: this.user?.id || 1
      };
    }
    this.showTaskModal = true;
  }

  closeTaskModal(): void {
    this.showTaskModal = false;
    this.editingTask = null;
  }

  openTeamModal(): void {
    this.newTeam = {
      name: '',
      workspace_id: this.workspaceId
    };
    this.showTeamModal = true;
  }

  closeTeamModal(): void {
    this.showTeamModal = false;
  }

  openMembersModal(team: Team): void {
    this.selectedTeam = team;
    this.newMember = {
      user_id: 0,
      role: 'member' as 'leader' | 'member'
    };
    this.loadAvailableUsersForTeam();
    this.showMembersModal = true;
  }

  closeMembersModal(): void {
    this.showMembersModal = false;
    this.selectedTeam = null;
  }

  loadAvailableUsersForTeam(): void {
    // Cargar todos los usuarios disponibles para agregar al equipo
    this.loadingUsers = true;
    this.userService.getAllUsers().subscribe({
      next: (response: any) => {
        // Si la respuesta es directamente el array de usuarios
        let users = Array.isArray(response) ? response : response.data || response.users || [];
        
        // Filtrar usuarios que no están en el equipo actual
        const currentTeamUserIds = this.selectedTeam?.users?.map(u => u.id) || [];
        this.availableUsersForTeam = users.filter((user: any) => 
          !currentTeamUserIds.includes(user.id)
        );
        
        this.loadingUsers = false;
        console.log('Usuarios disponibles para el equipo:', this.availableUsersForTeam);
      },
      error: (error: any) => {
        console.error('Error al cargar usuarios:', error);
        this.availableUsersForTeam = [];
        this.loadingUsers = false;
        this.error = 'Error al cargar la lista de usuarios disponibles';
      }
    });
  }

  addMemberToTeam(): void {
    if (!this.newMember.user_id || !this.selectedTeam) {
      this.error = 'Debes seleccionar un usuario válido';
      return;
    }

    // Limpiar el error antes de hacer la petición
    this.error = '';

    this.teamService.addMember(this.selectedTeam.id, {
      user_id: this.newMember.user_id,
      role: this.newMember.role
    }).subscribe({
      next: () => {
        // Actualizar solo el equipo específico en lugar de recargar todos
        this.updateSelectedTeamData();
        this.loadAvailableUsersForTeam();
        // Resetear el formulario
        this.newMember = { user_id: 0, role: 'member' as 'leader' | 'member' };
        this.error = '';
        console.log('Miembro agregado exitosamente');
      },
      error: (error: any) => {
        console.error('Error al agregar miembro:', error);
        this.error = error.error?.error || error.error?.message || 'Error al agregar miembro al equipo';
      }
    });
  }

  updateSelectedTeamData(): void {
    if (!this.selectedTeam) return;
    
    // Actualizar los datos del equipo seleccionado
    this.teamService.getTeam(this.selectedTeam.id).subscribe({
      next: (updatedTeam) => {
        // Encontrar el índice del equipo en la lista y actualizarlo
        const teamIndex = this.teams.findIndex(t => t.id === this.selectedTeam!.id);
        if (teamIndex !== -1) {
          this.teams[teamIndex] = updatedTeam;
          this.selectedTeam = updatedTeam; // Actualizar el equipo seleccionado también
        }
        this.checkCanCreateTasks();
        this.loadAvailableUsers();
      },
      error: (error) => {
        console.error('Error al actualizar datos del equipo:', error);
        // Fallback: recargar todos los equipos
        this.loadTeams();
      }
    });
  }

  removeMemberFromTeam(userId: number): void {
    if (!this.selectedTeam || !confirm('¿Estás seguro de que quieres remover este miembro del equipo?')) {
      return;
    }

    this.teamService.removeMember(this.selectedTeam.id, userId).subscribe({
      next: () => {
        // Actualizar solo el equipo específico
        this.updateSelectedTeamData();
        this.loadAvailableUsersForTeam();
        console.log('Miembro removido exitosamente');
      },
      error: (error: any) => {
        console.error('Error al remover miembro:', error);
        this.error = 'Error al remover miembro del equipo';
      }
    });
  }

  saveTask(): void {
    if (!this.newTask.title?.trim()) {
      return;
    }

    if (!this.newTask.team_id || !this.newTask.assigned_to) {
      this.error = 'Debes seleccionar un equipo y asignar la tarea a un usuario';
      return;
    }

    const taskData = {
      title: this.newTask.title,
      description: this.newTask.description || '',
      workspace_id: this.newTask.workspace_id || this.workspaceId,
      team_id: this.newTask.team_id,
      assigned_to: this.newTask.assigned_to
    };

    if (this.editingTask && this.editingTask.id) {
      // Actualizar tarea existente
      this.taskService.updateTask(this.editingTask.id, {
        progress: this.newTask.progress,
        is_done: this.newTask.is_done
      }).subscribe({
        next: () => {
          this.loadTasks();
          this.closeTaskModal();
        },
        error: (error) => {
          console.error('Error al actualizar tarea:', error);
          this.error = 'Error al actualizar la tarea';
        }
      });
    } else {
      // Crear nueva tarea
      this.taskService.createTask(taskData).subscribe({
        next: () => {
          this.loadTasks();
          this.closeTaskModal();
        },
        error: (error) => {
          console.error('Error al crear tarea:', error);
          this.error = 'Error al crear la tarea';
        }
      });
    }
  }

  saveTeam(): void {
    if (!this.newTeam.name.trim()) {
      return;
    }

    this.teamService.createTeam(this.newTeam).subscribe({
      next: () => {
        this.loadTeams();
        this.closeTeamModal();
      },
      error: (error) => {
        console.error('Error al crear equipo:', error);
        this.error = 'Error al crear el equipo';
      }
    });
  }

  deleteTask(task: TaskData): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      if (task.id) {
        this.taskService.deleteTask(task.id).subscribe({
          next: () => {
            this.loadTasks();
          },
          error: (error) => {
            console.error('Error al eliminar tarea:', error);
            this.error = 'Error al eliminar la tarea';
          }
        });
      }
    }
  }

  updateTaskStatus(task: TaskData, newStatus: string): void {
    let updateData: Partial<TaskData> = {};
    
    switch (newStatus) {
      case 'todo':
        updateData = { progress: 0, is_done: false };
        break;
      case 'in-progress':
        updateData = { progress: Math.max(task.progress, 1), is_done: false };
        break;
      case 'done':
        updateData = { progress: 100, is_done: true };
        break;
    }
    
    if (task.id) {
      this.taskService.updateTask(task.id, updateData).subscribe({
        next: () => {
          this.loadTasks();
        },
        error: (error) => {
          console.error('Error al actualizar estado:', error);
          this.error = 'Error al actualizar el estado de la tarea';
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/workspace-list']);
  }

  onLogout(): void {
    this.auth.logout();
  }

  getPriorityClass(progress: number): string {
    if (progress === 0) return 'priority-low';
    if (progress < 50) return 'priority-medium';
    return 'priority-high';
  }

  getProgressText(progress: number): string {
    return `${progress}%`;
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'todo': return 'Por Hacer';
      case 'in-progress': return 'En Progreso';
      case 'done': return 'Completado';
      default: return status;
    }
  }

  getAssignedUserName(task: TaskData): string {
    if (task.assigned_user) {
      return `${task.assigned_user.first_name} ${task.assigned_user.last_name}`;
    }
    return task.assigned_to ? `Usuario ${task.assigned_to}` : 'Sin asignar';
  }

  getCreatorName(task: TaskData): string {
    if (task.creator) {
      return `${task.creator.first_name} ${task.creator.last_name}`;
    }
    return task.created_by ? `Usuario ${task.created_by}` : 'Desconocido';
  }

  getUserTeams(): Team[] {
    return this.teams.filter(team => 
      team.users?.some(user => user.id === this.user?.id && user.pivot.role === 'leader')
    );
  }

  getTeamUsers(teamId: number): TeamUser[] {
    const team = this.teams.find(t => t.id === teamId);
    return team?.users || [];
  }

  deleteTeam(team: Team, event: Event): void {
    event.stopPropagation();
    if (confirm(`¿Estás seguro de que quieres eliminar el equipo "${team.name}"?`)) {
      this.teamService.deleteTeam(team.id).subscribe({
        next: () => {
          this.loadTeams();
        },
        error: (error) => {
          console.error('Error al eliminar equipo:', error);
          this.error = 'Error al eliminar el equipo';
        }
      });
    }
  }

  isUserLeaderOfTeam(team: Team): boolean {
    return team.users?.some(user => 
      user.id === this.user?.id && user.pivot.role === 'leader'
    ) || false;
  }
}
