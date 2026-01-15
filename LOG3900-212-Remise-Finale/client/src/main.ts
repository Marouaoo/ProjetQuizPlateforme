import { Routes } from '@angular/router';
import { AdminPageComponent } from '@app/pages/admin-page/admin-page.component';
import { CreateGamePageComponent } from '@app/pages/create-game-page/create-game-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { JoinGamePageComponent } from '@app/pages/join-game-page/join-game-page.component';
import { OrgGamePageComponent } from '@app/pages/org-game-page/org-game-page.component';
import { WaitingViewPageComponent } from '@app/pages/waiting-view-page/waiting-view-page.component';
import { CreateAccountPageComponent } from '@app/pages/create-account-page/create-account-page.component';
import { ChatroomComponent } from '@app/components/chatroom/chatroom.component';
import { HomePageComponent } from '@app/pages/home-page/home-page.component';
import { SettingsPageComponent } from '@app/pages/settings-page/settings-page.component';
import { PasswordRecoveryComponent } from '@app/pages/reset-password/reset-password.component';
import { ConnectPageComponent } from '@app/pages/connect-page/connect-page.component';
import { ResultsPageComponent } from '@app/pages/results-page/results-page.component';
import { CreateQuizComponent } from '@app/pages/create-quiz-page/create-quiz-page.component';
import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withHashLocation } from '@angular/router';
import { AppComponent } from '@app/pages/app/app.component';
import { environment } from './environments/environment';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { authGuard } from '@app/guards/auth.guard';

if (environment.production) {
    enableProdMode();
}

export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
    return new TranslateHttpLoader(http, 'assets/i18n/', '.json');
}

const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', component: ConnectPageComponent },
    { path: 'createAccount', component: CreateAccountPageComponent },
    { path: 'homePage', component: HomePageComponent, canActivate: [authGuard] },

    { path: 'game', component: GamePageComponent, canActivate: [authGuard] },
    { path: 'createQuiz', component: CreateQuizComponent, canActivate: [authGuard] },
    { path: 'createQuiz/:quizId', component: CreateQuizComponent, canActivate: [authGuard] },
    { path: 'reset-password', component: PasswordRecoveryComponent },
    { path: 'admin', component: AdminPageComponent, canActivate: [authGuard] },
    { path: 'createGame', component: CreateGamePageComponent, canActivate: [authGuard] },
    { path: 'waitingRoom', component: WaitingViewPageComponent, canActivate: [authGuard] },
    { path: 'waitingRoom/host', component: WaitingViewPageComponent, canActivate: [authGuard] },
    { path: 'resultsView', component: ResultsPageComponent, canActivate: [authGuard] },
    { path: 'joinGame', component: JoinGamePageComponent, canActivate: [authGuard] },
    { path: 'chatroom', component: ChatroomComponent, canActivate: [authGuard] },
    { path: 'settings', component: SettingsPageComponent, canActivate: [authGuard] },
    { path: 'organiserGame', component: OrgGamePageComponent, canActivate: [authGuard] },
    { path: '**', redirectTo: '/home' },
];

bootstrapApplication(AppComponent, {
    providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideRouter(routes, withHashLocation()),
        provideAnimations(),
        importProvidersFrom(
            TranslateModule.forRoot({
                loader: {
                    provide: TranslateLoader,
                    useFactory: HttpLoaderFactory,
                    deps: [HttpClient],
                },
            }),
        ),
    ],
});
