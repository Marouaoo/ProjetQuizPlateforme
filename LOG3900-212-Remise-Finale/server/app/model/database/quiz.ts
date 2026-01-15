import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';
import { DetailedQuestion } from '@common/question';
import { DetailedQuiz, QuizCategory } from '@common/game';

export type QuizDocument = Quiz & Document;

@Schema({ timestamps: true })
export class Quiz implements DetailedQuiz {
    @ApiProperty()
    @Prop({ type: Boolean, required: false, default: true })
    isVisible: boolean;

    @ApiProperty()
    @Prop({ type: Date, alias: 'updatedAt' })
    lastModified: Date;

    @ApiProperty()
    _id: Types.ObjectId;

    @ApiProperty()
    @Prop({ required: true })
    title: string;

    @ApiProperty()
    @Prop({ required: true })
    author: string;

    @ApiProperty()
    @Prop({ required: true })
    description: string;

    @ApiProperty()
    @Prop({ required: true })
    duration: number;

    @ApiProperty()
    @Prop({
        required: true,
    })
    questions: DetailedQuestion[];

    @ApiProperty()
    @Prop({ type: [String], enum: QuizCategory, required: false, default: [] })
    categories: QuizCategory[];
}

export const quizSchema = SchemaFactory.createForClass(Quiz);
quizSchema.set('versionKey', false);
