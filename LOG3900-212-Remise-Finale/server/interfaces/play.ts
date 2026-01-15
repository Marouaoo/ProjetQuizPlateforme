import { Answer } from './answer';
import { Game } from './game';
import { Player } from './player';

export interface Play {
    accessCode: string;
    isUnlocked: boolean;
    intervalId?: number;
    startTime: Date;
    game: Game;
    playersList: Player[];
    currentAnswers: Answer[];
    modificationsCount: number;
    bannedNames: string[];
    correctAnswersPlayers: string[];
}
