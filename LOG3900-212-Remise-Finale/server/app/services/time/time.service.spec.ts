/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Test, TestingModule } from '@nestjs/testing';
import { TimeService } from './time.service';

describe('TimeService', () => {
    let service: TimeService;

    beforeEach(() => {
        jest.useFakeTimers();
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [TimeService],
        }).compile();

        service = module.get<TimeService>(TimeService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should return the timer value that was set', () => {
        const initialTimerValue = 42;
        service.timer = initialTimerValue;

        const returnedTimerValue = service.getTime();

        expect(returnedTimerValue).toBe(initialTimerValue);
    });

    it('should start the interval', () => {
        const duration = 5;
        service.setInterval(duration);
        expect(service.getTime()).toBe(duration);
        expect(service.intervalId).toBeDefined();
    });

    it('should stop the interval immediately if the duration is 0', () => {
        service.setInterval(1);
        jest.runAllTimers();
        expect(service.intervalId).toBeUndefined();
        expect(service.getTime()).toBe(0);
    });

    it('should execute the callback after the specified delay', async () => {
        jest.setTimeout(5000);

        const delay = 3000;
        let callbackExecuted = false;

        service.setTimeout(async () => {
            callbackExecuted = true;
        });

        jest.advanceTimersByTime(delay);

        expect(callbackExecuted).toBe(true);
    });
});
