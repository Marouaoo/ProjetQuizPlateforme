import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ValidationService } from './qcm-validation.service';

describe('ValidationService', () => {
    let service: ValidationService;
    let formBuilder: FormBuilder;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientModule],
            providers: [FormBuilder],
        });
        service = TestBed.inject(ValidationService);
        formBuilder = TestBed.inject(FormBuilder);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should validate automatically a QRL question', () => {
        const formGroup: FormGroup = formBuilder.group({
            id: 'mockId',
            title: 'mockTitle',
            description: 'mockDescription',
            duration: 10,
            lastModification: new Date(),
            isVisible: false,
            questions: formBuilder.array([
                formBuilder.group({
                    type: 'QRL',
                    text: 'mockQuestionText',
                    points: 10,
                    answer: 'mockAnswer',
                }),
            ]),
        });

        const result = service.validateQuestion(formGroup, 0);
        expect(result).toBe(true);
    });

    it('should validate a question with at least 2 valid choices', () => {
        const formGroup: FormGroup = formBuilder.group({
            id: 'mockId',
            title: 'mockTitle',
            description: 'mockDescription',
            duration: 10,
            lastModification: new Date(),
            isVisible: false,
            questions: formBuilder.array([
                formBuilder.group({
                    type: 'QCM',
                    text: 'mockQuestionText',
                    points: 10,
                    choices: formBuilder.array([
                        formBuilder.group({
                            text: 'mockChoiceText',
                            isCorrect: true,
                        }),
                        formBuilder.group({
                            text: 'mockChoiceText',
                            isCorrect: false,
                        }),
                    ]),
                }),
            ]),
        });

        const result = service.validateQuestion(formGroup, 0);
        expect(result).toBe(true);
    });

    it('should not validate a question with less than 2 choices', () => {
        const formGroup: FormGroup = formBuilder.group({
            id: 'mockId',
            title: 'mockTitle',
            description: 'mockDescription',
            duration: 10,
            lastModification: new Date(),
            isVisible: false,
            questions: formBuilder.array([
                formBuilder.group({
                    type: 'QCM',
                    text: 'mockQuestionText',
                    points: 10,
                    choices: formBuilder.array([
                        formBuilder.group({
                            text: 'mockChoiceText',
                            isCorrect: true,
                        }),
                    ]),
                }),
            ]),
        });

        const result = service.validateQuestion(formGroup, 0);
        expect(result).toBe(false);
    });

    it('should not validate a question without both good and bad choices', () => {
        const formGroup: FormGroup = formBuilder.group({
            id: 'mockId',
            title: 'mockTitle',
            description: 'mockDescription',
            duration: 10,
            lastModification: new Date(),
            isVisible: false,
            questions: formBuilder.array([
                formBuilder.group({
                    type: 'QCM',
                    text: 'mockQuestionText',
                    points: 10,
                    choices: formBuilder.array([
                        formBuilder.group({
                            text: 'mockChoiceText',
                            isCorrect: true,
                        }),
                        formBuilder.group({
                            text: 'mockChoiceText',
                            isCorrect: true,
                        }),
                    ]),
                }),
            ]),
        });

        const result = service.validateQuestion(formGroup, 0);
        expect(result).toBe(false);
    });

    it('should not validate a question without one good choice', () => {
        const formGroup: FormGroup = formBuilder.group({
            id: 'mockId',
            title: 'mockTitle',
            description: 'mockDescription',
            duration: 10,
            lastModification: new Date(),
            isVisible: false,
            questions: formBuilder.array([
                formBuilder.group({
                    type: 'QCM',
                    text: 'mockQuestionText',
                    points: 10,
                    choices: formBuilder.array([
                        formBuilder.group({
                            text: 'mockChoiceText',
                            isCorrect: false,
                        }),
                        formBuilder.group({
                            text: 'mockChoiceText',
                            isCorrect: false,
                        }),
                    ]),
                }),
            ]),
        });

        const result = service.validateQuestion(formGroup, 0);
        expect(result).toBe(false);
    });

    it('should validate a good game', () => {
        const formGroup: FormGroup = formBuilder.group({
            id: 'mockId',
            title: 'mockTitle',
            description: 'mockDescription',
            duration: 10,
            lastModification: new Date(),
            isVisible: false,
            questions: formBuilder.array([
                formBuilder.group({
                    type: 'QCM',
                    text: 'mockQuestionText',
                    points: 10,
                    choices: formBuilder.array([
                        formBuilder.group({
                            text: 'mockChoiceText',
                            isCorrect: true,
                        }),
                        formBuilder.group({
                            text: 'mockChoiceText',
                            isCorrect: false,
                        }),
                    ]),
                }),
            ]),
        });
        const result = service.validateQuiz(formGroup);
        expect(result).toBe(true);
    });

    it('should not validate a game with zero questions', () => {
        const formGroup: FormGroup = formBuilder.group({
            id: 'mockId',
            title: 'mockTitle',
            description: 'mockDescription',
            duration: 10,
            lastModification: new Date(),
            isVisible: false,
            questions: formBuilder.array([]),
        });

        const result = service.validateQuiz(formGroup);
        expect(result).toBe(false);
    });

    it('should not validate a game with at least one invalid question', () => {
        const formGroup: FormGroup = formBuilder.group({
            id: 'mockId',
            title: 'mockTitle',
            description: 'mockDescription',
            duration: 10,
            lastModification: new Date(),
            isVisible: false,
            questions: formBuilder.array([
                formBuilder.group({
                    type: 'QCM',
                    text: 'mockQuestionText',
                    points: 10,
                    choices: formBuilder.array([
                        formBuilder.group({
                            text: 'mockChoiceText',
                            isCorrect: true,
                        }),
                        formBuilder.group({
                            text: 'mockChoiceText',
                            isCorrect: false,
                        }),
                    ]),
                }),
                formBuilder.group({
                    type: 'QCM',
                    text: 'mockQuestionText',
                    points: 10,
                    choices: formBuilder.array([
                        formBuilder.group({
                            text: 'mockChoiceText',
                            isCorrect: true,
                        }),
                        formBuilder.group({
                            text: 'mockChoiceText',
                            isCorrect: true,
                        }),
                    ]),
                }),
            ]),
        });
        const result = service.validateQuiz(formGroup);
        expect(result).toBe(false);
    });
});
