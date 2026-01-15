import { Injectable } from '@nestjs/common';

@Injectable()
export class DateService {
    currentTime(): Date {
        return new Date();
    }
}
