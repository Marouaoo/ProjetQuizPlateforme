import { Injectable, OnDestroy } from '@angular/core';
import { Player } from '@app/interfaces/player';
import { Subscription } from 'rxjs';
import { SocketService } from '../socket-service/socket-service';

@Injectable({
    providedIn: 'root',
})
export class PlayersListService implements OnDestroy {
    playersList: Player[] = [];
    selectedElementOrder: string = 'pointing';
    isAscendingOrder: boolean = false;
    getPlayersSub: Subscription;
    getPlayerSub: Subscription;
    getPlayerChatSub: Subscription;

    constructor(private socketService: SocketService) {
        this.getPlayersSub = this.socketService.listen('getPlayers').subscribe((playersList: unknown) => {
            this.playersList = playersList as Player[];
        });
        this.getPlayerSub = this.socketService.listen('getPlayer').subscribe((player: unknown) => {
            const playerReceived = player as Player;
            const playerIndex = this.playersList.findIndex((playerInList: Player) => playerInList.name === playerReceived.name);
            this.playersList[playerIndex] = playerReceived;
        });
        this.getPlayerChatSub = this.socketService.listen('getPlayerChat').subscribe((playerChat: unknown) => {
            const isChatActive = playerChat as [string, boolean];
            const playerIndex = this.playersList.findIndex((playerInList: Player) => playerInList.name === isChatActive[0]);
            this.playersList[playerIndex].isChatActive = isChatActive[1];
        });
    }

    get sortedPlayers(): Player[] {
        return this.changeElementListOrder();
    }

    ngOnDestroy(): void {
        this.getPlayersSub.unsubscribe();
    }

    onListOrderChange() {
        this.changeElementListOrder();
    }

    changeElementListOrder(): Player[] {
        let sortedPlayers: Player[] = [];

        switch (this.selectedElementOrder) {
            case 'name': {
                sortedPlayers = this.sortByPlayersName(this.isAscendingOrder);
                break;
            }
            case 'pointing': {
                sortedPlayers = this.sortByPlayersPointing(this.isAscendingOrder);
                break;
            }
            case 'playersState': {
                sortedPlayers = this.sortByPlayersState(this.isAscendingOrder);
                break;
            }
            default: {
                if (!['name', 'pointing', 'playersState'].includes(this.selectedElementOrder)) {
                    sortedPlayers = this.sortByPlayersPointing(this.isAscendingOrder);
                }
                break;
            }
        }
        return (this.playersList = sortedPlayers);
    }

    sortByPlayersName(isAscendingOrder: boolean): Player[] {
        return isAscendingOrder
            ? this.playersList.slice().sort((a, b) => {
                  return a.name.localeCompare(b.name);
              })
            : this.playersList.slice().sort((a, b) => {
                  return b.name.localeCompare(a.name);
              });
    }

    sortByPlayersPointing(isAscendingOrder: boolean): Player[] {
        return isAscendingOrder
            ? this.playersList.slice().sort((a, b) => {
                  if (a.points === b.points) {
                      return a.name.localeCompare(b.name);
                  }
                  return a.points - b.points;
              })
            : this.playersList.slice().sort((a, b) => {
                  if (a.points === b.points) {
                      return a.name.localeCompare(b.name);
                  }
                  return b.points - a.points;
              });
    }

    sortByPlayersState(isAscendingOrder: boolean): Player[] {
        const playersListToSort = this.playersList.slice().sort((a, b) => {
            return a.name.localeCompare(b.name);
        });
        const redPlayersList: Player[] = [];
        const yellowPlayersList: Player[] = [];
        const greenPlayersList: Player[] = [];
        const blackPlayersList: Player[] = [];
        let index = 0;
        for (index = 0; index < playersListToSort.length; index++) {
            if (playersListToSort[index].isInPlay) {
                if (!playersListToSort[index].isAnswerConfirmed && !playersListToSort[index].isAnswerSelected)
                    redPlayersList.push(playersListToSort[index]);
                else if (!playersListToSort[index].isAnswerConfirmed && playersListToSort[index].isAnswerSelected)
                    yellowPlayersList.push(playersListToSort[index]);
                else if (playersListToSort[index].isAnswerConfirmed) greenPlayersList.push(playersListToSort[index]);
            } else blackPlayersList.push(playersListToSort[index]);
        }
        return isAscendingOrder
            ? redPlayersList.concat(yellowPlayersList, greenPlayersList, blackPlayersList)
            : blackPlayersList.concat(greenPlayersList, yellowPlayersList, redPlayersList);
    }

    sortListByPlayersNameAndAscending(playersList: Player[]): Player[] {
        return playersList.slice().sort((a, b) => {
            return a.name.localeCompare(b.name);
        });
    }
}
