import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Team {
  id: number;
  name: string;
  workspace_id: number;
  users?: TeamUser[];
  workspace?: {
    id: number;
    name: string;
    description: string;
  };
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

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
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
      console.log('🔐 TeamService - Headers con token agregado');
    } else {
      console.log('⚠️ TeamService - No se encontró token de autenticación');
    }
    
    return headers;
  }

  // Obtener todos los equipos donde participa el usuario
  getUserTeams(): Observable<Team[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Team[]>(`${this.apiUrl}/teams`, { headers });
  }

  // Obtener todos los equipos con autenticación
  getTeams(): Observable<Team[]> {
    const headers = this.createAuthHeaders();
    console.log('🌐 TeamService: Obteniendo equipos...');
    return this.http.get<Team[]>(`${this.apiUrl}/teams`, { headers });
  }

  getTeam(id: number): Observable<Team> {
    const headers = this.getAuthHeaders();
    return this.http.get<Team>(`${this.apiUrl}/teams/${id}`, { headers });
  }

  createTeam(data: { name: string; workspace_id: number }): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/teams`, data, { headers });
  }

  updateTeam(id: number, data: { name: string }): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/teams/${id}`, data, { headers });
  }

  deleteTeam(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/teams/${id}`, { headers });
  }

  addMember(teamId: number, data: { user_id: number; role: 'leader' | 'member' }): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/teams/${teamId}/add-member`, data, { headers });
  }

  removeMember(teamId: number, userId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/teams/${teamId}/remove-member/${userId}`, { headers });
  }

  getTeamMembers(teamId: number): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/teams/${teamId}/members`, { headers });
  }

  // Obtener todas las tareas del equipo
  getTeamTasks(teamId: number): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/teams/${teamId}/tasks`, { headers });
  }
}
