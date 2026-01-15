import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';
import { COURSE_NAME_MAX_LENGTH } from './password.dto.constants';

export class CreatePasswordDto {
    @ApiProperty({ maxLength: 10 })
    @IsString()
    @MaxLength(COURSE_NAME_MAX_LENGTH)
    password: string;
}
