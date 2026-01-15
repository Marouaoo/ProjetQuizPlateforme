import { Injectable } from '@angular/core';
import { User, Account, Avatar, UserInfo, Session, Status, Theme, Language } from '@common/session';
import { firstValueFrom, Subject, Subscription, takeUntil } from 'rxjs';
import { CommunicationService } from '../httpcommunication.service.ts/communication.service';
import { SocketService } from '../socket-service/socket-service';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { TutorialTrackerService } from '../tutorialTracker/tutorial-tracker.service';

@Injectable({
    providedIn: 'root',
})
export class UserService {
    users: UserInfo[] = [];

    userId: string;

    user: User = {
        username: '',
        email: '',
        password: '',
        avatar: Avatar.Avatar1,
        isConnected: false,
        status: Status.Disconnected,
        history: [],
        theme: Theme.lightTheme,
        language: Language.french,
        money: 0,
        score: 0,
        friends: [],
        friendRequestsReceived: [],
        friendRequestsSent: [],
        gameHistory: [],
        themesAquired: [],
        avatarsAquired: [],
        lastBonusReceived: new Date(),
        challenges: [],
    };
    private readonly socketSubscription: Subscription = new Subscription();
    private readonly unsubscribe$ = new Subject<void>();

    constructor(
        private readonly communicationService: CommunicationService,
        private readonly socketService: SocketService,
        private readonly router: Router,
        private readonly tutorial: TutorialTrackerService,
    ) {
        this.socketSubscription.add(
            this.socketService.listen<UserInfo>('connected').subscribe((user) => {
                this.setUser(user);
                this.router.navigate(['/homePage']);
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen('disconnected').subscribe(() => {
                this.resetUser();
                this.router.navigate(['/']);
            }),
        );

        this.socketSubscription.add(
            this.socketService
                .listen<{ username: string; status: Status }>('statusUpdated')
                .subscribe((data: { username: string; status: Status }) => {
                    this.users.forEach((user: UserInfo) => {
                        if (user.username === data.username) user.status = data.status;
                    });
                    if (this.user.username === data.username) this.user.status = data.status;
                    this.getUsers();
                }),
        );
        this.getUsers();

        this.socketSubscription.add(
            this.socketService.listen<UserInfo>('userUpdate').subscribe((user) => {
                this.setUser(user);
            }),
        );
    }

    getUsers() {
        this.communicationService
            .basicGet<UserInfo[]>('session')
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((users: UserInfo[]) => {
                const currentUser = users.find((user) => user._id === this.userId);
                const others = users.filter((user) => user._id !== this.userId);
                this.users = currentUser ? [currentUser, ...others] : others;
            });
    }

    resetUser() {
        this.userId = '';
        this.user = {
            username: '',
            email: '',
            password: '',
            avatar: Avatar.Avatar1,
            isConnected: false,
            status: Status.Disconnected,
            history: [],
            theme: Theme.lightTheme,
            language: Language.french,
            money: 0,
            score: 0,
            friends: [],
            friendRequestsReceived: [],
            friendRequestsSent: [],
            gameHistory: [],
            themesAquired: [],
            avatarsAquired: [],
            lastBonusReceived: new Date(),
            challenges: [],
        };
        document.body.setAttribute('data-theme', Theme.lightTheme);
    }

    setUser(user: UserInfo) {
        this.userId = user._id;
        this.user.username = user.username;
        this.user.email = user.email;
        this.user.avatar = user.avatar;
        this.user.status = user.status;
        this.user.isConnected = true;
        this.user.language = user.language;
        this.user.theme = user.theme;
        document.body.setAttribute('data-theme', this.user.theme);
        this.user.money = user.money;
        this.user.themesAquired = user.themesAquired;
        this.user.lastBonusReceived = user.lastBonusReceived;

        this.user.friendRequestsReceived = user.friendRequestsReceived;
        this.user.friendRequestsSent = user.friendRequestsSent;
        this.user.friends = user.friends;

        this.user.challenges = user.challenges;
        this.user.score = user.score;

        this.user.gameHistory = user.gameHistory;
        this.user.history = user.history;
        this.user.avatarsAquired = user.avatarsAquired;
    }

    async register(): Promise<string> {
        const account: Account = {
            email: this.user.email,
            username: this.user.username,
            password: this.user.password,
            avatar: this.user.avatar,
        };
        try {
            await firstValueFrom(this.communicationService.basicPost<Account>('session/register', account));
        } catch (error) {
            if (error instanceof HttpErrorResponse) {
                let errorMessage = 'Erreur inattendue, veuillez réessayer plus tard...';
                if (error.error) {
                    try {
                        const errorObj = JSON.parse(error.error);
                        if (typeof errorObj.message === 'string') {
                            errorMessage = errorObj.message;
                        } else {
                            const message: string = errorObj.message.join(' ');
                            errorMessage = message;
                        }
                    } catch (e) {
                        return errorMessage;
                    }
                }
                return errorMessage;
            } else {
                return 'Erreur inconnue, veuillez réessayer plus tard...';
            }
        }
        this.tutorial.isInTutorial = true;
        this.login();
        return 'Votre compte a été sauvegardé avec succès!';
    }

    login() {
        const session: Session = {
            username: this.user.username,
            password: this.user.password,
        };
        this.socketService.sendMessage<Session>('login', session);
    }
}
