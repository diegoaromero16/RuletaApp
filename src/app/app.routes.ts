import { Routes } from '@angular/router';
import { authGuard } from '../guards/auth-guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
    },
    {
        path: 'login',
        loadComponent: () =>
            import('../components/login/login')
                .then((m) => m.Login),
    },
    {
        path: 'admin',
        canActivate: [authGuard],
        loadComponent: () =>
            import('../components/admin/admin')
                .then(m => m.Admin)
    },
    {
        path: 'ruleta/:id',
        loadComponent: () =>
            import('../components/ruleta/ruleta')
                .then(m => m.Ruleta)
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];
