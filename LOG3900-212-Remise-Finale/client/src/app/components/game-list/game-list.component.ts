import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '@app/services/account/user.service';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player/player.service';
import { SocketService } from '@app/services/socket-service/socket-service';
import { Game, Player } from '@common/game';
import { GameCreationEvents, JoinGameData } from '@common/game-creation.gateway.events';
import { Subscription } from 'rxjs';
import {TranslateModule, TranslateService} from "@ngx-translate/core";
import { ZERO } from '@common/constants';

@Component({
    selector: 'app-game-list',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './game-list.component.html',
    styleUrls: ['./game-list.component.scss'],
})
export class GameListComponent implements OnInit {
    filter: 'all' | 'waiting' | 'active' = 'all';

    socketSubscription: Subscription = new Subscription();
    messageError: string = 'Aucune partie disponible. Veuillez réessayer plus tard.';

    modalOpen: boolean = false;
    game: Game;

    constructor(
        private readonly socketService: SocketService,
        public readonly gameService: GameService,
        private readonly router: Router,
        private readonly playerService: PlayerService,
        private readonly userService: UserService,
        private readonly translate: TranslateService,
    ) {
        this.translate.setDefaultLang('fr');
        this.translate.use(this.userService.user.language);
    }

    get filteredGames(): Game[] {
        if (this.filter === 'waiting') return this.gameService.waitingGames;
        if (this.filter === 'active') return this.gameService.activeGames;
        return this.gameService.games;
    }

    ngOnInit() {
        this.socketService.sendMessage(GameCreationEvents.GetGames);
        this.socketSubscription.add(
            this.socketService.listen<Game>(GameCreationEvents.GameAccessed).subscribe((game) => {
                this.gameService.game = game;
                this.router.navigate(['/waitingRoom']);
            }),
        );
    }

    joinGame(game: Game) {
        if (!game.isLocked) {
            this.playerService.createPlayer();
            this.gameService.game = game;
            const joinGameData: JoinGameData = { player: this.playerService.player, gameId: game.id };
            this.socketService.sendMessage<JoinGameData>(GameCreationEvents.JoinGame, joinGameData);
        }
    }

    getHost(game: Game): Player | null {
        for (let player of game.players) {
            if (player.socketId === game.hostSocketId) {
                return player;
            }
        }
        return null;
    }

    isAccessible(game: Game): boolean {
        return this.userService.user.friends.includes(this.getHost(game)!.userId);
    }

    openConfirmationModal(game: Game): void {
        this.game = game;
        if (this.game.price === ZERO || !this.game.price) {
           this.accessGame();
        } else {
            this.modalOpen = true;
        }
    }

    accessGame(): void {
        this.joinGame(this.game);
        this.modalOpen = false;
    }

    closeModal(): void {
        this.modalOpen = false;
    }
}
