import { TestBed } from '@angular/core/testing';
import { Answer } from '@app/interfaces/answer';
import { Choice } from '@app/interfaces/choice';
import { HistogramService } from './histogram.service';

describe('HistogramService', () => {
    let service: HistogramService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(HistogramService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should set right histogramData when calling setHistogramData with QCM', () => {
        const question = {
            type: 'QCM',
            text: 'first Question',
            points: 10,
            answer: '',
            choices: [
                { text: 'first choice', isCorrect: true },
                { text: 'second choice', isCorrect: false },
            ],
        };
        const histogramData = {
            labels: question.choices.map((answer: Choice, index: number) => `Choix ${index + 1}`),
            datasets: [{ data: [] }],
        };
        service.setHistogramData(question, 0, 1);
        expect(service.histogramData).toEqual(histogramData);
    });

    it('should set right histogramData when calling setHistogramData with QCM empty choices', () => {
        const question = {
            type: 'QCM',
            text: 'first Question',
            points: 10,
            answer: '',
            choices: undefined,
        };
        const setQRLSpy = spyOn(service, 'setQRLHistogramData');
        service.setHistogramData(question, 0, 1);
        expect(setQRLSpy).toHaveBeenCalled();
    });

    it('should set right histogramData when calling setHistogramData with QRL', () => {
        const question = {
            type: 'QRL',
            text: 'third Question',
            points: 30,
            answer: '',
        };
        const setQRLSpy = spyOn(service, 'setQRLHistogramData');
        service.setHistogramData(question, 0, 1);
        expect(setQRLSpy).toHaveBeenCalled();
    });

    it('should empty histogramData when calling resetHistogramData', () => {
        const histogramData = {
            labels: [],
            datasets: [],
        };
        service.resetHistogramData();
        expect(service.histogramData).toEqual(histogramData);
    });

    it('should set right histogramData when calling setQRLHistogramData', () => {
        const modificationsCount = 2;
        const playersInPlay = 3;
        const histogramData = {
            labels: ['modifié', 'non-modifié'],
            datasets: [
                {
                    data: [modificationsCount, playersInPlay - modificationsCount],
                    backgroundColor: ['green', 'grey'],
                },
            ],
        };
        service.setQRLHistogramData(modificationsCount, playersInPlay);
        expect(service.histogramData).toEqual(histogramData);
    });

    it('should set right histogramData when calling setQCMHistogramData', () => {
        const answers: Answer[] = [
            { choice: { text: 'first choice', isCorrect: false }, count: 3 },
            { choice: { text: 'second choice', isCorrect: true }, count: 5 },
        ];
        const histogramData = {
            labels: answers.map((answer: Answer, index: number) => `Choix ${index + 1}`),
            datasets: [
                {
                    data: answers.map((answer: Answer) => answer.count),
                    backgroundColor: answers.map((answer: Answer) => (answer.choice.isCorrect ? 'green' : 'red')),
                },
            ],
        };
        service.setQCMHistogramData(answers);
        expect(service.histogramData).toEqual(histogramData);
    });
});
