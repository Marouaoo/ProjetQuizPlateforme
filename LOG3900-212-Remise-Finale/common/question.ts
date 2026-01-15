export enum QuestionType {
    QCM = 'QCM',
    QRL = 'QRL',
    QRE = 'QRE',
}

export interface Choice {
    text: string;
    isCorrect: boolean;
}

export interface QuestionBase {
    text: string;
    author: string;
    points: 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
    imageUrl?: string;
}

export interface DetailedQuestionBase {
    _id: Object;
    text: string;
    author: string;
    points: 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
    imageUrl?: string;
}

export interface QuestionQCM extends QuestionBase {
    choices: Choice[];
    type: QuestionType.QCM;
}

export interface DetailedQuestionQCM extends DetailedQuestionBase {
    choices: Choice[];
    type: QuestionType.QCM;
}

export interface QuestionQRE extends QuestionBase {
    correctAnswer: number;
    minRange: number;
    maxRange: number;
    tolerance: number;
    type: QuestionType.QRE;
}

export interface DetailedQuestionQRE extends DetailedQuestionBase {
    correctAnswer: number;
    minRange: number;
    maxRange: number;
    tolerance: number;
    type: QuestionType.QRE;
}

export interface QuestionQRL extends QuestionBase {
    type: QuestionType.QRL;
}

export interface DetailedQuestionQRL extends DetailedQuestionBase {
    type: QuestionType.QRL;
}

export type Question = QuestionQCM | QuestionQRE | QuestionQRL;

export type DetailedQuestion = DetailedQuestionQCM | DetailedQuestionQRE | DetailedQuestionQRL;
