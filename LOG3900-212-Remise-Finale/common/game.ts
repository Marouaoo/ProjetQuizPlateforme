import { Avatar } from './session';
import { DetailedQuestion } from './question';

export enum QuestionStatus {
    Correct = 'correct',
    PartiallyIncorrect = 'partiallyIncorrect', 
    PartiallyCorrect = 'partiallyCorrect', 
    Incorrect = 'incorrect', 
}

export enum Challenge {
    challenge1 = 'challenge1', 
    challenge2 = 'challenge2', 
    challenge3 = 'challenge3', 
    challenge4 = 'challenge4',
    challenge5 = 'challenge5', 
}

export interface Specs {
    nQuestionsRight: number;
    nQuestionsAnswered: number;
    points: number;
}

export interface Answer {
    questionId: string;
    points: number;
    answers: string[];
    status: QuestionStatus;
    bonus: number;
}

export interface Player {
    userId: string;
    socketId: string;
    name: string;
    avatar: Avatar;
    isActive: boolean;
    answers: Answer[];
    totalPoints: number;
    challenge: Challenge;
    succeedChallenge: boolean;
}

export interface Game {
    id: string;
    quiz: Quiz;
    hostSocketId: string;
    players: Player[];
    questionIndex: number;
    isLocked: boolean;
    hasStarted: boolean;
    bannedPlayers: string[];
    friendsOnly: boolean;
    firstPerfectAnswered: boolean;
    price: number;
    isFinished: boolean;
}

export enum QuizCategory {
    SPORT = 'sport',
    HISTOIRE = 'histoire',
    MATHS = 'mathématiques',
    SCIENCE = 'science',
    MUSIQUE = 'musique',
}

export interface Quiz {
    title: string;
    description: string;
    duration: number;
    questions: DetailedQuestion[];
    author: string;
    categories: QuizCategory[];
}

export interface DetailedQuiz extends Quiz {
    _id: Object;
    isVisible: boolean;
    lastModified: Date;
}
