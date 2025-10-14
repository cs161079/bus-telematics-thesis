import { Routes } from '@angular/router';
import { AuthGuard } from './guard/app.guard';
import { HomePage } from './pages/unoauth/home/home.page';
import { OAuthComponent } from './pages/oauth/oauth.component';
import { RoleGuard } from './guard/role.guard';
import { LoginGuard } from './guard/login.guard';

export const routes: Routes = [
  {
    path: "oauth",
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        component: OAuthComponent,
        children: [
          {
            path: 'push-notification',
            loadComponent: () => import('./pages/oauth/push-notification/push-notification.component').then(m => m.PushNotificationComponent),
            canActivate: [RoleGuard],
            data: { roles: ['oasa-admin'] }
          },
          {
            path: 'jobs',
            loadComponent: () => import('./pages/oauth/jobs/jobs.page').then(m => m.JobPage),
          },
          {
            path: 'capacity',
            loadComponent: () => import('./pages/oauth/capacity/capacity.page').then(m => m.CapacityPage)
          },
          {
            path: "",
            pathMatch: "full",
            redirectTo: "jobs"
          }
        ]
      }
    ]
  },
  {
    path: "unoauth",
    children: [
      {
        path: "home",
        component: HomePage,
        canActivate: [LoginGuard]
      }
    ]
  },
  {
    path: "",
    pathMatch: "full",
    redirectTo: "/oauth/jobs"
  },
  {
    path: '**',
    redirectTo: ''
  }
];
