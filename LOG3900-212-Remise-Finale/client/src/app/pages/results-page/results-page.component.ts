import { Component, OnInit } from '@angular/core';
import { ChartData } from 'chart.js';
import { Subscription } from 'rxjs';
import { Player } from '@common/game';
import { SocketService } from '@app/services/socket-service/socket-service';
import { GameService } from '@app/services/game/game.service';
import { Avatar } from '@common/session';
import { DetailedQuestion } from '@common/question';
import { UserService } from '@app/services/account/user.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ChatroomComponent } from '@app/components/chatroom/chatroom.component';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { GameChatroomComponent } from '@app/components/game-chatroom/game-chatroom.component';
import { ConfirmationModalComponent } from '@app/components/confirmation-modal/confirmation-modal.component';
import {TranslateModule, TranslateService} from "@ngx-translate/core";  
import { DECREMENT, FIRST_RANK, INCREMENT, ONE, THREE, TWO, ZERO } from '@common/constants';

@Component({
    selector: 'app-results-page',
    standalone: true,
    imports: [CommonModule, FormsModule, ChatroomComponent, NgChartsModule, GameChatroomComponent, ConfirmationModalComponent, TranslateModule],
    templateUrl: './results-page.component.html',
    styleUrls: ['./results-page.component.scss'],
})
export class ResultsPageComponent implements OnInit {
    players: Player[] = [];
    playersSorted: Player[] = [];
    podiumPlayers: { player: Player; rank: string; tied: boolean }[] = [];
    rankedPlayers: { player: Player; rank: number }[] = [];

    showResultsSub: Subscription;
    histogramsDataSub: Subscription;
    subscriptions: Subscription[] = [];

    histogramsGenerated: ChartData<'bar'>[] = [];
    histogramsQuestion: DetailedQuestion[] = [];
    currentIndexHistograms: number = 0;

    selectedChat: string = 'game';
    username: string = this.userService.user.username;
    chatOpen: boolean = true;

    isConfirmationModalVisible: boolean = false;

    get gameId(): string {
        return this.gameService.game.id;
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

    constructor(
        public socketService: SocketService,
        public readonly gameService: GameService,
        public readonly userService: UserService,
        public readonly router: Router,
        private readonly translate: TranslateService,
    ) {
        this.router = router;
        this.translate.setDefaultLang('fr');
        this.translate.use(this.userService.user.language);
    }

    ngOnInit(): void {
        this.players = this.gameService.game.players.filter((player) => player.socketId !== this.gameService.game.hostSocketId) || [];
        this.playersSorted = [...this.players].sort((a, b) => b.totalPoints - a.totalPoints);
        this.podiumPlayers = this.getPodiumWithTies(this.playersSorted);
        this.rankedPlayers = this.assignRanks(this.playersSorted);

        this.subscriptions.push(this.histogramsDataSub);
        this.subscriptions.push(this.showResultsSub);
    }

    getWinnerPrice(): number {
        const game = this.userService.user.gameHistory.find((game) => game.gameId === this.gameService.game.id);

        if (!game || !game.winners || game.winners.length === ZERO || this.gameService.game.price === ZERO) {
            return 0;
        }

        return Math.floor((this.gameService.game.price * TWO) / THREE / game.winners.length);
    }

    getConsolationPrice(): number {
        const game = this.userService.user.gameHistory.find((game) => game.gameId === this.gameService.game.id);

        if (!game || !game.winners || game.winners.length === ZERO || this.gameService.game.price === ZERO) {
            return 0;
        }

        return Math.floor(this.gameService.game.price / THREE / (game.players.length - game.winners.length));
    }

    getRankTied(rank: number): boolean {
        return this.rankedPlayers.filter((p) => p.rank === rank).length > INCREMENT;
    }

    getBonusCount(player: Player): number {
        return player.answers.reduce((sum, answer) => sum + (answer.bonus > ZERO ? ONE : ZERO), ZERO);
    }

    onCloseModal(): void {
        this.isConfirmationModalVisible = false;
    }

    getPodiumWithTies(players: Player[]): { player: Player; rank: string; tied: boolean }[] {
        const ranked = this.assignRanks(players).filter((entry) => entry.rank > ZERO);
        const podiumMap = new Map<number, string>([
            [1, 'first'],
            [2, 'second'],
            [3, 'third'],
        ]);

        const podium: { player: Player; rank: string; tied: boolean }[] = [];

        for (const entry of ranked) {
            const rankLabel = podiumMap.get(entry.rank);
            if (rankLabel) {
                const alreadyIn = podium.some((p) => p.rank === rankLabel);
                podium.push({
                    player: entry.player,
                    rank: rankLabel,
                    tied: alreadyIn,
                });
            }
        }

        return podium;
    }

    assignRanks(players: Player[]): { player: Player; rank: number }[] {
        const hostSocketId = this.gameService.game.hostSocketId;
        const activePlayers = players
            .filter((player) => player.isActive && player.socketId !== hostSocketId)
            .sort((a, b) => b.totalPoints - a.totalPoints);
        const result: { player: Player; rank: number }[] = [];
        let currentRank = FIRST_RANK;

        for (let i = ZERO; i < activePlayers.length; i++) {
            const currentPlayer = activePlayers[i];
            if (i > ZERO && currentPlayer.totalPoints === activePlayers[i - DECREMENT].totalPoints) {
                result.push({ player: currentPlayer, rank: result[i - DECREMENT].rank });
            } else {
                result.push({ player: currentPlayer, rank: currentRank });
            }
            if (i === activePlayers.length - DECREMENT || currentPlayer.totalPoints !== activePlayers[i + INCREMENT].totalPoints) {
                currentRank = result.length + INCREMENT;
            }
        }

        for (const player of players) {
            const isHost = player.socketId === hostSocketId;
            const isAlreadyRanked = result.some((r) => r.player.userId === player.userId);

            if (!isHost && !isAlreadyRanked) {
                result.push({ player, rank: ZERO });
            }
        }

        return result;
    }

    getRankForPlayer(player: Player): number | null {
        const entry = this.rankedPlayers.find((r) => r.player === player);
        return entry ? entry.rank : null;
    }

    getUserAvatar(avatar: Avatar): string {
        return avatar ? this.avatars.find((a) => a.id === avatar)?.preview || '' : '';
    }

    leaveGame(): void {
        this.isConfirmationModalVisible = true;
    }

    getChallengeEmoji(challenge: string): string {
        switch (challenge) {
            case 'challenge1':
                return '🎯';
            case 'challenge2':
                return '🧠';
            case 'challenge3':
                return '🧩';
            case 'challenge4':
                return '🏃';
            case 'challenge5':
                return '🔐';
            default:
                return '';
        }
    }

    getChallengeNameFr(challenge: string): string {
        switch (challenge) {
            case 'challenge1':
                return this.translate.instant('3 bonnes réponses consécutives');
            case 'challenge2':
                return this.translate.instant('Réponse parfaite à une QRL');
            case 'challenge3':
                return this.translate.instant('Toutes les QCM réussies (min. 3)');
            case 'challenge4':
                return this.translate.instant('Toutes les réponses correctes');
            case 'challenge5':
                return this.translate.instant('Réponse parfaite et rapide à une QRE');
            default:
                return '';
        }
    }

    toggleChat(chatType: string): void {
        this.selectedChat = chatType;
    }

    toggleChatVisibility() {
        this.chatOpen = !this.chatOpen;
    }
}
