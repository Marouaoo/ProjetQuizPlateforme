import { Component, HostListener } from '@angular/core';
import { UserService } from '@app/services/account/user.service';
import { Avatar } from '@common/session';
import { UserAccountComponent } from '../user-account/user-account.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FriendsComponent } from '../friends/friends.component';
import {TranslateModule, TranslateService} from "@ngx-translate/core";
import { LeaderboardComponent } from '../leaderboard/leaderboard.component.';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [UserAccountComponent, CommonModule, RouterModule, FriendsComponent, TranslateModule, LeaderboardComponent ],
    templateUrl: './topbar.component.html',
    styleUrls: ['./topbar.component.scss'],
})
export class TopbarComponent {
    isUserAccountOpen: boolean = false;
    isFriendsOpen: boolean = false;
    isLeaderboardOpen: boolean = false;

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

    constructor(
        public readonly userService: UserService,
        private readonly translate: TranslateService,
    ) {
        this.userService = userService;
        this.translate.setDefaultLang('fr');
        this.translate.use(this.userService.user.language);
    }

    getUserAvatar(avatar: Avatar): string {
        return avatar ? this.avatars.find((a) => a.id === avatar)?.preview || '' : '';
    }

    openUserAccount(): void {
        this.isUserAccountOpen = true;
    }

    openFriends(): void {
        this.isFriendsOpen = true;
    }

    openLeaderboard(): void {
        this.isLeaderboardOpen = true;
    }

    @HostListener('document:click', ['$event'])
    onClick(event: MouseEvent): void {
        const target = event.target as Node;

        const clickedInsideTopbar = document.getElementById('topbar')?.contains(target);
        const clickedUserAccount = document.getElementById('user-account-container')?.contains(target);
        const clickedFriends = document.getElementById('friends-container')?.contains(target);
        const clickedLeaderboard = document.getElementById('leaderboard-container')?.contains(target);

        const clickedInside = clickedInsideTopbar || clickedUserAccount || clickedFriends || clickedLeaderboard;

        if (!clickedInside) {
            this.isUserAccountOpen = false;
            this.isFriendsOpen = false;
            this.isLeaderboardOpen = false;
        }
    }
}
