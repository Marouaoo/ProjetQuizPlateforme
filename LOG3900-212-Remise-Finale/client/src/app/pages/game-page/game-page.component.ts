import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ChatroomComponent } from '@app/components/chatroom/chatroom.component';
import { DelayModalComponent } from '@app/components/delay-modal/delay-modal.component';
import { GameChatroomComponent } from '@app/components/game-chatroom/game-chatroom.component';
import { UserService } from '@app/services/account/user.service';
import { CountdownService } from '@app/services/countdown/countdown';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player/player.service';
import { SocketService } from '@app/services/socket-service/socket-service';
import { MIN_CHOICES, TIMEOUT_DELAY, VICTORY_POINTS, ZERO } from '@common/constants';
import { Game, Player, QuestionStatus } from '@common/game';
import { GameCreationEvents } from '@common/game-creation.gateway.events';
import { Choice, Question, QuestionType } from '@common/question';
import { FormsModule } from '@angular/forms';
import { ChatroomService } from '@app/services/chatroom-service/chatroom.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
    standalone: true,
    imports: [CommonModule, ChatroomComponent, GameChatroomComponent, DelayModalComponent, FormsModule, TranslateModule],
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent {
    username: string = this.userService.user.username;

    countdown: number | string | null;

    question: Question | null;
    index: number;

    selectedChoices: string[] = [];
    qreAnswer: number;
    qrlAnswer: string;

    sentAnswer: boolean = false;
    showExitModal: boolean = false;
    isDelayModalVisible: boolean = false;
    panicModeActivated: boolean = false;

    questionStatus: QuestionStatus;

    Correct: QuestionStatus.Correct;
    Incorrect: QuestionStatus.Incorrect;
    PartiallyCorrect: QuestionStatus.PartiallyCorrect | QuestionStatus.PartiallyIncorrect;

    receivedResult: boolean = false;
    hintUsed: boolean = false;
    hintAvailable: boolean = true;
    removedChoice: string = '';

    selectedChat: string = 'game';
    chatOpen: boolean = true;

    get gameId(): string {
        return this.gameService.game.id;
    }

    gameFinishedModal: boolean = false;

    constructor(
        private readonly router: Router,
        private readonly socketService: SocketService,
        private readonly playerService: PlayerService,
        private readonly userService: UserService,
        public readonly gameService: GameService,
        private readonly countdownService: CountdownService,
        private readonly chatroomService: ChatroomService,
        private readonly translate: TranslateService,
    ) {
        this.router = router;
        this.socketService = socketService;
        this.playerService = playerService;
        this.countdownService = countdownService;
        this.gameService = gameService;
        this.chatroomService = chatroomService;
        this.translate.setDefaultLang('fr');
        this.translate.use(this.userService.user.language);
    }

    isImage(url: string): boolean {
        return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
    }

    ngOnInit() {
        this.socketService.listen(GameCreationEvents.GameClosed).subscribe(() => {
            this.gameFinishedModal = true;
            setTimeout(() => {
                this.leaveGame();
                this.gameFinishedModal = false;
            }, TIMEOUT_DELAY);
        });

        this.countdownService.countdown$.subscribe((value) => {
            this.countdown = value;
        });

        this.countdownService.timerFinished$.subscribe((value) => {
            this.countdown = '--';
            if (!this.sentAnswer) this.sendTimeoutAnswer();
        });

        this.countdownService.delay$.subscribe((value) => {
            if (value !== null && value > ZERO) {
                this.isDelayModalVisible = true;
            }
        });

        this.countdownService.panicModeSignal$.subscribe((value) => {
            this.panicModeActivated = value;
        });

        this.gameService.questionIndex$.subscribe((value) => (this.index = value));

        this.gameService.question$.subscribe((value) => {
            this.question = value;
            this.sentAnswer = false;
            this.receivedResult = false;
            this.selectedChoices = [];
            this.qreAnswer = ZERO;
            this.qrlAnswer = '';
            this.hintUsed = false;
            this.removedChoice = '';
            if (this.question?.type === QuestionType.QRE) {
                this.qreAnswer = this.question.minRange;
            } else if (this.question?.type === QuestionType.QCM) {
                if (this.question.choices.length > MIN_CHOICES) this.hintAvailable = this.userService.user.money >= VICTORY_POINTS / MIN_CHOICES;
            }
        });

        this.socketService
            .listen<{
                status: QuestionStatus;
                pointsAwarded: number;
            }>('answerResult')
            .subscribe((data) => {
                this.questionStatus = data.status;
                this.playerService.player.totalPoints += data.pointsAwarded;
                this.receivedResult = true;
            });

        this.socketService.listen<string>('hintUsed').subscribe((removedChoice) => {
            this.removedChoice = removedChoice;
            if (this.selectedChoices.includes(removedChoice)) this.onSelectChoice(removedChoice);
            this.hintUsed = true;
        });

        this.socketService.listen<Game>('gameFinished').subscribe((game) => {
            this.gameService.setGame(game);
            this.countdownService.resetCountdowns();
            this.router.navigate(['/resultsView']);
        });
    }

    get player(): Player {
        return this.playerService.player;
    }

    get game(): Game {
        return this.gameService.game;
    }

    buyHint(): void {
        if (this.hintUsed || !this.hintAvailable || this.sentAnswer) return;
        this.socketService.sendMessage('buyHint', this.game.id);
    }

    toggleChat(chatType: string): void {
        this.selectedChat = chatType;
    }

    toggleChatVisibility() {
        this.chatOpen = !this.chatOpen;
    }

    leaveGame(): void {
        this.showExitModal = false;
        this.sendAnswer();
        this.socketService.sendMessage(GameCreationEvents.LeaveGame, this.gameService.game.id);
        this.gameService.resetGame();
        this.countdownService.resetCountdowns();
        this.chatroomService.channelChat = [];
        this.router.navigate(['/homePage']);
    }

    openExitConfirmationModal(): void {
        this.showExitModal = true;
    }

    closeExitModal(): void {
        this.showExitModal = false;
    }

    onCloseModal(): void {
        this.isDelayModalVisible = false;
    }

    onSelectChoice(answer: string): void {
        if (this.selectedChoices.includes(answer)) {
            this.selectedChoices = this.selectedChoices.filter((choice) => choice !== answer);
        } else {
            this.selectedChoices.push(answer);
        }
    }

    isQreAnswerValid(): boolean {
        if (this.question?.type === QuestionType.QRE) return this.qreAnswer >= this.question.minRange && this.qreAnswer <= this.question.maxRange;
        return true;
    }

    sendAnswer(): void {
        if (this.question?.type === QuestionType.QCM)
            this.socketService.sendMessage('answerQCMQuestion', { gameId: this.gameService.game.id, answers: this.selectedChoices });
        else if (this.question?.type === QuestionType.QRE)
            this.socketService.sendMessage('answerQREQuestion', {
                gameId: this.gameService.game.id,
                answer: this.qreAnswer ? this.qreAnswer : this.question.minRange,
            });
        else if (this.question?.type === QuestionType.QRL)
            this.socketService.sendMessage('answerQRLQuestion', { gameId: this.gameService.game.id, answer: this.qrlAnswer });
        this.sentAnswer = true;
    }

    sendAnswerOnTimeout(): void {
        if (this.question?.type === QuestionType.QCM)
            this.socketService.sendMessage('answerQCMQuestionOnTimeout', { gameId: this.gameService.game.id, answers: this.selectedChoices });
        else if (this.question?.type === QuestionType.QRE)
            this.socketService.sendMessage('answerQREQuestionOnTimeout', {
                gameId: this.gameService.game.id,
                answer: this.qreAnswer ? this.qreAnswer : this.question.minRange,
            });
        else if (this.question?.type === QuestionType.QRL)
            this.socketService.sendMessage('answerQRLQuestion', { gameId: this.gameService.game.id, answer: this.qrlAnswer });
        this.sentAnswer = true;
    }

    allowOnlyNumbers(event: KeyboardEvent): void {
        const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab'];
        const isNumber = /^[0-9]$/.test(event.key);

        if (!isNumber && !allowedKeys.includes(event.key)) {
            event.preventDefault();
        }
    }

    sendTimeoutAnswer(): void {
        this.sendAnswerOnTimeout();
    }

    getChoiceClass(choice: Choice): string {
        if (!this.receivedResult || this.question?.type !== QuestionType.QCM) return '';

        const isSelected = this.selectedChoices.includes(choice.text);
        const isCorrect = choice.isCorrect;

        if (isCorrect && isSelected) return 'correct-selected';
        if (!isCorrect && isSelected) return 'incorrect-selected';
        if (isCorrect && !isSelected) return 'correct-missing';

        return '';
    }

    getQuestionStatusClass(): string {
        if (!this.receivedResult) return '';

        if (this.question) {
            if (this.questionStatus === QuestionStatus.PartiallyCorrect && this.gameService.isQRE(this.question)) {
                return 'correct-bg';
            }
        }

        switch (this.questionStatus) {
            case QuestionStatus.Correct:
                return 'correct-bg';
            case QuestionStatus.PartiallyCorrect:
                return 'partial-bg';
            case QuestionStatus.PartiallyIncorrect:
                return 'partial-bg';
            case QuestionStatus.Incorrect:
                return 'incorrect-bg';
            default:
                return '';
        }
    }
}
