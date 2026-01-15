import { Inject, Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SessionService } from '@app/services/session/session.service';
import { Avatar, ConnectionEvent, Session, Status, Theme } from '@common/session';

@WebSocketGateway({ namespace: '/game', cors: { origin: '*' } })
export class SessionGateway {
    @WebSocketServer() server: Server;

    @Inject(SessionService) private readonly sessionService: SessionService;

    @SubscribeMessage('login')
    async handleJoinChannel(client: Socket, session: Session): Promise<void> {
        try {
            const user = await this.sessionService.login(client.id, session);
            this.server.to(client.id).emit('connected', user);
            this.server.emit('statusUpdated', { username: session.username, status: Status.Connected });
        } catch (error) {
            this.server.to(client.id).emit('authenticationError', error);
        }
    }

    @SubscribeMessage('logout')
    async handleMessage(client: Socket) {
        try {
            const clientUsername = await this.sessionService.logout(client.id);
            this.server.to(client.id).emit('disconnected');
            this.server.emit('statusUpdated', { username: clientUsername, status: Status.Disconnected });
        } catch (error) {
            Logger.log(error);
        }
    }

    @SubscribeMessage('isEmailAvailable')
    async handleEmailValidation(client: Socket, email: string) {
        try {
            this.server.to(client.id).emit('emailAvailability', !(await this.sessionService.isEmailTaken(email)));
        } catch (error) {
            Logger.log(error);
        }
    }

    @SubscribeMessage('isUsernameAvailable')
    async handleUsernameValidation(client: Socket, username: string) {
        try {
            this.server.to(client.id).emit('usernameAvailability', !(await this.sessionService.isUsernameTaken(username)));
        } catch (error) {
            Logger.log(error);
        }
    }

    @SubscribeMessage('updateStatus')
    async handleUpdateStatus(client: Socket, data: { userId: string; status: Status }) {
        await this.sessionService.updateStatus(data.userId, data.status);
        this.server.emit('statusUpdated', data);
    }

    @SubscribeMessage('updateUsername')
    async handleUpdateUsername(client: Socket, data: { userId: string; newUsername: string }) {
        await this.sessionService.updateUsername(data.userId, data.newUsername);
        this.server.emit('statusUpdated', data);
    }

    @SubscribeMessage('askLoginBonus')
    async handleDailyLoginBonus(client: Socket): Promise<void> {
        const user = await this.sessionService.getUserBySocketId(client.id);

        if (!user) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const receivedStreakBonusAt = user.lastBonusReceived ? new Date(user.lastBonusReceived) : null;
        if (receivedStreakBonusAt) receivedStreakBonusAt.setHours(0, 0, 0, 0);

        const alreadyReceivedToday = receivedStreakBonusAt?.getTime() === today.getTime();

        if (alreadyReceivedToday) {
            return;
        }

        const connectionDays = user.history
            .filter((h) => h.event === ConnectionEvent.CONNECTION)
            .map((h) => {
                const date = new Date(h.timestamp);
                date.setHours(0, 0, 0, 0);
                return date.getTime();
            });

        const uniqueDays = Array.from(new Set(connectionDays)).sort((a, b) => b - a);

        if (uniqueDays.length === 0 || uniqueDays[0] !== today.getTime()) {
            return;
        }

        const todayConnections = user.history.filter((h) => {
            const date = new Date(h.timestamp);
            date.setHours(0, 0, 0, 0);
            return h.event === ConnectionEvent.CONNECTION && date.getTime() === today.getTime();
        });

        if (todayConnections.length > 1) return;

        let streak = 1;
        for (let i = 1; i < uniqueDays.length; i++) {
            const current = new Date(uniqueDays[i]);
            const previous = new Date(uniqueDays[i - 1]);

            const diffDays = (previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays === 1) {
                streak++;
            } else {
                break;
            }
        }
        const bonus = this.calculateDailyBonus(streak);
        this.sessionService.addMoney(user._id, bonus);
        this.sessionService.receivedBonus(user._id);
        client.emit('dailyBonusReceived', { streak, bonus });
        client.emit('userUpdate', await this.sessionService.getUserById(user._id));
    }

    private calculateDailyBonus(streak: number): number {
        const base = 2;
        const bonus = base * Math.pow(1.5, streak - 1);
        return Math.round(bonus);
    }

    async handleDisconnect(client: Socket): Promise<void> {
        const clientUsername = await this.sessionService.logout(client.id);
        this.server.emit('statusUpdated', { username: clientUsername, status: Status.Disconnected });
    }

    @SubscribeMessage('buyAvatar')
    async handleBuyAvatar(client: Socket, avatar: Avatar): Promise<void> {
        const user = await this.sessionService.getUserBySocketId(client.id);
        if (!user) return;

        if (user.money < 150) return;

        if (await this.sessionService.addAvatar(user._id, avatar)) {
            await this.sessionService.takeMoney(user._id, 150);
            const updatedUser = await this.sessionService.getUserBySocketId(client.id);
            client.emit('userUpdate', updatedUser);
        } else {
            return;
        }
    }

    @SubscribeMessage('buyTheme')
    async handleBuyTheme(client: Socket, theme: Theme): Promise<void> {
        const user = await this.sessionService.getUserBySocketId(client.id);
        if (!user) return;

        if (user.money < 200) return;

        if (await this.sessionService.addTheme(user._id, theme)) {
            await this.sessionService.takeMoney(user._id, 200);
            const updatedUser = await this.sessionService.getUserBySocketId(client.id);
            client.emit('userUpdate', updatedUser);
        } else {
            return;
        }
    }
}
