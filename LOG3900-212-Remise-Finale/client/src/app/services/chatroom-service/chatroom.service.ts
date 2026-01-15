import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';
import { SocketService } from '../socket-service/socket-service';
import { Message } from '@common/message';
import { ChatEvents } from '@common/events/temp-chat-events';
import { SCROLL_TO_BOTTOM_DELAY } from '@common/constants';

@Injectable({
    providedIn: 'root',
})
export class ChatroomService {
    globalChat: Message[] = [];
    channelChat: Message[] = [];

    messageSubscription: Subscription;

    constructor(private readonly socketService: SocketService) {
        this.messageSubscription = this.socketService.listen<Message[]>(ChatEvents.PreviousMessages).subscribe((messages: Message[]) => {
            messages.forEach((message: Message) => {
                if (message.channelId === 'global') {
                    this.globalChat = messages;
                    this.scrollToBottom();
                } else {
                    this.channelChat = messages;
                    this.scrollToBottom();
                }
            });
        });

        this.messageSubscription = this.socketService.listen<Message>(ChatEvents.NewMessage).subscribe((message) => {
            if (message.channelId === 'global') {
                this.globalChat.push(message);
                this.scrollToBottom();
            } else {
                this.channelChat.push(message);
                this.scrollToBottom();
            }
        });
    }

    scrollToBottom(): void {
        setTimeout(() => {
            const messageArea = document.getElementById('chat-messages');
            if (messageArea) {
                messageArea.scrollTop = messageArea.scrollHeight;
            }
        }, SCROLL_TO_BOTTOM_DELAY);
    }
}
