import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule,DragDropModule],
  template: `<router-outlet></router-outlet>`
})
export class AppComponent {}
