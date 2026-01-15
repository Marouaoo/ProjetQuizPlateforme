import { User } from '@app/model/database/session.schema';
import { AccountDto } from '@app/model/dto/session/session.dto';
import { SessionService } from '@app/services/session/session.service';
import { Avatar, Language, Theme } from '@common/session';
import { Body, Controller, Get, HttpStatus, Inject, Param, Patch, Post, Res } from '@nestjs/common';
import { ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('Session')
@Controller('session')
export class SessionController {
    @Inject(SessionService) private readonly sessionService: SessionService;

    @ApiOkResponse({
        description: 'Returns all active sessions',
        type: User,
        isArray: true,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Get('/')
    async allUsers(@Res() response: Response) {
        try {
            const users = await this.sessionService.getAllUsers();
            response.status(HttpStatus.OK).json(users);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'Get map by ID',
        type: Map,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Get('/:email')
    async getMapById(@Param('email') email: string, @Res() response: Response) {
        try {
            const id = await this.sessionService.getIdByMail(email);
            response.status(HttpStatus.OK).json(id);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @ApiCreatedResponse({
        description: 'Register user',
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Post('/register')
    async register(@Body() accountDto: AccountDto, @Res() response: Response) {
        try {
            response.status(HttpStatus.CREATED).send(await this.sessionService.register(accountDto));
        } catch (error) {
            return response.status(error.status || HttpStatus.BAD_REQUEST).json({
                status: error.status || HttpStatus.BAD_REQUEST,
                message: error.message || 'La création de compte a échouée',
            });
        }
    }

    @ApiCreatedResponse({
        description: "Update a user's username",
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND if user is not found',
    })
    @Patch('/update-username')
    async updateUsername(@Body() body: { userId: string; newUsername: string }, @Res() response: Response) {
        try {
            await this.sessionService.updateUsername(body.userId, body.newUsername);
            return response.status(HttpStatus.OK).json({
                message: "Votre nom d'utilisateur a bien été modifié",
            });
        } catch (error) {
            return response.status(error.status || HttpStatus.BAD_REQUEST).json({
                status: error.status || HttpStatus.BAD_REQUEST,
                message: error.message || "La modification du nom d'utilisateur a échoué",
            });
        }
    }

    @ApiCreatedResponse({
        description: "Update a user's avatar",
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND if user is not found',
    })
    @Patch('/update-avatar')
    async updateAvatar(@Body() body: { userId: string; newAvatar: Avatar }, @Res() response: Response) {
        try {
            await this.sessionService.updateAvatar(body.userId, body.newAvatar);
            return response.status(HttpStatus.OK).json({
                message: 'Votre avatar a bien été modifié',
            });
        } catch (error) {
            return response.status(error.status || HttpStatus.BAD_REQUEST).json({
                status: error.status || HttpStatus.BAD_REQUEST,
                message: error.message || "La modification de l'avatar a échoué",
            });
        }
    }

    @ApiCreatedResponse({
        description: 'Update a account language',
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND if user is not found',
    })
    @Patch('/update-language')
    async updateLanguage(@Body() body: { userId: string; newLanguage: Language }, @Res() response: Response) {
        try {
            await this.sessionService.updateLanguage(body.userId, body.newLanguage);
            return response.status(HttpStatus.OK).json({
                message: 'Votre langue a bien été modifié',
            });
        } catch (error) {
            return response.status(error.status || HttpStatus.BAD_REQUEST).json({
                status: error.status || HttpStatus.BAD_REQUEST,
                message: error.message || 'La modification de la langue a échoué',
            });
        }
    }

    @ApiCreatedResponse({
        description: 'Update a account theme',
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND if user is not found',
    })
    @Patch('/update-theme')
    async updateTheme(@Body() body: { userId: string; newTheme: Theme }, @Res() response: Response) {
        try {
            await this.sessionService.updateTheme(body.userId, body.newTheme);
            return response.status(HttpStatus.OK).json({
                message: 'Votre thème a bien été modifié',
            });
        } catch (error) {
            return response.status(error.status || HttpStatus.BAD_REQUEST).json({
                status: error.status || HttpStatus.BAD_REQUEST,
                message: error.message || 'La modification du thème a échoué',
            });
        }
    }
}
