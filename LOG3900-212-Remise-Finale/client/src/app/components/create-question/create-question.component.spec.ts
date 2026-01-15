import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AddQuestionPopupComponent } from '@app/components/add-question-popup/add-question-popup.component';
import { CreateChoiceComponent } from '@app/components/create-choice/create-choice.component';
import { DeletePopupComponent } from '@app/components/delete-popup/delete-popup.component';
import { of } from 'rxjs';
import { CreateQuestionComponent } from './create-question.component';

describe('CreateQuestionComponent', () => {
    let component: CreateQuestionComponent;
    let fixture: ComponentFixture<CreateQuestionComponent>;
    let formBuilder: FormBuilder;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [CreateQuestionComponent, CreateChoiceComponent, AddQuestionPopupComponent],
            imports: [FormsModule, ReactiveFormsModule, DragDropModule, MatDialogModule],
            providers: [FormBuilder, CreateChoiceComponent, MatDialog],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        });
        fixture = TestBed.createComponent(CreateQuestionComponent);
        component = fixture.componentInstance;
        formBuilder = TestBed.inject(FormBuilder);

        const mockQuestions = formBuilder.array([]);
        component.questions = mockQuestions;

        component.newGameForm = formBuilder.group({
            questions: mockQuestions,
        });

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should get choices for a question at a specific index', () => {
        const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        dialogRefSpyObj.afterClosed.and.returnValue(of('Question à choix multiple'));
        spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(dialogRefSpyObj);

        component.addQuestion();

        const questionIndex = 0;
        const choices = component.getChoices(questionIndex);

        expect(choices).toBeTruthy();
        expect(choices instanceof FormArray).toBeTruthy();
    });

    it('should get the question FormGroup at a specific index', () => {
        const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        dialogRefSpyObj.afterClosed.and.returnValue(of('Question à choix multiple'));
        spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(dialogRefSpyObj);

        component.addQuestion();

        const questionIndex = 0;
        const questionFormGroup = component.getQuestionFormGroup(questionIndex);

        expect(questionFormGroup).toBeTruthy();
        expect(questionFormGroup instanceof FormGroup).toBeTruthy();
    });

    it('should add a QCM question', () => {
        const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        dialogRefSpyObj.afterClosed.and.returnValue(of('Question à choix multiple'));

        const dialogOpenSpy = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(dialogRefSpyObj);

        const initialQuestionsLength = component.questions.length;
        component.addQuestion();

        expect(dialogOpenSpy).toHaveBeenCalledOnceWith(AddQuestionPopupComponent);

        const updatedQuestionsLength = component.questions.length;
        expect(updatedQuestionsLength).toBe(initialQuestionsLength + 1);
    });

    it('should add a QRL question', () => {
        const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        dialogRefSpyObj.afterClosed.and.returnValue(of('Question à réponse libre'));

        const dialogOpenSpy = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(dialogRefSpyObj);

        const initialQuestionsLength = component.questions.length;
        component.addQuestion();

        expect(dialogOpenSpy).toHaveBeenCalledOnceWith(AddQuestionPopupComponent);

        const updatedQuestionsLength = component.questions.length;
        expect(updatedQuestionsLength).toBe(initialQuestionsLength + 1);
    });

    it('should properly initialize a QCM question', () => {
        const initialQuestionsLength = component.questions.length;
        component.addQCM();
        const updatedQuestionsLength = component.questions.length;

        expect(updatedQuestionsLength).toBe(initialQuestionsLength + 1);

        const addedQuestion = component.questions.at(updatedQuestionsLength - 1) as FormGroup;
        expect(addedQuestion.get('type')?.value).toBe('QCM');
        expect(addedQuestion.get('text')?.value).toBe('');
        const choices = addedQuestion.get('choices') as FormArray;
        expect(choices.length).toBe(2);
    });

    it('should properly initialize a QRL question', () => {
        const initialQuestionsLength = component.questions.length;
        component.addQRL();
        const updatedQuestionsLength = component.questions.length;

        expect(updatedQuestionsLength).toBe(initialQuestionsLength + 1);

        const addedQuestion = component.questions.at(updatedQuestionsLength - 1) as FormGroup;
        expect(addedQuestion.get('type')?.value).toBe('QRL');
        expect(addedQuestion.get('text')?.value).toBe('');
    });

    it('should delete a question', () => {
        const dialogData: { actionToAsk: string } = {
            actionToAsk: 'supprimer cette question',
        };
        const initialQuestionsLength = component.questions.length;
        component.addQuestion();

        const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        dialogRefSpyObj.afterClosed.and.returnValue(of('Oui'));

        const dialogOpenSpy = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(dialogRefSpyObj);

        component.deleteQuestion(0);
        const updatedQuestionsLength = component.questions.length;
        expect(updatedQuestionsLength).toBe(initialQuestionsLength);
        expect(dialogOpenSpy).toHaveBeenCalledOnceWith(DeletePopupComponent, { data: dialogData });
    });

    it('should handle dropQuestion', () => {
        const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        dialogRefSpyObj.afterClosed.and.returnValue(of('Question à choix multiple'));
        spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(dialogRefSpyObj);

        component.addQuestion();
        component.addQuestion();
        component.addQuestion();

        const controls = [...component.questions.controls];
        const previousIndex = 0;
        const currentIndex = 2;

        const mockDropEvent = {
            previousIndex,
            currentIndex,
        } as CdkDragDrop<AbstractControl[]>;

        component.dropQuestion(mockDropEvent);

        expect(component.questions.controls).toEqual([controls[1], controls[2], controls[0]]);
    });

    it('should return true for type "QCM"', () => {
        const result = component.isQCMQuestion('QCM');
        expect(result).toBe(true);
    });

    it('should return false for other types', () => {
        const result = component.isQCMQuestion('MultipleChoice');
        expect(result).toBe(false);
    });
});
