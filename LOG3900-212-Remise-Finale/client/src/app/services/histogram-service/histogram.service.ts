import { Injectable } from '@angular/core';
import { Answer } from '@app/interfaces/answer';
import { Choice } from '@app/interfaces/choice';
import { Question } from '@app/interfaces/question';
import { ChartData } from 'chart.js';
import { HISTOGRAM_OPTIONS } from './histogram.service.constants';

@Injectable({
    providedIn: 'root',
})
export class HistogramService {
    histogramData: ChartData<'bar'> = {
        labels: [],
        datasets: [],
    };

    histogramOptions = HISTOGRAM_OPTIONS;

    setHistogramData(currentQuestion: Question, modificationsCount: number, playersInPlay: number) {
        if (currentQuestion.type === 'QCM' && currentQuestion.choices) {
            this.histogramData = {
                labels: currentQuestion.choices.map((answer: Choice, index: number) => `Choix ${index + 1}`),
                datasets: [{ data: [] }],
            };
        } else {
            this.setQRLHistogramData(modificationsCount, playersInPlay);
        }
    }

    resetHistogramData() {
        this.histogramData = {
            labels: [],
            datasets: [],
        };
    }

    setQRLHistogramData(modificationsCount: number, playersInPlay: number) {
        this.histogramData = {
            labels: ['modifié', 'non-modifié'],
            datasets: [
                {
                    data: [modificationsCount, playersInPlay - modificationsCount],
                    backgroundColor: ['green', 'grey'],
                },
            ],
        };
    }

    setQCMHistogramData(answers: Answer[]) {
        this.histogramData = {
            labels: answers.map((answer: Answer, index: number) => `Choix ${index + 1}`),
            datasets: [
                {
                    data: answers.map((answer: Answer) => answer.count),
                    backgroundColor: answers.map((answer: Answer) => (answer.choice.isCorrect ? 'green' : 'red')),
                },
            ],
        };
    }
}
