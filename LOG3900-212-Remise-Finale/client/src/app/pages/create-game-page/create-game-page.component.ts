import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '@app/services/account/user.service';
import { CommunicationService } from '@app/services/httpcommunication.service.ts/communication.service';
import { Game, DetailedQuiz as Quiz } from '@common/game';
import { firstValueFrom, Subject, Subscription, takeUntil } from 'rxjs';
import { GameCreationEvents } from '@common/game-creation.gateway.events';
import { GameService } from '@app/services/game/game.service';
import { SocketService } from '@app/services/socket-service/socket-service';
import { FormsModule } from '@angular/forms';
import { TopbarComponent } from '@app/components/topbar/topbar.component';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DECREMENT, TIMEOUT_DELAY, ZERO } from '@common/constants';
import { TutorialTrackerService } from '@app/services/tutorialTracker/tutorial-tracker.service';

@Component({
    standalone: true,
    imports: [FormsModule, TopbarComponent, CommonModule, TranslateModule],
    selector: 'app-create-game-page',
    templateUrl: './create-game-page.component.html',
    styleUrls: ['./create-game-page.component.scss'],
})
export class CreateGamePageComponent implements OnInit {
    quizzes: Quiz[] = [];
    currentQuizIndex: number = ZERO;
    currentQuizId: string = '';
    isFriendsOnly: boolean = false;
    isMoneyGame: boolean = false;
    price: number = ZERO;
    buttonClicked = false;

    showErrorMessage: { userError: boolean; gameChoiceError: boolean } = {
        userError: false,
        gameChoiceError: false,
    };
    private readonly unsubscribe$ = new Subject<void>();
    messageSubscription: Subscription;

    constructor(
        private readonly userService: UserService,
        private readonly communicationService: CommunicationService,
        private readonly gameService: GameService,
        private readonly router: Router,
        public socketService: SocketService,
        private readonly translate: TranslateService,
        public tutorialTrackerService: TutorialTrackerService,
    ) {
        this.translate.setDefaultLang('fr');
        this.translate.use(this.userService.user.language);
    }

    ngOnInit(): void {
        this.getGamesData();
        this.messageSubscription = this.socketService.listen<Game>(GameCreationEvents.GameCreated).subscribe((game: Game) => {
            this.buttonClicked = false;
            this.gameService.game = game;
            this.router.navigate(['/waitingRoom/host']);
        });
    }

    getGamesData() {
        this.communicationService
            .basicGet<Quiz[]>(`quiz/${this.userService.user.username}`)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((quizzes: Quiz[]) => {
                this.quizzes = quizzes;
                this.currentQuizId = this.quizzes[this.currentQuizIndex]._id.toString();
            });
    }

    previousGame() {
        if (this.currentQuizIndex > ZERO) {
            this.currentQuizIndex--;
            this.currentQuizId = this.quizzes[this.currentQuizIndex]._id.toString();
        }
    }

    nextGame() {
        if (this.currentQuizIndex < this.quizzes.length - DECREMENT) {
            this.currentQuizIndex++;
            this.currentQuizId = this.quizzes[this.currentQuizIndex]._id.toString();
        }
    }

    async onClick() {
        if (!this.buttonClicked) {
            this.buttonClicked = true;
            await this.next();
        }
    }

    async next() {
        const chosenQuiz = await firstValueFrom(this.communicationService.basicGet<Quiz>(`quiz/unique/${this.currentQuizId}`));

        if (!chosenQuiz) {
            this.showErrorMessage.gameChoiceError = true;
            setTimeout(() => {
                this.router.navigate(['/']);
            }, TIMEOUT_DELAY);
        } else {
            const { _id, lastModified, isVisible, ...quiz } = chosenQuiz;
            const game = this.gameService.createNewGame(quiz, this.isFriendsOnly, this.price);
            this.socketService.sendMessage(GameCreationEvents.CreateGame, game);
        }
    }

    goBack(): void {
        this.router.navigate(['/home']);
    }
}
