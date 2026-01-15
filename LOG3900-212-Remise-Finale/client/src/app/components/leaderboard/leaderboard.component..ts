import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '@app/services/account/user.service';
import { FIRST_RANK } from '@common/constants';
import { Challenge } from '@common/game';
import { Avatar, UserInfo } from '@common/session';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-leaderboard',
    standalone: true,
    imports: [FormsModule, CommonModule, TranslateModule],
    templateUrl: './leaderboard.component.html',
    styleUrl: './leaderboard.component.scss',
})
export class LeaderboardComponent {
    query: string = '';
    searchResults: UserInfo[] = this.users;
    leaderboard: UserInfo[] = [];
    showOnlyFriends: boolean = false;

    constructor(
        public readonly userService: UserService,
        private readonly translate: TranslateService,
    ) {
        this.translate.setDefaultLang('fr');
        this.translate.use(this.userService.user.language);
    }

    avatars: { preview: string; id: Avatar }[] = [
        { preview: 'assets/avatars/ariel.png', id: Avatar.Avatar1 },
        { preview: 'assets/avatars/stitch.png', id: Avatar.Avatar2 },
        { preview: 'assets/avatars/genie.png', id: Avatar.Avatar3 },
        { preview: 'assets/avatars/cinderella.png', id: Avatar.Avatar4 },
        { preview: 'assets/avatars/donald_duck.png', id: Avatar.Avatar5 },
        { preview: 'assets/avatars/jasmine.png', id: Avatar.Avatar6 },
        { preview: 'assets/avatars/mickey_mouse.png', id: Avatar.Avatar7 },
        { preview: 'assets/avatars/snow_white.png', id: Avatar.Avatar8 },
        { preview: 'assets/avatars/simba.png', id: Avatar.Avatar9 },
        { preview: 'assets/avatars/rapunzel.png', id: Avatar.Avatar10 },
    ];

    get users(): UserInfo[] {
        return this.userService.users;
    }

    get filteredLeaderboard(): UserInfo[] {
        this.leaderboard = this.sortUsers();

        let filtered = this.leaderboard;

        if (this.showOnlyFriends) {
            filtered = filtered.filter((u) => this.userService.user.friends.includes(u._id) || this.userService.userId === u._id);
        }
        return filtered.filter((u) => this.searchResults.some((s) => s._id === u._id));
    }

    getUserAvatar(avatar: Avatar): string {
        return avatar ? this.avatars.find((a) => a.id === avatar)?.preview || '' : '';
    }

    sortUsers(): UserInfo[] {
        console.log([...this.users].sort((a, b) => b.score - a.score).map((user) => user.score));
        return [...this.users].sort((a, b) => b.score - a.score);
    }

    getNCompletedChallenge(userId: string, challengeNumber: number): number {
        const user = this.users.find((user) => userId === user._id);
        if (user) {
            if (challengeNumber === 1) {
                return user.challenges.filter((challenge) => challenge === Challenge.challenge1).length;
            } else if (challengeNumber === 2) {
                return user.challenges.filter((challenge) => challenge === Challenge.challenge2).length;
            } else if (challengeNumber === 3) {
                return user.challenges.filter((challenge) => challenge === Challenge.challenge3).length;
            } else if (challengeNumber === 4) {
                return user.challenges.filter((challenge) => challenge === Challenge.challenge4).length;
            } else {
                return user.challenges.filter((challenge) => challenge === Challenge.challenge5).length;
            }
        }
        return 0;
    }

    hasCompletedChallenge(userId: string, challengeNumber: number): boolean {
        const user = this.users.find((user) => userId === user._id);
        if (user) {
            if (challengeNumber === 1) {
                return user.challenges.includes(Challenge.challenge1);
            } else if (challengeNumber === 2) {
                return user.challenges.includes(Challenge.challenge2);
            } else if (challengeNumber === 3) {
                return user.challenges.includes(Challenge.challenge3);
            } else if (challengeNumber === 4) {
                return user.challenges.includes(Challenge.challenge4);
            } else {
                return user.challenges.includes(Challenge.challenge5);
            }
        }
        return false;
    }

    getRankIcon(userId: string): string {
        const sorted = [...this.users].sort((a, b) => b.score - a.score);

        const rankMap = new Map<string, number>();
        let currentRank = FIRST_RANK;
        let scoreToRank = new Map<number, number>();

        for (const user of sorted) {
            if (!scoreToRank.has(user.score)) {
                scoreToRank.set(user.score, currentRank);
                currentRank++;
            }
            rankMap.set(user._id, scoreToRank.get(user.score)!);
        }

        const icons = ['🥇', '🥈', '🥉'];
        const rank = rankMap.get(userId);
        return rank ? (rank <= icons.length ? icons[rank - FIRST_RANK] : '🏅') : '';
    }
}
