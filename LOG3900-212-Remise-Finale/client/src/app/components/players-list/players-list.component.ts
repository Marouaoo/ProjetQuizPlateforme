import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { SocketService } from '@app/services/socket-service/socket-service';
import { Player } from '@common/game';
import { GameCreationEvents, KickPlayerData } from '@common/game-creation.gateway.events';
import { Avatar } from '@common/session';
import { UserService } from '@app/services/account/user.service';
import {TranslateModule, TranslateService} from "@ngx-translate/core";  
import { ZERO } from '@common/constants';


@Component({
    selector: 'app-players-list',
    standalone: true,
    imports: [TranslateModule],
    templateUrl: './players-list.component.html',
    styleUrls: ['./players-list.component.scss'],
})
export class PlayersListComponent {
    @Input() players: Player[];
    @Input() isHost: boolean;
    @Input() isGameMaxed: boolean;
    @Input() isGameLocked: boolean;
    @Input() gameId: string;
    @Input() openProfileModal: () => void;
    @Input() showKickModal: boolean;

    hostPlayerId: string = '';
    hoveredPlayerId: string | null = null;
    kickingPlayerId: string = '';
    kickedPlayerId: string = '';

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

    constructor(
        private readonly socketService: SocketService,
        private readonly translate: TranslateService,
        private readonly userService: UserService,
    ) {
        this.socketService = socketService;
        this.translate.setDefaultLang('fr');
        this.translate.use(this.userService.user.language);
    }

    ngOnInit(): void {
        if (this.isHost && this.players.length > ZERO) {
            this.hostPlayerId = this.players[0].socketId;
        }
    }

    getUserAvatar(avatar: Avatar): string {
        return avatar ? this.avatars.find((a) => a.id === avatar)?.preview || '' : '';
    }

    checkHostPlayerId(): void {
        if (!this.isHost || !this.hoveredPlayerId) return;
        if (this.hostPlayerId === '') {
            this.hostPlayerId = this.players[ZERO]?.socketId || '';
        }
    }

    banPlayer(playerId: string): void {
        this.showKickModal = true;
        this.kickingPlayerId = playerId;
    }

    confirmBan() {
        this.showKickModal = false;
        const kickPlayer: KickPlayerData = { playerId: this.kickingPlayerId, gameId: this.gameId };
        this.socketService.sendMessage(GameCreationEvents.KickPlayer, kickPlayer);
        this.kickedPlayerId = this.kickingPlayerId;
    }

    cancelBan() {
        this.showKickModal = false;
        this.kickedPlayerId = '';
    }
}
