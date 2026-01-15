import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import {
    ConnectionEvent,
    Avatar,
    HistoryEvent as ConnectionEventType,
    GameHistoryEvent as GameHistoryType,
    Status,
    User as UserInterface,
    Theme,
    Language,
} from '@common/session';
import { Challenge } from '@common/game';

export type UserDocument = User & Document;

@Schema({ _id: false })
class HistoryEvent implements ConnectionEventType {
    @ApiProperty()
    @Prop({ type: String, enum: ConnectionEvent, required: true })
    event: ConnectionEvent;

    @ApiProperty()
    @Prop({ type: Date, required: true })
    timestamp: Date;
}

export const connectionEventSchema = SchemaFactory.createForClass(HistoryEvent);

@Schema({ _id: false })
class GameHistoryEvent implements GameHistoryType {
    @ApiProperty()
    @Prop({ type: Number, required: true })
    nQuestions: number;

    @ApiProperty()
    @Prop({ type: Boolean, required: true })
    hasAbandoned: boolean;

    @ApiProperty()
    @Prop({ type: String, required: true })
    gameId: string;

    @ApiProperty()
    @Prop({ type: String, required: true })
    quizName: string;

    @ApiProperty()
    @Prop({ type: String, required: true })
    admin: string;

    @ApiProperty()
    @Prop({ type: [String], required: true })
    winners: string[];

    @ApiProperty()
    @Prop({ type: [String], required: true })
    players: string[];

    @ApiProperty()
    @Prop({ type: Number, required: true })
    goodAnswers: number;

    @ApiProperty()
    @Prop({ type: Date, required: true })
    start: Date;

    @ApiProperty()
    @Prop({ type: Date, required: true })
    end: Date;
}

export const gameHistorySchema = SchemaFactory.createForClass(GameHistoryEvent);

@Schema()
export class User implements UserInterface {
    @ApiProperty()
    @Prop({ required: true })
    username: string;

    @ApiProperty()
    @Prop({ required: true })
    email: string;

    @ApiProperty()
    @Prop({ required: true })
    password: string;

    @ApiProperty()
    @Prop({ default: false })
    isConnected: boolean;

    @ApiProperty()
    @Prop({ type: String, enum: Avatar, required: true })
    avatar: Avatar;

    @ApiProperty()
    @Prop({ type: String, enum: Status, required: false, default: Status.Disconnected })
    status: Status;

    @ApiProperty()
    @Prop({ type: [connectionEventSchema], default: [] })
    history: HistoryEvent[];

    @ApiProperty()
    @Prop({ type: String, enum: Theme, required: true, default: Theme.lightTheme })
    theme: Theme;

    @ApiProperty()
    @Prop({ type: String, enum: Language, required: true, default: Language.french })
    language: Language;

    @ApiProperty()
    @Prop({ required: true })
    money: number;

    @ApiProperty()
    @Prop({ required: true })
    score: number;

    @ApiProperty()
    @Prop({ type: [gameHistorySchema], default: [] })
    gameHistory: GameHistoryEvent[];

    @ApiProperty()
    @Prop({ type: [String], enum: Theme, required: true, default: [Theme.darkTheme, Theme.lightTheme] })
    themesAquired: Theme[];

    @ApiProperty()
    @Prop({
        type: [String],
        enum: Avatar,
        required: true,
        default: [Avatar.Avatar1, Avatar.Avatar2, Avatar.Avatar3, Avatar.Avatar4, Avatar.Avatar5, Avatar.Avatar6, Avatar.Avatar7, Avatar.Avatar8],
    })
    avatarsAquired: Avatar[];

    @ApiProperty()
    @Prop({ type: [String], default: [] })
    friends: string[];

    @ApiProperty()
    @Prop({ type: [String], default: [] })
    friendRequestsReceived: string[];

    @ApiProperty()
    @Prop({ type: [String], default: [] })
    friendRequestsSent: string[];

    @ApiProperty()
    @Prop({ type: Date })
    lastBonusReceived: Date;

    @ApiProperty()
    @Prop({ type: [String], enum: Challenge })
    challenges: Challenge[];
}

export const userSchema = SchemaFactory.createForClass(User);
userSchema.set('versionKey', false);
