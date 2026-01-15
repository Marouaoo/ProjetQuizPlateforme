import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { CountdownService } from '@app/services/countdown/countdown';
import { PlayerService } from '@app/services/player/player.service';
import { Challenge } from '@common/game';
import { UserService } from '@app/services/account/user.service';
import {TranslateModule, TranslateService} from "@ngx-translate/core"; 
import { ZERO } from '@common/constants';

@Component({
    selector: 'app-delay-modal',
    standalone: true,
    imports: [TranslateModule],
    templateUrl: './delay-modal.component.html',
    styleUrl: './delay-modal.component.scss',
})
export class DelayModalComponent {
    @Output() close = new EventEmitter<void>();
    @Input() isHost: boolean;

    isWaitingRoom: boolean = false;
    isGamePage: boolean = false;

    delayMessage: string;
    delay: number | null;

    challenge1 = Challenge.challenge1;
    challenge2 = Challenge.challenge2;
    challenge3 = Challenge.challenge3;
    challenge4 = Challenge.challenge4;
    challenge5 = Challenge.challenge5;

    constructor(
        private readonly countdownService: CountdownService,
        private readonly router: Router,
        public readonly playerService: PlayerService,
        private readonly translate: TranslateService,
        private readonly userService: UserService,
    ) {
        this.countdownService = countdownService;
        this.router = router;
        this.translate.setDefaultLang('fr');
        this.translate.use(this.userService.user.language);
    }

    ngOnInit() {
        if (this.router.url.includes('waitingRoom')) {
            this.isWaitingRoom = true;
        }

        if (this.router.url.includes('game')) {
            this.isGamePage = true;
        }

        if (this.isWaitingRoom) {
            this.delayMessage = "La partie débutera dans ";
        }

        if (this.isGamePage) {
            this.delayMessage = "La prochaine question débute dans ";
        }

        this.countdownService.countdown$.subscribe((value) => {
            this.delay = value;
            if (this.delay === ZERO) {
                this.close.emit();
            }
        });

        this.countdownService.delay$.subscribe((value) => {
            this.delay = value;
        });

        this.countdownService.delayFinished$.subscribe((value) => {
            if (value) this.close.emit();
        });
    }
}
