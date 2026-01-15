import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TopbarComponent } from '@app/components/topbar/topbar.component';
import { UserService } from '@app/services/account/user.service';
import { CommunicationService } from '@app/services/httpcommunication.service.ts/communication.service';
import { DetailedQuiz as Quiz, QuizCategory } from '@common/game';
import { Subject, takeUntil } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ZERO } from '@common/constants';
import { TutorialTrackerService } from '@app/services/tutorialTracker/tutorial-tracker.service';

@Component({
    standalone: true,
    imports: [TopbarComponent, CommonModule, FormsModule, TranslateModule],
    selector: 'app-admin-page',
    templateUrl: './admin-page.component.html',
    styleUrls: ['./admin-page.component.scss'],
})
export class AdminPageComponent implements OnInit {
    quizzes: Quiz[];

    showDeleteModal = false;

    selectedQuizId: string | null = null;

    currentIndex: number = ZERO;

    categories = Object.values(QuizCategory);
    selectedCategory: QuizCategory;
    errorMessage: string = '';

    private readonly unsubscribe$ = new Subject<void>();

    constructor(
        private readonly communicationService: CommunicationService,
        public readonly userService: UserService,
        public tutorialTrackerService: TutorialTrackerService,
        private readonly translate: TranslateService,
        private readonly router: Router,
    ) {
        this.communicationService = communicationService;
        this.userService = userService;
        this.translate.addLangs(['en', 'fr']);
        this.translate.setDefaultLang('fr');
        this.translate.use('fr');
    }

    ngOnInit(): void {
        this.updateDisplay();
    }

    navigateToMain(): void {
        this.router.navigate(['/']);
    }

    createQuiz(): void {
        this.router.navigate(['/createQuiz']);
    }

    goBack(): void {
        this.router.navigate(['/homePage']);
    }

    updateDisplay() {
        this.communicationService
            .basicGet<Quiz[]>(`quiz/${this.userService.user.username}`)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((quizzes: Quiz[]) => (this.quizzes = quizzes));
    }

    openDeleteModal(quizId: string) {
        this.selectedQuizId = quizId;
        this.showDeleteModal = true;
    }

    closeDeleteModal() {
        this.showDeleteModal = false;
        this.selectedQuizId = null;
    }

    deleteQuiz() {
        if (this.selectedQuizId) {
            this.communicationService
                .basicDelete(`quiz/${this.selectedQuizId}`)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe({
                    next: () => {
                        this.updateDisplay();
                        this.closeDeleteModal();
                    },
                });
        }
    }

    modifyQuiz(quizId: string) {
        const selectedQuiz = this.quizzes.find((quiz) => quiz._id === quizId);
        if (selectedQuiz) {
            this.router.navigate(['/createQuiz', quizId], {
                state: { quiz: selectedQuiz },
            });
        }
    }

    toggleQuizzVisibility(quizId: string) {
        this.communicationService
            .basicPatch(`quiz/edition/${quizId}/${this.userService.user.username}`)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.updateDisplay());
    }

    sortByCategory(category: QuizCategory) {
        this.quizzes = this.quizzes.filter((quiz) => quiz.categories?.includes(category));

        if (
            category !== QuizCategory.HISTOIRE &&
            category !== QuizCategory.MATHS &&
            category !== QuizCategory.MUSIQUE &&
            category !== QuizCategory.SPORT &&
            category !== QuizCategory.SCIENCE
        ) {
            this.updateDisplay();
        }
    }
}
