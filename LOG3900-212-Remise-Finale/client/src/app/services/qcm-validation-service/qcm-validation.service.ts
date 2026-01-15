import { Injectable } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { Game } from '@app/interfaces/game';
import { MIN_NUMBER_OF_CHOICES } from './qcm-validation.constants';

@Injectable({
    providedIn: 'root',
})
export class ValidationService {
    questionErrorMessage: string = '';
    gameErrorMessage: string = '';
    games: Game[];

    validateQuestion(newGameForm: FormGroup, questionIndex: number): boolean {
        const question = (newGameForm.get('questions') as FormArray).at(questionIndex) as FormGroup;

        if (question.get('type')?.value !== 'QCM') {
            return true;
        }

        const choices = question.get('choices') as FormArray;
        const correctChoicesCount = choices.controls.filter((choice) => choice.get('isCorrect')?.value).length;

        if (choices.length < MIN_NUMBER_OF_CHOICES) {
            this.questionErrorMessage = 'Vous devez avoir au moins 2 choix de réponse par question.';
            return false;
        } else if (correctChoicesCount < 1) {
            this.questionErrorMessage = 'Vous devez avoir au moins 1 bon choix de réponse par question.';
            return false;
        } else if (correctChoicesCount === choices.length) {
            this.questionErrorMessage = 'Vous ne pouvez pas avoir que des bonnes réponses dans une question.';
            return false;
        } else {
            this.questionErrorMessage = '';
            return true;
        }
    }

    validateQuiz(newGameForm: FormGroup): boolean {
        const questions = newGameForm.get('questions') as FormArray;
        const allQuestionsValid = questions.controls.every((question, index) => this.validateQuestion(newGameForm, index));

        if (questions.length === 0) {
            this.gameErrorMessage = 'Le jeu doit avoir minimum une question.';
            return false;
        } else if (!allQuestionsValid) {
            this.gameErrorMessage = this.questionErrorMessage;
            return false;
        } else {
            this.gameErrorMessage = '';
            return true;
        }
    }
}
