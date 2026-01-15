import { Component, OnDestroy, OnInit } from '@angular/core';
import { UserService } from '@app/services/account/user.service';
import { Avatar } from '@common/session';
import { Router } from '@angular/router';
import { SocketService } from '@app/services/socket-service/socket-service';
import { PlayerService } from '@app/services/player/player.service';
import { GameService } from '@app/services/game/game.service';
import { GameCreationEvents, ToggleGameLockStateData } from '@common/game-creation.gateway.events';
import { Game, Player } from '@common/game';
import { Subscription } from 'rxjs';
import { ChatEvents } from '@common/events/temp-chat-events';
import { MAX_PLAYERS, TIME_LIMIT_DELAY } from '@common/constants';
import { GameChatroomComponent } from '@app/components/game-chatroom/game-chatroom.component';
import { TopbarComponent } from '@app/components/topbar/topbar.component';
import { CommonModule } from '@angular/common';
import { PlayersListComponent } from '@app/components/players-list/players-list.component';
import { ChatroomComponent } from '@app/components/chatroom/chatroom.component';
import { CountdownService } from '@app/services/countdown/countdown';
import { DelayModalComponent } from '@app/components/delay-modal/delay-modal.component';
import { ConfirmationModalComponent } from '@app/components/confirmation-modal/confirmation-modal.component';
import {TranslateModule, TranslateService} from "@ngx-translate/core";

@Component({
    selector: 'app-waiting-view-page',
    standalone: true,
    imports: [GameChatroomComponent, ChatroomComponent, TopbarComponent, CommonModule, PlayersListComponent, DelayModalComponent, ConfirmationModalComponent, TranslateModule],
    templateUrl: './waiting-view-page.component.html',
    styleUrls: ['./waiting-view-page.component.scss'],
})
export class WaitingViewPageComponent implements OnInit, OnDestroy {
    constructor(
        public readonly userService: UserService,
        public readonly playerService: PlayerService,
        public readonly gameService: GameService,
        private readonly router: Router,
        private readonly socketService: SocketService,
        private readonly countdownService: CountdownService,
        private readonly translate: TranslateService,
    ) {
        this.router = router;
        this.socketService = socketService;
        this.socketService.connect();
        this.translate.setDefaultLang('fr');
        this.translate.use(this.userService.user.language);
    }

    username: string;
    avatar: Avatar;
    socketSubscription: Subscription = new Subscription();
    isHost: boolean = false;
    players: Player[] = [];
    showExitModal: boolean = false;
    showKickModal: boolean = false;
    dialogBoxMessage: string;
    isStartable: boolean = false;
    isGameLocked: boolean = false;
    hover: boolean = false;
    numberOfPlayers: number;
    maxPlayers: number = MAX_PLAYERS;
    gameInitialized: boolean = false;
    kickedPlayerId: string = '';
    isDelayModalVisible: boolean = false;
    isConfirmationModalVisible: boolean = false;

    selectedChat: string = 'game';
    chatOpen: boolean = true;

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
        if (!this.socketService.isSocketAlive()) {
            this.ngOnDestroy();
            this.socketService.disconnect();
            this.router.navigate(['/']);
            return;
        }
        this.avatar = this.playerService.player.avatar;
        this.username = this.playerService.player.name;
        this.listenToSocketMessages();

        if (this.router.url.includes('host')) {
            this.isHost = true;
        }

        this.countdownService.startSignal$.subscribe((canStart: boolean) => {
            if (canStart) {
                if (!this.isHost) this.router.navigate(['/game']);
                else this.router.navigate(['organiserGame']);
            }
        });

        this.socketService.sendMessage(GameCreationEvents.GetGameData, this.waitingRoomCode);
        this.socketService.sendMessage(GameCreationEvents.GetPlayers, this.waitingRoomCode);
        this.socketService.sendMessage(ChatEvents.JoinChatRoom, this.waitingRoomCode);
    }

    get waitingRoomCode(): string {
        return this.gameService.game.id;
    }

    startGame(): void {
        this.socketService.sendMessage(GameCreationEvents.InitializeGame, this.waitingRoomCode);
    }

    exitGame(): void {
        this.isConfirmationModalVisible = true;
    }

    navigateToGamePage() {
        this.router.navigate([`/game/${this.waitingRoomCode}`], {
            state: { player: this.playerService.player, gameId: this.waitingRoomCode },
        });
    }

    getUserAvatar(avatar: Avatar): string {
        return avatar ? this.avatars.find((a) => a.id === avatar)?.preview || '' : '';
    }

    listenToSocketMessages(): void {
        if (!this.isHost) {
            this.socketSubscription.add(
                this.socketService.listen(GameCreationEvents.GameClosed).subscribe(() => {
                    this.dialogBoxMessage = "L'hôte de la partie a quitté.";
                    this.showExitModal = true;
                    setTimeout(() => {
                        this.router.navigate(['/']);
                    }, TIME_LIMIT_DELAY);
                }),
            );
            this.socketSubscription.add(
                this.socketService.listen<boolean>(GameCreationEvents.GameLockToggled).subscribe((isLocked) => {
                    this.isGameLocked = isLocked;
                }),
            );
        }

        this.socketSubscription.add(
            this.socketService.listen<Game>(GameCreationEvents.GameInitialized).subscribe((game) => {
                this.isDelayModalVisible = true;
                this.gameService.setGame(game);
                game.players.forEach((player) => {
                    if (player.socketId === this.playerService.player.socketId) {
                        this.playerService.player = player;

                        this.playerService.player.challenge = player.challenge;
                    }
                });
                this.gameInitialized = true;
                this.socketService.sendMessage<string>('startGame', this.gameService.game.id);
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen<Player[]>(GameCreationEvents.CurrentPlayers).subscribe((players: Player[]) => {
                this.players = players;
                this.numberOfPlayers = players.length;
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen<Player[]>(GameCreationEvents.PlayerJoined).subscribe((players: Player[]) => {
                this.players = players;
                this.numberOfPlayers = players.length;

                if (this.isHost) {
                    this.socketSubscription.add(
                        this.socketService.listen(GameCreationEvents.IsStartable).subscribe(() => {
                            this.isStartable = true;
                        }),
                    );
                    this.socketService.sendMessage(GameCreationEvents.IfStartable, this.waitingRoomCode);
                }
                if (this.numberOfPlayers === this.maxPlayers) {
                    const toggleGameLockStateData: ToggleGameLockStateData = { isLocked: true, gameId: this.waitingRoomCode };
                    this.socketService.sendMessage(GameCreationEvents.ToggleGameLockState, toggleGameLockStateData);
                }
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen(GameCreationEvents.PlayerKicked).subscribe(() => {
                this.dialogBoxMessage = 'Vous avez été exclu.';
                this.showExitModal = true;
                setTimeout(() => {
                    this.router.navigate(['/main-menu']);
                }, TIME_LIMIT_DELAY);
                this.socketService.sendMessage(GameCreationEvents.LeaveGame, this.waitingRoomCode);
                this.playerService.resetPlayer();
            }),
        );


        this.socketSubscription.add(
            this.socketService.listen<Player[]>(GameCreationEvents.PlayerLeft).subscribe((players: Player[]) => {
                if (this.isHost) {
                    this.isStartable = false;
                    this.socketService.sendMessage(GameCreationEvents.IfStartable, this.waitingRoomCode);
                }
                this.players = players;
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen(GameCreationEvents.IsStartable).subscribe(() => {
                this.isStartable = true;
            }),
        );
    }

    toggleHover(state: boolean): void {
        this.hover = state;
    }

    toggleGameLockState(): void {
        this.isGameLocked = !this.isGameLocked;
        const toggleGameLockStateData: ToggleGameLockStateData = { isLocked: this.isGameLocked, gameId: this.waitingRoomCode };
        this.socketService.sendMessage(GameCreationEvents.ToggleGameLockState, toggleGameLockStateData);
    }

    isGameMaxed(): boolean {
        return this.numberOfPlayers === this.maxPlayers;
    }

    onCloseModal(): void {
        this.isDelayModalVisible = false;
        this.isConfirmationModalVisible = false;
    }

    
    toggleChat(chatType: string): void {
        this.selectedChat = chatType;
    }

    toggleChatVisibility() {
        this.chatOpen = !this.chatOpen;
    }

    ngOnDestroy(): void {
        if (this.socketSubscription) {
            this.socketSubscription.unsubscribe();
        }
    }
}
