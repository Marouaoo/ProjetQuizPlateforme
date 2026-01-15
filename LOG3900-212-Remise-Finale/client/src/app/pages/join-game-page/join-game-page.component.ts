import { Component, ElementRef, OnInit, QueryList, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player/player.service';
import { GameCreationEvents, JoinGameData } from '@common/game-creation.gateway.events';
import { Subscription } from 'rxjs';
import { SocketService } from '@app/services/socket-service/socket-service';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { FormsModule } from '@angular/forms';
import { TopbarComponent } from '@app/components/topbar/topbar.component';
import { Game } from '@common/game';
import { UserService } from '@app/services/account/user.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MAX_INPUT_LENGTH, MIN_INPUT_LENGTH, ZERO } from '@common/constants';
import { TutorialTrackerService } from '@app/services/tutorialTracker/tutorial-tracker.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-join-game-page',
    standalone: true,
    imports: [GameListComponent, FormsModule, TopbarComponent, TranslateModule, CommonModule],
    templateUrl: './join-game-page.component.html',
    styleUrls: ['./join-game-page.component.scss'],
})
export class JoinGamePageComponent implements OnInit {
    @ViewChildren('codeInput') codeInputs!: QueryList<ElementRef>;

    code: string[] = ['', '', '', ''];

    waitingRoomCode: string;
    socketSubscription: Subscription = new Subscription();
    messageError: string = '';
    modalOpen: boolean = false;

    constructor(
        private router: Router,
        public socketService: SocketService,
        private readonly playerService: PlayerService,
        public readonly gameService: GameService,
        private readonly translate: TranslateService,
        private readonly userService: UserService,
        public tutorialTrackerService: TutorialTrackerService,
    ) {
        this.translate.setDefaultLang('fr');
        this.translate.use(this.userService.user.language);
    }

    ngOnInit(): void {
        this.socketSubscription.add(
            this.socketService.listen<string>(GameCreationEvents.GameNotFound).subscribe((message: string) => {
                this.messageError = message;
                this.resetCodeAndFocus();
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen<string>(GameCreationEvents.GameLocked).subscribe((message: string) => {
                this.messageError = message;
                this.resetCodeAndFocus();
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen<Game>(GameCreationEvents.GameAccessed).subscribe((game) => {
                this.gameService.game = game;
                this.router.navigate(['/waitingRoom']);
            }),
        );
    }

    ngAfterViewInit(): void {
        this.focusFirstInput();
    }

    focusFirstInput(): void {
        const firstInput = this.codeInputs.first;
        if (firstInput) {
            firstInput.nativeElement.focus();
        }
    }

    resetCodeAndFocus(): void {
        this.code = ['', '', '', ''];
        const firstInput = this.codeInputs.first;
        if (firstInput) {
            firstInput.nativeElement.focus();
        }
    }

    moveToNext(event: any, index: number): void {
        const input = event.target;
        const value = input.value.replace(/[^0-9]/g, '');
        input.value = value;

        if (value.length === MIN_INPUT_LENGTH && index < MAX_INPUT_LENGTH) {
            const nextInput = this.codeInputs.toArray()[index];
            if (nextInput) {
                nextInput.nativeElement.focus();
            }
        }
    }

    validateAccessCode() {}

    joinGame(event: any): void {
        const input = event.target;
        const value = input.value.replace(/[^0-9]/g, '');
        input.value = value;

        if (this.code.every((digit) => digit !== '')) {
            const gameCode = this.code.join('');
            this.waitingRoomCode = gameCode;
            this.gameService.waitingGames.forEach((game) => {
                if (game.id === this.waitingRoomCode) {
                    this.gameService.setGame(game);
                }
            });
        }
        this.openConfirmationModal();
    }

    openConfirmationModal(): void {
        if (this.gameService.game.price === ZERO || !this.gameService.game.price) {
            this.accessGame();
        } else {
            this.modalOpen = true;
        }
    }

    accessGame(): void {
        if (this.code.every((digit) => digit !== '')) {
            const gameCode = this.code.join('');
            this.waitingRoomCode = gameCode;
            this.playerService.createPlayer();
            const joinGameData: JoinGameData = { player: this.playerService.player, gameId: this.waitingRoomCode };
            this.socketService.sendMessage<JoinGameData>(GameCreationEvents.JoinGame, joinGameData);
        }
        this.modalOpen = false;
    }

    closeModal(): void {
        this.modalOpen = false;
    }

    haveSpace(input: string): boolean {
        const spaceNotFound = -1;
        return input.indexOf(' ') !== spaceNotFound;
    }

    goBack(): void {
        this.router.navigate(['/home']);
    }
}
