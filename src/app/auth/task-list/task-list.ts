import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: 'task-list.html',
})
export class TaskListComponent implements OnInit {
  @Input() teamId!: number;
  tasks: any[] = [];
  error = '';

  constructor(private taskService: TaskService, private router: Router) {}

  ngOnInit(): void {
    this.taskService.getTasks().subscribe({
      next: (tasks: any) => {
        // Filtrar tareas por teamId si es necesario
        this.tasks = this.teamId ? tasks.filter((task: any) => task.team_id === this.teamId) : tasks;
      },
      error: () => this.error = 'Error al cargar las tareas.'
    });
  }

  goToTask(taskId: number) {
    this.router.navigate(['/task', taskId]);
  }
}
