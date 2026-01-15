import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Player } from 'interfaces/player';
import { Document } from 'mongoose';

export type PlayHistoryDocument = PlayHistory & Document;

@Schema()
export class PlayHistory {
    @ApiProperty()
    @Prop({ required: true })
    accessCode: string;

    @ApiProperty()
    @Prop({ required: true })
    game: string;

    @ApiProperty()
    @Prop({ required: true })
    startTime: Date;

    @ApiProperty()
    @Prop({ required: true })
    playersList: Player[];
}

export const playHistorySchema = SchemaFactory.createForClass(PlayHistory);
