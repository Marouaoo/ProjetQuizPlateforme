import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root',
})
export class TutorialTrackerService {
    currentStep = 1;
    isInTutorial = false;

    constructor(private readonly router: Router) {}

    nextTutorialStep() {
        this.currentStep++;
        if (this.currentStep === 12) {
            this.resetTutorial();
            return;
        }
        switch (this.currentStep) {
            case 1:
                console.log('on rentre ici');
                this.router.navigate(['/homePage']);
                break;
            case 2:
                this.router.navigate(['/homePage']);
                break;
            case 3:
                this.router.navigate(['/joinGame']);
                break;
            case 4:
                this.router.navigate(['/joinGame']);
                break;
            case 5:
                this.router.navigate(['/homePage']);
                break;
            case 6:
                this.router.navigate(['/createGame']);
                break;
            case 7:
                this.router.navigate(['/createGame']);
                break;
            case 8:
                this.router.navigate(['/createGame']);
                break;
            case 9:
                this.router.navigate(['/homePage']);
                break;
            case 10:
                this.router.navigate(['/admin']);
                break;
            case 11:
                this.router.navigate(['/admin']);
                break;
            default:
                this.router.navigate(['/homePage']);
                break;
        }
    }

    public resetTutorial() {
        this.isInTutorial = false;
        this.currentStep = 1;
        this.router.navigate(['homePage']);
    }
}
