import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '@app/model/database/session.schema';
import { Avatar, ConnectionEvent, Language, Session, Theme, UserInfo, Status, GameHistoryEvent } from '@common/session';
import * as bcrypt from 'bcryptjs';
import { AccountDto } from '@app/model/dto/session/session.dto';
import { ObjectId } from 'mongodb';
import { Challenge, Game } from '@common/game';

@Injectable()
export class SessionService {
    @InjectModel(User.name, 'Users') public userModel: Model<UserDocument>;

    private sessions: Record<string, UserInfo> = {};

    async getAllActiveSessions(): Promise<UserInfo[]> {
        return Object.values(this.sessions);
    }

    async getAllUsers(): Promise<UserInfo[]> {
        return await this.userModel.find();
    }

    getSocketIdByUserId(userId: string): string | null {
        for (const socketId in this.sessions) {
            if (this.sessions[socketId]._id === userId) {
                return socketId;
            }
        }
        return null;
    }

    async getBayesianScoreForUser(userId: string): Promise<number> {
        const users = await this.getAllUsers();
        const m = 10;
        const playersWithGames = users.filter((u) => u.gameHistory.length > 0);

        const globalAverage =
            playersWithGames.reduce((sum, player) => {
                const wins = player.gameHistory.filter((g) => g.winners.includes(player._id)).length;
                return sum + wins / player.gameHistory.length;
            }, 0) / (playersWithGames.length || 1);

        const user = users.find((u) => u._id.toString() === userId);

        if (!user || user.gameHistory.length === 0) return 0;

        const v = user.gameHistory.length;
        const wins = user.gameHistory.filter((g) => g.winners.includes(user._id)).length;
        const R = wins / v;
        const bayesianScore = (v / (v + m)) * R + (m / (v + m)) * globalAverage;
        return bayesianScore;
    }

    async getUserBySocketId(socketId: string): Promise<UserInfo> {
        const session = this.sessions[socketId];
        if (session) {
            return await this.userModel.findById(session._id);
        }
    }

    async getUserById(userId: string): Promise<UserInfo> {
        return await this.userModel.findById(userId);
    }

    async addMoney(userId: string, money: number): Promise<void> {
        const user = await this.userModel.findById(userId);
        user.money += money;
        await user.save();
    }

    async addChallenge(userId: string, challenge: Challenge): Promise<void> {
        const user = await this.userModel.findById(userId);
        user.challenges.push(challenge);
        await user.save();
    }

    async receivedBonus(userId: string): Promise<void> {
        const user = await this.userModel.findById(userId);
        user.lastBonusReceived = new Date();
        await user.save();
    }

    async takeMoney(userId: string, money: number): Promise<void> {
        const user = await this.userModel.findById(userId);
        if (user.money >= money) user.money -= money;
        await user.save();
    }

    async updateLeaderBoardScore(userId: string): Promise<void> {
        const user = await this.userModel.findById(userId);
        if (user) {
            const score = await this.getBayesianScoreForUser(userId);
            user.score = score;
            await user.save();
        }
    }

    async createGameHistory(playerId: string, game: Game, start: Date) {
        const user = await this.userModel.findById(playerId);
        if (user) {
            let admin = game.players.find((player) => player.socketId === game.hostSocketId);
            const gameData: GameHistoryEvent = {
                gameId: game.id,
                quizName: game.quiz.title,
                admin: admin.userId,
                players: game.players.map((player) => player.userId),
                start: start,
                winners: [],
                end: new Date(),
                goodAnswers: 0,
                hasAbandoned: false,
                nQuestions: game.quiz.questions.length,
            };
            user.gameHistory.push(gameData);
            await user.save();
        }
    }

    async completeGameHistory(playerId: string, gameId: string, end: Date, winners: string[], nQuestionsRight: number, nQuestions: number) {
        const user = await this.userModel.findById(playerId);
        if (user) {
            const gameData = user.gameHistory.find((gameHistory) => gameHistory.gameId === gameId);
            if (gameData) {
                gameData.end = end;
                gameData.goodAnswers = nQuestionsRight;
                gameData.winners = winners;
                gameData.nQuestions = nQuestions;
                await user.save();
            }
        }
    }

    async completeGameHistoryAbandon(playerId: string, gameId: string, winners: string[], nQuestionsRight: number, nQuestions: number) {
        const user = await this.userModel.findById(playerId);
        if (user) {
            const gameData = user.gameHistory.find((gameHistory) => gameHistory.gameId === gameId);
            if (gameData) {
                gameData.goodAnswers = nQuestionsRight;
                gameData.winners = winners;
                gameData.nQuestions = nQuestions;
                await user.save();
            }
        }
    }

    async setAbandon(playerId: string, gameId: string) {
        const user = await this.userModel.findById(playerId);
        if (user) {
            const gameData = user.gameHistory.find((gameHistory) => gameHistory.gameId === gameId);
            if (gameData) {
                gameData.hasAbandoned = true;
                gameData.end = new Date();
                await user.save();
            }
        }
    }

    async register(account: AccountDto): Promise<void> {
        await this.validateAccount(account);
        try {
            account.password = bcrypt.hashSync(account.password);
            const user: User = {
                ...account,
                history: [],
                status: Status.Connected,
                isConnected: false,
                theme: Theme.lightTheme,
                language: Language.french,
                money: 0,
                score: 0,
                friends: [],
                friendRequestsReceived: [],
                friendRequestsSent: [],
                gameHistory: [],
                themesAquired: [Theme.darkTheme, Theme.lightTheme],
                avatarsAquired: [
                    Avatar.Avatar1,
                    Avatar.Avatar2,
                    Avatar.Avatar3,
                    Avatar.Avatar4,
                    Avatar.Avatar5,
                    Avatar.Avatar6,
                    Avatar.Avatar7,
                    Avatar.Avatar8,
                ],
                lastBonusReceived: new Date(),
                challenges: [],
            };
            const userFinal = await this.userModel.create(user);
        } catch (error) {
            throw new Error('La création du compte a échoué.');
        }
    }

    async login(id: string, session: Session): Promise<UserInfo> {
        const user = await this.userModel.findOne({ username: session.username });
        if (!user) {
            throw new UnauthorizedException("Aucun utilisateur avec ce pseudonyme n'a été trouvé.");
        }
        const isMatch = await bcrypt.compare(session.password, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Mot de passe incorrect');
        }
        if (user.isConnected) {
            throw new ConflictException('Un utilisateur est déjà connecté sur ce compte. Veuillez essayer plus tard.');
        }

        user.status = Status.Connected;
        user.isConnected = true;
        user.history.push({ event: ConnectionEvent.CONNECTION, timestamp: new Date() });
        await user.save();

        const userInfo: UserInfo = {
            _id: user._id.toString(),
            email: user.email,
            username: user.username,
            avatar: user.avatar,
            status: Status.Connected,
            history: user.history,
            theme: user.theme,
            language: user.language,
            money: user.money,
            score: user.score,
            friends: user.friends,
            friendRequestsReceived: user.friendRequestsReceived,
            friendRequestsSent: user.friendRequestsSent,
            gameHistory: user.gameHistory,
            themesAquired: user.themesAquired,
            avatarsAquired: user.avatarsAquired,
            lastBonusReceived: user.lastBonusReceived,
            challenges: [],
        };
        this.sessions[id] = userInfo;
        return userInfo;
    }

    async logout(socketId: string): Promise<string> {
        if (this.sessions[socketId]) {
            const user = await this.userModel.findById(this.sessions[socketId]._id);
            if (user) {
                user.isConnected = false;
                user.status = Status.Disconnected;
                user.history.push({ event: ConnectionEvent.DISCONNECTION, timestamp: new Date() });
                await user.save();
            }
            delete this.sessions[socketId];
            return user.username;
        }
    }

    async validateAccount(account: AccountDto): Promise<void> {
        if (await this.isEmailTaken(account.email)) {
            throw new ConflictException('Cet email est déjà utilisé');
        } else if (await this.isUsernameTaken(account.username)) {
            throw new ConflictException('Ce pseudonyme est déjà pris');
        }
    }

    async getSessionByMail(sessionEmail: string): Promise<Session> {
        const user = await this.userModel.findOne({ email: sessionEmail }, { _id: 0, isVisible: 0, lastModified: 0 });
        if (!user) {
            throw new Error(`No account associated with email : ${sessionEmail}`);
        }
        return user;
    }

    async getIdByMail(sessionEmail: string): Promise<string> {
        const user = await this.userModel.findOne({ email: sessionEmail }, { _id: 1 }).lean();
        if (!user) {
            return '';
        }
        return user._id.toString();
    }

    async modifyPassword(id: string, newPassword: string): Promise<void> {
        const objectId = new ObjectId(id);
        const user = await this.userModel.findById(objectId);
        if (!user) {
            throw new Error(`Aucun utilisateur n'a été trouvé avec le id: ${id}`);
        }
        newPassword = bcrypt.hashSync(newPassword);
        user.set({ ...user, password: newPassword });
        await user.save();
    }

    async isEmailTaken(email: string): Promise<boolean> {
        return !!(await this.userModel.exists({ email: email }));
    }

    async isUsernameTaken(username: string): Promise<boolean> {
        return !!(await this.userModel.exists({ username: username }));
    }

    async updateStatus(userId: string, status: Status): Promise<void> {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new Error(`Aucun utilisateur trouvé avec id : ${userId}`);
        }
        user.status = status;
        await user.save();
    }

    async updateUsername(userId: string, newUsername: string): Promise<void> {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new Error(`Aucun utilisateur trouvé avec l'id : ${userId}`);
        }
        user.username = newUsername;
        await user.save();
    }

    async updateAvatar(userId: string, newAvatar: Avatar): Promise<void> {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new Error(`Aucun utilisateur trouvé avec l'id : ${userId}`);
        }
        user.avatar = newAvatar;
        await user.save();
    }

    async updateLanguage(userId: string, newLanguage: Language): Promise<void> {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new Error(`Aucun utilisateur trouvé avec l'id : ${userId}`);
        }
        user.language = newLanguage;
        await user.save();
    }

    async updateTheme(userId: string, newTheme: Theme): Promise<void> {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new Error(`Aucun utilisateur trouvé avec l'id : ${userId}`);
        }
        user.theme = newTheme;
        await user.save();
    }

    async addAvatar(userId: string, newAvatar: Avatar): Promise<boolean> {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new Error(`Aucun utilisateur trouvé avec l'id : ${userId}`);
        }
        if (!user.avatarsAquired.includes(newAvatar)) {
            user.avatarsAquired.push(newAvatar);
            await user.save();
            return true;
        }
        return false;
    }

    async addTheme(userId: string, newTheme: Theme): Promise<boolean> {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new Error(`Aucun utilisateur trouvé avec l'id : ${userId}`);
        }
        if (!user.themesAquired.includes(newTheme)) {
            user.themesAquired.push(newTheme);
            await user.save();
            return true;
        }
        return false;
    }
}
