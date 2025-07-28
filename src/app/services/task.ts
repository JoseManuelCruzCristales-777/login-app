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

// Interface actualizada para TaskData sin team_id (según schema real)
export interface TaskDataCreate {
  title: string;
  description?: string;
  workspace_id: number;
  assigned_to: number;
  progress?: number;
  is_done?: boolean;
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
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  // Obtener todas las tareas asignadas al usuario autenticado
  getTasks(): Observable<TaskData[]> {
    console.log('🌐 TaskService: Obteniendo tareas del usuario autenticado...');
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

  // Crear nueva tarea (método principal)
  createTask(data: { 
    title: string; 
    description?: string; 
    workspace_id: number; 
    team_id: number; 
    assigned_to: number; 
  }): Observable<any> {
    console.log('🌐 TaskService: Creando nueva tarea...');
    return this.http.post(`${this.apiUrl}/tasks`, data, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Actualizar tarea
  updateTask(id: number, data: Partial<TaskData>): Observable<any> {
    console.log('🌐 TaskService: Actualizando tarea ID:', id);
    return this.http.put(`${this.apiUrl}/tasks/${id}`, data, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Eliminar tarea
  deleteTask(id: number): Observable<any> {
    console.log('🌐 TaskService: Eliminando tarea ID:', id);
    return this.http.delete(`${this.apiUrl}/tasks/${id}`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Actualizar progreso de tarea (para miembros)
  updateTaskProgress(id: number, data: { progress: number; is_done: boolean }): Observable<TaskData> {
    return this.http.put<TaskData>(`${this.apiUrl}/tasks/${id}`, data, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Obtener tareas de un workspace específico (para líderes)
  getWorkspaceTasks(workspaceId: number): Observable<TaskData[]> {
    console.log('🌐 TaskService: Obteniendo tareas del workspace:', workspaceId);
    return this.http.get<TaskData[]>(`${this.apiUrl}/workspaces/${workspaceId}/tasks`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Método alternativo en caso de que la ruta principal falle
  getTasksByWorkspaceAlternative(workspaceId: number): Observable<TaskData[]> {
    return this.http.get<TaskData[]>(`${this.apiUrl}/tasks?workspace_id=${workspaceId}`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Método para obtener tareas de un equipo específico
  getTeamTasks(teamId: number): Observable<TaskData[]> {
    return this.http.get<TaskData[]>(`${this.apiUrl}/teams/${teamId}/tasks`, { 
      headers: this.getAuthHeaders() 
    });
  }
}
