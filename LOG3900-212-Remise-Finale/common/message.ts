import { Avatar } from './session';

export interface Message {
    avatar: Avatar;
    author: string;
    text: string;
    timestamp: Date;
    channelId: string;
    fileUrl?: string;
}
