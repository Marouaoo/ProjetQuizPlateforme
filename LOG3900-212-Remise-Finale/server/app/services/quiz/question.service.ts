import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QuestionBase, QuestionDocument } from '@app/model/database/question';
import { QuestionDto } from '@app/model/dto/game/question.dto';

@Injectable()
export class QuestionService {
    @InjectModel('Question', 'Games') private readonly questionModel: Model<QuestionDocument>;

    async getAllQuestions(): Promise<QuestionBase[]> {
        return await this.questionModel.find({});
    }

    async getQuestionById(questionId: string): Promise<QuestionBase> {
        const objectId = new Types.ObjectId(questionId);
        const question = await this.questionModel.findOne({ _id: objectId }, { __v: 0 });
        if (!question) {
            throw new NotFoundException(`Question avec l'ID ${questionId} non trouvée.`);
        }
        return question;
    }

    async addQuestion(question: QuestionDto): Promise<QuestionBase> {
        try {
            return await this.questionModel.create(question);
        } catch (error) {
            console.log(error);
            throw new Error('La création de la question a échoué');
        }
    }

    async modifyQuestion(id: string, questionDto: QuestionDto): Promise<QuestionBase> {
        const existingQuestion = await this.questionModel.findById(id).exec();

        if (existingQuestion) {
            Object.assign(existingQuestion, {
                ...questionDto,
                choices: questionDto.choices,
            });

            await existingQuestion.save();
            return existingQuestion;
        } else {
            const newQuestion = new this.questionModel({ _id: id, ...questionDto });
            await newQuestion.save();
            return newQuestion;
        }
    }

    async deleteQuestion(questionId: string): Promise<void> {
        try {
            const objectId = new Types.ObjectId(questionId);
            const response = await this.questionModel.deleteOne({
                _id: objectId,
            });
            if (response.deletedCount === 0) {
                throw new NotFoundException("La question n'a pas été trouvé");
            }
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
            throw new BadRequestException('La suppression de la question a échoué');
        }
    }
}
