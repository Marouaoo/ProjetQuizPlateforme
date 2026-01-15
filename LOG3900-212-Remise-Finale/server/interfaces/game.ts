import { Question } from './question';

export interface Game {
    id: string;
    title: string;
    description: string;
    duration: number;
    lastModification: Date;
    isVisible: boolean;
    questions: Question[];
    fileName?: string;
}
