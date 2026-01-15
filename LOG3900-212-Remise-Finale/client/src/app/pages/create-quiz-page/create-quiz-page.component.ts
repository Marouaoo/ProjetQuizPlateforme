import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ValidationService } from '@app/services/qcm-validation-service/qcm-validation.service';
import { QuizService } from '@app/services/quiz/quiz.service';
import { HttpErrorResponse } from '@angular/common/http';
import { TopbarComponent } from '@app/components/topbar/topbar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateQuestionComponent } from '@app/components/create-question/create-question.component';
import { QuestionService } from '@app/services/question/question.service';
import { Question, QuestionType } from '@common/question';
import { CdkDragDrop, CdkDropList, CdkDrag, moveItemInArray } from '@angular/cdk/drag-drop';
import { QuizCategory } from '@common/game';
import {TranslateModule, TranslateService} from "@ngx-translate/core";  
import { UserService } from '@app/services/account/user.service';
import { MINUTE_SECOND, TIME_INCREMENT, ZERO } from '@common/constants';

@Component({
    standalone: true,
    imports: [TopbarComponent, CommonModule, FormsModule, CreateQuestionComponent, CdkDrag, CdkDropList, TranslateModule],
    selector: 'app-create-quiz',
    templateUrl: './create-quiz-page.component.html',
    styleUrls: ['./create-quiz-page.component.scss'],
})
export class CreateQuizComponent implements OnInit {
    selectedQuestionId: string | null = null;

    showDeleteModal = false;
    showRemoveModal = false;

    qcmQuestions: Question[] = [];
    qreQuestions: Question[] = [];
    qrlQuestions: Question[] = [];

    QRE = QuestionType.QRE;
    QCM = QuestionType.QCM;
    isGameValid: boolean = false;

    errorMessage: string = '';

    isModifying: boolean = false;

    selectedList: string = 'quizQuestions';

    quizId: string = '';

    category = QuizCategory;
    categories = [QuizCategory.HISTOIRE, QuizCategory.MATHS, QuizCategory.MUSIQUE, QuizCategory.SCIENCE, QuizCategory.SPORT];
    selectedCategories: boolean[] = [false, false, false, false, false];

    isExistingGame: boolean = false;

    constructor(
        public readonly quizService: QuizService,
        public readonly questionService: QuestionService,
        private readonly validationService: ValidationService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly translate: TranslateService,
        private readonly userService: UserService
    ) {
        this.quizService = quizService;
        this.questionService = questionService;
        this.validationService = validationService;
        this.route = route;
        this.router = router;
        this.translate.setDefaultLang('fr');
        this.translate.use(this.userService.user.language);
    }

    async ngOnInit() {
        await this.questionService.updateQuestions();

        this.route.params.subscribe(async (params) => {
            this.quizId = params['quizId'];
            if (this.quizId) {
                await this.quizService.getQuiz(this.quizId);
                for (let i = ZERO; i < this.categories.length; i++) {
                    if (this.quizService.quiz.categories.includes(this.categories[i])) {
                        this.selectedCategories[i] = true;
                    }
                }
                this.isExistingGame = true;
            } else {
                this.quizService.initializeVirginQuiz();
            }
        });

        if (this.router.url.includes('quizId')) {
            this.isModifying = true;
        }
    }

    addCategories(): void {
        this.quizService.quiz.categories = [];
        for (let i = ZERO; i < this.selectedCategories.length; i++) {
            if (this.selectedCategories[i]) {
                this.quizService.quiz.categories.push(this.categories[i]);
            }
        }
    }

    incrementTime(): void {
        if (this.quizService.quiz.duration < MINUTE_SECOND) {
            this.quizService.quiz.duration += TIME_INCREMENT;
        }
    }

    decrementTime(): void {
        if (this.quizService.quiz.duration > TIME_INCREMENT) {
            this.quizService.quiz.duration -= TIME_INCREMENT;
        }
    }

    toggleList(listType: string): void {
        this.selectedList = listType;
    }

    drop(event: CdkDragDrop<string[]>) {
        moveItemInArray(this.quizService.quiz.questions, event.previousIndex, event.currentIndex);
    }

    submitQuiz() {
        this.isGameValid = this.validateQuiz();
        this.addCategories();

        if (!this.isGameValid) {
            this.errorMessage = 'Assurez-vous de remplir tous les champs. ' + this.validationService.gameErrorMessage;
            return;
        }
        this.handleSaveQuiz();
    }

    async handleSaveQuiz(): Promise<string> {
        try {
            if (this.isExistingGame) {
                await this.quizService.modifyQuiz();
            } else {
                await this.quizService.createQuiz();
            }

            this.resetForm();
            this.router.navigate(['admin']);
            return 'Bravo! Votre quiz a été enregistré avec succès.';
        } catch (error) {
            if (error instanceof HttpErrorResponse) {
                return this.handleError(error);
            } else {
                return 'Erreur inconnue, veuillez réessayer plus tard...';
            }
        }
    }

    handleError(error: HttpErrorResponse): string {
        let errorMessage = 'Erreur inattendue, veuillez réessayer plus tard...';
        if (error.error) {
            try {
                const errorObj = JSON.parse(error.error);
                if (typeof errorObj.message === 'string') {
                    errorMessage = errorObj.message;
                } else {
                    errorMessage = errorObj.message.join(' ');
                }
            } catch (e) {
                return errorMessage;
            }
        }
        return errorMessage;
    }

    validateQuiz(): boolean {
        if (this.quizService.quiz.title.trim().length === ZERO) {
            return false;
        }
        if (this.quizService.quiz.description.trim().length === ZERO) {
            return false;
        }
        if (this.quizService.quiz.questions.length === ZERO) {

            return false;
        }
        return true;
    }

    resetForm() {
        this.quizService.initializeVirginQuiz();
        this.questionService.setQuestionType(QuestionType.QCM);
        this.isExistingGame = false;
    }

    async deleteQuestion() {
        if (this.selectedQuestionId) {
            await this.questionService.deleteQuestion(this.selectedQuestionId);
            this.closeDeleteModal();
        }
    }

    removeQuestion() {
        if (this.selectedQuestionId) {
            this.quizService.removeQuestion(this.selectedQuestionId);
            this.closeRemoveModal();
        }
    }

    isQuestionInQuiz(quizId: string): boolean {
        return this.quizService.quiz.questions.some((question) => question._id === quizId);
    }

    openDeleteModal(questionId: string) {
        this.selectedQuestionId = questionId;
        this.showDeleteModal = true;
    }

    closeDeleteModal() {
        this.showDeleteModal = false;
        this.selectedQuestionId = null;
    }

    openRemoveModal(questionId: string) {
        this.selectedQuestionId = questionId;
        this.showRemoveModal = true;
    }

    closeRemoveModal() {
        this.showRemoveModal = false;
        this.selectedQuestionId = null;
    }

    modifyQuestion(questionId: string) {
        const questionToEdit = this.questionService.getQuestionById(questionId);
        if (questionToEdit) {
            this.questionService.isModify = true;
            this.questionService.isModifyInQuiz = false;
            this.questionService.questionToModifyId = questionId;
            this.questionService.setQuestionType(questionToEdit.type);
            const { _id, ...questionWithoutId } = questionToEdit;
            this.questionService.question = questionWithoutId;
            this.questionService.question.author = questionToEdit.author;
        }
    }

    modifyQuestionInQuiz(questionId: string) {
        const questionToEdit = this.quizService.quiz.questions.find((question) => question._id.toString() === questionId);
        if (questionToEdit) {
            this.questionService.isModify = true;
            this.questionService.isModifyInQuiz = true;
            this.questionService.questionToModifyId = questionId;
            this.questionService.setQuestionType(questionToEdit.type);
            this.questionService.question = questionToEdit;
            this.questionService.question.author = questionToEdit.author;
        }
    }

    goBack(): void {
        this.router.navigate(['/admin']);
    }
}
