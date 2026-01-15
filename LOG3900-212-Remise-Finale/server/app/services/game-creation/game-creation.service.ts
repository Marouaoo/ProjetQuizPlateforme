import { Challenge, Game, Player, Quiz } from '@common/game';
import { Inject, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { SessionService } from '../session/session.service';
import { QuestionType } from '@common/question';
import { Status, UserInfo } from '@common/session';
import { CountdownService } from '../countdown/countdown.service';

@Injectable()
export class GameCreationService {
    public gameRooms: Record<string, Game> = {};

    @Inject(SessionService) private readonly sessionService: SessionService;
    @Inject(CountdownService) private readonly countdownService: CountdownService;

    getGameById(gameId: string): Game {
        const game = this.gameRooms[gameId];
        if (!game) {
            return null;
        }
        return game;
    }

    async areFriends(playerSocketId: string, hostSocketId: string) {
        const player = await this.sessionService.getUserBySocketId(playerSocketId);
        const host = await this.sessionService.getUserBySocketId(hostSocketId);
        return player.friends.includes(host._id);
    }

    getGames(): Game[] {
        return Object.values(this.gameRooms);
    }

    getPlayer(gameId: string, playerSocketId: string): Player {
        const game = this.getGameById(gameId);
        return game.players.filter((player) => player.socketId === playerSocketId)[0];
    }

    generateUniqueId(): string {
        let id: string;
        do {
            id = Math.floor(1000 + Math.random() * 9000).toString();
        } while (id in this.gameRooms);
        return id;
    }

    addGame(game: Game): string {
        if (this.doesGameExist(game.id)) {
            return;
        }
        this.gameRooms[game.id] = game;
    }

    doesGameExist(gameId: string): boolean {
        return gameId in this.gameRooms;
    }

    async getUserBySocketId(socketId: string): Promise<UserInfo> {
        return await this.sessionService.getUserBySocketId(socketId);
    }

    async addPlayerToGame(player: Player, gameId: string): Promise<Game> {
        const game = this.getGameById(gameId);
        await this.sessionService.takeMoney(player.userId, game.price);
        this.gameRooms[gameId].players.push(player);
        await this.sessionService.updateStatus(player.userId, Status.Occupied);
        return game;
    }

    isPlayerHost(socketId: string, gameId: string): boolean {
        return this.getGameById(gameId).hostSocketId === socketId;
    }

    async handlePlayerLeaving(client: Socket, gameId: string): Promise<Game | null> {
        const game = this.getGameById(gameId);
        if (game) {
            if (game.hasStarted && !game.isFinished) {
                if (game.players.find((player) => player.isActive && player.socketId === client.id)) {
                    await this.sessionService.setAbandon(game.players.find((player) => player.socketId === client.id).userId, game.id);
                }
                game.players = game.players.map((player) => {
                    return player.socketId === client.id ? { ...player, isActive: false } : player;
                });
            } else {
                game.players = game.players.filter((player) => player.socketId !== client.id);
            }

            return this.getGameById(gameId);
        }
    }

    initializeGame(gameId: string): void {
        this.getGameById(gameId).hasStarted = true;
        this.getGameById(gameId).isLocked = true;
        this.getGameById(gameId).quiz.questions = this.shuffleArray(this.getGameById(gameId).quiz.questions);
        this.assignChallenges(gameId);
    }

    assignChallenges(gameId: string) {
        const game = this.getGameById(gameId);
        const possibleChallenges = this.getPossibleChallenges(game.quiz);
        for (let player of game.players) {
            const randomIndex = Math.floor(Math.random() * possibleChallenges.length);
            player.challenge = possibleChallenges[randomIndex];
        }
    }

    getPossibleChallenges(quiz: Quiz) {
        let nQCM = 0;
        let nQRL = 0;
        let nQRE = 0;
        for (const question of quiz.questions) {
            if (question.type === QuestionType.QCM) nQCM++;
            if (question.type === QuestionType.QRE) nQRE++;
            if (question.type === QuestionType.QRL) nQRL++;
        }
        const possibleChallenges: Challenge[] = [Challenge.challenge4];
        if (nQRL + nQCM + nQRE >= 3) {
            possibleChallenges.push(Challenge.challenge1);
        }
        if (nQRL > 0) {
            possibleChallenges.push(Challenge.challenge2);
        }
        if (nQCM > 3) {
            possibleChallenges.push(Challenge.challenge3);
        }
        if (nQRE > 0) {
            possibleChallenges.push(Challenge.challenge5);
        }
        return possibleChallenges;
    }
    isGameStartable(gameId: string): boolean {
        const game = this.getGameById(gameId);
        const activePlayersCount = game.players.filter((player) => player.isActive).length;
        return activePlayersCount >= 2;
    }

    shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    lockGame(gameId: string): void {
        this.gameRooms[gameId].isLocked = true;
    }

    banPlayer(gameId: string, playerId: string) {
        const game = this.getGameById(gameId);
        game.bannedPlayers.push(this.getPlayer(game.id, playerId).name);
    }

    deleteRoom(gameId: string): void {
        delete this.gameRooms[gameId];
    }
}
