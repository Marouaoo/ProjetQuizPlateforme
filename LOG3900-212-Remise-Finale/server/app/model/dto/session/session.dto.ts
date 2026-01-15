import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Avatar } from '@common/session';

export class AccountDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'Veuillez entrer un pseudonyme.' })
    username: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'Veuillez entrer un mot de passe' })
    password: string;

    @ApiProperty()
    @IsEmail({}, { message: 'Veuillez entrer une adresse courriel' })
    email: string;

    @ApiProperty()
    @IsEnum(Avatar)
    avatar: Avatar;
}

export class SessionDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'Veuillez entrer votre pseudonyme' })
    username: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'Veuillez entrer un mot de passe' })
    password: string;
}
