import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type PasswordDocument = Password & Document;

@Schema()
export class Password {
    @ApiProperty()
    @Prop({ required: true })
    password: string;
}

export const passwordSchema = SchemaFactory.createForClass(Password);
