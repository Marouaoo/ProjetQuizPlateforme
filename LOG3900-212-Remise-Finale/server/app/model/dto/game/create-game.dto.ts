import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDate, IsNumber, IsString } from 'class-validator';

export class CreateGameDto {
    @ApiProperty()
    @IsString()
    _id: string;

    @ApiProperty()
    @IsString()
    title: string;

    @ApiProperty()
    @IsString()
    description: string;

    @ApiProperty()
    @IsNumber()
    duration: number;

    @ApiProperty()
    @IsDate()
    lastModification: Date;

    @ApiProperty()
    @IsBoolean()
    isVisible: boolean;

    @ApiProperty()
    @IsBoolean()
    friendsOnly: boolean;

    @ApiProperty()
    @IsArray()
    questions: [
        {
            type: string;
            text: string;
            points: number;
            choices: [
                {
                    text: string;
                    isCorrect: boolean;
                },
            ];
        },
    ];

    @ApiProperty()
    @IsString()
    fileName?: string;
}
