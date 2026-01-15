import { Avatar } from '@common/session';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class MessageDto {
    @IsEnum(Avatar)
    avatar: Avatar;

    @IsNotEmpty()
    @IsString()
    author: string;

    @IsNotEmpty()
    @IsString()
    text: string;

    @IsNotEmpty()
    @IsString()
    channelId: string;

    @IsOptional()
    @IsString()
    fileUrl?: string;

    @IsNotEmpty()
    @IsDateString()
    timestamp: Date;
}
