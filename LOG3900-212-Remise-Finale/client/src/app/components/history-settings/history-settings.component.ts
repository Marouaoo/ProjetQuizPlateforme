import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { UserService } from '@app/services/account/user.service';
import { GameService } from '@app/services/game/game.service';
import { MAX_SECONDS } from '@common/constants';
import { ConnectionEvent } from '@common/session';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
    standalone: true,
    imports: [CommonModule, TranslateModule],
    selector: 'app-history-settings',
    templateUrl: './history-settings.component.html',
    styleUrls: ['./history-settings.component.scss'],
})
export class HistorySettingsComponent {
    constructor(
        public readonly userService: UserService,
        public readonly gameService: GameService,
        private readonly translate: TranslateService,
    ) {
        this.userService = userService;
        this.gameService = gameService;
        this.translate.setDefaultLang('fr');
        this.translate.use(this.userService.user.language);
    }
    connection = ConnectionEvent.CONNECTION;
    disconnection = ConnectionEvent.DISCONNECTION;

    getDuration(start: Date, end: Date): string {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffInMs = endDate.getTime() - startDate.getTime();
        const totalSeconds = Math.floor(diffInMs / MAX_SECONDS);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);
        if (hours > 0) {
            return `${hours} h ${minutes} min ${seconds} sec`;
        } else {
            return `${minutes} min ${seconds} sec`;
        }
    }

    getUsername(userId: string) {
        return this.userService.users.find((user) => user._id === userId)?.username
            ? this.userService.users.find((user) => user._id === userId)?.username
            : 'Anonym player';
    }
}
