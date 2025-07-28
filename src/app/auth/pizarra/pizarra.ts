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
  
  // Formulario para nueva tarea (simplificado sin team_id)
  newTask: Partial<TaskData> = {
    title: '',
    description: '',
    progress: 0,
    is_done: false,
    workspace_id: 0,
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

  // Propiedades para gestión de equipos
  showTeamDetailsModal: boolean = false;
  selectedUserId: number | null = null;
  selectedRole: 'member' | 'leader' = 'member';

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
    // Método temporal comentado hasta que el backend esté listo
    console.log('Verificando acceso al workspace (método temporal)...');
    
    // Por ahora, asumir que el usuario tiene acceso y proceder con verificación de equipos
    this.checkTeamMembership();
    
    /* TODO: Descomentar cuando getWorkspace esté implementado
    this.workspaceService.getWorkspace(this.workspaceId).subscribe({
      next: (workspace) => {
        this.workspace = workspace;
        
        if (workspace.created_by === this.user.id) {
          this.isReadOnlyMode = false;
          this.canCreateTasks = true;
          this.canManageTeams = true;
          this.loadAllData();
        } else {
          this.checkTeamMembership();
        }
      },
      error: (error) => {
        console.error('Error al cargar workspace:', error);
        this.handleWorkspaceAccessError(error);
      }
    });
    */
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
          console.log('Usuario es LÍDER - Permisos completos de gestión');
          
          // Los líderes tienen el mismo flujo que los propietarios
          this.loadAllData();
        } else {
          this.isReadOnlyMode = true;
          this.canCreateTasks = false;
          this.canManageTeams = false;
          this.readOnlyMessage = '👁️ Modo solo lectura - Solo puedes ver las tareas';
          console.log('Usuario es MIEMBRO - Solo lectura');
          
          // Solo cargar tareas para miembros (modo lectura)
          this.loadTasksBasedOnRole();
        }
      },
      error: (error) => {
        console.error('Error al verificar membresía:', error);
        this.handleNoAccess();
      }
    });
  }

  loadAllData(): void {
    // Método para propietarios Y líderes - cargar todo
    console.log('Cargando todos los datos (propietario o líder)');
    this.loadTeams();
    this.loadAllWorkspaceTasks(); // Cambiar a método que carga todas las tareas
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

  // Método simplificado para cargar workspace
  loadWorkspace(): void {
    if (!this.canManageTeams) return; // Solo propietarios y líderes
    
    console.log('Información del workspace será cargada cuando sea necesario...');
    // Por ahora, no cargar workspace específico hasta que el backend esté listo
    // this.workspace = { id: this.workspaceId, name: 'Workspace', description: '' };
  }

  loadTeams(): void {
    // Cargar equipos para propietarios y líderes
    console.log('Cargando equipos del workspace...');
    
    this.teamService.getTeams().subscribe({
      next: (teams) => {
        this.teams = teams.filter(team => team.workspace_id === this.workspaceId);
        console.log('Equipos cargados:', this.teams.length);
        
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
        // Usar método temporal como fallback
        this.loadAvailableUsersForTeamTemp(teamId);
      }
    });
  }

  // Métodos temporales hasta que el backend esté completo
  loadAvailableUsersForTeamTemp(teamId: number): void {
    console.log('Cargando usuarios disponibles (temporal)...');
    this.availableUsersForTeam = this.availableUsers.filter(user => 
      !this.selectedTeam?.users?.some(teamUser => teamUser.id === user.id)
    );
  }

  addMemberToTeamTemp(): void {
    console.log('Agregando miembro al equipo (temporal)...');
    this.closeTeamModal();
  }

  removeMemberFromTeamTemp(userId: number): void {
    console.log('Removiendo miembro del equipo (temporal)...');
    if (this.selectedTeam?.users) {
      this.selectedTeam.users = this.selectedTeam.users.filter(user => user.id !== userId);
    }
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
          // Usar método temporal como fallback
          this.addMemberToTeamTemp();
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
          // Usar método temporal como fallback
          this.removeMemberFromTeamTemp(userId);
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

    console.log('Verificación de permisos:');
    console.log('- Es propietario:', this.workspace.created_by === this.user.id);
    console.log('- Equipos del usuario:', userTeams.length);
    console.log('- Es líder en algún equipo:', isLeaderInAnyTeam);

    if (isLeaderInAnyTeam) {
      this.isReadOnlyMode = false;
      this.canCreateTasks = true;
      this.canManageTeams = true;
      this.readOnlyMessage = '';
      console.log('✅ LÍDER: Permisos completos asignados');
    } else {
      this.isReadOnlyMode = true;
      this.canCreateTasks = false;
      this.canManageTeams = false;
      this.readOnlyMessage = '👁️ Modo solo lectura - Solo puedes ver las tareas';
      console.log('👁️ MIEMBRO: Modo solo lectura asignado');
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
    
    // this.taskService.getTasksByWorkspaceAlternative(this.workspaceId).subscribe({
    //   next: (tasks) => {
    //     this.tasks = tasks;
    //     this.loading = false;
    //     console.log('Tareas cargadas con método alternativo:', tasks);
    //   },
    //   error: (error) => {
    //     console.error('Error con método alternativo:', error);
    //     
    //     // Si ambos métodos fallan, usar getTasks() y filtrar localmente
    //     this.loadAllTasksAndFilter();
    //   }
    // });
    
    // Usar directamente el método que funciona
    this.loadAllTasksAndFilter();
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
    
    if (!this.newTask.title?.trim() || !this.newTask.assigned_to) {
      this.error = 'El título y el usuario asignado son obligatorios';
      setTimeout(() => { this.error = ''; }, 3000);
      return;
    }

    // Encontrar el equipo del usuario actual (donde es líder)
    const userTeam = this.teams.find(team => 
      team.users?.some(user => user.id === this.user.id && user.pivot.role === 'leader')
    );

    if (!userTeam) {
      this.error = 'Debes ser líder de un equipo para crear tareas';
      return;
    }

    // Preparar datos incluyendo team_id para validación del backend
    const taskData = {
      title: this.newTask.title.trim(),
      description: this.newTask.description?.trim() || '',
      workspace_id: Number(this.workspaceId),
      team_id: Number(userTeam.id), // Requerido por el backend para verificar permisos
      assigned_to: Number(this.newTask.assigned_to),
      progress: Number(this.newTask.progress) || 0,
      is_done: Boolean(this.newTask.is_done) || false
    };
    
    console.log('Guardando tarea con datos:', taskData);
    console.log('Equipo del líder:', userTeam);
    
    // Validar datos antes de enviar
    if (!this.validateTaskData(taskData)) {
      this.error = 'Datos de tarea inválidos';
      return;
    }
    
    // Método de debugging para validar datos antes de enviar
    this.validateTaskData(taskData);
    
    if (this.editingTask) {
      // Actualizar tarea existente
      this.taskService.updateTask(this.editingTask.id!, taskData).subscribe({
        next: () => {
          console.log('Tarea actualizada exitosamente');
          this.loadTasksBasedOnRole();
          this.closeTaskModal();
        },
        error: (error: any) => {
          console.error('Error al actualizar tarea:', error);
          this.error = `Error al actualizar la tarea: ${error.error?.message || error.message}`;
        }
      });
    } else {
      // Crear nueva tarea - usar método original con datos simples
      this.taskService.createTask(taskData as any).subscribe({
        next: (response) => {
          console.log('Tarea creada exitosamente:', response);
          this.loadTasksBasedOnRole();
          this.closeTaskModal();
        },
        error: (error: any) => {
          console.error('Error al crear tarea:', error);
          console.error('Detalles del error:', error.error);
          this.error = `Error al crear la tarea: ${error.error?.message || error.message}`;
          
          // Mostrar error específico del servidor si está disponible
          if (error.error?.errors) {
            console.error('Errores de validación:', error.error.errors);
          }
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

  getTeamUsers(teamId?: number): any[] {
    if (!teamId) {
      // Si no hay equipo seleccionado, devolver todos los usuarios disponibles
      return this.availableUsers;
    }
    
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

  // Método para verificar si se deben mostrar las acciones de tarea
  shouldShowTaskActions(): boolean {
    return !this.isReadOnlyMode && this.hasWorkspaceAccess();
  }

  // Método para verificar si una tarea se puede editar
  canEditTask(task: TaskData): boolean {
    if (this.isReadOnlyMode) return false;
    if (!this.hasWorkspaceAccess()) return false;
    
    // Solo propietarios y líderes pueden editar tareas
    return this.canCreateTasks;
  }

  // Método para obtener el estado visual de una tarea
  getTaskVisualState(task: TaskData): string {
    if (this.isReadOnlyMode) {
      return 'read-only';
    }
    return this.canEditTask(task) ? 'editable' : 'view-only';
  }

  // Método específico para cargar todas las tareas del workspace (para líderes/propietarios)
  loadAllWorkspaceTasks(): void {
    console.log('👑 Cargando todas las tareas del workspace como líder/propietario...');
    
    // Verificar token antes de hacer la petición
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('🔐 No hay token disponible');
      this.error = 'No estás autenticado. Por favor, inicia sesión nuevamente.';
      return;
    }
    
    console.log('🔐 Token encontrado:', token.substring(0, 20) + '...');
    console.log('📍 Workspace ID:', this.workspaceId);
    
    // Usar el endpoint correcto del backend: /api/workspaces/{id}/tasks
    console.log('🔄 Usando endpoint: /api/workspaces/' + this.workspaceId + '/tasks');
    
    this.workspaceService.getWorkspaceTasks(this.workspaceId).subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.loading = false;
        console.log('✅ Todas las tareas del workspace cargadas:', this.tasks.length);
        console.log('📋 Tareas:', this.tasks);
      },
      error: (error) => {
        console.error('❌ Error al cargar tareas del workspace:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Message:', error.message);
        
        if (error.status === 401) {
          console.error('🔐 Error de autenticación - Token inválido o expirado');
          this.error = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
        } else if (error.status === 403) {
          console.error('🚫 Sin permisos para ver tareas del workspace');
          this.error = 'No tienes permisos para ver las tareas de este workspace';
        } else {
          console.error('💥 Fallback: usando método alternativo...');
          // Si el endpoint específico falla, usar método alternativo
          this.loadAllTasksAndFilter();
        }
      }
    });
  }

  // Método para manejar clic en tarea en modo solo lectura
  onTaskClick(task: TaskData): void {
    if (this.isReadOnlyMode) {
      // En modo solo lectura, mostrar información de la tarea sin permitir edición
      this.showTaskInfo(task);
    } else {
      // En modo normal, abrir modal de edición
      this.openTaskModal(task);
    }
  }

  // Método para mostrar información de la tarea sin edición
  showTaskInfo(task: TaskData): void {
    const assignedUser = this.getAssignedUserName(task);
    const creator = this.getCreatorName(task);
    const progress = task.progress || 0;
    const status = task.is_done ? 'Completada' : progress === 0 ? 'Por hacer' : 'En progreso';
    
    alert(`
📋 Información de la Tarea:

📝 Título: ${task.title}
📄 Descripción: ${task.description || 'Sin descripción'}
👤 Asignado a: ${assignedUser}
👨‍💻 Creado por: ${creator}
📊 Progreso: ${progress}%
⚡ Estado: ${status}
📅 Creado: ${task.created_at ? new Date(task.created_at).toLocaleDateString() : 'N/A'}

👁️ Estás en modo solo lectura - No puedes realizar cambios
    `);
  }

  // Método para obtener el estado de una tarea
  getTaskStatus(task: TaskData): string {
    if (task.is_done) {
      return 'done';
    } else if (task.progress > 0) {
      return 'in-progress';
    } else {
      return 'todo';
    }
  }

  // Método de debugging para validar datos antes de enviar
  validateTaskData(taskData: any): boolean {
    console.log('=== Validando datos de tarea ===');
    console.log('title:', taskData.title, 'type:', typeof taskData.title);
    console.log('description:', taskData.description, 'type:', typeof taskData.description);
    console.log('workspace_id:', taskData.workspace_id, 'type:', typeof taskData.workspace_id);
    console.log('team_id:', taskData.team_id, 'type:', typeof taskData.team_id);
    console.log('assigned_to:', taskData.assigned_to, 'type:', typeof taskData.assigned_to);
    console.log('progress:', taskData.progress, 'type:', typeof taskData.progress);
    console.log('is_done:', taskData.is_done, 'type:', typeof taskData.is_done);
    
    // Validaciones específicas
    if (!taskData.title || taskData.title.trim() === '') {
      console.error('❌ Título vacío');
      return false;
    }
    
    if (!taskData.workspace_id || isNaN(taskData.workspace_id)) {
      console.error('❌ workspace_id inválido');
      return false;
    }
    
    if (!taskData.team_id || isNaN(taskData.team_id)) {
      console.error('❌ team_id inválido');
      return false;
    }
    
    if (!taskData.assigned_to || isNaN(taskData.assigned_to)) {
      console.error('❌ assigned_to inválido');
      return false;
    }
    
    console.log('✅ Datos válidos');
    return true;
  }

  // Obtener el equipo donde el usuario actual es líder
  getLeaderTeam() {
    return this.teams.find(team => 
      team.users?.some(user => user.id === this.user.id && user.pivot.role === 'leader')
    );
  }

  // Obtener usuarios del equipo donde es líder
  getLeaderTeamUsers(): any[] {
    const leaderTeam = this.getLeaderTeam();
    return leaderTeam?.users || [];
  }

  // Método mejorado para cargar tareas según permisos usando endpoints correctos
  loadTasksBasedOnRole(): void {
    console.log('🎯 Cargando tareas basado en rol del usuario...');
    console.log('📊 Modo solo lectura:', this.isReadOnlyMode);
    console.log('🔨 Puede crear tareas:', this.canCreateTasks);
    console.log('👥 Puede gestionar equipos:', this.canManageTeams);
    
    this.loading = true;
    this.error = '';
    
    // Usar el método que determina el endpoint correcto
    this.loadTasksWithCorrectEndpoint();
  }

  // Método para debuggear autenticación
  debugAuthentication(): void {
    console.log('=== DEBUG AUTENTICACIÓN ===');
    console.log('🔐 Token en localStorage:', localStorage.getItem('token'));
    console.log('🔐 Usuario en localStorage:', localStorage.getItem('user'));
    console.log('🔐 isAuthenticated():', this.auth?.isAuthenticated());
    console.log('👤 Usuario actual:', this.user);
    console.log('🏢 Workspace ID:', this.workspaceId);
    console.log('========================');
  }

  // Método simplificado que no depende de backend incompleto
  openTeamDetailsSimplified(team: any): void {
    this.selectedTeam = team;
    this.showTeamDetailsModal = true;
    
    // Usar datos locales en lugar de cargar del servidor
    this.availableUsersForTeam = this.availableUsers.filter(user => 
      !team.users?.some((teamUser: any) => teamUser.id === user.id)
    );
    
    console.log('Team details abierto (modo simplificado):', team);
  }

  // Método simplificado para agregar miembro
  addMemberSimplified(): void {
    if (!this.selectedUserId || !this.selectedTeam) return;
    
    console.log('Agregando miembro (modo simplificado)');
    // Simular agregar miembro localmente
    const user = this.availableUsers.find(u => u.id === this.selectedUserId);
    if (user && this.selectedTeam.users) {
      this.selectedTeam.users.push({
        ...user,
        pivot: { role: this.selectedRole }
      });
    }
    
    this.closeTeamModal();
  }

  // Método simplificado para remover miembro
  removeMemberSimplified(userId: number): void {
    if (this.selectedTeam?.users) {
      this.selectedTeam.users = this.selectedTeam.users.filter((user: any) => user.id !== userId);
      console.log('Miembro removido (modo simplificado)');
    }
  }

  // Método para cargar tareas según el endpoint correcto del backend
  loadTasksWithCorrectEndpoint(): void {
    console.log('🎯 Determinando endpoint correcto según permisos del usuario...');
    
    if (this.isReadOnlyMode) {
      // Miembros: usar /api/tasks (solo sus tareas asignadas)
      console.log('👤 MIEMBRO: Usando endpoint /api/tasks para tareas asignadas');
      this.loadUserAssignedTasks();
    } else {
      // Líderes/Propietarios: usar /api/workspaces/{id}/tasks (todas las tareas del workspace)
      console.log('👑 LÍDER/PROPIETARIO: Usando endpoint /api/workspaces/' + this.workspaceId + '/tasks');
      this.loadAllWorkspaceTasks();
    }
  }

  // Método para cargar solo las tareas asignadas al usuario (para miembros)
  loadUserAssignedTasks(): void {
    console.log('👤 Cargando tareas asignadas al usuario (miembro)...');
    
    this.taskService.getTasks().subscribe({
      next: (userTasks) => {
        // El endpoint /api/tasks ya devuelve solo las tareas asignadas al usuario
        // Filtrar por workspace para mayor seguridad
        this.tasks = userTasks.filter(task => task.workspace_id === this.workspaceId);
        this.loading = false;
        console.log('✅ Tareas asignadas cargadas:', this.tasks.length);
        console.log('📋 Tareas del miembro:', this.tasks);
      },
      error: (error) => {
        console.error('❌ Error al cargar tareas asignadas:', error);
        this.error = 'Error al cargar las tareas asignadas';
        this.loading = false;
      }
    });
  }
}
