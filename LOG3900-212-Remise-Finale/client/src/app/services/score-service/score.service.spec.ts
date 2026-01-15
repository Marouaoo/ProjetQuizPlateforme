import { TestBed } from '@angular/core/testing';
import { Player } from '@app/interfaces/player';
import { SocketClientService } from '@app/services/websocket-service/websocket.service';
import { ScoreService } from './score.service';

describe('AudioService', () => {
    let service: ScoreService;
    let socketService: jasmine.SpyObj<SocketClientService>;
    const playersList: Player[] = [
        {
            name: 'Player 1',
            points: 0,
            isInPlay: true,
            numberOfBonuses: 0,
            isChatActive: true,
            isAnswerConfirmed: false,
            isAnswerSelected: false,
        },
        {
            name: 'Player 2',
            points: 0,
            isInPlay: true,
            numberOfBonuses: 0,
            isChatActive: true,
            isAnswerConfirmed: false,
            isAnswerSelected: false,
        },
    ];

    beforeEach(async () => {
        socketService = jasmine.createSpyObj('SocketClientService', ['send']);
        await TestBed.configureTestingModule({
            providers: [{ provide: SocketClientService, useValue: socketService }],
        })
            .compileComponents()
            .then(() => {
                TestBed.configureTestingModule({});
                service = TestBed.inject(ScoreService);
            });
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should give grade to a player', () => {
        const currentPlayerIndex = 0;
        const currentGrade = 85;
        const updatedPlayersList = service.giveGrade(playersList, currentPlayerIndex, currentGrade);
        expect(updatedPlayersList[currentPlayerIndex].qrlGrade).toBe(currentGrade);
        const updatedAgainPlayersList = service.giveGrade(playersList, currentPlayerIndex, currentGrade);
        expect(updatedAgainPlayersList[currentPlayerIndex].qrlGrade).toBe(currentGrade);
    });

    it('should return if it is the last player', () => {
        const firstCurrentPlayerIndex = 0;
        const firstIsLastPlayer = service.isTheLastPlayer(firstCurrentPlayerIndex, playersList);
        expect(firstIsLastPlayer).toBeFalse();

        const secondCurrentPlayerIndex = 1;
        const secondIsLastPlayer = service.isTheLastPlayer(secondCurrentPlayerIndex, playersList);
        expect(secondIsLastPlayer).toBeTrue();
    });

    it('should send sendGradesToPlayers withplayerList when calling sendGrades', () => {
        service.sendGrades(playersList);
        expect(socketService.send).toHaveBeenCalledWith('sendGradesToPlayers', playersList);
    });

    it('should set players grade to undefined when calling sendGrades', () => {
        service.sendGrades(playersList);
        expect(playersList[0].qrlGrade).toBeUndefined();
        expect(playersList[0].qrlWrittenAnswer).toBeUndefined();
        expect(playersList[1].qrlGrade).toBeUndefined();
        expect(playersList[1].qrlWrittenAnswer).toBeUndefined();
    });
});
