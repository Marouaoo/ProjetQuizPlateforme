import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { FriendService } from '@app/services/friends/friends';

@WebSocketGateway({ namespace: '/game', cors: { origin: '*' } })
export class FriendGateway {
    @WebSocketServer()
    server: Server;

    constructor(private readonly friendService: FriendService) {
        this.friendService = friendService;
    }

    @SubscribeMessage('sendFriendRequest')
    async handleSendFriendRequest(@MessageBody() data: { senderId: string; receiverId: string }) {
        const receiverSocketId = await this.friendService.sendFriendRequest(data.senderId, data.receiverId);
        if (receiverSocketId) this.server.to(receiverSocketId).emit('friendRequestReceived', data.senderId);
    }

    @SubscribeMessage('cancelFriendRequest')
    async handleCancelFriendRequest(@MessageBody() data: { senderId: string; receiverId: string }) {
        const receiverSocketId = await this.friendService.cancelFriendRequest(data.senderId, data.receiverId);
        if (receiverSocketId) {
            this.server.to(receiverSocketId).emit('friendRequestCancelled', data.senderId);
        }
    }

    @SubscribeMessage('acceptFriendRequest')
    async handleAcceptFriendRequest(@MessageBody() data: { userId: string; requesterId: string }) {
        const requesterSocketId = await this.friendService.acceptFriendRequest(data.userId, data.requesterId);
        if (requesterSocketId) this.server.to(requesterSocketId).emit('friendRequestAccepted', data.userId);
    }

    @SubscribeMessage('rejectFriendRequest')
    async handleRejectFriendRequest(@MessageBody() data: { userId: string; requesterId: string }) {
        const requesterSocketId = await this.friendService.rejectFriendRequest(data.userId, data.requesterId);
        if (requesterSocketId) this.server.to(requesterSocketId).emit('friendRequestRejected', data.userId);
    }

    @SubscribeMessage('removeFriend')
    async handleRemoveFriend(@MessageBody() data: { userId: string; friendId: string }) {
        const friendSocketId = await this.friendService.removeFriend(data.userId, data.friendId);
        if (friendSocketId) this.server.to(friendSocketId).emit('lostFriend', data.userId);
    }

    @SubscribeMessage('searchUsers')
    async handleSearchUsers(client: Socket, data: { query: string; userId: string }) {
        const users = await this.friendService.searchUsers(data.query, data.userId);
        this.server.to(client.id).emit('searchResults', users);
    }
}
