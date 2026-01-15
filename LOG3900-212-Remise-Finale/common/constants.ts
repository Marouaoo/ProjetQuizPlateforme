export interface IWaitingRoomParameters {
    MIN_CODE: number;
    MAX_CODE: number;
}

export class WaitingRoomParameters {
    static get MIN_CODE(): number {
        return 1000;
    }
    static get MAX_CODE(): number {
        return 9999;
    }
}

export const TIME_LIMIT_DELAY: number = 6000;

export const TIME_REDIRECTION: number = 5000;

export const COUNTDOWN_INTERVAL: number = 1000;

export const MESSAGE_DURATION: number = 3000;

export const TIMEOUT_DELAY: number = 3000;

export const FORBIDDEN_WORD__ERROR_MESSAGE: number = 3000;

export const UPLOAD_DELAY: number = 2000;

export const FOCUS_DELAY: number = 100;

export const TIME_PULSE: number = 500;

export const PERCENT: number = 100;

export const TIME_DASH_OFFSET: number = 100;

export const MINUTE_SECOND: number = 60;

export const MAX_SECONDS: number = 1000;

export const COUNTDOWN_PULSE: number = 6;

export const HALF = 0.5;

export const PERCENTAGE: number = 100;

export const MINUTE: number = 60;

export const TURN_DURATION = 30;

export const DELAY: number = 3;

export const MAX_CHAR: number = 2;

export const SUFFIX_INCREMENT: number = 1;

export const SUFFIX_VALUE: number = 10;

export const DEFAULT_INDEX: number = 0;

export const EMPTY_MESSAGE: number = 0;

export const INCREMENT: number = 1;

export const DECREMENT: number = 1;

export const VISIBLE_AVATARS: number = 5;

export const SCROLL_TO_BOTTOM_DELAY: number = 20;

export const MAX_MESSAGE_LENGTH: number = 200;

export const VICTORY_POINTS: number = 100;

export const AVATAR_PRICE: number = 150;

export const THEME_PRICE: number = 200;

export const MAX_FILE_SZIE: number = 25 * 1024 * 1024;

export const POINTS_INCREMENT: number = 10;

export const TIME_INCREMENT: number = 10;

export const FIRST_RANK: number = 1;

export const SCROLL_SPEED: number = 50;

export const ZERO: number = 0;

export const ONE: number = 1;

export const TWO: number = 2;

export const THREE: number = 3;

export const QUARTER: number = 4;

export const MIN_CHOICES: number = 2;

export const STREAK_MODAL_TIMEOUT: number = 5000;

export const MIN_INPUT_LENGTH: number = 1;

export const MAX_INPUT_LENGTH: number = 4;

export const MIN_PANIC_MODE: number = 10;

export const MAX_PANIC_MODE: number = 20;

export const QRL_MIN_POINTS: number = 50;

export const QRL_MAX_POINTS: number = 100;

export const MAX_PLAYERS: number = 20;
