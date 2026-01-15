import { COUNTDOWN_INTERVAL } from '@common/constants';
import { CountdownEvents } from '@common/events/countdown.events';
import { QuestionType } from '@common/question';
import { Injectable } from '@nestjs/common';
import { interval, Subscription } from 'rxjs';
import { Server } from 'socket.io';
import { EventEmitter } from 'stream';

export interface Countdown {
    duration: number;
    remaining: number;
    timerSubscription?: Subscription;
    panicMode?: boolean;
}

@Injectable()
export class CountdownService extends EventEmitter {
    private server: Server;
    private readonly countdowns: Map<string, Countdown> = new Map();

    setServer(server: Server) {
        this.server = server;
    }

    getCountdown(gameId: string): Countdown {
        return this.countdowns.get(gameId);
    }

    initCountdown(id: string, duration: number): void {
        if (!this.countdowns.has(id)) {
            const countdown: Countdown = {
                duration: duration,
                remaining: duration,
                panicMode: false,
            };
            this.countdowns.set(id, countdown);
        }
    }

    changeCountdownDuration(id: string, duration: number): void {
        if (this.countdowns.has(id)) {
            this.countdowns.get(id).duration = duration;
        }
    }

    async startNewCountdown(gameId: string, withDelay: boolean): Promise<void> {
        const countdown = this.countdowns.get(gameId);
        if (countdown) {
            this.resetTimerSubscription(gameId);
            countdown.remaining = countdown.duration;
            let delay = withDelay ? 3 : -1;

            countdown.timerSubscription = interval(COUNTDOWN_INTERVAL).subscribe(() => {
                if (delay >= 0) {
                    this.server.to(gameId).emit(CountdownEvents.Delay, delay);
                    if (delay === 0) {
                        this.emit('sendQuestion', gameId);
                    }
                    delay--;
                } else if (countdown.remaining > 0) {
                    this.server.to(gameId).emit(CountdownEvents.SecondPassed, countdown.remaining);
                    countdown.remaining--;
                } else {
                    countdown.duration === 5 ? this.emit('gameStarts', gameId) : this.emit('timeout', gameId);
                }
            });
        }
    }

    activatePanicMode(gameId: string, questionType: QuestionType): void {
        const countdown = this.countdowns.get(gameId);
        if (!countdown || countdown.panicMode) return;

        const minTimeRequired = questionType === QuestionType.QRL ? 20 : 10;
        if (countdown.remaining >= minTimeRequired) {
            countdown.panicMode = true;
            this.resetTimerSubscription(gameId);

            this.server.to(gameId).emit(CountdownEvents.PanicModeActivated);

            countdown.timerSubscription = interval(250).subscribe(() => {
                if (countdown.remaining > 0) {
                    this.server.to(gameId).emit(CountdownEvents.SecondPassed, countdown.remaining);
                    countdown.remaining--;
                } else {
                    countdown.panicMode = false;
                    this.emit('timeout', gameId);
                }
            });
        }
    }

    resumeCountdown(id: string) {
        const countdown = this.countdowns.get(id);
        this.resetTimerSubscription(id);

        countdown.timerSubscription = interval(COUNTDOWN_INTERVAL).subscribe(() => {
            const value = countdown.remaining;
            if (countdown.remaining-- === 0) {
                this.emit('timeout', id);
            } else {
                this.server.to(id).emit(CountdownEvents.SecondPassed, value);
            }
        });
    }

    pauseCountdown(id: string): void {
        const countdown = this.countdowns.get(id);
        if (countdown) {
            this.resetTimerSubscription(id);
            this.server.to(id).emit(CountdownEvents.PauseCountDown, countdown.remaining);
        }
    }

    resetTimerSubscription(id: string): void {
        const countdown = this.countdowns.get(id);
        if (countdown && countdown.timerSubscription) {
            countdown.timerSubscription.unsubscribe();
            countdown.timerSubscription = undefined;
        }
    }

    deleteCountdown(id: string): void {
        const countdown = this.countdowns.get(id);
        if (countdown) {
            this.resetTimerSubscription(id);
            this.countdowns.delete(id);
        }
    }
}
