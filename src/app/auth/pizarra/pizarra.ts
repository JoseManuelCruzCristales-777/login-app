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
  userRole: 'owner' | 'member' = 'member'; // Rol del usuario en este workspace
  canCreateTasks: boolean = false;
  canManageTeams: boolean = false;
  
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

  // Propiedades para modo solo lectura
  isReadOnlyMode: boolean = false;
  readOnlyMessage: string = '';

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
      
      // Cargar usuario primero
      this.loadUserAndInitialize();
    });
  }

  loadUserAndInitialize(): void {
    this.userService.getUser().subscribe({
      next: (user) => {
        this.user = user;
        // Solo después de tener el usuario, verificar permisos y cargar datos
        this.initializeWorkspaceAccess();
      },
      error: () => {
        this.user = null;
        this.error = 'Error al cargar información del usuario';
      }
    });
  }

  initializeWorkspaceAccess(): void {
    if (!this.user) {
      this.error = 'Usuario no autenticado';
      return;
    }

    // Primero intentar cargar información básica del workspace
    this.checkWorkspaceAccess();
  }

  checkWorkspaceAccess(): void {
    // Intentar cargar workspace con manejo de errores mejorado
    this.workspaceService.getWorkspace(this.workspaceId).subscribe({
      next: (workspace) => {
        this.workspace = workspace;
        
        // Verificar si es propietario
        if (workspace.created_by === this.user.id) {
          this.isReadOnlyMode = false;
          this.canCreateTasks = true;
          this.canManageTeams = true;
          this.loadAllData();
        } else {
          // No es propietario, verificar membresía en equipos
          this.checkTeamMembership();
        }
      },
      error: (error) => {
        console.error('Error al cargar workspace:', error);
        this.handleWorkspaceAccessError(error);
      }
    });
  }

  checkTeamMembership(): void {
    // Cargar equipos para verificar membresía SIN hacer llamadas que puedan fallar
    this.teamService.getTeams().subscribe({
      next: (allTeams) => {
        // Filtrar equipos de este workspace donde el usuario es miembro
        const userTeamsInWorkspace = allTeams.filter(team => 
          team.workspace_id === this.workspaceId &&
          team.users?.some(user => user.id === this.user.id)
        );

        if (userTeamsInWorkspace.length === 0) {
          // Usuario no pertenece a ningún equipo = sin acceso
          this.handleNoAccess();
          return;
        }

        this.teams = userTeamsInWorkspace;
        
        // Verificar rol más alto
        const isLeader = userTeamsInWorkspace.some(team =>
          team.users?.some(user => 
            user.id === this.user.id && user.pivot.role === 'leader'
          )
        );

        if (isLeader) {
          this.isReadOnlyMode = false;
          this.canCreateTasks = true;
          this.canManageTeams = true;
          this.readOnlyMessage = '';
        } else {
          this.isReadOnlyMode = true;
          this.canCreateTasks = false;
          this.canManageTeams = false;
          this.readOnlyMessage = '👁️ Modo solo lectura - Solo puedes ver las tareas';
        }

        // Cargar tareas solo si tiene acceso
        this.loadTasksWithPermissionCheck();
      },
      error: (error) => {
        console.error('Error al verificar membresía:', error);
        this.handleNoAccess();
      }
    });
  }

  loadAllData(): void {
    // Método para propietarios - cargar todo
    this.loadTeams();
    this.loadTasks();
  }

  loadTasksWithPermissionCheck(): void {
    // Solo cargar tareas si no está en modo de acceso denegado
    if (!this.readOnlyMessage.includes('❌')) {
      this.loadTasks();
    }
  }

  handleWorkspaceAccessError(error: any): void {
    if (error.status === 403) {
      this.isReadOnlyMode = true;
      this.readOnlyMessage = '❌ No tienes permisos para acceder a este workspace';
      this.canCreateTasks = false;
      this.canManageTeams = false;
      this.error = '';
    } else {
      this.error = 'Error al cargar el workspace';
    }
  }

  handleNoAccess(): void {
    this.isReadOnlyMode = true;
    this.readOnlyMessage = '❌ No tienes acceso a este workspace';
    this.canCreateTasks = false;
    this.canManageTeams = false;
    this.error = '';
    this.tasks = [];
    this.teams = [];
  }

  // Método simplificado para cargar workspace (solo para propietarios)
  loadWorkspace(): void {
    if (!this.canManageTeams) return; // Solo propietarios/líderes
    
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
    // Solo cargar si es propietario o tiene permisos de gestión
    if (!this.canManageTeams && !this.isReadOnlyMode) return;
    
    this.teamService.getTeams().subscribe({
      next: (teams) => {
        this.teams = teams.filter(team => team.workspace_id === this.workspaceId);
        this.loadAvailableUsers();
        this.loadTeamDetails();
      },
      error: (error) => {
        console.error('Error al cargar equipos:', error);
        if (error.status !== 403) {
          this.error = 'Error al cargar los equipos';
        }
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

  openMembersModal(team: Team): void {
    this.selectedTeam = team;
    this.showMembersModal = true;
    this.newMember = { user_id: 0, role: 'member' };
    
    // Cargar usuarios disponibles usando el nuevo endpoint
    this.loadAvailableUsersForTeam(team.id);
  }

  loadAvailableUsersForTeam(teamId: number): void {
    this.loadingUsers = true;
    this.workspaceService.getAvailableUsersForTeam(teamId).subscribe({
      next: (users: any[]) => {
        this.availableUsersForTeam = users;
        this.loadingUsers = false;
      },
      error: (error: any) => {
        console.error('Error al cargar usuarios disponibles:', error);
        this.availableUsersForTeam = [];
        this.loadingUsers = false;
      }
    });
  }

  addMemberToTeam(): void {
    if (this.selectedTeam && this.newMember.user_id && this.newMember.role) {
      this.workspaceService.addMemberToTeam(
        this.selectedTeam.id, 
        this.newMember.user_id, 
        this.newMember.role
      ).subscribe({
        next: () => {
          // Recargar equipos para mostrar el nuevo miembro
          this.loadTeams();
          // Recargar usuarios disponibles
          this.loadAvailableUsersForTeam(this.selectedTeam!.id);
          // Resetear formulario
          this.newMember = { user_id: 0, role: 'member' };
        },
        error: (error: any) => {
          console.error('Error al agregar miembro:', error);
          this.error = 'Error al agregar el miembro al equipo';
        }
      });
    }
  }

  removeMemberFromTeam(userId: number): void {
    if (this.selectedTeam && confirm('¿Estás seguro de que quieres remover este miembro?')) {
      this.workspaceService.removeMemberFromTeam(this.selectedTeam.id, userId).subscribe({
        next: () => {
          // Recargar equipos para actualizar la lista
          this.loadTeams();
          // Recargar usuarios disponibles
          this.loadAvailableUsersForTeam(this.selectedTeam!.id);
        },
        error: (error: any) => {
          console.error('Error al remover miembro:', error);
          this.error = 'Error al remover el miembro del equipo';
        }
      });
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
    if (progress <= 25) return 'low';
    if (progress <= 50) return 'medium';
    if (progress <= 75) return 'high';
    return 'very-high';
  }

  getProgressText(progress: number): string {
    if (progress === 0) return 'Sin iniciar';
    if (progress <= 25) return 'Bajo';
    if (progress <= 50) return 'Medio';
    if (progress <= 75) return 'Alto';
    return 'Muy alto';
  }

  getAssignedUserName(task: TaskData): string {
    // Buscar el usuario asignado en todos los equipos
    for (const team of this.teams) {
      if (team.users) {
        const assignedUser = team.users.find(user => user.id === task.assigned_to);
        if (assignedUser) {
          return `${assignedUser.first_name} ${assignedUser.last_name}`;
        }
      }
    }
    return 'Usuario no encontrado';
  }

  getCreatorName(task: TaskData): string {
    // Buscar el creador en todos los equipos
    for (const team of this.teams) {
      if (team.users) {
        const creator = team.users.find(user => user.id === task.created_by);
        if (creator) {
          return `${creator.first_name} ${creator.last_name}`;
        }
      }
    }
    return 'Creador no encontrado';
  }

  getUserTeams(): Team[] {
    if (!this.user) return [];
    return this.teams.filter(team => 
      team.users?.some(user => user.id === this.user.id)
    );
  }

  isUserLeaderOfTeam(team: Team): boolean {
    if (!this.user || !team.users) return false;
    return team.users.some(user => 
      user.id === this.user.id && user.pivot.role === 'leader'
    );
  }

  checkUserPermissions(): void {
    // Verificar si el usuario es propietario del workspace
    if (this.workspace && this.user && this.workspace.created_by === this.user.id) {
      this.userRole = 'owner';
      this.canCreateTasks = true;
      this.canManageTeams = true;
    } else {
      // Verificar si es líder de algún equipo en este workspace
      const isLeaderInAnyTeam = this.teams.some(team => 
        team.users?.some(user => user.id === this.user?.id && user.pivot.role === 'leader')
      );
      
      if (isLeaderInAnyTeam) {
        this.canCreateTasks = true;
        this.canManageTeams = true;
      } else {
        this.canCreateTasks = false;
        this.canManageTeams = false;
      }
    }

    // Verificar permisos del usuario en este workspace
    this.checkWorkspacePermissions();
  }

  // Verificar permisos del usuario en este workspace
  checkWorkspacePermissions(): void {
    if (!this.workspace || !this.user) return;

    // Si es el propietario del workspace, tiene todos los permisos
    if (this.workspace.created_by === this.user.id) {
      this.isReadOnlyMode = false;
      this.canCreateTasks = true;
      this.canManageTeams = true;
      return;
    }

    // Si no es propietario, verificar rol en equipos
    const userTeams = this.teams.filter(team => 
      team.users?.some(user => user.id === this.user.id)
    );

    if (userTeams.length === 0) {
      // Usuario no pertenece a ningún equipo = sin acceso
      this.isReadOnlyMode = true;
      this.readOnlyMessage = '❌ No tienes acceso a este workspace';
      this.canCreateTasks = false;
      this.canManageTeams = false;
      return;
    }

    // Verificar si es líder de algún equipo
    const isLeaderInAnyTeam = userTeams.some(team =>
      team.users?.some(user => user.id === this.user.id && user.pivot.role === 'leader')
    );

    if (isLeaderInAnyTeam) {
      this.isReadOnlyMode = false;
      this.canCreateTasks = true;
      this.canManageTeams = true;
    } else {
      this.isReadOnlyMode = true;
      this.readOnlyMessage = '👁️ Modo solo lectura - Solo puedes ver las tareas';
      this.canCreateTasks = false;
      this.canManageTeams = false;
    }
  }

  // Métodos faltantes necesarios para el funcionamiento
  loadTasks(): void {
    // No cargar tareas si no tiene acceso
    if (this.readOnlyMessage.includes('❌')) {
      this.tasks = [];
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = '';
    
    // Usar el nuevo sistema optimizado de carga
    this.loadAllWorkspaceTasks();
  }

  loadTasksAlternativeForMembers(): void {
    // Estrategia 1: Obtener todas las tareas del usuario y filtrar por workspace
    this.taskService.getTasks().subscribe({
      next: (allTasks: any[]) => {
        // Filtrar TODAS las tareas de este workspace, independientemente del equipo
        this.tasks = allTasks.filter((task: any) => task.workspace_id === this.workspaceId);
        this.loading = false;
        console.log('Tareas cargadas usando método alternativo (todas las del workspace):', this.tasks);
        
        // Si no hay tareas, intentar método de respaldo
        if (this.tasks.length === 0) {
          console.log('No se encontraron tareas, intentando método de respaldo...');
          this.loadTasksAlternative();
        }
      },
      error: (error: any) => {
        console.error('Error al cargar tareas con método alternativo:', error);
        
        // Como último recurso, intentar cargar directamente desde endpoint de workspace (puede fallar pero vale la pena intentar)
        this.loadTasksAlternative();
      }
    });
  }

  loadTasksFromTeams(): void {
    // Último método: intentar cargar todas las tareas y filtrar por equipos del workspace
    this.taskService.getTasks().subscribe({
      next: (allTasks: any[]) => {
        // Obtener IDs de equipos de este workspace donde el usuario es miembro
        const workspaceTeamIds = this.teams
          .filter(team => team.workspace_id === this.workspaceId)
          .map(team => team.id);
        
        // Filtrar tareas que pertenecen a equipos de este workspace
        this.tasks = allTasks.filter((task: any) => 
          task.workspace_id === this.workspaceId ||
          (task.team_id && workspaceTeamIds.includes(task.team_id))
        );
        
        this.loading = false;
        console.log('Tareas cargadas y filtradas por equipos del workspace:', this.tasks);
      },
      error: (error: any) => {
        console.error('Error al cargar tareas filtradas por equipos:', error);
        this.tasks = [];
        this.loading = false;
        
        // No mostrar error si es problema de permisos
        if (error.status !== 403) {
          this.error = 'Error al cargar las tareas';
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

  checkCanCreateTasks(): void {
    // Este método puede estar vacío si checkUserPermissions() maneja todo
    this.checkUserPermissions();
  }

  // Métodos para abrir modales
  openTaskModal(task?: TaskData): void {
    if (!this.preventUnauthorizedAction('gestionar tareas')) return;
    
    this.showTaskModal = true;
    if (task) {
      this.editingTask = task;
      this.newTask = { ...task };
    } else {
      this.editingTask = null;
      this.resetTaskForm();
    }
  }

  openTeamModal(): void {
    if (!this.preventUnauthorizedAction('crear equipos')) return;
    
    this.showTeamModal = true;
    this.resetTeamForm();
  }

  // Método para cerrar modales
  closeTaskModal(): void {
    this.showTaskModal = false;
    this.editingTask = null;
    this.resetTaskForm();
  }

  closeTeamModal(): void {
    this.showTeamModal = false;
    this.resetTeamForm();
  }

  closeMembersModal(): void {
    this.showMembersModal = false;
    this.selectedTeam = null;
    this.newMember = { user_id: 0, role: 'member' };
  }

  // Método para resetear formularios
  resetTaskForm(): void {
    this.newTask = {
      title: '',
      description: '',
      progress: 0,
      is_done: false,
      workspace_id: this.workspaceId,
      team_id: undefined,
      assigned_to: undefined
    };
  }

  resetTeamForm(): void {
    this.newTeam = {
      name: '',
      workspace_id: this.workspaceId
    };
  }

  // Métodos para guardar
  saveTask(): void {
    if (!this.preventUnauthorizedAction('guardar tareas')) return;
    
    if (!this.newTask.title?.trim() || !this.newTask.team_id || !this.newTask.assigned_to) {
      return;
    }

    const taskData = {
      title: this.newTask.title!,
      description: this.newTask.description || '',
      workspace_id: this.workspaceId,
      team_id: this.newTask.team_id!,
      assigned_to: this.newTask.assigned_to!,
      progress: this.newTask.progress || 0,
      is_done: this.newTask.is_done || false
    };
    
    if (this.editingTask) {
      // Actualizar tarea existente
      this.taskService.updateTask(this.editingTask.id!, taskData).subscribe({
        next: () => {
          this.loadTasksWithPermissionCheck();
          this.closeTaskModal();
        },
        error: (error: any) => {
          console.error('Error al actualizar tarea:', error);
          this.error = 'Error al actualizar la tarea';
        }
      });
    } else {
      // Crear nueva tarea
      this.taskService.createTask(taskData).subscribe({
        next: () => {
          this.loadTasksWithPermissionCheck();
          this.closeTaskModal();
        },
        error: (error: any) => {
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
      error: (error: any) => {
        console.error('Error al crear equipo:', error);
        this.error = 'Error al crear el equipo';
      }
    });
  }

  deleteTask(task: TaskData): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      this.taskService.deleteTask(task.id!).subscribe({
        next: () => {
          this.loadTasks();
        },
        error: (error: any) => {
          console.error('Error al eliminar tarea:', error);
          this.error = 'Error al eliminar la tarea';
        }
      });
    }
  }

  deleteTeam(team: Team, event: Event): void {
    event.stopPropagation();
    if (confirm(`¿Estás seguro de que quieres eliminar el equipo "${team.name}"?`)) {
      this.teamService.deleteTeam(team.id).subscribe({
        next: () => {
          this.loadTeams();
        },
        error: (error: any) => {
          console.error('Error al eliminar equipo:', error);
          this.error = 'Error al eliminar el equipo';
        }
      });
    }
  }

  getTeamUsers(teamId: number): any[] {
    const team = this.teams.find(t => t.id === teamId);
    return team?.users || [];
  }

  // Métodos auxiliares para verificación de permisos
  hasWorkspaceAccess(): boolean {
    return !this.readOnlyMessage.includes('❌');
  }

  canViewTasks(): boolean {
    return this.hasWorkspaceAccess() && (this.canCreateTasks || this.isReadOnlyMode);
  }

  // Método para prevenir acciones no autorizadas
  preventUnauthorizedAction(action: string): boolean {
    if (!this.hasWorkspaceAccess()) {
      alert(`❌ No tienes permisos para ${action} en este workspace.`);
      return false;
    }
    if (this.isReadOnlyMode && !this.canCreateTasks) {
      alert(`👁️ Estás en modo solo lectura. No puedes ${action}.`);
      return false;
    }
    return true;
  }

  // Método optimizado que intenta múltiples estrategias para mostrar TODAS las tareas
  loadAllWorkspaceTasks(): void {
    console.log('Iniciando carga optimizada de tareas para workspace:', this.workspaceId);
    
    // Estrategia 1: Endpoint directo del workspace (ideal)
    this.tryWorkspaceEndpoint().then(success => {
      if (success) return;
      
      // Estrategia 2: Filtrar desde todas las tareas del usuario
      return this.tryUserTasksFiltered();
    }).then(success => {
      if (success) return;
      
      // Estrategia 3: Cargar desde equipos del workspace
      return this.tryTeamBasedTasks();
    }).catch(error => {
      console.error('Todas las estrategias de carga fallaron:', error);
      this.handleAllTaskLoadingFailed();
    });
  }

  private tryWorkspaceEndpoint(): Promise<boolean> {
    return new Promise((resolve) => {
      this.taskService.getWorkspaceTasks(this.workspaceId).subscribe({
        next: (tasks: any[]) => {
          this.tasks = tasks;
          this.loading = false;
          console.log('✅ Tareas cargadas desde endpoint de workspace:', tasks.length);
          resolve(true);
        },
        error: (error: any) => {
          console.log('❌ Falló endpoint de workspace:', error.status);
          resolve(false);
        }
      });
    });
  }

  private tryUserTasksFiltered(): Promise<boolean> {
    return new Promise((resolve) => {
      this.taskService.getTasks().subscribe({
        next: (allTasks: any[]) => {
          this.tasks = allTasks.filter((task: any) => task.workspace_id === this.workspaceId);
          this.loading = false;
          console.log('✅ Tareas filtradas desde tareas del usuario:', this.tasks.length);
          resolve(true);
        },
        error: (error: any) => {
          console.log('❌ Falló filtrado de tareas del usuario:', error.status);
          resolve(false);
        }
      });
    });
  }

  private tryTeamBasedTasks(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.teams.length === 0) {
        console.log('❌ No hay equipos cargados para obtener tareas');
        resolve(false);
        return;
      }

      // Intentar obtener tareas de cada equipo del workspace
      const teamIds = this.teams
        .filter(team => team.workspace_id === this.workspaceId)
        .map(team => team.id);

      if (teamIds.length === 0) {
        console.log('❌ No hay equipos de este workspace');
        resolve(false);
        return;
      }

      console.log('🔄 Intentando cargar tareas desde equipos:', teamIds);
      
      // Para simplificar, usar el método de tareas del usuario filtradas por equipos
      this.taskService.getTasks().subscribe({
        next: (allTasks: any[]) => {
          this.tasks = allTasks.filter((task: any) => 
            task.workspace_id === this.workspaceId || 
            (task.team_id && teamIds.includes(task.team_id))
          );
          this.loading = false;
          console.log('✅ Tareas cargadas desde equipos:', this.tasks.length);
          resolve(true);
        },
        error: (error: any) => {
          console.log('❌ Falló carga desde equipos:', error.status);
          resolve(false);
        }
      });
    });
  }

  private handleAllTaskLoadingFailed(): void {
    console.log('❌ Todas las estrategias de carga fallaron');
    this.tasks = [];
    this.loading = false;
    this.error = '';
    
    // No mostrar error, solo logs informativos
    console.log('ℹ️ Workspace accesible pero sin tareas visibles');
  }
}
