import { TestBed } from '@angular/core/testing';

import { ChatMessageService } from './chat-message.service';

describe('ChatMessageService', () => {
    let service: ChatMessageService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ChatMessageService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return messages when getChatMessages is called', () => {
        const messagesEmpty = service.getChatMessages();
        expect(messagesEmpty).toEqual([]);

        const message = { sender: 'user0', text: 'testMessage', time: new Date() };
        service['messages'] = [message];
        const messages = service.getChatMessages();
        expect(messages).toEqual(messages);
    });

    it('should add a message to messages when addChatMessage is called', () => {
        const message = { sender: 'user1', text: 'testMessage', time: new Date() };
        service.addChatMessage(message);
        expect(service['messages'][0]).toEqual(message);
    });

    it('should erase all the messages of messages when eraseChatMessages is called', () => {
        const message = { sender: 'user1', text: 'testMessage', time: new Date() };
        service.addChatMessage(message);
        service.eraseChatMessages();
        expect(service['messages']).toEqual([]);
    });
});
