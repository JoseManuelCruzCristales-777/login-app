import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { RegisterComponent } from './auth/register/register';
import { WorkspaceListComponent } from './auth/workspace-list/workspace-list';
import { WorkspaceFormComponent } from './auth/workspace-form/workspace-form';
// import {TaskBoardComponent} from './auth/home/home';
import { AuthGuard } from './guards/auth.guard';
import { PublicGuard } from './guards/public.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [PublicGuard]
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [PublicGuard]
  },
  {
    path: 'workspace-list',
    component: WorkspaceListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'workspace-form',
    component: WorkspaceFormComponent,
    canActivate: [AuthGuard]
  }
  // Ejemplo de rutas adicionales:
  // { path: 'workspace/:id', component: WorkspaceDetailComponent, canActivate: [AuthGuard] },
  // { path: 'team/:id', component: TeamDetailComponent, canActivate: [AuthGuard] },
  // { path: 'task/:id', component: TaskDetailComponent, canActivate: [AuthGuard] }
];