import { Injectable } from '@nestjs/common';
import { GameCreationService } from '../game-creation/game-creation.service';
import { Answer, Challenge, QuestionStatus } from '@common/game';
import { QuestionType } from '@common/question';
import { SessionService } from '../session/session.service';
import { Socket } from 'socket.io';

@Injectable()
export class GameManagerService {
    constructor(
        private readonly gameCreationService: GameCreationService,
        private readonly sessionService: SessionService,
    ) {
        this.gameCreationService = gameCreationService;
        this.sessionService = sessionService;
    }

    async assignChallengeBonus(gameId): Promise<void> {
        const game = this.gameCreationService.getGameById(gameId);
        if (game) {
            for (let player of game.players) {
                if (player.succeedChallenge) {
                    await this.sessionService.addMoney(player.userId, 20);
                }
            }
        }
    }

    async assignPrize(gameId: string): Promise<void> {
        const game = this.gameCreationService.getGameById(gameId);
        if (!game) return;

        const players = game.players.filter((p) => p.isActive && p.socketId !== game.hostSocketId);
        if (players.length === 0) return;

        const winnersIds = this.getWinners(game.id);
        const losers = players.filter((player) => player.isActive && !winnersIds.includes(player.userId));

        for (const winner of winnersIds) {
            await this.sessionService.addMoney(winner, 100);
        }
        for (const loser of losers) {
            await this.sessionService.addMoney(loser.userId, 20);
        }

        if (game.price && game.price > 0) {
            const totalPot = game.price * players.length;
            const potWinners = Math.round((2 / 3) * totalPot);
            const potLosers = Math.round((1 / 3) * totalPot);

            const bonusPerWinner = Math.floor(potWinners / winnersIds.length);
            const bonusPerLoser = losers.length > 0 ? Math.floor(potLosers / losers.length) : 0;

            for (const winner of winnersIds) {
                await this.sessionService.addMoney(winner, bonusPerWinner);
            }
            for (const loser of losers) {
                await this.sessionService.addMoney(loser.userId, bonusPerLoser);
            }
        }
    }

    async refundGameCost(gameId: string, playerSocketId: string) {
        const cost = this.gameCreationService.getGameById(gameId).price;
        const userId = (await this.sessionService.getUserBySocketId(playerSocketId))._id;
        await this.sessionService.addMoney(userId.toString(), cost);
    }

    async verifyChallenges(gameId: string): Promise<void> {
        const game = this.gameCreationService.getGameById(gameId);
        if (game) {
            for (let player of game.players) {
                if (player.socketId === game.hostSocketId) continue;
                if (player.challenge === Challenge.challenge1) {
                    player.succeedChallenge = this.verifyChallenge1(player.answers);
                    await this.sessionService.addChallenge(player.userId, Challenge.challenge1);
                }
                if (player.challenge === Challenge.challenge3) {
                    player.succeedChallenge = this.verifyChallenge3(player.answers, gameId);
                    await this.sessionService.addChallenge(player.userId, Challenge.challenge3);
                }
                if (player.challenge === Challenge.challenge4) {
                    player.succeedChallenge = this.verifyChallenge4(player.answers);
                    await this.sessionService.addChallenge(player.userId, Challenge.challenge4);
                }
            }
        }
    }

    verifyChallenge1(playerAnswers: Answer[]): boolean {
        let consecutiveCorrectCount = 0;
        for (let answer of playerAnswers) {
            if (answer.status === QuestionStatus.Correct) {
                consecutiveCorrectCount++;
                if (consecutiveCorrectCount === 3) {
                    return true;
                }
            } else {
                consecutiveCorrectCount = 0;
            }
        }

        return false;
    }

    verifyChallenge3(playerAnswers: Answer[], gameId: string): boolean {
        const game = this.gameCreationService.getGameById(gameId);
        for (let i = 0; i < playerAnswers.length; i++) {
            if (game.quiz.questions[i].type === QuestionType.QCM && playerAnswers[i].status !== QuestionStatus.Correct) {
                return false;
            }
        }
        return true;
    }

    verifyChallenge4(playerAnswers: Answer[]): boolean {
        const invalidStatuses = [QuestionStatus.Incorrect, QuestionStatus.PartiallyCorrect, QuestionStatus.PartiallyIncorrect];
        return !playerAnswers.some((answer) => invalidStatuses.includes(answer.status));
    }

    getWinners(gameId: string): string[] {
        const game = this.gameCreationService.getGameById(gameId);
        if (!game) return [];

        const activePlayers = game.players.filter((player) => player.isActive && player.socketId !== game.hostSocketId);

        if (activePlayers.length === 0) return [];

        const maxPoints = Math.max(...activePlayers.map((p) => p.totalPoints));

        return activePlayers.filter((player) => player.totalPoints === maxPoints).map((player) => player.userId);
    }

    isGameResumable(gameId: string): boolean {
        return (
            this.gameCreationService.getGameById(gameId) && !!this.gameCreationService.getGameById(gameId).players.find((player) => player.isActive)
        );
    }

    async handleQRE(client: Socket, data: { gameId: string; answer: number }): Promise<boolean> {
        const game = this.gameCreationService.getGameById(data.gameId);
        if (!game) return false;
        const player = game.players.find((p) => p.socketId === client.id);
        if (!player) return false;

        const question = game.quiz.questions[game.questionIndex];

        if (player.answers.some((answer) => answer.questionId === question._id.toString())) {
            return false;
        }

        if (question.type === QuestionType.QRE) {
            const expected = question.correctAnswer;
            const tolerance = question.tolerance;

            const given = data.answer;
            let diff: number = 0;
            if (!given) diff = tolerance + 1;
            else diff = Math.abs(given - expected);

            let status: QuestionStatus = QuestionStatus.Incorrect;
            let pointsAwarded = 0;

            const answer: Answer = {
                questionId: question._id.toString(),
                answers: [data.answer.toString()],
                points: pointsAwarded,
                status: status,
                bonus: 0,
            };

            if (diff === 0) {
                pointsAwarded = question.points * 1.2;
                status = QuestionStatus.Correct;
                answer.status = status;
                answer.points = question.points;
                answer.bonus = pointsAwarded - answer.points;
            } else if (diff <= tolerance) {
                pointsAwarded = question.points;
                status = QuestionStatus.PartiallyCorrect;
                answer.status = status;
                answer.points = question.points;
            }

            player.totalPoints += pointsAwarded;
            player.answers.push(answer);
            console.log('on a envoyé la reponse du joueur : ', player.name);

            if (player.challenge === Challenge.challenge5 && !game.firstPerfectAnswered && status === QuestionStatus.Correct) {
                player.succeedChallenge = true;
                game.firstPerfectAnswered = true;
                await this.sessionService.addChallenge(player.userId, Challenge.challenge5);
            }
            return true;
        }
    }

    handleQCM(client: Socket, data: { gameId: string; answers: string[] }): boolean {
        const game = this.gameCreationService.getGameById(data.gameId);
        if (!game) return false;

        const player = game.players.find((p) => p.socketId === client.id);
        if (!player) return false;

        const question = game.quiz.questions[game.questionIndex];

        if (player.answers.some((answer) => answer.questionId === question._id.toString())) {
            return false;
        }

        if (question.type === QuestionType.QCM) {
            const correctAnswers = [];
            for (let choice of question.choices) {
                if (choice.isCorrect) {
                    correctAnswers.push(choice.text);
                }
            }

            let selectedAnswers = data.answers;
            if (!selectedAnswers) selectedAnswers = [];

            const correctSelections = selectedAnswers.filter((ans) => correctAnswers.includes(ans));
            const incorrectSelections = selectedAnswers.filter((ans) => !correctAnswers.includes(ans));

            const totalCorrect = correctAnswers.length;
            const totalSelectedCorrect = correctSelections.length;

            let pointsAwarded = Math.max(
                (totalSelectedCorrect / totalCorrect) * question.points -
                    incorrectSelections.length * (1 / question.choices.length) * question.points,
                0,
            );

            let status: QuestionStatus;

            if (totalSelectedCorrect === totalCorrect && incorrectSelections.length === 0) {
                status = QuestionStatus.Correct;
            } else if (totalSelectedCorrect > 0 && incorrectSelections.length === 0) {
                status = QuestionStatus.PartiallyCorrect;
            } else if (totalSelectedCorrect > 0 && incorrectSelections.length > 0) {
                status = QuestionStatus.PartiallyIncorrect;
            } else {
                status = QuestionStatus.Incorrect;
            }

            const answer: Answer = {
                questionId: question._id.toString(),
                answers: data.answers,
                points: pointsAwarded,
                status: status,
                bonus: 0,
            };

            if (!game.firstPerfectAnswered) {
                game.firstPerfectAnswered = true;
                pointsAwarded *= 1.2;
                answer.bonus = pointsAwarded - answer.points;
            }

            player.totalPoints += pointsAwarded;
            player.answers.push(answer);
            return true;
        }
    }
}
