import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Quiz, QuizDocument } from '@app/model/database/quiz';

import { QuizDto } from '@app/model/dto/game/quiz.dto';
import { DetailedQuiz } from '@common/game';

@Injectable()
export class QuizService {
    @InjectModel(Quiz.name, 'Games') public quizModel: Model<QuizDocument>;

    async getQuizById(quizId: string): Promise<Quiz> {
        const quiz = await this.quizModel.findById(quizId, { __v: 0 });
        if (!quiz) {
            throw new NotFoundException(quizId);
        }
        return quiz;
    }

    async getAllQuiz(username: string): Promise<Quiz[]> {
        return await this.quizModel.find({
            $or: [{ isVisible: true }, { author: username }],
        });
    }

    async addQuiz(quiz: QuizDto): Promise<void> {
        try {
            if (!(await this.isUnique(quiz.title))) {
                throw new ConflictException('Un quiz avec ce nom existe déjà');
            }
            await this.quizModel.create(quiz);
        } catch (error) {
            throw new Error('La création du jeu-questionnaire a échoué');
        }
    }

    private async isUnique(quizTitle: string): Promise<boolean> {
        return !(await this.quizModel.findOne({ name: quizTitle }));
    }

    async deleteQuiz(quizId: string): Promise<void> {
        try {
            const objectId = new Types.ObjectId(quizId);
            const response = await this.quizModel.deleteOne({
                _id: objectId,
            });
            if (response.deletedCount === 0) {
                throw new NotFoundException("Le jeu n'a pas été trouvé");
            }
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
            throw new BadRequestException('La suppression du jeu a échoué');
        }
    }

    async modifyQuiz(quizId: string, quizDto: QuizDto): Promise<DetailedQuiz> {
        try {
            const existingQuiz = await this.quizModel.findById(quizId);

            if (existingQuiz) {
                existingQuiz.set({ ...quizDto });
                existingQuiz.lastModified = new Date();
                return await existingQuiz.save();
            } else {
                const newQuiz = new this.quizModel({
                    ...quizDto,
                    _id: new Types.ObjectId(),
                    lastModified: new Date(),
                });
                return await newQuiz.save();
            }
        } catch (error) {
            throw new Error("Le jeu n'a pas pu être modifié");
        }
    }

    async toggleVisibility(quizId: string, username: string) {
        const quiz = await this.getQuizById(quizId);
        if (quiz.author === username) {
            return await this.quizModel.findByIdAndUpdate(quiz._id, { isVisible: !quiz.isVisible }, { new: true });
        }
    }
}
