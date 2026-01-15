import { Challenge } from './game';

export enum Avatar {
    Avatar1 = '1', // inclus
    Avatar2 = '2', // inclus
    Avatar3 = '3', // inclus
    Avatar4 = '4', // inclus
    Avatar5 = '5', // inclus
    Avatar6 = '6', // inclus
    Avatar7 = '7', // inclus
    Avatar8 = '8', // inclus
    Avatar9 = '9', // payant
    Avatar10 = '10', // payant
}

export enum Theme {
    lightTheme = 'clear', // inclus
    darkTheme = 'dark', // inclus
    arielTheme = 'ariel', // payant
    donaldTheme = 'donald', // payant
    stitchTheme = 'stitch', // payant
    cinderellaTheme = 'cinderella', // payant
}

export enum Status {
    Connected = 'connected',
    Occupied = 'occupied',
    Disconnected = 'disconnected',
}

export enum ConnectionEvent {
    CONNECTION = 'connection',
    DISCONNECTION = 'disconnection',
}

export enum Language {
    french = 'fr',
    english = 'en',
}

export interface HistoryEvent {
    event: ConnectionEvent;
    timestamp: Date;
}

export interface GameHistoryEvent {
    gameId: string;
    quizName: string;
    nQuestions: number;
    admin: string;
    players: string[];
    winners: string[];
    start: Date;
    end: Date;
    goodAnswers: number;
    hasAbandoned: boolean;
}

export interface User {
    username: string;
    email: string;

    password: string;

    isConnected: boolean;
    avatar: Avatar;
    status: Status;
    friends: string[];
    friendRequestsReceived: string[];
    friendRequestsSent: string[];

    history: HistoryEvent[];
    gameHistory: GameHistoryEvent[];

    score: number;

    theme: Theme;
    language: Language;

    money: number;
    themesAquired: Theme[];
    avatarsAquired: Avatar[];

    lastBonusReceived: Date;
    challenges: Challenge[];
}


export interface UserInfo {
    _id: string;
    username: string;
    email: string;
    avatar: Avatar;
    status: Status;
    friends: string[];
    friendRequestsReceived: string[];
    friendRequestsSent: string[];

    history: HistoryEvent[];
    gameHistory: GameHistoryEvent[];

    theme: Theme;
    language: Language;

    score: number;

    money: number;
    themesAquired: Theme[];
    avatarsAquired: Avatar[];

    lastBonusReceived: Date;
    challenges: Challenge[];
}

export interface Session {
    username: string;
    password: string;
}

export interface Account {
    username: string;
    email: string;
    password: string;
    avatar: Avatar;
}
