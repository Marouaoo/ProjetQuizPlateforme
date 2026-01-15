/* eslint-disable */
import { GameCreationService } from '@app/services/game-creation/game-creation.service';
import { GameManagerService } from '@app/services/game-manager/game-manager.service';
import { Injectable } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CountdownService } from '@app/services/countdown/countdown.service';
import { Answer, Challenge, Game, Player, QuestionStatus } from '@common/game';
import { Question, QuestionType } from '@common/question';
import { SessionService } from '@app/services/session/session.service';
import { stat } from 'fs';
import { VICTORY_POINTS } from '@common/constants';
import { GameCreationEvents } from '@common/game-creation.gateway.events';
import { Avatar, Status } from '@common/session';
import { Message } from '@common/message';
import { ChatChannelService } from '@app/services/chatroom/chatroom.service';

@WebSocketGateway({ namespace: '/game', cors: { origin: '*' } })
@Injectable()
export class GameManagerGateway {
    @WebSocketServer() private server: Server;

    constructor(
        private readonly gameManagerService: GameManagerService,
        private readonly gameCreationService: GameCreationService,
        private readonly countdownService: CountdownService,
        private readonly sessionService: SessionService,
        private readonly chatChannelService: ChatChannelService,
    ) {}

    async afterInit() {
        this.countdownService.setServer(this.server);

        this.countdownService.on('timeout', (gameId: string) => {
            const game = this.gameCreationService.getGameById(gameId);
            this.countdownService.resetTimerSubscription(game.id);
            this.sendCorrections({ ...game });
            this.server.to(game.id).emit('timerFinished');
        });

        this.countdownService.on('gameStarts', async (gameId: string) => {
            const game = this.gameCreationService.getGameById(gameId);
            this.server.to(gameId).emit('gameCanStart');
            this.countdownService.resetTimerSubscription(game.id);
            this.countdownService.changeCountdownDuration(
                gameId,
                game.quiz.questions[game.questionIndex].type === QuestionType.QRL ? 60 : game.quiz.duration,
            );
            let start = new Date();
            game.players.forEach(async (player) => {
                await this.sessionService.createGameHistory(player.userId, game, start);
            });
            this.startTurn(gameId, false);
            this.server.to(gameId).emit('newQuestion', game.quiz.questions[game.questionIndex]);
        });

        this.countdownService.on('sendQuestion', (gameId: string) => {
            const game = this.gameCreationService.getGameById(gameId);
            this.server.to(gameId).emit('newQuestion', game.quiz.questions[game.questionIndex]);
        });
    }

    @SubscribeMessage('startGame')
    startGame(client: Socket, gameId: string): void {
        this.countdownService.initCountdown(gameId, 5);
        this.countdownService.startNewCountdown(gameId, false);
    }

    @SubscribeMessage('nextQuestion')
    nextQuestion(client: Socket, gameId: string): void {
        const game = this.gameCreationService.getGameById(gameId);
        if (!game) return;
        const currentQuestion = game.quiz.questions[game.questionIndex];

        const activePlayers = game.players.filter((player) => player.isActive && player.socketId !== game.hostSocketId);

        const allAnswered = activePlayers.every((player) => player.answers.some((answer) => answer.questionId === currentQuestion._id.toString()));

        if (!allAnswered) {
            return;
        }
        game.firstPerfectAnswered = false;
        game.questionIndex++;
        this.prepareNextTurn(gameId);
    }

    prepareNextTurn(gameId: string): void {
        const game = this.gameCreationService.getGameById(gameId);
        this.countdownService.changeCountdownDuration(
            gameId,
            game.quiz.questions[game.questionIndex].type === QuestionType.QRL ? 60 : game.quiz.duration,
        );
        this.countdownService.resetTimerSubscription(gameId);
        this.startTurn(gameId, true);
    }

    startTurn(gameId: string, withDelay: boolean): void {
        const game = this.gameCreationService.getGameById(gameId);
        if (!this.gameManagerService.isGameResumable(gameId)) {
            this.gameCreationService.deleteRoom(gameId);
            this.countdownService.resetTimerSubscription(gameId);
            this.countdownService.deleteCountdown(gameId);
            this.server.emit('gamesUpdate', this.gameCreationService.getGames());
            return;
        }
        this.countdownService.startNewCountdown(game.id, withDelay);
    }

    @SubscribeMessage('answerQCMQuestion')
    handleQCMAnswer(client: Socket, data: { gameId: string; answers: string[] }): void {
        const game = this.gameCreationService.getGameById(data.gameId);
        if (!game) return;

        const player = game.players.find((p) => p.socketId === client.id);
        if (!player) return;

        const question = game.quiz.questions[game.questionIndex];
        if (question.type === QuestionType.QCM) {
            if (!this.gameManagerService.handleQCM(client, data)) return;

            const allActiveAnswered = game.players
                .filter((player) => player.isActive && player.socketId !== game.hostSocketId)
                .every((player) => player.answers.some((answer) => answer.questionId === question._id.toString()));

            if (allActiveAnswered) {
                this.countdownService.resetTimerSubscription(game.id);
                this.server.to(game.id).emit('timerFinished');
                this.sendCorrections(game);
            }
        }
    }

    @SubscribeMessage('answerQCMQuestionOnTimeout')
    handleQCMAnswerOnTimeout(client: Socket, data: { gameId: string; answers: string[] }): void {
        const game = this.gameCreationService.getGameById(data.gameId);
        if (!game) return;

        const player = game.players.find((p) => p.socketId === client.id);
        if (!player) return;

        const question = game.quiz.questions[game.questionIndex];

        if (question.type === QuestionType.QCM) {
            if (!this.gameManagerService.handleQCM(client, data)) return;
            const lastAnswer = player.answers.find((a) => a.questionId === question._id.toString());
            this.server.to(player.socketId).emit('answerResult', {
                status: lastAnswer.status,
                pointsAwarded: lastAnswer.points + lastAnswer.bonus,
            });
            this.server.to(game.hostSocketId).emit('playerAnswered', {
                playerId: player.userId,
                pointsAwarded: lastAnswer.points + lastAnswer.bonus,
                answer: lastAnswer.answers,
            });
        }
    }

    @SubscribeMessage('answerQREQuestion')
    async handleQREAnswer(client: Socket, data: { gameId: string; answer: number }): Promise<void> {
        const game = this.gameCreationService.getGameById(data.gameId);
        if (!game) return;
        const player = game.players.find((p) => p.socketId === client.id);
        if (!player) return;

        const question = game.quiz.questions[game.questionIndex];

        if (player.answers.some((answer) => answer.questionId === question._id.toString())) {
            return;
        }

        if (question.type === QuestionType.QRE) {
            if (!(await this.gameManagerService.handleQRE(client, data))) return;

            const allActiveAnswered = game.players
                .filter((player) => player.isActive && player.socketId !== game.hostSocketId)
                .every((player) => player.answers.some((answer) => answer.questionId === question._id.toString()));

            if (allActiveAnswered) {
                this.countdownService.resetTimerSubscription(game.id);
                this.server.to(game.id).emit('timerFinished');
                this.sendCorrections(game);
            }
        }
    }

    @SubscribeMessage('answerQREQuestionOnTimeout')
    async handleQREAnswerOnTimeout(client: Socket, data: { gameId: string; answer: number }): Promise<void> {
        const game = this.gameCreationService.getGameById(data.gameId);
        if (!game) return;
        const player = game.players.find((p) => p.socketId === client.id);
        if (!player) return;

        const question = game.quiz.questions[game.questionIndex];

        if (player.answers.some((answer) => answer.questionId === question._id.toString())) {
            return;
        }

        if (question.type === QuestionType.QRE) {
            if (!(await this.gameManagerService.handleQRE(client, data))) return;

            const lastAnswer = player.answers.find((a) => a.questionId === question._id.toString());

            this.server.to(player.socketId).emit('answerResult', {
                status: lastAnswer.status,
                pointsAwarded: lastAnswer.points + lastAnswer.bonus,
            });
            this.server.to(game.hostSocketId).emit('playerAnsweredQRE', {
                playerId: player.userId,
                pointsAwarded: lastAnswer.points + lastAnswer.bonus,
                answer: lastAnswer.answers,
                questionStatus: lastAnswer.status,
            });
        }
    }

    @SubscribeMessage('answerQRLQuestion')
    handleQRLAnswer(client: Socket, data: { gameId: string; answer: string }): void {
        const game = this.gameCreationService.getGameById(data.gameId);
        if (!game) return;

        const player = game.players.find((p) => p.socketId === client.id);
        if (!player) return;

        const hasAnswered = player.answers.some((answer) => answer.questionId === game.quiz.questions[game.questionIndex]._id.toString());

        const question = game.quiz.questions[game.questionIndex];

        if (!hasAnswered) {
            this.server.to(game.hostSocketId).emit('qrlAnswerReceived', {
                playerId: player.userId,
                answer: data.answer,
            });
        }
    }

    @SubscribeMessage('evaluateQRLAnswer')
    async evaluateQRLAnswer(client: Socket, data: { gameId: string; playerId: string; evaluation: 0 | 50 | 100; answer: string }): Promise<void> {
        const game = this.gameCreationService.getGameById(data.gameId);
        if (!game) return;

        const player = game.players.find((p) => p.userId === data.playerId);
        if (!player) return;

        const question = game.quiz.questions[game.questionIndex];

        if (player.answers.some((answer) => answer.questionId === question._id.toString())) {
            return;
        }

        if ((question.type = QuestionType.QRL)) {
            const percent = data.evaluation / 100;

            const pointsAwarded = question.points * percent;
            let status: QuestionStatus;

            if (data.evaluation === 0) {
                status = QuestionStatus.Incorrect;
            } else if (data.evaluation === 50) {
                status = QuestionStatus.PartiallyCorrect;
            } else {
                status = QuestionStatus.Correct;
            }

            const answer: Answer = {
                questionId: question._id.toString(),
                answers: [data.answer],
                points: pointsAwarded,
                status: status,
                bonus: 0,
            };

            player.totalPoints += pointsAwarded;
            player.answers.push(answer);

            if (player.challenge === Challenge.challenge2 && data.evaluation === 100) {
                player.succeedChallenge = true;
                await this.sessionService.addChallenge(player.userId, Challenge.challenge2);
            }

            const allActiveAnswered = game.players
                .filter((player) => player.isActive && player.socketId !== game.hostSocketId)
                .every((player) => player.answers.some((answer) => answer.questionId === question._id.toString()));

            if (allActiveAnswered) {
                this.countdownService.resetTimerSubscription(game.id);
                this.server.to(game.id).emit('timerFinished');
                this.sendCorrections(game);
            }
        }
    }

    @SubscribeMessage('activatePanicMode')
    handleActivatePanicMode(client: Socket, gameId: string): void {
        const game = this.gameCreationService.getGameById(gameId);
        if (!game || client.id !== game.hostSocketId) return;
        const question = game.quiz.questions[game.questionIndex];
        this.countdownService.activatePanicMode(gameId, question.type);
    }

    @SubscribeMessage('pauseCountdown')
    handlePauseCountdown(client: Socket, gameId: string): void {
        const game = this.gameCreationService.getGameById(gameId);
        if (!game || client.id !== game.hostSocketId) return;

        this.countdownService.pauseCountdown(gameId);
    }

    @SubscribeMessage('resumeCountdown')
    handleResumeCountdown(client: Socket, gameId: string): void {
        const game = this.gameCreationService.getGameById(gameId);
        if (!game || client.id !== game.hostSocketId) return;

        this.countdownService.resumeCountdown(gameId);
    }

    @SubscribeMessage('buyHint')
    async handleBuyHint(client: Socket, gameId: string) {
        const game = this.gameCreationService.getGameById(gameId);
        if (!game) return;

        const player = game.players.find((p) => p.socketId === client.id);
        if (!player) return;

        const question = game.quiz.questions[game.questionIndex];
        if (
            question.type !== QuestionType.QCM ||
            question.choices.length <= 2 ||
            (await this.sessionService.getUserBySocketId(player.socketId)).money < VICTORY_POINTS / 2
        ) {
            return;
        }

        const wrongChoices = question.choices.filter((c) => !c.isCorrect);
        if (wrongChoices.length === 0) return;

        const removedChoice = wrongChoices[Math.floor(Math.random() * wrongChoices.length)].text;

        await this.sessionService.takeMoney(player.userId, VICTORY_POINTS / 2);

        client.emit('userUpdate', await this.sessionService.getUserBySocketId(player.socketId));
        client.emit('hintUsed', removedChoice);
    }

    @SubscribeMessage('endGame')
    async endGame(client: Socket, gameId: string) {
        const game = this.gameCreationService.getGameById(gameId);
        const winners = this.gameManagerService.getWinners(gameId);
        const end = new Date();
        if (game) {
            for (let player of game.players.filter((player) => player.socketId !== game.hostSocketId)) {
                const nQuestionsRight = player.answers.reduce((sum, answer) => sum + (answer.points > 0 ? 1 : 0), 0);
                if (player.isActive) {
                    await this.sessionService.completeGameHistory(player.userId, game.id, end, winners, nQuestionsRight, game.quiz.questions.length);
                } else {
                    await this.sessionService.completeGameHistoryAbandon(
                        player.userId,
                        game.id,
                        winners,
                        nQuestionsRight,
                        game.quiz.questions.length,
                    );
                }
                await this.sessionService.updateLeaderBoardScore(player.userId);
            }
            await this.gameManagerService.verifyChallenges(gameId);
            await this.gameManagerService.assignChallengeBonus(gameId);
            await this.gameManagerService.assignPrize(gameId);
            game.isFinished = true;
            for (const player of game.players) {
                const updatedUser = await this.sessionService.getUserBySocketId(player.socketId);
                this.server.to(player.socketId).emit('userUpdate', updatedUser);
            }
            this.server.to(gameId).emit('gameFinished', game);
        }
    }

    async endGameNoWinner(gameId: string) {
        const game = this.gameCreationService.getGameById(gameId);
        const end = new Date();
        if (game) {
            for (let player of game.players) {
                const nQuestionsRight = player.answers.reduce((sum, answer) => sum + (answer.points > 0 ? 1 : 0), 0);
                if (player.isActive) {
                    await this.sessionService.completeGameHistory(player.userId, game.id, end, [], nQuestionsRight, game.quiz.questions.length);
                } else {
                    await this.sessionService.completeGameHistoryAbandon(player.userId, game.id, [], nQuestionsRight, game.quiz.questions.length);
                }
                await this.sessionService.updateLeaderBoardScore(player.userId);
            }
            game.isFinished = true;
            for (const player of game.players) {
                const updatedUser = await this.sessionService.getUserBySocketId(player.socketId);
                this.server.to(player.socketId).emit('userUpdate', updatedUser);
            }
            this.server.to(gameId).emit('gameFinished', game);
        }
    }

    private sendCorrections(game: Game): void {
        const currentQuestion = game.quiz.questions[game.questionIndex];

        for (let player of game.players) {
            if (player.socketId === game.hostSocketId) continue;
            const lastAnswer = player.answers.find((a) => a.questionId === currentQuestion._id.toString());
            if (!lastAnswer) continue;

            switch (currentQuestion.type) {
                case QuestionType.QCM:
                    this.server.to(player.socketId).emit('answerResult', {
                        status: lastAnswer.status,
                        pointsAwarded: lastAnswer.points + lastAnswer.bonus,
                    });
                    this.server.to(game.hostSocketId).emit('playerAnswered', {
                        playerId: player.userId,
                        pointsAwarded: lastAnswer.points + lastAnswer.bonus,
                        answer: lastAnswer.answers,
                    });
                    break;

                case QuestionType.QRE:
                    console.log('on envoie les résultats de reponse ici');
                    this.server.to(player.socketId).emit('answerResult', {
                        status: lastAnswer.status,
                        pointsAwarded: lastAnswer.points + lastAnswer.bonus,
                    });
                    this.server.to(game.hostSocketId).emit('playerAnsweredQRE', {
                        playerId: player.userId,
                        pointsAwarded: lastAnswer.points + lastAnswer.bonus,
                        answer: lastAnswer.answers,
                        questionStatus: lastAnswer.status,
                    });
                    break;

                case QuestionType.QRL:
                    this.server.to(player.socketId).emit('answerResult', {
                        status: lastAnswer.status,
                        pointsAwarded: lastAnswer.points + lastAnswer.bonus,
                    });
                    this.server.to(game.hostSocketId).emit('QRLevaluated', {
                        playerId: player.userId,
                        status: lastAnswer.status,
                        pointsAwarded: lastAnswer.points + lastAnswer.bonus,
                    });
                    break;
            }
        }
    }

    @SubscribeMessage(GameCreationEvents.LeaveGame)
    async handleLeaveGame(client: Socket, gameId: string): Promise<void> {
        const game = this.gameCreationService.getGameById(gameId);
        if (!game) return;

        const isHost = this.gameCreationService.isPlayerHost(client.id, gameId);

        const user = await this.sessionService.getUserBySocketId(client.id);
        await this.sessionService.updateStatus(user._id, Status.Connected);
        this.server.emit('statusUpdated', {
            username: user.username,
            status: (await this.sessionService.getUserById(user._id)).status,
        });

        const newMessage: Message = {
            author: 'ADMIN',
            avatar: Avatar.Avatar1,
            text: `${user.username} a quitté la partie`,
            timestamp: new Date(),
            channelId: game.id,
        };

        const updatedGame = await this.gameCreationService.handlePlayerLeaving(client, gameId);
        if (!updatedGame) return;

        if (!game.hasStarted) {
            if (isHost) {
                this.server.to(game.id).emit(GameCreationEvents.GameClosed);
                for (let player of game.players) {
                    await this.gameManagerService.refundGameCost(game.id, client.id);
                    this.server.to(client.id).emit('userUpdate', await this.sessionService.getUserBySocketId(client.id));
                    const user = await this.sessionService.getUserBySocketId(player.socketId);
                    await this.sessionService.updateStatus(user._id, Status.Connected);
                    this.server.emit('statusUpdated', {
                        username: user.username,
                        status: (await this.sessionService.getUserById(user._id)).status,
                    });
                }
                this.countdownService.deleteCountdown(game.id);
                this.gameCreationService.deleteRoom(game.id);
                // --------
                const socketsInRoom = await this.server.in(game.id).fetchSockets();

                for (const socket of socketsInRoom) {
                    console.log('tous les joueurs se font kick de la room!');
                    await socket.leave(game.id);
                }
                // --------
                this.server.emit('gamesUpdate', this.gameCreationService.getGames());
            } else {
                await this.gameManagerService.refundGameCost(game.id, client.id);
                client.leave(gameId);
                client.emit('userUpdate', await this.sessionService.getUserBySocketId(client.id));
                this.server.to(game.id).emit(GameCreationEvents.PlayerLeft, updatedGame.players);
            }
            return;
        }

        if (isHost && !game.isFinished) {
            for (let player of game.players) {
                const user = await this.sessionService.getUserBySocketId(player.socketId);
                if (user) {
                    await this.sessionService.updateStatus(user._id, Status.Connected);
                    this.server.emit('statusUpdated', {
                        username: user.username,
                        status: (await this.sessionService.getUserById(user._id)).status,
                    });
                }
            }
            if (game.players.filter((player) => player.isActive).length === 1) {
                await this.endGame(client, game.id);
            } else {
                this.server.to(game.id).emit(GameCreationEvents.GameClosed);
                await this.endGameNoWinner(game.id);
            }
            this.countdownService.deleteCountdown(game.id);
            this.gameCreationService.deleteRoom(game.id);
            this.server.emit('gamesUpdate', this.gameCreationService.getGames());
            return;
        }

        // la partie est commencée, un joueur quitte
        client.leave(gameId);

        await this.chatChannelService.addMessage(game.id, newMessage, client.id);

        this.server.to(game.id).emit(GameCreationEvents.PlayerLeft, updatedGame.players);

        const stillActivePlayers = updatedGame.players.filter((p) => p.isActive && p.socketId !== updatedGame.hostSocketId);

        if (stillActivePlayers.length === 1) {
            console.log('il reste un joueur et cest le gagnant');

            await this.endGame(client, game.id);

            this.countdownService.deleteCountdown(game.id);
            this.gameCreationService.deleteRoom(game.id);
            this.server.emit('gamesUpdate', this.gameCreationService.getGames());
        }

        if (stillActivePlayers.length === 0) {
            this.server.to(updatedGame.hostSocketId).emit('AllPlayersLeft');
        }

        const totalActive = updatedGame.players.filter((p) => p.isActive).length;
        if (totalActive === 0) {
            this.countdownService.deleteCountdown(gameId);
            this.gameCreationService.deleteRoom(gameId);
            this.chatChannelService.deleteRoom(gameId);
            this.server.emit('gamesUpdate', this.gameCreationService.getGames());
        }
    }

    async handleDisconnect(client: Socket): Promise<void> {
        const games = this.gameCreationService.getGames();
        for (const game of games) {
            const player = game.players.find((p) => p.socketId === client.id);
            if (player || game.hostSocketId === client.id) {
                await this.handleLeaveGame(client, game.id);
            }
        }
        await this.sessionService.logout(client.id);
    }
}
