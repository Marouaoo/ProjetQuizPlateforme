import { Injectable } from '@nestjs/common/decorators';

@Injectable()
export class TimeService {
    timer: number;
    intervalId;
    private readonly tick = 1000;
    private readonly delay = 3000;

    getTime(): number {
        return this.timer;
    }

    setInterval(duration: number) {
        if (!this.intervalId) {
            this.timer = duration;
            this.intervalId = setInterval(() => {
                this.timer--;
                if (this.timer <= 0) {
                    clearInterval(this.intervalId);
                    this.intervalId = undefined;
                }
            }, this.tick);
        }
    }

    setTimeout(callback: () => void) {
        setTimeout(callback, this.delay);
    }
}
