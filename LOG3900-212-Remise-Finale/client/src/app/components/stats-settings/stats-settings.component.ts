import { Component } from '@angular/core';
import { UserService } from '@app/services/account/user.service';
import { MAX_SECONDS, PERCENT, ZERO } from '@common/constants';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
    standalone: true,
    imports: [TranslateModule],
    selector: 'app-stats-settings',
    templateUrl: './stats-settings.component.html',
    styleUrls: ['./stats-settings.component.scss'],
})
export class StatsSettingsComponent {
    constructor(
        public readonly userService: UserService,
        private readonly translate: TranslateService,
    ) {
        this.userService = userService;
        this.translate.addLangs(['en', 'fr']);
        this.translate.setDefaultLang('fr');
        this.translate.use(this.userService.user.language);
    }

    getGames(): number {
        return this.userService.user.gameHistory.length;
    }

    getWonGames(): number {
        return this.userService.user.gameHistory.filter((game) => game.winners.includes(this.userService.userId)).length;
    }

    getAverageAnswers() {
        const goodAnswers = this.userService.user.gameHistory.reduce((sum, game) => sum + game.goodAnswers, ZERO);
        const totalQuestions = this.userService.user.gameHistory.reduce((sum, game) => sum + game.nQuestions, ZERO);
        return (goodAnswers / totalQuestions) * PERCENT;
    }

    getAverageTime() {
        const averageSeconds =
            this.userService.user.gameHistory.reduce((sum, game) => sum + this.getDuration(game.start, game.end), ZERO) /
            this.userService.user.gameHistory.length;
        const hours = Math.floor(averageSeconds / 3600);
        const minutes = Math.floor((averageSeconds % 3600) / 60);
        const seconds = Math.floor(averageSeconds % 60);
        if (hours > 0) {
            return `${hours} h ${minutes} min ${seconds} sec`;
        } else {
            return `${minutes} min ${seconds} sec`;
        }
    }

    getDuration(start: Date, end: Date): number {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffInMs = endDate.getTime() - startDate.getTime();
        const totalSeconds = Math.floor(diffInMs / MAX_SECONDS);
        return totalSeconds;
    }
}
