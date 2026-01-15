/* eslint-disable @typescript-eslint/no-magic-numbers */
import { TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';

import { Game } from '@app/interfaces/game';
import { SocketClientService } from '@app/services/websocket-service/websocket.service';
import { TimeService } from './time.service';

describe('TimeService', () => {
    let service: TimeService;
    let socketService: SocketClientService;
    const TIMEOUT = 5;
    const MS_SECOND = 1000;
    const callback = () => undefined;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [SocketClientService],
        });
        service = TestBed.inject(TimeService);
        socketService = TestBed.inject(SocketClientService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return timer when getTime is called', () => {
        service['timer'] = TIMEOUT;

        const timer = service.getTime();

        expect(timer).toBe(TIMEOUT);
    });

    it('setInterval should start an interval', fakeAsync(() => {
        service.setInterval(TIMEOUT, callback);
        const interval = service['intervalId'];
        expect(interval).toBeTruthy();
        expect(service['timer']).toEqual(TIMEOUT);
        discardPeriodicTasks();
    }));

    it('setInterval should call window.setInterval', fakeAsync(() => {
        const duration = TIMEOUT;

        const spy = spyOn(window, 'setInterval');
        service.setInterval(duration, callback);

        expect(spy).toHaveBeenCalled();
        discardPeriodicTasks();
    }));

    it('interval should reduce time by 1 every second ', fakeAsync(() => {
        service.setInterval(TIMEOUT, callback);
        tick(MS_SECOND);
        expect(service['timer']).toEqual(TIMEOUT - 1);
        tick(MS_SECOND);
        expect(service['timer']).toEqual(TIMEOUT - 2);
        discardPeriodicTasks();
    }));

    it('interval should stop after TIMEOUT seconds ', fakeAsync(() => {
        service.setInterval(TIMEOUT, callback);
        tick(TIMEOUT * MS_SECOND);
        expect(service['timer']).toEqual(0);
        discardPeriodicTasks();
    }));

    it('setInterval should not start a new interval if one exists', fakeAsync(() => {
        service.setInterval(TIMEOUT, callback);
        tick(TIMEOUT);
        const spy = spyOn(window, 'setInterval');
        service.setInterval(TIMEOUT, callback);
        expect(spy).not.toHaveBeenCalled();
        discardPeriodicTasks();
    }));

    it('clearInterval should call window.clearInterval and set intervalId to undefined', fakeAsync(() => {
        const spy = spyOn(window, 'clearInterval');
        service.setInterval(TIMEOUT, callback);
        tick(1);
        expect(service['intervalId']).toBeTruthy();
        service.clearInterval();
        expect(spy).toHaveBeenCalled();
        expect(service['intervalId']).toBeUndefined();
        discardPeriodicTasks();
    }));

    it('setTimeout should call window.setInterval with a delay of 3 seconds', fakeAsync(() => {
        const delay = 3000;
        const spy = spyOn(window, 'setTimeout');
        service.setTimeout(callback);
        expect(spy).toHaveBeenCalledWith(callback, delay);
        discardPeriodicTasks();
    }));

    it('should call socketService.send("pauseTimer") and return false', () => {
        const sendSpy = spyOn(socketService, 'send');
        service.pause();
        expect(sendSpy).toHaveBeenCalledWith('pauseTimer');
    });

    it('should send resumeTimer message if panic mode is off', () => {
        const durationIndex: number[] = [10, 0];
        const panicOn = false;
        const game: Game = {
            id: 'gameId',
            title: 'Test Game',
            description: 'Game description',
            duration: 60,
            lastModification: new Date(),
            isVisible: true,
            questions: [
                {
                    type: 'QCM',
                    text: 'first Question',
                    points: 10,
                    choices: [
                        { text: 'first choice', isCorrect: true },
                        { text: 'second choice', isCorrect: false },
                    ],
                },
                {
                    type: 'QCM',
                    text: 'second Question',
                    points: 20,
                    choices: [
                        { text: 'first choice', isCorrect: false },
                        { text: 'second choice', isCorrect: true },
                    ],
                },
                {
                    type: 'QRL',
                    text: 'third Question',
                    points: 30,
                },
            ],
        };

        const sendSpy = spyOn(socketService, 'send');

        service.resume(durationIndex, panicOn, game);

        expect(sendSpy).toHaveBeenCalledWith('resumeTimer', [10, 'QCM']);
    });

    it('should send panicMode message if panic mode is on', () => {
        const durationIndex: number[] = [5, 0];
        const panicOn = true;
        const game: Game = {
            id: 'gameId',
            title: 'Test Game',
            description: 'Game description',
            duration: 60,
            lastModification: new Date(),
            isVisible: true,
            questions: [
                {
                    type: 'QCM',
                    text: 'first Question',
                    points: 10,
                    choices: [
                        { text: 'first choice', isCorrect: true },
                        { text: 'second choice', isCorrect: false },
                    ],
                },
                {
                    type: 'QCM',
                    text: 'second Question',
                    points: 20,
                    choices: [
                        { text: 'first choice', isCorrect: false },
                        { text: 'second choice', isCorrect: true },
                    ],
                },
                {
                    type: 'QRL',
                    text: 'third Question',
                    points: 30,
                },
            ],
        };

        const sendSpy = spyOn(socketService, 'send');

        service.resume(durationIndex, panicOn, game);

        expect(sendSpy).toHaveBeenCalledWith('panicMode', [5, 'QCM']);
    });

    it('should send panicMode message', () => {
        const durationIndex: number[] = [5, 0];
        const game: Game = {
            id: 'gameId',
            title: 'Test Game',
            description: 'Game description',
            duration: 60,
            lastModification: new Date(),
            isVisible: true,
            questions: [
                {
                    type: 'QCM',
                    text: 'first Question',
                    points: 10,
                    choices: [
                        { text: 'first choice', isCorrect: true },
                        { text: 'second choice', isCorrect: false },
                    ],
                },
                {
                    type: 'QCM',
                    text: 'second Question',
                    points: 20,
                    choices: [
                        { text: 'first choice', isCorrect: false },
                        { text: 'second choice', isCorrect: true },
                    ],
                },
                {
                    type: 'QRL',
                    text: 'third Question',
                    points: 30,
                },
            ],
        };

        const sendSpy = spyOn(socketService, 'send');

        service.panicMode(durationIndex[0], durationIndex[1], game);

        expect(sendSpy).toHaveBeenCalledWith('panicMode', [5, 'QCM']);
    });
});
