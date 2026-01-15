import { Injectable } from '@angular/core';
import { CountdownEvents } from '@common/events/countdown.events';
import { BehaviorSubject, Subscription } from 'rxjs';
import { SocketService } from '../socket-service/socket-service';
import { GameCreationEvents } from '@common/game-creation.gateway.events';

@Injectable({
    providedIn: 'root',
})
export class CountdownService {
    private readonly socketSubscription = new Subscription();

    private readonly countdown = new BehaviorSubject<number | null>(null);
    public countdown$ = this.countdown.asObservable();

    private readonly delay = new BehaviorSubject<number | null>(null);
    public delay$ = this.delay.asObservable();

    private readonly startSignal = new BehaviorSubject<boolean>(false);
    public startSignal$ = this.startSignal.asObservable();

    private readonly panicModeSignal = new BehaviorSubject<boolean>(false);
    public panicModeSignal$ = this.panicModeSignal.asObservable();

    startAnsweringCountdown: number;

    private readonly delayFinished = new BehaviorSubject<boolean>(false);
    public delayFinished$ = this.delayFinished.asObservable();

    private readonly timerFinished = new BehaviorSubject<boolean>(false);
    public timerFinished$ = this.timerFinished.asObservable();

    constructor(private readonly socketService: SocketService) {
        this.listenCountdown();
        this.listenForStartTurnDelay();
        this.listenGameClosed();
        this.socketService = socketService;
    }

    listenGameClosed(): void {
        this.socketService.listen(GameCreationEvents.GameClosed).subscribe(() => {
            this.resetCountdowns();
        });
    }

    resetCountdowns(): void {
        this.countdown.next(null);
        this.startSignal.next(false);
        this.delay.next(null);
        this.delayFinished.next(false);
    }

    listenCountdown() {
        this.socketSubscription.add(
            this.socketService.listen<number>(CountdownEvents.SecondPassed).subscribe((remainingTime) => {
                this.countdown.next(remainingTime);
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen('gameCanStart').subscribe(() => {
                this.startSignal.next(true);
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen('timerFinished').subscribe(() => {
                this.timerFinished.next(true);
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen(CountdownEvents.PanicModeActivated).subscribe(() => {
                this.panicModeSignal.next(true);
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen<number>(CountdownEvents.PauseCountDown).subscribe((remaining) => {
                this.countdown.next(remaining);
            }),
        );
    }

    listenForStartTurnDelay() {
        this.socketSubscription.add(
            this.socketService.listen<number>(CountdownEvents.Delay).subscribe((delay) => {
                this.panicModeSignal.next(false);
                this.timerFinished.next(false);
                this.startAnsweringCountdown = delay;
                this.delay.next(delay);
                if (delay === 0) {
                    this.delayFinished.next(true);
                }
            }),
        );
    }
}
