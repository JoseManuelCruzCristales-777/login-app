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
}

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  private baseUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) { }

  // Obtener todos los workspaces
  getWorkspaces(): Observable<Workspace[]> {
    return this.http.get<Workspace[]>(`${this.baseUrl}/workspaces`);
  }

  // Obtener un workspace específico
  getWorkspace(id: number): Observable<Workspace> {
    return this.http.get<Workspace>(`${this.baseUrl}/workspaces/${id}`);
  }

  // Crear un nuevo workspace
  createWorkspace(workspace: Partial<Workspace>): Observable<Workspace> {
    return this.http.post<Workspace>(`${this.baseUrl}/workspaces`, workspace);
  }

  // Actualizar un workspace
  updateWorkspace(id: number, workspace: Partial<Workspace>): Observable<Workspace> {
    return this.http.put<Workspace>(`${this.baseUrl}/workspaces/${id}`, workspace);
  }

  // Eliminar un workspace
  deleteWorkspace(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/workspaces/${id}`);
  }

  // Método para obtener todas las tareas de un workspace específico
  getWorkspaceTasks(workspaceId: number): Observable<any[]> {
    const url = `${this.baseUrl}/workspaces/${workspaceId}/tasks`;
    console.log('🌐 Realizando petición GET a:', url);
    console.log('🔐 Con token:', localStorage.getItem('token')?.substring(0, 20) + '...');
    
    return this.http.get<any[]>(url);
  }

  // Obtener workspaces donde el usuario es miembro
  getMemberWorkspaces(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/member-workspaces`);
  }

  // Obtener workspaces creados por el usuario
  getOwnWorkspaces(): Observable<Workspace[]> {
    return this.http.get<Workspace[]>(`${this.baseUrl}/own-workspaces`);
  }

  // Métodos temporales hasta que el backend esté completo
  getAvailableUsersForTeam(teamId: number): Observable<any[]> {
    console.log('Método temporal: getAvailableUsersForTeam');
    return this.http.get<any[]>(`${this.baseUrl}/teams/${teamId}/available-users`);
  }

  addMemberToTeam(teamId: number, userId: number, role: string): Observable<any> {
    console.log('Método temporal: addMemberToTeam');
    return this.http.post(`${this.baseUrl}/teams/${teamId}/members`, { user_id: userId, role });
  }

  removeMemberFromTeam(teamId: number, userId: number): Observable<any> {
    console.log('Método temporal: removeMemberFromTeam');
    return this.http.delete(`${this.baseUrl}/teams/${teamId}/members/${userId}`);
  }
}