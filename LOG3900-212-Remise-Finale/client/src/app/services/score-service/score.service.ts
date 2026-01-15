import { Injectable } from '@angular/core';
import { Player } from '@app/interfaces/player';
import { SocketService } from '../socket-service/socket-service';

@Injectable({
    providedIn: 'root',
})
export class ScoreService {
    constructor(private socketService: SocketService) {}

    giveGrade(playersList: Player[], currentPlayerIndex: number, currentGrade: number): Player[] {
        playersList[currentPlayerIndex].qrlGrade = currentGrade;
        return playersList;
    }

    isTheLastPlayer(currentPlayerIndex: number, playersList: Player[]): boolean {
        return currentPlayerIndex === playersList.length - 1;
    }

    sendGrades(playersList: Player[]) {
        this.socketService.sendMessage('sendGradesToPlayers', playersList);
        playersList.forEach((player) => {
            player.qrlGrade = undefined;
            player.qrlWrittenAnswer = undefined;
        });
    }
}
