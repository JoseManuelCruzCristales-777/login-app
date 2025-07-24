import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeamService } from '../../services/team';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './team-list.html',
  styleUrl: './team-list.scss'
})
export class TeamListComponent implements OnInit {
  @Input() workspaceId!: number;
  teams: any[] = [];
  error = '';

  constructor(private teamService: TeamService, private router: Router) {}

  ngOnInit(): void {
    this.teamService.getTeams().subscribe({
      next: (teams: any) => {
        // Filtrar equipos por workspaceId si es necesario
        this.teams = this.workspaceId ? teams.filter((team: any) => team.workspace_id === this.workspaceId) : teams;
      },
      error: () => this.error = 'Error al cargar los equipos.'
    });
  }

  goToTeam(teamId: number) {
    this.router.navigate(['/team', teamId]);
  }
}

