import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDate, IsString } from 'class-validator';
import { Player } from 'interfaces/player';

export class PlayHistoryDto {
    @ApiProperty()
    @IsString()
    accessCode: string;

    @ApiProperty()
    @IsString()
    game: string;

    @ApiProperty()
    @IsDate()
    startTime: Date;

    @ApiProperty()
    @IsArray()
    playersList: Player[];
}
