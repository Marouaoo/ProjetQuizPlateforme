import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Avatar } from '@common/session';

export class UserDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'Veuillez entrer un pseudonyme.' })
    username: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'Veuillez entrer un mot de passe.' })
    password: string;

    @ApiProperty()
    @IsEmail({}, { message: 'Veuillez entrer une adresse courriel.' })
    email: string;

    @ApiProperty()
    @IsBoolean()
    isConnected: boolean;

    @ApiProperty()
    @IsEnum(Avatar)
    avatar: Avatar;
}
