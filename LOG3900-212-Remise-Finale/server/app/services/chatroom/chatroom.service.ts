import { ChannelMessage, ChannelMessageDocument } from '@app/model/database/message.schema';
import { ChatEvents } from '@common/events/chat.events';
import { Message } from '@common/message';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as fs from 'fs';
import { Model } from 'mongoose';
import * as path from 'path';
import { Server } from 'socket.io';

@Injectable()
export class ChatChannelService {
    @InjectModel(ChannelMessage.name, 'Games') private readonly channelMessageModel: Model<ChannelMessageDocument>;

    server: Server;

    private channels: Record<string, Message[]> = {};
    private bannedWords: Set<string> = new Set();

    async onModuleInit() {
        await this.loadBannedWords();
    }

    setServer(server: Server) {
        this.server = server;
    }

    async ensureGlobalChannelExists(): Promise<void> {
        const existing = await this.channelMessageModel.findOne({ channelId: 'global' });
        if (!existing) {
            await this.channelMessageModel.create({
                channelId: 'global',
                messages: [],
            });
        }
    }

    async loadBannedWords(): Promise<void> {
        try {
            const filePath = path.join(process.cwd(), '/assets/forbidden-words.txt');
            const data = await fs.promises.readFile(filePath, 'utf-8');
            this.bannedWords = new Set(data.split(/\r?\n/g).map((word) => word.toLowerCase()));
        } catch (error) {
            Logger.error('Erreur lors du chargement des mots censurés :', error);
        }
    }

    async addMessage(channelId: string, message: Message, clientId: string): Promise<void> {
        const normalizedText = message.text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[.,!?;:]/g, '');

        for (const banned of this.bannedWords) {
            const pattern = new RegExp(`\\b${banned}\\b`, 'i');
            if (pattern.test(normalizedText)) {
                this.server.to(clientId).emit('forbiddenWord');
                return;
            }
        }

        if (!this.channels[channelId]) {
            this.channels[channelId] = [];
        }
        this.channels[channelId].push(message);

        this.server.to(channelId).emit(ChatEvents.NewMessage, message);

        if (channelId === 'global') await this.channelMessageModel.updateOne({ channelId }, { $push: { messages: message } }, { upsert: true });
    }

    deleteRoom(channelId: string) {
        delete this.channels[channelId];
    }

    async getMessages(channelId: string): Promise<Message[]> {
        if (channelId === 'global') return (await this.channelMessageModel.findOne({ channelId })).messages;
        return this.channels[channelId] || [];
    }
}
