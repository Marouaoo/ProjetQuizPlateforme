import { Injectable } from '@angular/core';
import { Challenge, Player } from '@common/game';
import { UserService } from '../account/user.service';
import { SocketService } from '../socket-service/socket-service';

@Injectable({
    providedIn: 'root',
})
export class PlayerService {
    player: Player;

    challenge: Challenge;

    constructor(
        private readonly socketService: SocketService,
        private readonly userService: UserService,
    ) {
        this.resetPlayer();
        this.socketService = socketService;
    }

    createPlayer() {
        const player: Player = {
            userId: this.userService.userId,
            socketId: this.socketService.socket.id || '',
            name: this.userService.user.username,
            avatar: this.userService.user.avatar,
            isActive: true,
            answers: [],
            totalPoints: 0,
            challenge: Challenge.challenge1,
            succeedChallenge: false,
        };
        this.player = player;
    }

    resetPlayer(): void {
        this.createPlayer();
    }
}
