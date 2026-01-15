import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Choice, QuestionType } from '@common/question';
import { QuestionService } from '@app/services/question/question.service';
import { QuizService } from '@app/services/quiz/quiz.service';
import { UserService } from '@app/services/account/user.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommunicationService } from '@app/services/httpcommunication.service.ts/communication.service';
import { AwsService } from '@app/services/aws/aws.service';
import { INCREMENT, MAX_FILE_SZIE, POINTS_INCREMENT, QUARTER, VICTORY_POINTS } from '@common/constants';

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule],
    selector: 'app-create-question',
    templateUrl: './create-question.component.html',
    styleUrls: ['./create-question.component.scss'],
})
export class CreateQuestionComponent {
    tolerance: number = 0;
    isButtonEnabled: boolean = false;

    QCM = QuestionType.QCM;
    QRL = QuestionType.QRL;
    QRE = QuestionType.QRE;

    isImageUploading: boolean = false;
    imageUploadError: string = '';

    constructor(
        public readonly quizService: QuizService,
        public readonly questionService: QuestionService,
        private readonly translate: TranslateService,
        private readonly userService: UserService,
        public readonly communicationService: CommunicationService,
        private readonly awsService: AwsService,
    ) {
        this.questionService = questionService;
        this.quizService = quizService;
        this.translate.setDefaultLang('fr');
        this.translate.use(this.userService.user.language);
        this.questionService = questionService;
        this.quizService = quizService;
        this.communicationService = communicationService;
    }

    async onImageUpload(event: Event): Promise<void> {
        const files = (event.target as HTMLInputElement).files;
        if (files) {
            this.isImageUploading = true;
            this.imageUploadError = '';
            try {
                for (const file of Array.from(files)) {
                    if (file.type.startsWith('image/')) {
                        if (file.size > MAX_FILE_SZIE) {
                            this.imageUploadError = `L'image dépasse la taille maximale de 25 MB.`;
                            setTimeout(() => {
                                this.imageUploadError = '';
                            }, 2000);
                            continue;
                        }
                        try {
                            const s3Url = await this.awsService.uploadFile(file, 'image');

                            this.questionService.question.imageUrl = s3Url;
                        } catch (error: any) {
                            console.log(`Failed to upload image ${file.name}: ${error.message}`);
                        }
                    } else {
                        this.imageUploadError = `Le fichier n'est pas supporté.`;
                        setTimeout(() => {
                            this.imageUploadError = '';
                        }, 2000);
                    }
                }
            } finally {
                this.isImageUploading = false;
            }
        }
    }

    async createQuestion(): Promise<void> {
        if (this.questionService.question.type === QuestionType.QCM) {
            if (this.questionService.createQCMQuestion()) {
                await this.questionService.createQuestion();
            }
        } else if (this.questionService.question.type === QuestionType.QRE) {
            if (this.questionService.createQREQuestion()) {
                await this.questionService.createQuestion();
            }
        } else if (this.questionService.question.type === QuestionType.QRL) {
            if (this.questionService.createQRLQuestion()) {
                await this.questionService.createQuestion();
            }
        }
        this.cancelModif();
    }

    isImage(url: string): boolean {
        return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
    }

    removeImage() {
        this.questionService.question.imageUrl = '';
        const fileInput = document.getElementById('fileInputQuestion');
        (fileInput as HTMLInputElement).value = '';
    }

    cancelModif() {
        const fileInput = document.getElementById('fileInputQuestion');
        (fileInput as HTMLInputElement).value = '';
        this.questionService.isModify = false;
        this.questionService.isModifyInQuiz = false;
        this.questionService.questionToModifyId = '';
    }

    calculateTolerance(): number {
        if (this.questionService.isQRE(this.questionService.question)) {
            if (this.questionService.question.minRange !== undefined && this.questionService.question.maxRange !== undefined) {
                const interval = this.questionService.question.maxRange - this.questionService.question.minRange;
                this.tolerance = interval / QUARTER;
                return this.tolerance;
            }
        }
        return 0;
    }

    addChoice() {
        if (this.questionService.isQCM(this.questionService.question)) {
            if (!this.questionService.question.choices) {
                this.questionService.question.choices = [];
            }
            this.questionService.question.choices.push({ text: '', isCorrect: false });
        }
    }

    removeChoice(index: number) {
        if (this.questionService.isQCM(this.questionService.question)) {
            if (!this.questionService.question.choices) {
                this.questionService.question.choices = [];
            }
            this.questionService.question.choices.splice(index, INCREMENT);
        }
    }

    incrementPoints(): void {
        if (this.questionService.question.points < VICTORY_POINTS) {
            this.questionService.question.points += POINTS_INCREMENT;
        }
    }

    decrementPoints(): void {
        if (this.questionService.question.points > POINTS_INCREMENT) {
            this.questionService.question.points -= POINTS_INCREMENT;
        }
    }

    toggleCorrectAnswer(choice: Choice): void {
        if (this.questionService.isQCM(this.questionService.question)) {
            if (!this.questionService.question.choices) {
                this.questionService.question.choices = [];
            }
            choice.isCorrect = !choice.isCorrect;
        }
    }

    enableButton(): void {
        if (this.questionService.question.text && this.questionService.question.points) {
            if (this.questionService.isQCM(this.questionService.question)) {
                if (this.questionService.validateQCMQuestion()) {
                    this.isButtonEnabled = true;
                }
            }
            if (this.questionService.isQRE(this.questionService.question)) {
                if (this.questionService.validateQREQuestion()) {
                    this.isButtonEnabled = true;
                }
            }
            if (this.questionService.isQRL(this.questionService.question)) {
                if (this.questionService.validateQRLQuestion()) {
                    this.isButtonEnabled = true;
                }
            }
        } else {
            this.isButtonEnabled = false;
        }
    }
}
