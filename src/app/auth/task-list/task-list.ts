import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../services/task';
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

  constructor(private taskService: Task, private router: Router) {}

  ngOnInit(): void {
    // Aquí deberías tener un método en el servicio para obtener tareas por teamId
    // Por simplicidad, asume que getTasks(teamId) existe
    this.taskService.getTasks(this.teamId).subscribe({
      next: (tasks) => this.tasks = tasks,
      error: () => this.error = 'Error al cargar las tareas.'
    });
  }

  goToTask(taskId: number) {
    this.router.navigate(['/task', taskId]);
  }
}
