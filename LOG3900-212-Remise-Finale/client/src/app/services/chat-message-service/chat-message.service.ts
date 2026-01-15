import { Injectable } from '@angular/core';
import { Message } from '@app/interfaces/message';

@Injectable({
    providedIn: 'root',
})
export class ChatMessageService {
    private messages: Message[] = [];

    getChatMessages() {
        return this.messages;
    }

    addChatMessage(message: Message) {
        this.messages.push(message);
    }

    eraseChatMessages() {
        this.messages.splice(0, this.messages.length);
    }
}
