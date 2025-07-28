import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { WorkspaceService, Workspace, WorkspaceWithRole } from '../../services/workspace';
import { Auth } from '../../services/auth';
import { UserService } from '../../services/user.service';
import { TeamService, Team } from '../../services/team';

@Component({
  selector: 'app-workspace-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './workspace-list.html',
  styleUrls: ['./workspace-list.scss']
})
export class WorkspaceListComponent implements OnInit {
  workspaces: Workspace[] = [];
  ownWorkspaces: Workspace[] = []; // Workspaces creados por el usuario
  memberWorkspaces: WorkspaceWithRole[] = []; // Workspaces donde es miembro
  error = '';
  showDropdown = false;
  user: any = null;
  loading = false; // Nueva propiedad para controlar el estado de carga

  constructor(
    private workspaceService: WorkspaceService,
    private teamService: TeamService,
    private router: Router,
    private auth: Auth,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    // Cargar usuario primero, luego los workspaces
    this.loadUserAndWorkspaces();
  }

  loadUserAndWorkspaces(): void {
    this.loading = true;
    this.error = '';
    
    // Primero cargar el usuario
    this.userService.getUser().subscribe({
      next: (user: any) => {
        this.user = user;
        // Una vez que tenemos el usuario, cargar los workspaces
        this.loadWorkspaces();
      },
      error: (error) => {
        console.error('Error al cargar usuario:', error);
        this.user = null;
        this.error = 'Error al cargar información del usuario';
        this.loading = false;
      }
    });
  }

  loadWorkspaces(): void {
    this.loading = true;
    this.error = '';
    
    // Cargar workspaces propios
    this.workspaceService.getWorkspaces().subscribe({
      next: (workspaces) => {
        this.ownWorkspaces = workspaces || []; // Asegurar que sea un array
        console.log('Workspaces propios cargados:', this.ownWorkspaces);
        
        // Cargar workspaces donde es miembro
        this.loadMemberWorkspaces();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar workspaces propios:', error);
        
        // Si falla cargar workspaces propios, solo inicializar como array vacío
        this.ownWorkspaces = [];
        
        // Aún así intentar cargar workspaces compartidos
        this.loadMemberWorkspaces();
        this.loading = false;
        
        // Solo mostrar error si es algo diferente a "no tiene workspaces"
        if (error.status !== 404) {
          this.error = 'Error al cargar algunos workspaces';
        }
      }
    });
  }

  loadMemberWorkspaces(): void {
    // Método alternativo: usar equipos para encontrar workspaces donde es miembro
    this.loadMemberWorkspacesFromTeams();
  }

  loadMemberWorkspacesFromTeams(): void {
    // Verificar que el usuario esté cargado
    if (!this.user) {
      console.error('Usuario no disponible para verificar membresía');
      this.memberWorkspaces = [];
      return;
    }

    // Cargar todos los equipos del usuario
    this.teamService.getTeams().subscribe({
      next: (allTeams: any[]) => {
        // Filtrar equipos donde el usuario es miembro
        const userTeams = allTeams.filter(team => 
          team.users?.some((user: any) => user.id === this.user.id)
        );

        console.log('Equipos donde el usuario es miembro:', userTeams);

        if (userTeams.length === 0) {
          // No pertenece a ningún equipo
          this.memberWorkspaces = [];
          console.log('Usuario no pertenece a ningún equipo');
          return;
        }

        // Obtener IDs únicos de workspaces
        const workspaceIds = [...new Set(userTeams.map(team => team.workspace_id))];
        console.log('IDs de workspaces donde es miembro:', workspaceIds);
        
        // Cargar información de cada workspace
        this.loadWorkspaceDetails(workspaceIds, userTeams);
      },
      error: (error: any) => {
        console.error('Error al cargar equipos:', error);
        this.memberWorkspaces = [];
        // No mostrar error si solo falla la carga de workspaces compartidos
      }
    });
  }

  loadWorkspaceDetails(workspaceIds: number[], userTeams: any[]): void {
    const workspacePromises = workspaceIds.map(id => 
      this.workspaceService.getWorkspace(id).toPromise().catch(error => {
        console.error(`Error al cargar workspace ${id}:`, error);
        return null; // Retornar null si falla, filtraremos después
      })
    );

    Promise.all(workspacePromises).then(workspaces => {
      // Filtrar workspaces que se cargaron exitosamente
      const validWorkspaces = workspaces.filter(w => w !== null) as Workspace[];
      
      // Determinar rol del usuario en cada workspace
      this.memberWorkspaces = validWorkspaces.map(workspace => {
        const workspaceTeams = userTeams.filter(team => team.workspace_id === workspace.id);
        
        // Determinar el rol más alto del usuario en este workspace
        let userRole: 'leader' | 'member' = 'member';
        for (const team of workspaceTeams) {
          if (team.users) {
            const userInTeam = team.users.find((user: any) => user.id === this.user.id);
            if (userInTeam && userInTeam.pivot.role === 'leader') {
              userRole = 'leader';
              break;
            }
          }
        }
        
        return {
          ...workspace,
          userRole: userRole
        } as WorkspaceWithRole;
      });
    }).catch(error => {
      console.error('Error al cargar detalles de workspaces:', error);
      this.memberWorkspaces = [];
    });
  }

  createWorkspace() {
    this.router.navigate(['/workspace-form']);
  }

  goToWorkspace(id: number) {
    this.router.navigate(['/workspace', id]);
  }

  editWorkspace(workspaceId: number): void {
    this.router.navigate(['/workspace-form'], { queryParams: { id: workspaceId } });
  }

  enterWorkspace(workspaceId: number): void {
    console.log('Entrando al workspace:', workspaceId);
    
    // Verificar rol del usuario en el workspace
    const memberWorkspace = this.memberWorkspaces.find(w => w.id === workspaceId);
    const ownWorkspace = this.ownWorkspaces.find(w => w.id === workspaceId);
    
    if (ownWorkspace) {
      // Es propietario - modo completo
      console.log('👑 Propietario - Navegando a pizarra completa');
      this.router.navigate(['/workspace', workspaceId]);
    } else if (memberWorkspace) {
      if (memberWorkspace.userRole === 'leader') {
        // Es líder - modo completo
        console.log('🏆 Líder - Navegando a pizarra completa');
        this.router.navigate(['/workspace', workspaceId]);
      } else {
        // Es miembro - modo solo lectura
        console.log('👤 Miembro - Navegando a modo viewer');
        this.router.navigate(['/workspace-viewer', workspaceId]);
      }
    } else {
      console.error('No se encontró el workspace o no tienes permisos');
    }
  }

  getCreatorName(created_by: any): string {
    if (!created_by) return '';
    if (typeof created_by === 'object' && created_by.first_name) {
      return `${created_by.first_name} ${created_by.last_name}`;
    }
    return `Usuario ${created_by}`;
  }

  deleteWorkspace(workspaceId: number, event: Event): void {
    event.stopPropagation();
    if (confirm('¿Estás seguro de que quieres eliminar este workspace?')) {
      this.workspaceService.deleteWorkspace(workspaceId).subscribe({
        next: () => {
          // Remover de ambas listas localmente para mejor UX
          this.ownWorkspaces = this.ownWorkspaces.filter(w => w.id !== workspaceId);
          this.memberWorkspaces = this.memberWorkspaces.filter(w => w.id !== workspaceId);
        },
        error: (error: any) => {
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
  goToHome(): void {
    this.router.navigate(['/home']);
  }

  // Navegar a dashboard
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  // Refrescar datos
  refresh(): void {
    this.loadUserAndWorkspaces();
  }

  // Métodos auxiliares para las estadísticas
  getCreatedByMeCount(): number {
    return this.ownWorkspaces.length;
  }

  getSharedWithMeCount(): number {
    return this.memberWorkspaces.length;
  }

  isOwner(workspace: Workspace): boolean {
    return this.ownWorkspaces.some(w => w.id === workspace.id);
  }

  isMember(workspace: Workspace): boolean {
    return this.memberWorkspaces.some(w => w.id === workspace.id);
  }

  // Método auxiliar para navegar con workspace como parámetro (si es necesario en el futuro)
  navigateToWorkspace(workspace: Workspace): void {
    this.enterWorkspace(workspace.id);
  }

  showWorkspaceInfo(workspace: WorkspaceWithRole): void {
    const roleInfo = workspace.userRole === 'leader' 
      ? {
          title: 'Líder de Equipo',
          permissions: `Como líder de equipo en este workspace, puedes:
• Crear y gestionar tareas
• Asignar tareas a miembros del equipo
• Administrar miembros de tu equipo
• Ver todas las tareas y su progreso
• Actualizar el progreso de cualquier tarea

No puedes:
• Eliminar el workspace (solo el propietario)
• Crear nuevos equipos
• Gestionar otros equipos donde no eres líder`
        }
      : {
          title: 'Miembro de Equipo',
          permissions: `Como miembro de equipo en este workspace, puedes:
• Ver todas las tareas y su progreso
• Consultar información de equipos
• Actualizar el progreso de tus tareas asignadas
• Ver miembros de todos los equipos

No puedes:
• Crear nuevos equipos o tareas
• Eliminar elementos
• Gestionar miembros de equipos
• Asignar tareas a otros usuarios`
        };

    alert(`
Información del Workspace:

📁 Nombre: ${workspace.name}
📝 Descripción: ${workspace.description || 'Sin descripción'}
👤 Tu rol: ${roleInfo.title}
📅 Creado: ${workspace.created_at ? new Date(workspace.created_at).toLocaleDateString() : 'Fecha no disponible'}

${roleInfo.permissions}
    `);
  }

  // Método para debuggear token antes de cargar workspaces
  debugAuthToken(): void {
    console.log('=== DEBUG TOKEN WORKSPACE-LIST ===');
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.log('🔐 Token encontrado:', !!token);
    console.log('👤 Usuario encontrado:', !!user);
    
    if (token) {
      console.log('🔐 Token preview:', token.substring(0, 30) + '...');
      console.log('🔐 Token length:', token.length);
      
      // Verificar formato básico
      if (token.includes('|')) {
        console.log('✅ Token parece tener formato Sanctum correcto');
      } else {
        console.log('⚠️ Token no parece tener formato Sanctum');
      }
    } else {
      console.log('❌ No hay token disponible');
    }
    
    if (user) {
      try {
        const userData = JSON.parse(user);
        console.log('👤 Usuario ID:', userData.id);
        console.log('👤 Usuario email:', userData.email);
      } catch (e) {
        console.log('❌ Error al parsear datos del usuario');
      }
    }
    
    console.log('===========================');
  }
}
