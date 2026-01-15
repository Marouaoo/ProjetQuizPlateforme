import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ChatroomComponent } from '@app/components/chatroom/chatroom.component';
import { TopbarComponent } from '@app/components/topbar/topbar.component';
import { UserService } from '@app/services/account/user.service';
import { SocketService } from '@app/services/socket-service/socket-service';
import { STREAK_MODAL_TIMEOUT, ZERO } from '@common/constants';
import { ChatEvents } from '@common/events/temp-chat-events';
import { Theme } from '@common/session';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TutorialTrackerService } from '@app/services/tutorialTracker/tutorial-tracker.service';
import { CommonModule } from '@angular/common';

@Component({
    standalone: true,
    imports: [TopbarComponent, ChatroomComponent, RouterModule, TranslateModule, CommonModule],
    selector: 'app-home-page',
    templateUrl: './home-page.component.html',
    styleUrls: ['./home-page.component.scss'],
})
export class HomePageComponent implements OnInit {
    themes = [
        { id: Theme.lightTheme, name: 'Disney classique', preview: 'assets/avatars/mickey_mouse.png' },
        { id: Theme.darkTheme, name: 'Disney classique', preview: 'assets/avatars/ursula.png' },
        { id: Theme.arielTheme, name: 'Disney Ariel', preview: 'assets/avatars/ariel.png' },
        { id: Theme.donaldTheme, name: 'Disney Donald', preview: 'assets/avatars/donald_duck.png' },
        { id: Theme.stitchTheme, name: 'Disney Cendrillon', preview: 'assets/avatars/stitch.png' },
        { id: Theme.cinderellaTheme, name: 'Disney Stitch', preview: 'assets/avatars/cinderella.png' },
    ];
    tutorial: any;

    constructor(
        private readonly socketService: SocketService,
        private readonly translate: TranslateService,
        public readonly userService: UserService,
        public tutorialTrackerService: TutorialTrackerService,
    ) {
        this.translate.setDefaultLang('fr');
        this.translate.use(this.userService.user.language);
    }

    isStreakModalVisible = false;
    streak: number = ZERO;
    bonus: number = ZERO;

    ngOnInit(): void {
        this.socketService.sendMessage(ChatEvents.JoinChatRoom, 'global');

        this.socketService.listen<{ streak: number; bonus: number }>('dailyBonusReceived').subscribe((data) => {
            this.streak = data.streak;
            this.bonus = data.bonus;
            this.isStreakModalVisible = true;

            setTimeout(() => {
                this.isStreakModalVisible = false;
            }, STREAK_MODAL_TIMEOUT);
        });
        this.socketService.sendMessage('askLoginBonus');
    }
}
