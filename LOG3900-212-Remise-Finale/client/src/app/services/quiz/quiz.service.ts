import { Injectable, OnDestroy } from '@angular/core';
import { DetailedQuiz, Quiz } from '@common/game';
import { UserService } from '../account/user.service';
import { firstValueFrom, Subject } from 'rxjs';
import { CommunicationService } from '../httpcommunication.service.ts/communication.service';

@Injectable({
    providedIn: 'root',
})
export class QuizService implements OnDestroy {
    quizId: string = '';

    quiz: Quiz = {
        title: '',
        description: '',
        duration: 10,
        questions: [],
        author: '',
        categories: [],
    };

    private readonly unsubscribe$ = new Subject<void>();

    initializeVirginQuiz() {
        this.quiz.author = this.userService.user.username;
        this.quiz.title = '';
        this.quiz.description = '';
        this.quiz.duration = 10;
        this.quiz.questions = [];
    }

    initializeWithExisting(quiz: DetailedQuiz) {
        this.quiz.title = quiz.title;
        this.quiz.description = quiz.description;
        this.quiz.duration = quiz.duration;
        this.quiz.author = quiz.author;
        this.quiz.questions = quiz.questions;
        this.quiz.categories = quiz.categories;
    }

    removeQuestion(selectedQuestionId: string) {
        this.quiz.questions = this.quiz.questions.filter((question) => question._id !== selectedQuestionId);
    }

    async getQuiz(quizId: string) {
        const quiz = await firstValueFrom(this.communicationService.basicGet<DetailedQuiz>(`quiz/unique/${quizId}`));
        this.initializeWithExisting(quiz);
        this.quizId = quizId;
    }

    async modifyQuiz(): Promise<void> {
        this.quiz.description = this.quiz.description.trim();
        this.quiz.title = this.quiz.title.trim();
        await firstValueFrom(this.communicationService.basicPut<Quiz>(`quiz/edition/quiz/${this.quizId}`, this.quiz));
    }

    async createQuiz(): Promise<void> {
        this.quiz.description = this.quiz.description.trim();
        this.quiz.title = this.quiz.title.trim();
        await firstValueFrom(this.communicationService.basicPost<Quiz>('quiz/creation', this.quiz));
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    constructor(
        private readonly userService: UserService,
        private readonly communicationService: CommunicationService,
    ) {
        this.userService = userService;
        this.communicationService = communicationService;
    }
}
