import { ChatChannelService } from '@app/services/chatroom/chatroom.service';
import { Message } from '@common/message';
import { Inject } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatEvents } from '@common/events/chat.events';

@WebSocketGateway({ namespace: '/game', cors: { origin: '*' } })
export class ChatChannelGateway {
    @WebSocketServer() server: Server;

    @Inject(ChatChannelService) private readonly chatroomService: ChatChannelService;

    @SubscribeMessage(ChatEvents.JoinChatRoom)
    async handleJoinChannel(client: Socket, channelId: string) {
        client.join(channelId);
        if (channelId === 'global') {
            await this.chatroomService.ensureGlobalChannelExists();
        }
        const existingMessages = await this.chatroomService.getMessages(channelId);
        this.server.to(channelId).emit(ChatEvents.PreviousMessages, existingMessages);
    }

    @SubscribeMessage(ChatEvents.Message)
    async handleMessage(client: Socket, data: { channelId: string; message: Message }) {
        await this.chatroomService.addMessage(data.channelId, data.message, client.id);
    }

    afterInit() {
        this.chatroomService.setServer(this.server);
    }
}
