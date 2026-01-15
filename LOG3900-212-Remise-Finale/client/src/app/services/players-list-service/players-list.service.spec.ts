import { TestBed } from '@angular/core/testing';
import { Player } from '@app/interfaces/player';
import { SocketClientService } from '@app/services/websocket-service/websocket.service';
import { of } from 'rxjs';
import { PlayersListService } from './players-list.service';

describe('PlayersListService', () => {
    let service: PlayersListService;
    let socketService: jasmine.SpyObj<SocketClientService>;
    const player: Player = {
        name: 'BPlayer',
        points: 150,
        isInPlay: true,
        numberOfBonuses: 0,
        isChatActive: false,
        isAnswerConfirmed: false,
        isAnswerSelected: false,
    };
    const playerChat: [string, boolean] = ['APlayer', true];
    const playerList: Player[] = [
        {
            name: 'CPlayer',
            points: 100,
            isInPlay: true,
            numberOfBonuses: 0,
            isChatActive: true,
            isAnswerConfirmed: false,
            isAnswerSelected: true,
        },
        {
            name: 'BPlayer',
            points: 150,
            isInPlay: true,
            numberOfBonuses: 0,
            isChatActive: false,
            isAnswerConfirmed: false,
            isAnswerSelected: false,
        },
        {
            name: 'APlayer',
            points: 50,
            isInPlay: true,
            numberOfBonuses: 0,
            isChatActive: true,
            isAnswerConfirmed: true,
            isAnswerSelected: true,
        },
        {
            name: 'DPlayer',
            points: 200,
            isInPlay: false,
            numberOfBonuses: 0,
            isChatActive: false,
            isAnswerConfirmed: false,
            isAnswerSelected: false,
        },
    ];

    beforeEach(async () => {
        socketService = jasmine.createSpyObj('SocketClientService', ['listen']);
        socketService.listen.withArgs('getPlayers').and.returnValue(of(playerList));
        socketService.listen.withArgs('getPlayer').and.returnValue(of(player));
        socketService.listen.withArgs('getPlayerChat').and.returnValue(of(playerChat));
        await TestBed.configureTestingModule({
            providers: [{ provide: SocketClientService, useValue: socketService }],
        })
            .compileComponents()
            .then(() => {
                TestBed.configureTestingModule({});
                service = TestBed.inject(PlayersListService);
                socketService = TestBed.inject(SocketClientService) as jasmine.SpyObj<SocketClientService>;
            });
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should change player for new player when listenning on getPlayer event', () => {
        const playerReceived = {
            name: 'BPlayer',
            points: 150,
            isInPlay: false,
            numberOfBonuses: 0,
            isChatActive: false,
            isAnswerConfirmed: false,
            isAnswerSelected: false,
        };
        socketService.listen.withArgs('getPlayer').and.returnValue(of(playerReceived));
        expect(playerList[1]).toEqual(player);
    });

    it('should call changeElementListOrder when getting sortedPlayers', () => {
        const changeElementListOrderSpy = spyOn(service, 'changeElementListOrder').and.returnValue(playerList);
        const players = service.sortedPlayers;
        expect(changeElementListOrderSpy).toHaveBeenCalled();
        expect(players).toEqual(playerList);
    });

    it('should call changeElementListOrder on element and direction list order change', () => {
        const changeElementListOrderSpy = spyOn(service, 'changeElementListOrder').and.returnValue(playerList);
        service.onListOrderChange();
        expect(changeElementListOrderSpy).toHaveBeenCalled();
    });

    it('should call socketService.listen get players method', () => {
        const getPlayersSpy = socketService.listen.withArgs('getPlayers').and.returnValue(of(playerList));
        expect(getPlayersSpy).toHaveBeenCalled();
    });

    it('should call sortByPlayersName when element to order is name', () => {
        service.selectedElementOrder = 'name';
        const sortByPlayersNameSpy = spyOn(service, 'sortByPlayersName');
        service.changeElementListOrder();
        expect(sortByPlayersNameSpy).toHaveBeenCalledWith(service.isAscendingOrder);
    });

    it('should call sortByPlayersPointing when element to order is pointing', () => {
        service.selectedElementOrder = 'pointing';
        const sortByPlayersPointingSpy = spyOn(service, 'sortByPlayersPointing');
        service.changeElementListOrder();
        expect(sortByPlayersPointingSpy).toHaveBeenCalledWith(service.isAscendingOrder);
    });

    it('should call sortByPlayersState when element to order is playersState', () => {
        service.selectedElementOrder = 'playersState';
        const sortByPlayersStateSpy = spyOn(service, 'sortByPlayersState');
        service.changeElementListOrder();
        expect(sortByPlayersStateSpy).toHaveBeenCalledWith(service.isAscendingOrder);
    });

    it('should call sortByPlayersPointing when element to order is default', () => {
        service.selectedElementOrder = 'invalid';
        const sortByPlayersPointingSpy = spyOn(service, 'sortByPlayersPointing');
        service.changeElementListOrder();
        expect(sortByPlayersPointingSpy).toHaveBeenCalledWith(service.isAscendingOrder);
    });

    it('should return an array of players sorted by names in right order', () => {
        const sortedPlayersDescending = service.sortByPlayersName(false);
        expect(sortedPlayersDescending).toEqual([playerList[3], playerList[0], playerList[1], playerList[2]]);
        const sortedPlayersAscending = service.sortByPlayersName(true);
        expect(sortedPlayersAscending).toEqual([playerList[2], playerList[1], playerList[0], playerList[3]]);
    });

    it('should return an array of players sorted by points in the right order', () => {
        const sortedPlayersDescending = service.sortByPlayersPointing(false);
        expect(sortedPlayersDescending).toEqual([playerList[3], playerList[1], playerList[0], playerList[2]]);
        const sortedPlayersAscending = service.sortByPlayersPointing(true);
        expect(sortedPlayersAscending).toEqual([playerList[2], playerList[0], playerList[1], playerList[3]]);
    });

    it('should handle players with the same points by sorting them by name', () => {
        const players: Player[] = [
            {
                name: 'CPlayer',
                points: 100,
                isInPlay: true,
                numberOfBonuses: 0,
                isChatActive: true,
                isAnswerConfirmed: false,
                isAnswerSelected: true,
            },
            {
                name: 'BPlayer',
                points: 100,
                isInPlay: true,
                numberOfBonuses: 0,
                isChatActive: false,
                isAnswerConfirmed: false,
                isAnswerSelected: false,
            },
            {
                name: 'APlayer',
                points: 100,
                isInPlay: true,
                numberOfBonuses: 0,
                isChatActive: true,
                isAnswerConfirmed: true,
                isAnswerSelected: true,
            },
        ];
        service.playersList = players;
        const sortedPlayersDescending = service.sortByPlayersPointing(false);
        expect(sortedPlayersDescending).toEqual([players[2], players[1], players[0]]);
        const sortedPlayersAscending = service.sortByPlayersPointing(true);
        expect(sortedPlayersAscending).toEqual([players[2], players[1], players[0]]);
    });

    it('should return an array of players sorted by playersState in the right order', () => {
        const sortedPlayersDescending = service.sortByPlayersState(false);
        expect(sortedPlayersDescending).toEqual([playerList[3], playerList[2], playerList[0], playerList[1]]);
        const sortedPlayersAscending = service.sortByPlayersState(true);
        expect(sortedPlayersAscending).toEqual([playerList[1], playerList[0], playerList[2], playerList[3]]);
    });

    it('should return an array of players sorted by name in ascending order if all states are the same', () => {
        const players: Player[] = [
            {
                name: 'CPlayer',
                points: 100,
                isInPlay: true,
                numberOfBonuses: 0,
                isChatActive: true,
                isAnswerConfirmed: true,
                isAnswerSelected: true,
            },
            {
                name: 'BPlayer',
                points: 100,
                isInPlay: true,
                numberOfBonuses: 0,
                isChatActive: true,
                isAnswerConfirmed: true,
                isAnswerSelected: true,
            },
            {
                name: 'APlayer',
                points: 100,
                isInPlay: true,
                numberOfBonuses: 0,
                isChatActive: true,
                isAnswerConfirmed: true,
                isAnswerSelected: true,
            },
        ];
        service.playersList = players;
        const sortedPlayersDescending = service.sortByPlayersState(false);
        expect(sortedPlayersDescending).toEqual([players[2], players[1], players[0]]);
        const sortedPlayersAscending = service.sortByPlayersState(true);
        expect(sortedPlayersAscending).toEqual([players[2], players[1], players[0]]);
    });

    it('should return an array of players sorted by names in ascending order when calling sortListByPlayersNameAndAscending', () => {
        const sortedPlayersAscending = service.sortListByPlayersNameAndAscending(playerList);
        expect(sortedPlayersAscending).toEqual([playerList[2], playerList[1], playerList[0], playerList[3]]);
    });
});
