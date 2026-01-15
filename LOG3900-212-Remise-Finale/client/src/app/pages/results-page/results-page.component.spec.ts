/* eslint-disable @typescript-eslint/no-magic-numbers */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { ChatAreaComponent } from '@app/components/chat-area/chat-area.component';
import { MessagePopupComponent } from '@app/components/message-popup/message-popup.component';
import { TopbarComponent } from '@app/components/topbar/topbar.component';
import { Histograms } from '@app/interfaces/histogram';
import { Player } from '@app/interfaces/player';
import { HistogramService } from '@app/services/histogram-service/histogram.service';
import { HISTOGRAM_OPTIONS } from '@app/services/histogram-service/histogram.service.constants';
import { SocketClientService } from '@app/services/websocket-service/websocket.service';
import { of } from 'rxjs';
import { ResultsPageComponent } from './results-page.component';

describe('ResultsPageComponent', () => {
    let component: ResultsPageComponent;
    let fixture: ComponentFixture<ResultsPageComponent>;
    let socketService: jasmine.SpyObj<SocketClientService>;
    let testData: unknown;
    let histogramService: HistogramService;
    const fakeHistogram: Histograms = {
        grades: [
            [0, 50, 0],
            [100, 0, 0],
        ],
        histograms: [
            {
                labels: ['histogram1'],
                datasets: [{ data: [5, 10, 15] }],
            },
            {
                labels: ['histogram2'],
                datasets: [{ data: [5, 10, 15] }],
            },
            {
                labels: ['histogram3'],
                datasets: [{ data: [5, 10, 15] }],
            },
        ],
        choices: [['choix1', 'choix2', 'choix3']],
        questions: [
            {
                type: 'QRL',
                text: 'Votre nom ?',
                points: 5,
            },
        ],
    };

    const newPlayers: Player[] = [
        {
            name: 'CPlayer',
            points: 100,
            isInPlay: true,
            numberOfBonuses: 0,
            isChatActive: true,
            isAnswerConfirmed: false,
            isAnswerSelected: false,
        },
        {
            name: 'BPlayer',
            points: 150,
            isInPlay: true,
            numberOfBonuses: 0,
            isChatActive: false,
            isAnswerConfirmed: false,
            isAnswerSelected: false,
        },
        {
            name: 'APlayer',
            points: 50,
            isInPlay: true,
            numberOfBonuses: 0,
            isChatActive: true,
            isAnswerConfirmed: false,
            isAnswerSelected: false,
        },
    ];

    beforeEach(async () => {
        socketService = jasmine.createSpyObj('SocketClientService', ['send', 'listen']);
        socketService.listen.and.returnValue(of(testData));
        socketService.listen.withArgs('getPlayers').and.returnValue(of([newPlayers]));
        await TestBed.configureTestingModule({
            declarations: [ResultsPageComponent, ChatAreaComponent, MessagePopupComponent, TopbarComponent],
            imports: [MatDialogModule, FormsModule],
            providers: [{ provide: SocketClientService, useValue: socketService }],
        })
            .compileComponents()
            .then(() => {
                fixture = TestBed.createComponent(ResultsPageComponent);
                component = fixture.componentInstance;
                socketService = TestBed.inject(SocketClientService) as jasmine.SpyObj<SocketClientService>;
                histogramService = TestBed.inject(HistogramService);
            });
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should update playersList when "showResults" event is received', () => {
        const showResultsSpy = socketService.listen.withArgs('showResults').and.returnValue(of(newPlayers));
        component.ngOnInit();
        expect(component.players).toEqual(newPlayers);
        expect(showResultsSpy).toHaveBeenCalled();
    });

    it('should call socketService.send("quitPlayerFromList") when quitPlay() is called', () => {
        component.quitPlay();
        expect(socketService.send).toHaveBeenCalledWith('quitPlayerFromList');
    });

    it('should return histogramOptions when using histogramOptions', () => {
        histogramService.histogramOptions = HISTOGRAM_OPTIONS;
        const histogramOptions = component.histogramOptions;
        expect(histogramOptions).toEqual(HISTOGRAM_OPTIONS);
    });

    it('should decrement currentIndexHistograms when previousHistogram is called ', () => {
        component.histogramsGenerated = fakeHistogram.histograms;
        component.gradesList = [[0, 50, 100]];
        component.gradeData();
        component.currentIndexHistograms = 1;
        component.previousHistogram();
        expect(component.currentIndexHistograms).toBe(0);
    });

    it('should increment currentIndexHistograms when nextHistogram is called ', () => {
        component.histogramsGenerated = fakeHistogram.histograms;
        component.gradesList = fakeHistogram.grades;
        component.gradeData();
        component.currentIndexHistograms = 0;
        component.nextHistogram();
        expect(component.currentIndexHistograms).toBe(1);
    });

    it('should assign variables when initHistogramData is called', () => {
        const showResultsSpy = socketService.listen.withArgs('showResults').and.returnValue(of(fakeHistogram));
        socketService.listen.withArgs('histogramsData').and.returnValue(of(fakeHistogram));
        component.initHistogramData();
        expect(showResultsSpy).toHaveBeenCalledWith('histogramsData');
        expect(component.histogramsInterface).toEqual(fakeHistogram);
        expect(component.gradesList).toEqual(fakeHistogram.grades);
        expect(component.histogramsInterface.choices).toEqual(fakeHistogram.choices);
        expect(component.histogramsInterface.questions).toEqual(fakeHistogram.questions);
    });
    it('should push the good number of grades in gradesResult array', () => {
        const expectedGradesResult = [
            [0, 50, 50],
            [0, 100, 50],
        ];

        component.gradesList = expectedGradesResult;
        component.gradeData();
        expect(component.gradesResult[0]).toEqual([1, 2, 0]);
    });
});
