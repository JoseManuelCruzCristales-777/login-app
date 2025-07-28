import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Workspace {
  id: number;
  name: string;
  description?: string;
  created_by: number;
  created_at?: string;
  updated_at?: string;
  teams?: Team[];
  tasks?: any[];
}

export interface Team {
  id: number;
  name: string;
  workspace_id: number;
  users?: TeamUser[];
}

export interface TeamUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  pivot: {
    role: 'leader' | 'member';
  };
}

// Extender la interfaz Workspace para incluir rol del usuario
export interface WorkspaceWithRole extends Workspace {
  userRole?: 'owner' | 'leader' | 'member';
}

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  private baseUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) { }

  // Crear un nuevo workspace
  createWorkspace(workspace: Partial<Workspace>): Observable<Workspace> {
    const headers = this.createAuthHeaders();
    return this.http.post<Workspace>(`${this.baseUrl}/workspaces`, workspace, { headers });
  }

  // Obtener todos los workspaces
  getWorkspaces(): Observable<Workspace[]> {
    const headers = this.createAuthHeaders();
    return this.http.get<Workspace[]>(`${this.baseUrl}/workspaces`, { headers });
  }

  // Obtener un workspace específico
  getWorkspace(id: number): Observable<Workspace> {
    const headers = this.createAuthHeaders();
    return this.http.get<Workspace>(`${this.baseUrl}/workspaces/${id}`, { headers });
  }

  // Actualizar un workspace
  updateWorkspace(id: number, workspace: Partial<Workspace>): Observable<Workspace> {
    const headers = this.createAuthHeaders();
    return this.http.put<Workspace>(`${this.baseUrl}/workspaces/${id}`, workspace, { headers });
  }

  // Eliminar un workspace
  deleteWorkspace(id: number): Observable<any> {
    const headers = this.createAuthHeaders();
    return this.http.delete(`${this.baseUrl}/workspaces/${id}`, { headers });
  }

  // Obtener workspaces donde el usuario es miembro
  getMemberWorkspaces(): Observable<WorkspaceWithRole[]> {
    const headers = this.createAuthHeaders();
    return this.http.get<WorkspaceWithRole[]>(`${this.baseUrl}/member-workspaces`, { headers });
  }

  // Obtener workspaces creados por el usuario
  getOwnWorkspaces(): Observable<Workspace[]> {
    const headers = this.createAuthHeaders();
    return this.http.get<Workspace[]>(`${this.baseUrl}/own-workspaces`, { headers });
  }

  // Método para obtener todas las tareas de un workspace específico
  getWorkspaceTasks(workspaceId: number): Observable<any[]> {
    const headers = this.createAuthHeaders();
    const url = `${this.baseUrl}/workspaces/${workspaceId}/tasks`;
    console.log('🌐 Realizando petición GET a:', url);
    console.log('🔐 Con token:', localStorage.getItem('token')?.substring(0, 20) + '...');
    
    return this.http.get<any[]>(url, { headers });
  }

  // Métodos para gestión de equipos
  getAvailableUsersForTeam(teamId: number): Observable<any[]> {
    const headers = this.createAuthHeaders();
    return this.http.get<any[]>(`${this.baseUrl}/teams/${teamId}/available-users`, { headers });
  }

  addMemberToTeam(teamId: number, userId: number, role: string): Observable<any> {
    const headers = this.createAuthHeaders();
    return this.http.post(`${this.baseUrl}/teams/${teamId}/members`, {
      user_id: userId,
      role: role
    }, { headers });
  }

  removeMemberFromTeam(teamId: number, userId: number): Observable<any> {
    const headers = this.createAuthHeaders();
    return this.http.delete(`${this.baseUrl}/teams/${teamId}/members/${userId}`, { headers });
  }

  // Helper para crear headers con token de autenticación
  private createAuthHeaders(): { [header: string]: string } {
    const token = localStorage.getItem('token');
    const headers: { [header: string]: string } = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🔐 Headers con token agregado:', token.substring(0, 20) + '...');
    } else {
      console.log('⚠️ No se encontró token de autenticación');
    }
    
    return headers;
  }
}
