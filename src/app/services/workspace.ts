import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Workspace {
  id: number;
  name: string;
  description: string;
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

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  createWorkspace(data: { name: string; description?: string }): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/workspaces`, data, { headers });
  }

  getWorkspaces(): Observable<Workspace[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Workspace[]>(`${this.apiUrl}/workspaces`, { headers });
  }

  getWorkspace(id: number): Observable<Workspace> {
    const headers = this.getAuthHeaders();
    return this.http.get<Workspace>(`${this.apiUrl}/workspaces/${id}`, { headers });
  }

  updateWorkspace(id: number, data: { name: string; description?: string }): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/workspaces/${id}`, data, { headers });
  }

  deleteWorkspace(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/workspaces/${id}`, { headers });
  }
}
