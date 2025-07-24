import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TaskData {
  id?: number;
  title: string;
  description?: string;
  progress: number; // porcentaje 0-100
  is_done: boolean;
  workspace_id: number;
  team_id?: number;
  assigned_to?: number;
  created_by: number;
  created_at?: string;
  updated_at?: string;
  // Propiedades de relación (opcionales)
  assigned_user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  creator?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  workspace?: {
    id: number;
    name: string;
    description: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // Obtener todas las tareas asignadas al usuario autenticado
  getUserTasks(): Observable<TaskData[]> {
    return this.http.get<TaskData[]>(`${this.apiUrl}/tasks`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Obtener detalles de una tarea específica
  getTaskById(id: number): Observable<TaskData> {
    return this.http.get<TaskData>(`${this.apiUrl}/tasks/${id}`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Actualizar progreso de tarea (para miembros)
  updateTaskProgress(id: number, data: { progress: number; is_done: boolean }): Observable<TaskData> {
    return this.http.put<TaskData>(`${this.apiUrl}/tasks/${id}`, data, { 
      headers: this.getAuthHeaders() 
    });
  }

  createTask(data: { 
    title: string; 
    description?: string; 
    workspace_id: number; 
    team_id: number; 
    assigned_to: number; 
  }): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/tasks`, data, { headers });
  }

  updateTask(id: number, data: Partial<TaskData>): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/tasks/${id}`, data, { headers });
  }

  deleteTask(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/tasks/${id}`, { headers });
  }

  getTasks(): Observable<TaskData[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<TaskData[]>(`${this.apiUrl}/tasks`, { headers });
  }

  getTask(id: number): Observable<TaskData> {
    const headers = this.getAuthHeaders();
    return this.http.get<TaskData>(`${this.apiUrl}/tasks/${id}`, { headers });
  }

  getWorkspaceTasks(workspaceId: number): Observable<TaskData[]> {
    const headers = this.getAuthHeaders();
    // Usar la ruta específica que tienes configurada
    return this.http.get<TaskData[]>(`${this.apiUrl}/workspaces/${workspaceId}/tasks`, { headers });
  }

  // Método alternativo en caso de que la ruta principal falle
  getTasksByWorkspaceAlternative(workspaceId: number): Observable<TaskData[]> {
    const headers = this.getAuthHeaders();
    // Ruta alternativa usando filtros
    return this.http.get<TaskData[]>(`${this.apiUrl}/tasks?workspace_id=${workspaceId}`, { headers });
  }
}
