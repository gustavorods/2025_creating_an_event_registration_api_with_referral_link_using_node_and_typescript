import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { App } from './app/app';
import { Registration } from './app/registration';
import { Dashboard } from './app/dashboard';

bootstrapApplication(App, {
  providers: [provideHttpClient(), provideRouter([
    { path: '', component: Registration, title: 'Inscrição | NLW Connect' },
    { path: 'inscricao/:id', component: Dashboard, title: 'Seu convite | NLW Connect' },
    { path: '**', redirectTo: '' },
  ])],
}).catch(console.error);
