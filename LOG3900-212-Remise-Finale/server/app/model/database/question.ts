import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';
import { DetailedQuestionBase } from '@common/question';

export type QuestionDocument = QuestionBase & Document;

@Schema({ _id: false }) 
export class ChoiceSchema {
    @ApiProperty()
    @Prop({ required: true })
    text: string;

    @ApiProperty()
    @Prop({ required: true })
    isCorrect: boolean;
}

@Schema({ discriminatorKey: 'type' })
export class QuestionBase implements DetailedQuestionBase {
    @ApiProperty()
    _id: Types.ObjectId;

    @ApiProperty()
    @Prop({ required: true })
    text: string;

    @ApiProperty({ required: true })
    @Prop({ required: true })
    author: string;

    @ApiProperty({ required: true, enum: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] })
    @Prop({ required: true })
    points: 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;

    @ApiProperty({ required: false })
    @Prop()
    imageUrl?: string;
}

@Schema()
export class QuestionQCM extends QuestionBase {
    @ApiProperty({ type: [ChoiceSchema] })
    @Prop({ type: [{ text: String, isCorrect: Boolean }], required: false, _id: false })
    choices: ChoiceSchema[];
}

@Schema()
export class QuestionQRE extends QuestionBase {
    @ApiProperty()
    @Prop({ required: false })
    correctAnswer: number;

    @ApiProperty()
    @Prop({ required: false })
    minRange: number;

    @ApiProperty()
    @Prop({ required: false })
    maxRange: number;

    @ApiProperty()
    @Prop({ required: false })
    tolerance: number;
}

@Schema()
export class QuestionQRL extends QuestionBase {}

export const QuestionBaseSchema = SchemaFactory.createForClass(QuestionBase);
QuestionBaseSchema.set('discriminatorKey', 'type');
QuestionBaseSchema.set('versionKey', false);

export const QuestionQCMSchema = SchemaFactory.createForClass(QuestionQCM);
export const QuestionQRESchema = SchemaFactory.createForClass(QuestionQRE);
export const QuestionQRLSchema = SchemaFactory.createForClass(QuestionQRL);
QuestionQCMSchema.set('versionKey', false);
QuestionQRESchema.set('versionKey', false);
QuestionQRLSchema.set('versionKey', false);
