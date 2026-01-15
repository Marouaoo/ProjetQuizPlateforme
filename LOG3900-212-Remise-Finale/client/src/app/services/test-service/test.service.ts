import { Injectable } from '@angular/core';
import { Game } from '@app/interfaces/game';

@Injectable({
    providedIn: 'root',
})
export class TestService {
    game: Game = {
        id: '',
        title: '',
        description: '',
        duration: 0,
        lastModification: new Date(),
        isVisible: true,
        questions: [],
    };
}
