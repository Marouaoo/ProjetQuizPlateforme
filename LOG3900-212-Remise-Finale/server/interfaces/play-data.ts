import { Player } from './player';

export interface PlayData {
    accessCode: string;
    game: string;
    startTime: Date;
    playersList: Player[];
}
