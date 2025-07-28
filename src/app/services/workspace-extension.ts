// Extensión temporal del WorkspaceService para métodos faltantes
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable()
export class WorkspaceServiceExtension {
  
  // Métodos temporales que faltan en WorkspaceService
  getAvailableUsersForTeam(teamId: number): Observable<any[]> {
    console.log('Método temporal: getAvailableUsersForTeam');
    return of([]);
  }

  addMemberToTeam(teamId: number, userId: number, role: string): Observable<any> {
    console.log('Método temporal: addMemberToTeam');
    return of({ success: true });
  }

  removeMemberFromTeam(teamId: number, userId: number): Observable<any> {
    console.log('Método temporal: removeMemberFromTeam');
    return of({ success: true });
  }
}