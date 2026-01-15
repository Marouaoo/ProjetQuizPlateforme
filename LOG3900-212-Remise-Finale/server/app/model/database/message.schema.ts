import { Avatar } from '@common/session';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Message {
    @Prop({ required: true })
    channelId: string;

    @Prop({ required: true })
    author: string;

    @Prop({ required: true, enum: Avatar })
    avatar: Avatar;

    @Prop({ required: true })
    text: string; 

    @Prop()
    fileUrl?: string;

    @Prop({ default: Date.now })
    timestamp: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

export type ChannelMessageDocument = ChannelMessage & Document;

@Schema()
export class ChannelMessage {
    @Prop({ required: true, unique: true })
    channelId: string;

    @Prop({ type: [Object], default: [] })
    messages: Message[];
}

export const ChannelMessageSchema = SchemaFactory.createForClass(ChannelMessage);
