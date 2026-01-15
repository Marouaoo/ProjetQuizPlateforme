import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '@app/services/account/user.service';
import { SocketService } from '@app/services/socket-service/socket-service';
import { FIRST_RANK } from '@common/constants';
import { Challenge } from '@common/game';
import { Avatar, UserInfo } from '@common/session';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-friends',
    standalone: true,
    imports: [FormsModule, CommonModule, TranslateModule],
    templateUrl: './friends.component.html',
    styleUrl: './friends.component.scss',
})
export class FriendsComponent implements OnInit {
    query: string = '';
    searchResults: UserInfo[] = [];
    leaderboard: UserInfo[] = [];
    showOnlyFriends: boolean = false;
    sortActive: boolean = false;
    otherUsers: UserInfo[] = [];

    constructor(
        public readonly userService: UserService,
        private readonly socketService: SocketService,
        private readonly translate: TranslateService,
    ) {
        this.translate.setDefaultLang('fr');
        this.translate.use(this.userService.user.language);
        this.searchResults = this.userService.users.filter((user) => user._id !== this.userService.userId);
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

    toggleSort(): void {
        this.sortActive = !this.sortActive;
    }

    get users(): UserInfo[] {
        this.otherUsers = this.userService.users.filter((user) => user._id !== this.userService.userId);
        return this.otherUsers;
    }

    get requests(): UserInfo[] {
        return this.users.filter(
            (user) =>
                (this.userService.user.friendRequestsReceived.includes(user._id) ||
                    this.userService.user.friendRequestsSent.includes(user._id) ||
                    this.userService.user.friends.includes(user._id)) &&
                (this.searchResults.some((u) => u._id === user._id) ?? true),
        );
    }

    get filteredLeaderboard(): UserInfo[] {
        if (this.sortActive) {
            this.leaderboard = this.sortUsers();
        } else {
            this.leaderboard = this.users;
        }

        let filtered = this.leaderboard;

        if (this.showOnlyFriends) {
            filtered = filtered.filter((u) => this.userService.user.friends.includes(u._id) || this.userService.userId === u._id);
        }
        return filtered.filter((u) => this.searchResults.some((s) => s._id === u._id));
    }

    getUserAvatar(avatar: Avatar): string {
        return avatar ? this.avatars.find((a) => a.id === avatar)?.preview || '' : '';
    }

    ngOnInit(): void {
        this.socketService.listen<UserInfo[]>('searchResults').subscribe((users: UserInfo[]) => {
            this.searchResults = users;
        });

        this.socketService.listen<string>('friendRequestReceived').subscribe((userId) => {
            this.userService.user.friendRequestsReceived.push(userId);
        });

        this.socketService.listen<string>('friendRequestCancelled').subscribe((userId) => {
            this.userService.user.friendRequestsReceived = this.userService.user.friendRequestsReceived.filter((user) => user !== userId);
        });

        this.socketService.listen<string>('friendRequestAccepted').subscribe((userId) => {
            this.userService.user.friends.push(userId);
            this.userService.user.friendRequestsSent = this.userService.user.friendRequestsSent.filter((user) => user !== userId);
        });

        this.socketService.listen<string>('friendRequestRejected').subscribe((userId) => {
            this.userService.user.friendRequestsSent = this.userService.user.friendRequestsSent.filter((user) => user !== userId);
        });

        this.socketService.listen<string>('lostFriend').subscribe((userId) => {
            this.userService.user.friends = this.userService.user.friends.filter((user) => user !== userId);
        });
    }

    async onSearch() {
        if (this.query.trim() === '') {
            this.searchResults = this.users;
            return;
        }
        this.socketService.sendMessage<{ query: string; userId: string }>('searchUsers', {
            query: this.query.trim(),
            userId: this.userService.userId,
        });
    }

    sortUsers(): UserInfo[] {
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

    addFriend(userId: string) {
        if (!this.userService.user.friendRequestsSent.includes(userId)) {
            this.socketService.sendMessage<{ senderId: string; receiverId: string }>('sendFriendRequest', {
                senderId: this.userService.userId,
                receiverId: userId,
            });
            this.userService.user.friendRequestsSent.push(userId);
        }
    }

    acceptRequest(userId: string) {
        if (this.userService.user.friendRequestsReceived.includes(userId)) {
            this.socketService.sendMessage<{ userId: string; requesterId: string }>('acceptFriendRequest', {
                userId: this.userService.userId,
                requesterId: userId,
            });

            this.userService.user.friendRequestsReceived = this.userService.user.friendRequestsReceived.filter((id) => id !== userId);

            if (!this.userService.user.friends.includes(userId)) {
                this.userService.user.friends.push(userId);
            }
        }
    }

    denyRequest(userId: string) {
        if (this.userService.user.friendRequestsReceived.includes(userId)) {
            this.socketService.sendMessage<{ userId: string; requesterId: string }>('rejectFriendRequest', {
                userId: this.userService.userId,
                requesterId: userId,
            });

            this.userService.user.friendRequestsReceived = this.userService.user.friendRequestsReceived.filter((id) => id !== userId);
        }
    }

    removeFriend(userId: string) {
        if (this.userService.user.friends.includes(userId)) {
            this.socketService.sendMessage<{ userId: string; friendId: string }>('removeFriend', {
                userId: this.userService.userId,
                friendId: userId,
            });

            this.userService.user.friends = this.userService.user.friends.filter((id) => id !== userId);
        }
    }

    cancelRequest(userId: string) {
        if (this.userService.user.friendRequestsSent.includes(userId)) {
            this.socketService.sendMessage<{ senderId: string; receiverId: string }>('cancelFriendRequest', {
                senderId: this.userService.userId,
                receiverId: userId,
            });

            this.userService.user.friendRequestsSent = this.userService.user.friendRequestsSent.filter((id) => id !== userId);
        }
    }
}
