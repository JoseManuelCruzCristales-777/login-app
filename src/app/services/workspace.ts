import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Workspace {
  id?: number;
  name: string;
  description: string;
  created_by?: number | { first_name: string; last_name: string }; // Soporta ambos casos
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

  createWorkspace(data: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/workspaces`, data, { headers });
  }

  getWorkspaces(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/workspaces`, { headers });
  }

  getWorkspace(id: number): Observable<Workspace> {
    const headers = this.getAuthHeaders();
    return this.http.get<Workspace>(`${this.apiUrl}/workspaces/${id}`, { headers });
  }

  updateWorkspace(id: number, workspace: Workspace): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/workspaces/${id}`, workspace, { headers });
  }
}
