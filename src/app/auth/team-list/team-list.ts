import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Team } from '../../services/team';
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

  constructor(private teamService: Team, private router: Router) {}

  ngOnInit(): void {
    this.teamService.getTeams(this.workspaceId).subscribe({
      next: (teams) => this.teams = teams,
      error: () => this.error = 'Error al cargar los equipos.'
    });
  }

  goToTeam(teamId: number) {
    this.router.navigate(['/team', teamId]);
  }
}

