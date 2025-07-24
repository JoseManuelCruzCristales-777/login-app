import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { RegisterComponent } from './auth/register/register';
import { HomeSelectorComponent } from './auth/home-selector/home-selector';
import { DashboardComponent } from './auth/dashboard/dashboard';
import { WorkspaceListComponent } from './auth/workspace-list/workspace-list';
import { WorkspaceFormComponent } from './auth/workspace-form/workspace-form';
import { PizarraComponent } from './auth/pizarra/pizarra';
// import {TaskBoardComponent} from './auth/home/home';
import { AuthGuard } from './guards/auth.guard';
import { PublicGuard } from './guards/public.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
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
    path: 'home',
    component: HomeSelectorComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
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
  },
  {
    path: 'workspace/:id',
    component: PizarraComponent,
    canActivate: [AuthGuard]
  }
  // Ejemplo de rutas adicionales:
  // { path: 'workspace/:id', component: WorkspaceDetailComponent, canActivate: [AuthGuard] },
  // { path: 'team/:id', component: TeamDetailComponent, canActivate: [AuthGuard] },
  // { path: 'task/:id', component: TaskDetailComponent, canActivate: [AuthGuard] }
];