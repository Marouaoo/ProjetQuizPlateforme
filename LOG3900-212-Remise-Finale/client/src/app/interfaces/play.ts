import { Game } from './game';
import { Player } from './player';

export interface Play {
    accessCode: string;
    isUnlocked: boolean;
    startTime: Date;
    game: Game;
    playersList: Player[];
}
