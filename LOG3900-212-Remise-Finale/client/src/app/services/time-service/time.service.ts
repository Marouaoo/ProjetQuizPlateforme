import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Game } from '@app/interfaces/game';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { SocketService } from '../socket-service/socket-service';

@Injectable({
    providedIn: 'root',
})
export class TimeService {
    showCountdown: boolean = false;
    countdownSubject: BehaviorSubject<number> = new BehaviorSubject<number>(0);
    countdown$: Observable<number> = this.countdownSubject.asObservable();
    private countdownSubscription: Subscription;
    private timer: number = 0;
    private intervalId: number | undefined;
    private readonly tick = 1000;
    private readonly delay = 3000;

    constructor(
        private socketService: SocketService,
        private ngZone: NgZone,
        private router: Router,
    ) {}

    getTime(): number {
        return this.timer;
    }

    startCountdown(navigateTo: string) {
        this.countdownSubscription = this.socketService.listen('countdown').subscribe((countdown: unknown) => {
            this.showCountdown = true;
            const countdownValue = countdown as number;
            if (countdownValue === 0) {
                this.showCountdown = false;
                this.ngZone.run(() => {
                    this.countdownSubscription.unsubscribe();
                    this.router.navigate([navigateTo]);
                });
            } else {
                this.countdownSubject.next(countdownValue);
            }
        });
        return this.countdownSubscription;
    }

    setInterval(duration: number, callback: () => void) {
        if (!this.intervalId) {
            this.timer = duration;
            this.intervalId = window.setInterval(() => {
                this.timer--;
                callback();
            }, this.tick);
        }
    }

    clearInterval() {
        window.clearInterval(this.intervalId);
        this.intervalId = undefined;
    }

    setTimeout(callback: () => void) {
        window.setTimeout(callback, this.delay);
    }

    pause(): boolean {
        this.socketService.sendMessage('pauseTimer');
        return true;
    }

    resume(durationIndex: number[], panicOn: boolean, playingGame: Game): boolean {
        const questionType = playingGame.questions[durationIndex[1]].type;
        if (!panicOn) this.socketService.sendMessage('resumeTimer', [durationIndex[0], questionType]);
        else this.socketService.sendMessage('panicMode', [durationIndex[0], questionType]);
        return false;
    }

    panicMode(duration: number, index: number, playingGame: Game) {
        const type = playingGame.questions[index].type;
        this.socketService.sendMessage('panicMode', [duration, type]);
    }
}
