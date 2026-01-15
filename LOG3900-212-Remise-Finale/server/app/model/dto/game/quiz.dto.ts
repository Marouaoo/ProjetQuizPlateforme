import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsNumber, Min, ValidateNested, IsArray, ArrayNotEmpty, Max } from 'class-validator';
import { DetailedQuestionDto } from './question.dto';

export class QuizDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'Un titre est obligatoire pour le jeu-questionnaire' })
    title: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'Un auteur doit être associé au questionnaire' })
    author: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'Une description est obligatoire pour le jeu-questionnaire' })
    description: string;

    @ApiProperty()
    @IsNumber()
    @Min(10, { message: 'La durée minimale est de 10 secondes ' })
    @Max(100, { message: 'La durée maximale est de 100 secondes ' })
    duration: number;

    @ApiProperty({ type: [DetailedQuestionDto] })
    @IsArray()
    @ArrayNotEmpty({ message: 'Un jeu-questionnaire doit contenir au moins une question' })
    @ValidateNested({ each: true })
    @Type(() => DetailedQuestionDto)
    questions: DetailedQuestionDto[];

    @ApiProperty({ type: [String] })
    @IsArray()
    @IsString({ each: true })
    categories: string[];
}
