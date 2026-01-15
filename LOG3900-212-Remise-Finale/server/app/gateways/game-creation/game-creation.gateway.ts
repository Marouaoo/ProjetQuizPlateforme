import { GameCreationService } from '@app/services/game-creation/game-creation.service';
import { Inject, Injectable } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Game } from '@common/game';
import { Server, Socket } from 'socket.io';
import { GameCreationEvents, JoinGameData, KickPlayerData, ToggleGameLockStateData } from '@common/game-creation.gateway.events';
import { SessionService } from '@app/services/session/session.service';
import { Status } from '@common/session';

@WebSocketGateway({ namespace: '/game', cors: { origin: '*' } })
@Injectable()
export class GameCreationGateway {
    @WebSocketServer() private readonly server: Server;

    @Inject(GameCreationService) private readonly gameCreationService: GameCreationService;
    @Inject(SessionService) private readonly sessionService: SessionService;

    @SubscribeMessage(GameCreationEvents.GetGames)
    getGames(client: Socket): void {
        this.server.to(client.id).emit(GameCreationEvents.Games, this.gameCreationService.getGames());
    }

    @SubscribeMessage(GameCreationEvents.CreateGame)
    async handleCreateGame(client: Socket, newGame: Game): Promise<void> {
        newGame.hostSocketId = client.id;
        newGame.id = this.gameCreationService.generateUniqueId();
        client.join(newGame.id);
        this.gameCreationService.addGame(newGame);

        const user = await this.sessionService.getUserBySocketId(newGame.hostSocketId);
        await this.sessionService.updateStatus(user._id, Status.Occupied);
        this.server.emit('statusUpdated', {
            username: user.username,
            status: (await this.gameCreationService.getUserBySocketId(client.id)).status,
        });
        this.server.to(newGame.id).emit(GameCreationEvents.GameCreated, newGame);
        this.server.emit('gamesUpdate', this.gameCreationService.getGames());
    }

    @SubscribeMessage(GameCreationEvents.JoinGame)
    async handleJoinGame(client: Socket, data: JoinGameData): Promise<void> {
        if (this.gameCreationService.doesGameExist(data.gameId)) {
            let game = this.gameCreationService.getGameById(data.gameId);
            if (game.hasStarted) {
                client.emit(GameCreationEvents.GameLocked, "Vous n'avez pas été assez rapide... La partie a déjà commencé.");
                return;
            } else if (game.isLocked) {
                client.emit(GameCreationEvents.GameLocked, 'La partie est vérouillée, veuillez réessayer plus tard.');
                return;
            } else if (game.bannedPlayers.includes(data.player.name)) {
                client.emit(GameCreationEvents.GameLocked, 'Vous avez été bani de cette partie.');
                return;
            } else if (game.friendsOnly && !(await this.gameCreationService.areFriends(data.player.socketId, game.hostSocketId))) {
                client.emit(GameCreationEvents.GameLocked, "Cette partie est réservée aux amis de l'organisateur.");
                return;
            } else if (game.price > (await this.sessionService.getUserBySocketId(data.player.socketId))?.money) {
                client.emit(GameCreationEvents.GameLocked, 'Vous manquez de fonds pour accéder à la partie');
                return;
            }
            client.join(data.gameId);
            game = await this.gameCreationService.addPlayerToGame(data.player, data.gameId);
            const newPlayer = game.players.filter((player) => player.socketId === client.id)[0];
            client.emit(GameCreationEvents.GameAccessed, game);
            client.emit('userUpdate', await this.gameCreationService.getUserBySocketId(newPlayer.socketId));
            this.server.emit('statusUpdated', {
                username: newPlayer.name,
                status: (await this.gameCreationService.getUserBySocketId(newPlayer.socketId)).status,
            });

            client.emit(GameCreationEvents.YouJoined, newPlayer);
            this.server.to(data.gameId).emit(GameCreationEvents.PlayerJoined, game.players);
            this.server.to(data.gameId).emit(GameCreationEvents.CurrentPlayers, game.players);
        } else {
            client.emit(GameCreationEvents.GameNotFound, "Cette partie n'existe plus.");
        }
    }

    @SubscribeMessage(GameCreationEvents.GetPlayers)
    getAvailableAvatars(client: Socket, gameId: string): void {
        if (this.gameCreationService.doesGameExist(gameId)) {
            const game = this.gameCreationService.getGameById(gameId);
            client.emit(
                GameCreationEvents.CurrentPlayers,
                game.players.filter((player) => player.isActive),
            );
        } else {
            client.emit(GameCreationEvents.GameNotFound, 'La partie a été fermée');
        }
    }

    @SubscribeMessage(GameCreationEvents.KickPlayer)
    handleKickPlayer(client: Socket, data: KickPlayerData): void {
        this.gameCreationService.banPlayer(data.gameId, data.playerId);
        this.server.to(data.playerId).emit(GameCreationEvents.PlayerKicked);
    }

    @SubscribeMessage(GameCreationEvents.GetGameData)
    getGame(client: Socket, gameId: string): void {
        if (this.gameCreationService.doesGameExist(gameId)) {
            const game = this.gameCreationService.getGameById(gameId);
            client.emit(GameCreationEvents.CurrentGame, game);
        } else {
            client.emit(GameCreationEvents.GameNotFound, 'La partie a été fermée');
        }
    }

    @SubscribeMessage(GameCreationEvents.InitializeGame)
    async handleInitGame(client: Socket, roomId: string): Promise<void> {
        if (this.gameCreationService.doesGameExist(roomId)) {
            const game = this.gameCreationService.getGameById(roomId);
            if (game && client.id === game.hostSocketId) {
                this.gameCreationService.initializeGame(roomId);
                this.server.to(roomId).emit(GameCreationEvents.GameInitialized, game);
            }
        } else {
            client.emit(GameCreationEvents.GameNotFound);
        }
    }

    @SubscribeMessage(GameCreationEvents.ToggleGameLockState)
    handleToggleGameLockState(client: Socket, data: ToggleGameLockStateData): void {
        const game = this.gameCreationService.getGameById(data.gameId);
        if (game && game.hostSocketId === client.id) {
            game.isLocked = data.isLocked;
            this.server.to(game.id).emit(GameCreationEvents.GameLockToggled, game.isLocked);
        }
    }

    @SubscribeMessage(GameCreationEvents.IfStartable)
    isStartable(client: Socket, gameId: string): void {
        const game = this.gameCreationService.getGameById(gameId);
        if (game && client.id === game.hostSocketId) {
            if (this.gameCreationService.isGameStartable(gameId)) {
                client.emit(GameCreationEvents.IsStartable);
            } else {
                return;
            }
        }
    }
}
