import { Message } from '@common/temp-message';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatService {
    private readonly globalMessages: Message[] = [];
    addGlobalMessage(message: Message): void {
        this.globalMessages.push(message);
    }
    getGlobalMessages(): Message[] {
        return this.globalMessages;
    }
}
