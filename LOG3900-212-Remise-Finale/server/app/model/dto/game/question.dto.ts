import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType } from '@common/question';

export class ChoiceDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'Spécifiez le choix de réponse.' })
    text: string;

    @ApiProperty()
    @IsNotEmpty({ message: 'Spécifiez si la réponse est correcte.' })
    isCorrect: boolean;
}

export class QuestionDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'Spécifiez la question' })
    text: string;

    @ApiProperty({ enum: QuestionType })
    @IsEnum(QuestionType)
    type: QuestionType;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    author: string;

    @ApiProperty()
    @IsNumber()
    @Min(10)
    @Max(100)
    points: number;

    @ApiProperty()
    @IsOptional()
    @IsString()
    imageUrl?: string;

    @ApiProperty({ type: [ChoiceDto], required: false })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ChoiceDto)
    @IsOptional()
    choices?: ChoiceDto[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    correctAnswer?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    minRange?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    maxRange?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    tolerance?: number;
}

export class DetailedQuestionDto {
    @ApiProperty()
    @IsString()
    _id: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'Spécifiez la question' })
    text: string;

    @ApiProperty({ enum: QuestionType })
    @IsEnum(QuestionType)
    type: QuestionType;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    author: string;

    @ApiProperty()
    @IsNumber()
    @Min(10)
    @Max(100)
    points: number;

    @ApiProperty()
    @IsOptional()
    @IsString()
    imageUrl?: string;

    @ApiProperty({ type: [ChoiceDto], required: false })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ChoiceDto)
    @IsOptional()
    choices?: ChoiceDto[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    correctAnswer?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    minRange?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    maxRange?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    tolerance?: number;
}
