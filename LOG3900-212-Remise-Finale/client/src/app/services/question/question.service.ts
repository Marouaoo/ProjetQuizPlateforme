import { Injectable } from '@angular/core';
import { DetailedQuestion, Question, QuestionQCM, QuestionQRE, QuestionQRL, QuestionType } from '@common/question';
import { CommunicationService } from '../httpcommunication.service.ts/communication.service';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { UserService } from '../account/user.service';
import { QuizService } from '../quiz/quiz.service';

@Injectable({
    providedIn: 'root',
})
export class QuestionService {
    isModify: boolean = false;
    isModifyInQuiz: boolean = false;
    questionToModifyId: string;
    questions: DetailedQuestion[];

    qcmQuestions: Question[];
    qreQuestions: Question[];
    qrlQuestions: Question[];

    question: Question = {
        text: '',
        type: QuestionType.QCM,
        author: this.userService.user.username,
        points: 10,
        choices: [],
    };

    private readonly unsubscribe$ = new Subject<void>();

    constructor(
        private readonly communicationService: CommunicationService,
        private readonly userService: UserService,
        private readonly quizService: QuizService,
    ) {
        this.communicationService = communicationService;
    }

    initializeQCMQuestion(): QuestionQCM {
        return {
            text: this.question.text,
            type: QuestionType.QCM,
            author: this.userService.user.username,
            points: this.question.points,
            choices: [],
        };
    }

    initializeQREQuestion(): QuestionQRE {
        return {
            text: this.question.text,
            type: QuestionType.QRE,
            author: this.userService.user.username,
            points: this.question.points,
            correctAnswer: 0,
            minRange: 0,
            maxRange: 10,
            tolerance: 1,
        };
    }

    initializeQRLQuestion(): QuestionQRL {
        return {
            text: this.question.text,
            type: QuestionType.QRL,
            author: this.userService.user.username,
            points: this.question.points,
        };
    }

    async createQuestion() {
        if (this.isModify && !this.isModifyInQuiz) {
            this.communicationService.basicPut<Question>(`questions/edition/${this.questionToModifyId}`, { ...this.question }).subscribe(() => {
                this.updateQuestions();
            });
        } else if (this.isModify && this.isModifyInQuiz) {
            const index = this.quizService.quiz.questions.findIndex((question) => question._id.toString() === this.questionToModifyId);
            if (index !== -1) {
                const updatedQuestion = {
                    ...this.question,
                    _id: this.quizService.quiz.questions[index]._id,
                };

                this.quizService.quiz.questions[index] = updatedQuestion;
            }
        } else {
            this.question.author = this.userService.user.username;
            const res = await firstValueFrom(this.communicationService.basicPost<Question>('questions/creation', this.question));
            const detailedQuestion = JSON.parse(res.body!);
            this.updateQuestions();
            this.quizService.quiz.questions.push(detailedQuestion);
        }
        this.resetForm();
    }

    sortQuestions() {
        this.qcmQuestions = this.questions.filter((q) => q.type === QuestionType.QCM);
        this.qreQuestions = this.questions.filter((q) => q.type === QuestionType.QRE);
        this.qrlQuestions = this.questions.filter((q) => q.type === QuestionType.QRL);
    }

    setQuestionType(type: QuestionType) {
        if (type === QuestionType.QCM) this.question = this.initializeQCMQuestion();
        if (type === QuestionType.QRE) this.question = this.initializeQREQuestion();
        if (type === QuestionType.QRL) this.question = this.initializeQRLQuestion();
    }

    addQuestion(quizId: string) {
        const question = this.getQuestionById(quizId);
        if (question) {
            this.quizService.quiz.questions.push(question);
        }
    }

    isQCM(question: Question): question is QuestionQCM {
        return question.type === QuestionType.QCM;
    }

    isQRE(question: Question): question is QuestionQRE {
        return question.type === QuestionType.QRE;
    }

    isQRL(question: Question): question is QuestionQRL {
        return question.type === QuestionType.QRL;
    }

    updateQuestions() {
        this.communicationService
            .basicGet<DetailedQuestion[]>(`questions/`)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((questions: DetailedQuestion[]) => {
                this.questions = questions;
                this.sortQuestions();
            });
    }

    deleteQuestion(questionId: string) {
        this.communicationService
            .basicDelete(`questions/${questionId}`)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe({
                next: () => {
                    this.updateQuestions();
                },
            });
    }

    createQCMQuestion(): boolean {
        return this.validateQCMQuestion();
    }

    createQREQuestion(): boolean {
        return this.validateQREQuestion();
    }

    createQRLQuestion(): boolean {
        return this.validateQRLQuestion();
    }

    resetForm() {
        this.question.text = '';
        this.question.points = 10;
        this.question.author = this.userService.user.username;
        this.question.imageUrl = '';
        if (this.isQCM(this.question)) {
            this.question.choices = [];
        } else if (this.isQRE(this.question)) {
            this.question.minRange = 0;
            this.question.maxRange = 0;
            this.question.tolerance = 0;
            this.question.correctAnswer = 0;
        }
        this.setQuestionType(QuestionType.QCM);
    }

    validateGoodSelected(): boolean {
        if (this.question.type === QuestionType.QCM) {
            const correctChoices = this.question.choices.filter((choice) => choice.isCorrect);
            const incorrectChoices = this.question.choices.filter((choice) => !choice.isCorrect);

            return correctChoices.length >= 1 && incorrectChoices.length >= 1;
        }
        return true;
    }
    validateNoChoiceDuplicates(): boolean {
        if (this.question.type === QuestionType.QCM) {
            const trimmedChoices = this.question.choices.map((choice) => choice.text.trim());

            const hasDuplicateChoices = new Set(trimmedChoices).size !== trimmedChoices.length;

            return !hasDuplicateChoices;
        }
        return true;
    }

    validateQCMQuestion(): boolean {
        if (this.question.type === QuestionType.QCM) {
            return (
                this.question.text.trim() !== '' &&
                this.question.choices.length >= 2 &&
                this.question.choices.length <= 4 &&
                this.validateGoodSelected() &&
                this.validateNoChoiceDuplicates()
            );
        }
        return false;
    }

    validateQREQuestion(): boolean {
        if (this.question.type === QuestionType.QRE) {
            return (
                this.question.text.trim() !== '' &&
                this.validateRange() &&
                this.question.tolerance > 0 &&
                this.question.correctAnswer >= this.question.minRange &&
                this.question.correctAnswer <= this.question.maxRange
            );
        }
        return false;
    }

    validateQRLQuestion(): boolean {
        return this.question.text.trim() !== '';
    }

    validateRange(): boolean {
        if (this.question.type === QuestionType.QRE) {
            if (!this.question.minRange || !this.question.maxRange) {
                return false;
            }
            return this.question.minRange < this.question.maxRange;
        }
        return false;
    }

    validateInterval(): boolean {
        if (this.question.type === QuestionType.QRE) {
            if (!this.question.minRange || !this.question.maxRange) {
                return false;
            }
            return this.question.minRange < this.question.correctAnswer && this.question.maxRange > this.question.correctAnswer;
        }
        return false;
    }

    getQuestionById(id: string) {
        return this.questions.find((question) => question._id === id);
    }
}
