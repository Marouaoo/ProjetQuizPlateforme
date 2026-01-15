import { DragDropModule } from '@angular/cdk/drag-drop';
import { HttpClientModule, HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormArray, FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { CreateChoiceComponent } from '@app/components/create-choice/create-choice.component';
import { CreateQuestionComponent } from '@app/components/create-question/create-question.component';
import { MessagePopupComponent } from '@app/components/message-popup/message-popup.component';
import { TopbarComponent } from '@app/components/topbar/topbar.component';
import { Game } from '@app/interfaces/game';
import { CommunicationService2 } from '@app/services/communication-service/communication.service';
import { of } from 'rxjs';
import { CreateQCMComponent } from './create-quiz-page.component';

describe('CreateQCMComponent', () => {
    let component: CreateQCMComponent;
    let fixture: ComponentFixture<CreateQCMComponent>;
    let communicationService: CommunicationService2;
    let route: ActivatedRoute;
    let createQuestion: CreateQuestionComponent;
    let topbar: TopbarComponent;
    let fakeGame: Game;
    let games: Game[];

    const dialogOpenSpy = jasmine.createSpy();

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [CreateQCMComponent, CreateQuestionComponent, MessagePopupComponent, CreateChoiceComponent, TopbarComponent],
            imports: [HttpClientModule, MatDialogModule, FormsModule, ReactiveFormsModule, DragDropModule, HttpClientTestingModule],
            providers: [
                FormBuilder,
                CommunicationService2,
                CreateQuestionComponent,
                {
                    provide: MatDialog,
                    useValue: { open: dialogOpenSpy },
                },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        queryParams: of({ encodedId: 'mockEncodedId' }),
                    },
                },
            ],
        });

        fakeGame = {
            id: '123',
            title: 'Test Game',
            description: 'Description',
            duration: 60,
            lastModification: new Date(),
            isVisible: false,
            questions: [
                {
                    type: 'QCM',
                    text: 'question QCM',
                    points: 10,
                    choices: [
                        { text: 'choice1', isCorrect: true },
                        { text: 'choice1', isCorrect: false },
                    ],
                },
                {
                    type: 'QRL',
                    text: 'question QRL',
                    points: 10,
                },
            ],
        };

        fixture = TestBed.createComponent(CreateQCMComponent);
        communicationService = TestBed.inject(CommunicationService2);
        route = TestBed.inject(ActivatedRoute);
        createQuestion = TestBed.inject(CreateQuestionComponent);
        topbar = TestBed.createComponent(TopbarComponent);
        component = fixture.componentInstance;
        component.initializeNewGameForm();
        const questionsFormArray = component.newGameForm.get('questions') as FormArray;
        const questionQRLGroup = component.fb.group({
            type: ['QRL'],
            text: [''],
            points: [INITIAL_VALUE_SLIDER],
        });
        const questionQCMGroup = component.fb.group({
            type: ['QCM'],
            text: [''],
            points: [INITIAL_VALUE_SLIDER],
            choices: component.fb.array([
                component.fb.group({
                    text: [''],
                    isCorrect: [false],
                }),
                component.fb.group({
                    text: [''],
                    isCorrect: [false],
                }),
            ]),
        });
        questionsFormArray.push(questionQCMGroup);
        questionsFormArray.push(questionQRLGroup);
        component.games = [];
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
        expect(createQuestion).toBeTruthy();
        expect(topbar).toBeTruthy();
    });

    it('should open a popup message with the correct data', () => {
        const messageToSend = 'Test Message';
        component.openPopupMessage(messageToSend);
        expect(dialogOpenSpy).toHaveBeenCalledWith(MessagePopupComponent, {
            data: { message: messageToSend },
        });
    });

    it('should get the existing game when gameId is provided', () => {
        const mockGame = fakeGame;
        route.queryParams = of({ encodedId: 'mockGameId' });

        const getGameSpy = spyOn(communicationService, 'getGame').and.returnValue(of(mockGame));
        const populateFormSpy = spyOn(component, 'populateFormWithExistingGame');

        component.ngOnInit();

        expect(getGameSpy).toHaveBeenCalledWith('mockGameId');
        expect(populateFormSpy).toHaveBeenCalled();
        expect(component.newGameForm).toBeTruthy();
    });

    it('should return true when the title already exists', () => {
        const mockGame = fakeGame;
        const mockTitle = 'Test Game';
        component.newGameForm.get('title')?.setValue(mockTitle);
        component.games = [mockGame];
        expect(component.isTitleUsed()).toBeTrue();
    });

    it('should return false when the title does not exist', () => {
        const mockTitle = 'Test Game';
        component.newGameForm.get('title')?.setValue(mockTitle);
        component.games = [];
        expect(component.isTitleUsed()).toBeFalse();
    });

    it('should initialize a new form when gameId is not provided', () => {
        route.queryParams = of({});
        const initFormSpy = spyOn(component, 'initializeNewGameForm');
        component.ngOnInit();
        expect(initFormSpy).toHaveBeenCalled();
        expect(component.newGameForm).toBeTruthy();
    });

    it('should populate the form with an existing game', () => {
        const mockGame = fakeGame;
        component.populateFormWithExistingGame(mockGame);
        expect(component.newGameForm.value).toEqual(mockGame);
    });

    it('should submit a new game when isGameValid is true, isExistingGame is false, and the title is unique', () => {
        const mockGame = fakeGame;
        component.newGameForm.setValue(mockGame);
        component.isGameValid = true;
        spyOn(component, 'isTitleUsed').and.returnValue(false);

        const createGameSpy = spyOn(communicationService, 'createGame').and.returnValue(of(new HttpResponse({ body: 'Success', status: 200 })));

        component.isExistingGame = false;
        component.submitGame();

        expect(createGameSpy).toHaveBeenCalledWith(mockGame);
    });

    it('should submit an updated game when isGameValid is true and isExistingGame is true', () => {
        const mockGame = fakeGame;
        component.newGameForm.setValue(mockGame);

        component.isGameValid = true;

        const updateGameSpy = spyOn(communicationService, 'updateGame').and.returnValue(of(undefined));

        component.isExistingGame = true;
        component.submitGame();

        expect(updateGameSpy).toHaveBeenCalledWith(mockGame.id, mockGame);
    });

    it('should not submit the game when isGameValid is false', () => {
        component.isGameValid = false;

        const createGameSpy = spyOn(communicationService, 'createGame');
        const updateGameSpy = spyOn(communicationService, 'updateGame');

        component.submitGame();

        expect(createGameSpy).not.toHaveBeenCalled();
        expect(updateGameSpy).not.toHaveBeenCalled();
    });

    it('should not submit the game when isTitleUsed is true', () => {
        spyOn(component, 'isTitleUsed').and.returnValue(true);

        const createGameSpy = spyOn(communicationService, 'createGame');
        const updateGameSpy = spyOn(communicationService, 'updateGame');

        component.submitGame();

        expect(createGameSpy).not.toHaveBeenCalled();
        expect(updateGameSpy).not.toHaveBeenCalled();
    });

    it('should not submit the game and show error message when the title is not unique', () => {
        const mockGame = fakeGame;
        component.newGameForm.setValue(mockGame);

        spyOn(component, 'isTitleUsed').and.returnValue(true);

        const createGameSpy = spyOn(communicationService, 'createGame');

        component.handleCreateGame(mockGame);

        expect(createGameSpy).not.toHaveBeenCalled();
        expect(component.errorMessage).toBe("Le titre du jeu n'est pas unique.");

        expect(dialogOpenSpy).toHaveBeenCalledWith(MessagePopupComponent, {
            data: { message: "Le titre du jeu n'est pas unique." },
        });
    });

    it('should call getGamesData on init', () => {
        spyOn(component, 'getGamesData');
        component.ngOnInit();
        expect(component.getGamesData).toHaveBeenCalled();
    });

    it('should call getGamesData on init', () => {
        spyOn(component, 'getGamesData');
        component.ngOnInit();
        expect(component.getGamesData).toHaveBeenCalled();
    });

    it('should call getGames when calling getGamesData', () => {
        const communicationServiceSpy = spyOn(communicationService, 'getGames').and.returnValue(of(games));
        component.getGamesData();
        expect(communicationServiceSpy).toHaveBeenCalled();
    });
});
