import { Component, OnDestroy, OnInit } from '@angular/core';
import { Avatar } from '@common/session';
import { Subscription } from 'rxjs';
import { SocketService } from '@app/services/socket-service/socket-service';
import { GameService } from '@app/services/game/game.service';
import { CountdownService } from '@app/services/countdown/countdown';
import { Question, QuestionType } from '@common/question';
import { Game, Player, QuestionStatus } from '@common/game';
import { PlayerService } from '@app/services/player/player.service';
import { DelayModalComponent } from '@app/components/delay-modal/delay-modal.component';
import { CommonModule } from '@angular/common';
import { GameCreationEvents } from '@common/game-creation.gateway.events';
import { Router } from '@angular/router';
import { ChatroomService } from '@app/services/chatroom-service/chatroom.service';
import { GameChatroomComponent } from '@app/components/game-chatroom/game-chatroom.component';
import { ChatroomComponent } from '@app/components/chatroom/chatroom.component';
import { UserService } from '@app/services/account/user.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
    DECREMENT,
    INCREMENT,
    MAX_PANIC_MODE,
    MIN_PANIC_MODE,
    PERCENT,
    QRL_MAX_POINTS,
    QRL_MIN_POINTS,
    TIMEOUT_DELAY,
    ZERO,
} from '@common/constants';

@Component({
    selector: 'app-org-game-page',
    standalone: true,
    imports: [CommonModule, DelayModalComponent, GameChatroomComponent, ChatroomComponent, TranslateModule],
    templateUrl: './org-game-page.component.html',
    styleUrls: ['./org-game-page.component.scss'],
})
export class OrgGamePageComponent implements OnInit, OnDestroy {
    answers: { [key: string]: string[] } = {};
    pointsAwardedPerPlayer: { [playerId: string]: number } = {};
    qreDistribution: { exact: number; partial: number; incorrect: number } = { exact: 0, partial: 0, incorrect: 0 };

    QCM = QuestionType.QCM;
    QRL = QuestionType.QRL;
    QRE = QuestionType.QRE;

    CORRECT = QuestionStatus.Correct;
    PARTIALLY_CORRECT = QuestionStatus.PartiallyCorrect;
    INCORRECT = QuestionStatus.Incorrect;
    username: string = '';
    gameId: string = this.gameService.game.id;

    private readonly socketSubscription: Subscription = new Subscription();

    isImage(url: string): boolean {
        return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
    }

    qrlResponses: { [userId: string]: string } = {};
    qrlResponsesStatus: { [userId: string]: QuestionStatus } = {};
    totalPlayers: number = ZERO;
    countdown: number | string | null;
    question: Question | null;
    index: number;
    panicModeAvailable: boolean = false;
    panicModeActivated: boolean = false;

    isPaused: boolean = false;
    isDelayModalVisible: boolean = false;
    isLastQuestion: boolean = false;
    isNextAvailable: boolean = false;
    playerPoints: number = ZERO;

    showExitModal = false;
    gameFinishedModal = false;

    selectedChat: string = 'game';
    chatOpen: boolean = true;

    constructor(
        private readonly socketService: SocketService,
        public readonly gameService: GameService,
        private readonly countdownService: CountdownService,
        private readonly playerService: PlayerService,
        private readonly router: Router,
        private readonly chatroomService: ChatroomService,
        private readonly translate: TranslateService,
        private readonly userService: UserService,
    ) {
        this.chatroomService = chatroomService;
        this.translate.setDefaultLang('fr');
        this.translate.use(this.userService.user.language);
    }

    avatars: { preview: string; id: Avatar }[] = [
        { preview: 'assets/avatars/ariel.png', id: Avatar.Avatar1 },
        { preview: 'assets/avatars/stitch.png', id: Avatar.Avatar2 },
        { preview: 'assets/avatars/genie.png', id: Avatar.Avatar3 },
        { preview: 'assets/avatars/cinderella.png', id: Avatar.Avatar4 },
        { preview: 'assets/avatars/donald_duck.png', id: Avatar.Avatar5 },
        { preview: 'assets/avatars/jasmine.png', id: Avatar.Avatar6 },
        { preview: 'assets/avatars/mickey_mouse.png', id: Avatar.Avatar7 },
        { preview: 'assets/avatars/snow_white.png', id: Avatar.Avatar8 },
        { preview: 'assets/avatars/simba.png', id: Avatar.Avatar9 },
        { preview: 'assets/avatars/rapunzel.png', id: Avatar.Avatar10 },
    ];

    ngOnInit(): void {
        this.socketSubscription.add(
            this.socketService.listen(GameCreationEvents.GameClosed).subscribe(() => {
                this.gameFinishedModal = true;
                setTimeout(() => {
                    this.leaveGame();
                    this.gameFinishedModal = false;
                }, TIMEOUT_DELAY);
            }),
        );

        this.countdownService.countdown$.subscribe((value) => {
            this.countdown = value;
            if (this.countdown) {
                if (this.countdown >= MIN_PANIC_MODE && this.question?.type !== QuestionType.QRL) this.panicModeAvailable = true;
                else if (this.countdown >= MAX_PANIC_MODE && this.question?.type === QuestionType.QRL) this.panicModeAvailable = true;
                else this.panicModeAvailable = false;
            }
        });

        this.countdownService.timerFinished$.subscribe((value) => {
            this.countdown = '--';
            this.isNextAvailable = true;
        });

        this.countdownService.delay$.subscribe((value) => {
            if (value !== null && value > ZERO) {
                this.isDelayModalVisible = true;
            }
        });

        this.countdownService.panicModeSignal$.subscribe((value) => {
            this.panicModeActivated = value;
        });

        this.gameService.question$.subscribe((value) => {
            this.question = value;
            this.isNextAvailable = false;
            this.answers = {};
            this.qrlResponses = {};
            this.qrlResponsesStatus = {};
            this.pointsAwardedPerPlayer = {};
            if (this.question?.type === QuestionType.QRE) {
                this.qreDistribution = { exact: ZERO, partial: ZERO, incorrect: ZERO };
            }
        });

        this.gameService.questionIndex$.subscribe((value) => {
            this.index = value;
            if (this.index === this.gameService.game.quiz.questions.length - DECREMENT) {
                this.isLastQuestion = true;
            }
        });

        this.socketSubscription.add(
            this.socketService
                .listen<{ playerId: string; pointsAwarded: number; answer: string[] }>('playerAnswered')
                .subscribe(({ playerId, pointsAwarded, answer }) => {
                    if (!this.answers[playerId]) {
                        this.answers[playerId] = answer;
                        this.pointsAwardedPerPlayer[playerId] = pointsAwarded;
                        const player = this.players.find((player) => player.userId === playerId);
                        if (player) {
                            player.totalPoints += pointsAwarded;
                        }
                    }
                }),
        );
        this.socketSubscription.add(
            this.socketService
                .listen<{ playerId: string; pointsAwarded: number; answer: string[]; questionStatus: QuestionStatus }>('playerAnsweredQRE')
                .subscribe(({ playerId, pointsAwarded, answer, questionStatus }) => {
                    if (!this.answers[playerId]) {
                        this.answers[playerId] = answer;
                        this.pointsAwardedPerPlayer[playerId] = pointsAwarded;
                        const player = this.players.find((player) => player.userId === playerId);
                        if (player) {
                            player.totalPoints += pointsAwarded;
                        }
                        if (questionStatus === QuestionStatus.Correct) this.qreDistribution.exact += INCREMENT;
                        else if (questionStatus === QuestionStatus.Incorrect) this.qreDistribution.incorrect += INCREMENT;
                        else this.qreDistribution.partial += INCREMENT;
                    }
                }),
        );
        this.socketSubscription.add(
            this.socketService.listen<{ playerId: string; pointsAwarded: number }>('QRLevaluated').subscribe(({ playerId, pointsAwarded }) => {
                if (!this.pointsAwardedPerPlayer[playerId]) {
                    this.pointsAwardedPerPlayer[playerId] = pointsAwarded;
                    const player = this.players.find((player) => player.userId === playerId);
                    if (player) {
                        player.totalPoints += pointsAwarded;
                    }
                }
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<{ playerId: string; answer: string }>('qrlAnswerReceived').subscribe(({ playerId, answer }) => {
                if (!this.qrlResponses[playerId]) {
                    this.qrlResponses[playerId] = answer;
                }
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen('AllPlayersLeft').subscribe(() => {
                this.gameFinishedModal = true;
                setTimeout(() => {
                    this.gameFinishedModal = false;
                    this.leaveGame();
                }, TIMEOUT_DELAY);
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<Game>('gameFinished').subscribe((game) => {
                this.gameService.game = game;
                this.isLastQuestion = false;
                this.countdownService.resetCountdowns();
                this.router.navigate(['/resultsView']);
            }),
        );
    }

    openExitConfirmationModal(): void {
        this.showExitModal = true;
    }

    closeExitModal(): void {
        this.showExitModal = false;
    }

    leaveGame(): void {
        this.showExitModal = false;
        this.socketService.sendMessage(GameCreationEvents.LeaveGame, this.gameService.game.id);
        this.gameService.resetGame();
        this.countdownService.resetCountdowns();
        this.chatroomService.channelChat = [];
        this.router.navigate(['/homePage']);
    }

    endGame(): void {
        this.socketService.sendMessage('endGame', this.gameService.game.id);
    }

    get game(): Game {
        return this.gameService.game;
    }

    get players(): Player[] {
        return this.gameService.game.players.filter((player) => player.socketId !== this.playerService.player.socketId);
    }

    nextQuestion() {
        this.socketService.sendMessage('nextQuestion', this.gameService.game.id);
    }

    canClickNext(): boolean {
        if (this.question?.type === QuestionType.QRL) {
            const activePlayers = this.game.players.filter((player) => player.isActive && player.socketId !== this.gameService.game.hostSocketId);
            const allEvaluated = activePlayers.every((player) => this.qrlResponsesStatus[player.userId] !== undefined);

            return allEvaluated;
        }

        return this.isNextAvailable;
    }

    getPlayerUsername(userId: string) {
        return this.game.players.find((player) => player.userId === userId)?.name;
    }

    getPlayerById(userId: string): Player {
        const foundPlayer = this.game.players.find((player) => player.userId === userId);
        if (foundPlayer) {
            return foundPlayer;
        } else {
            throw new Error(`Player with userId ${userId} not found`);
        }
    }

    evaluateQRLAnswer(playerId: string, score: 0 | 50 | 100) {
        if (score === ZERO) this.qrlResponsesStatus[playerId] = QuestionStatus.Incorrect;
        if (score === QRL_MIN_POINTS) this.qrlResponsesStatus[playerId] = QuestionStatus.PartiallyCorrect;
        if (score === QRL_MAX_POINTS) this.qrlResponsesStatus[playerId] = QuestionStatus.Correct;
        this.socketSubscription.add(
            this.socketService.sendMessage('evaluateQRLAnswer', {
                gameId: this.gameService.game.id,
                playerId,
                evaluation: score,
                answer: this.qrlResponses[playerId],
            }),
        );
    }

    activatePanicMode() {
        this.socketService.sendMessage('activatePanicMode', this.game.id);
    }

    togglePause() {
        if (this.isPaused) {
            this.socketService.sendMessage('resumeCountdown', this.game.id);
        } else {
            this.socketService.sendMessage('pauseCountdown', this.game.id);
        }
        this.isPaused = !this.isPaused;
    }

    getBarColor(answer: string): string {
        if (this.question?.type === QuestionType.QCM) {
            const isCorrect = this.question?.choices?.find((c) => c.text === answer)?.isCorrect;
            return isCorrect ? 'green' : 'red';
        }
        return '';
    }

    getBarWidthFromCount(count: number): string {
        const totalPlayers = this.game.players.filter((p) => p.isActive).length - DECREMENT || DECREMENT;
        return `${(count / totalPlayers) * 100}%`;
    }

    getQCMAnswerDistribution(): { [answerText: string]: number } {
        const allAnswers = ([] as string[]).concat(...Object.values(this.answers));
        const distribution: { [text: string]: number } = {};

        allAnswers.forEach((answer) => {
            distribution[answer] = (distribution[answer] || ZERO) + INCREMENT;
        });

        return distribution;
    }

    getActivePlayerIds(): string[] {
        return this.game.players.filter((p) => p.isActive && p.userId !== this.playerService.player.userId).map((p) => p.userId);
    }

    getPointsBarWidth(playerId: string): string {
        const maxPoints = this.question?.points || INCREMENT;
        const playerPoints = this.pointsAwardedPerPlayer[playerId] || ZERO;
        const width = (playerPoints / maxPoints) * PERCENT;
        return `${width}%`;
    }

    getUserAvatar(avatar: Avatar): string {
        return avatar ? this.avatars.find((a) => a.id === avatar)?.preview || '' : '';
    }

    onCloseModal(): void {
        this.isDelayModalVisible = false;
    }

    toggleChat(chatType: string): void {
        this.selectedChat = chatType;
    }

    toggleChatVisibility() {
        this.chatOpen = !this.chatOpen;
    }

    ngOnDestroy(): void {
        this.socketSubscription.unsubscribe();
    }
}
