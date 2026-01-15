import { Controller, Get, Post, Put, Delete, Param, Body, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { QuestionService } from '@app/services/quiz/question.service';
import { QuestionDto } from '@app/model/dto/game/question.dto';
import { QuestionBase } from '@app/model/database/question';

@ApiTags('Questions')
@Controller('questions')
export class QuestionController {
    constructor(private readonly questionService: QuestionService) {
        this.questionService = questionService;
    }

    @ApiOkResponse({
        description: 'Returns all questions',
        type: QuestionBase,
        isArray: true,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Get('/')
    async allQuestions(@Res() response: Response) {
        try {
            const questions = await this.questionService.getAllQuestions();
            return response.status(HttpStatus.OK).json(questions);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'Returns a question by ID',
        type: QuestionBase,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Get('/:questionId')
    async getQuestionById(@Param('questionId') questionId: string, @Res() response: Response) {
        try {
            const question = await this.questionService.getQuestionById(questionId);
            return response.status(HttpStatus.OK).json(question);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @ApiCreatedResponse({
        description: 'Adds a new question',
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Post('/creation')
    async addQuestion(@Body() questionDto: QuestionDto, @Res() response: Response) {
        try {
            const question = await this.questionService.addQuestion(questionDto);
            response.status(HttpStatus.CREATED).json(question);
        } catch (error) {
            return response.status(HttpStatus.BAD_REQUEST).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'Modify a question',
        type: QuestionBase,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Put('/edition/:questionId')
    async modifyQuestion(@Param('questionId') id: string, @Body() questionDto: QuestionDto, @Res() response: Response) {
        try {
            const updatedQuestion = await this.questionService.modifyQuestion(id, questionDto);
            response.status(HttpStatus.OK).json(updatedQuestion);
        } catch (error) {
            return response.status(HttpStatus.BAD_REQUEST).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'Deletes a question',
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Delete('/:questionId')
    async deleteQuestion(@Param('questionId') questionId: string, @Res() response: Response) {
        try {
            await this.questionService.deleteQuestion(questionId);
            response.status(HttpStatus.OK).send();
        } catch (error) {
            return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }
}
