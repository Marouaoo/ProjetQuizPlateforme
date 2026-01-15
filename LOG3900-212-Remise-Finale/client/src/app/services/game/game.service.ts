import { Injectable } from '@angular/core';
import { Game, Player, Quiz } from '@common/game';
import { PlayerService } from '../player/player.service';
import { SocketService } from '../socket-service/socket-service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { GameCreationEvents } from '@common/game-creation.gateway.events';
import { Question, QuestionQCM, QuestionQRE, QuestionQRL, QuestionType } from '@common/question';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    game: Game;

    player: Player;

    games: Game[];
    activeGames: Game[];
    waitingGames: Game[];

    index: number = 0;

    isDelayModalVisible: boolean = false;

    private readonly questionIndex = new BehaviorSubject<number>(this.index);
    public questionIndex$ = this.questionIndex.asObservable();

    private readonly question = new BehaviorSubject<Question | null>(null);
    public question$ = this.question.asObservable();

    socketSubscription: Subscription = new Subscription();

    constructor(
        private readonly playerService: PlayerService,
        private readonly socketService: SocketService,
    ) {
        this.socketSubscription.add(
            this.socketService.listen<Game[]>(GameCreationEvents.Games).subscribe((games: Game[]) => {
                this.games = games;
                this.activeGames = [];
                this.waitingGames = [];
                this.games.forEach((game: Game) => (game.hasStarted ? this.activeGames.push(game) : this.waitingGames.push(game)));
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen<Game[]>('gamesUpdate').subscribe((games) => {
                this.games = games;
                this.activeGames = [];
                this.waitingGames = [];
                this.games.forEach((game: Game) => (game.hasStarted ? this.activeGames.push(game) : this.waitingGames.push(game)));
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen<Question>('newQuestion').subscribe((question: Question) => {
                this.isDelayModalVisible = true;
                this.questionIndex.next(this.index++);
                this.question.next(question);
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen<Player[]>(GameCreationEvents.PlayerLeft).subscribe((players: Player[]) => {
                this.game.players = players;
            }),
        );
    }

    setGame(newGame: Game): void {
        this.game = newGame;
    }

    createNewGame(quiz: Quiz, isFriendsOnly: boolean, price: number): Game {
        this.playerService.createPlayer();
        return {
            quiz: quiz,
            id: '',
            players: [this.playerService.player],
            hostSocketId: '',
            questionIndex: 0,
            isLocked: false,
            hasStarted: false,
            bannedPlayers: [],
            friendsOnly: isFriendsOnly,
            firstPerfectAnswered: false,
            price: price,
            isFinished: false,
        };
    }

    isQCM(question: Question): question is QuestionQCM {
        return question.type === QuestionType.QCM;
    }

    isQRE(question: Question): question is QuestionQRE {
        return question.type === QuestionType.QRE;
    }

    isQRL(question: Question): question is QuestionQRL {
        return question.type === QuestionType.QRL;
    }

    resetGame() {
        this.game = {
            id: '',
            quiz: {
                title: '',
                description: '',
                duration: 0,
                questions: [],
                categories: [],
                author: '',
            },
            hostSocketId: '',
            players: [],
            questionIndex: 0,
            isLocked: false,
            hasStarted: false,
            bannedPlayers: [],
            friendsOnly: false,
            firstPerfectAnswered: false,
            price: 0,
            isFinished: false,
        };
        this.question.next(null);
        this.questionIndex.next(0);
        this.index = 0;
    }
}
