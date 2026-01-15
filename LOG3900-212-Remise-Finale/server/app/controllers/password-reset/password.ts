import { Controller, Post, Body, Put, HttpStatus, Res, BadRequestException } from '@nestjs/common';
import { AuthService } from '@app/services/password-reset/password.service';
import { SessionService } from '@app/services/session/session.service';
import { ApiNotFoundResponse, ApiOkResponse } from '@nestjs/swagger';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly sessionService: SessionService,
    ) {
        this.authService = authService;
        this.sessionService = sessionService;
    }

    @Post('send-code')
    async sendCode(@Body('email') email: string) {
        return this.authService.sendVerificationCode(email);
    }

    @ApiOkResponse({
        description: 'Verify code',
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Post('verify-code')
    async verifyCode(@Body() body: { email: string; code: number }, @Res() response: Response) {
        try {
            const isValid = await this.authService.verifyCode(body.email, body.code);
            if (!isValid) {
                throw new BadRequestException('Le code est invalide');
            }
            response.status(HttpStatus.OK).json(isValid);
        } catch (error) {
            return response.status(error.status || HttpStatus.BAD_REQUEST).json({
                status: error.status || HttpStatus.BAD_REQUEST,
                message: error.message || 'La modification du jeu a échoué',
            });
        }
    }

    @Put('modify-pw')
    async modifyPassword(@Body() body: { id: string; newPassword: string }, @Res() response: Response) {
        try {
            await this.sessionService.modifyPassword(body.id, body.newPassword);
            response.status(HttpStatus.OK).json(true);
        } catch (error) {
            return response.status(error.status || HttpStatus.BAD_REQUEST).json({
                status: error.status || HttpStatus.BAD_REQUEST,
                message: error.message || 'La modification du mot de passe a échouée',
            });
        }
    }
}
