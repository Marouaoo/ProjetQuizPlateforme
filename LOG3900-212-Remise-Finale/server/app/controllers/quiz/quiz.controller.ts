import { Quiz } from '@app/model/database/quiz';
import { QuizDto } from '@app/model/dto/game/quiz.dto';
import { QuizService } from '@app/services/quiz/quiz.service';
import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Put, Res } from '@nestjs/common';
import { ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('Quiz')
@Controller('quiz')
export class QuizController {
    constructor(private readonly quizService: QuizService) {
        this.quizService = quizService;
    }

    @ApiOkResponse({
        description: 'Returns all quizzes',
        type: Quiz,
        isArray: true,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Get('/:username')
    async allGames(@Param('username') username: string, @Res() response: Response) {
        try {
            const authorizedQuiz = await this.quizService.getAllQuiz(username);
            response.status(HttpStatus.OK).json(authorizedQuiz);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'Get quiz by id',
        type: Quiz,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Get('/unique/:id')
    async id(@Param('id') id: string, @Res() response: Response) {
        try {
            const quiz = await this.quizService.getQuizById(id);
            response.status(HttpStatus.OK).json(quiz);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @ApiCreatedResponse({
        description: 'Add new quiz',
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Post('/creation')
    async addQuiz(@Body() quizDto: QuizDto, @Res() response: Response) {
        try {
            await this.quizService.addQuiz(quizDto);
            response.status(HttpStatus.CREATED).send();
        } catch (error) {
            return response.status(HttpStatus.BAD_REQUEST).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'Modify a quiz',
        type: Quiz,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Put('/edition/quiz/:quizId')
    async modifyQuiz(@Param('quizId') quizId: string, @Body() quizDto: QuizDto, @Res() response: Response) {
        try {
            const updatedQuiz = await this.quizService.modifyQuiz(quizId, quizDto);
            response.status(HttpStatus.OK).json(updatedQuiz);
        } catch (error) {
            return response.status(HttpStatus.BAD_REQUEST).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'Modify a quiz visibility',
        type: Quiz,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Patch('/edition/:quizId/:username')
    async modifyVisibility(@Param('quizId') quizId: string, @Param('username') username: string, @Res() response: Response) {
        try {
            const updatedQuiz = await this.quizService.toggleVisibility(quizId, username);
            response.status(HttpStatus.OK).json(updatedQuiz);
        } catch (error) {
            return response.status(HttpStatus.BAD_REQUEST).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'Delete a quiz',
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Delete('/:quizId')
    async deleteQuiz(@Param('quizId') quizId: string, @Res() response: Response) {
        try {
            await this.quizService.deleteQuiz(quizId);
            response.status(HttpStatus.OK).send();
        } catch (error) {
            return response.status(HttpStatus.BAD_REQUEST).send(error.message);
        }
    }
}
