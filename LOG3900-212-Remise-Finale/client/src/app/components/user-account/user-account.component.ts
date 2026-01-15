import { Component } from '@angular/core';
import { UserService } from '@app/services/account/user.service';
import { SocketService } from '@app/services/socket-service/socket-service';
import { Router, RouterModule } from '@angular/router';
import { Status } from '@common/session';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {TranslateModule, TranslateService} from "@ngx-translate/core";

@Component({
    selector: 'app-user-account',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
    templateUrl: './user-account.component.html',
    styleUrls: ['./user-account.component.scss'],
})
export class UserAccountComponent {
    statusOptions: Status[] = [Status.Connected, Status.Occupied, Status.Disconnected];
    status: Status = this.userService.user.status;

    constructor(
        public readonly userService: UserService,
        public readonly socketService: SocketService,
        private readonly router: Router,
        private readonly translate: TranslateService,
    ) {
        this.userService = userService;
        this.socketService = socketService;
        this.socketService.connect();
        this.translate.setDefaultLang('fr');
        this.translate.use(this.userService.user.language);
    }

    async changeStatus(status: Status): Promise<void> {
        this.userService.user.status = status;
        this.socketService.sendMessage('updateStatus', { userId: this.userService.userId, status: this.userService.user.status });
    }

    async logout(): Promise<void> {
        this.socketService.sendMessage('logout', this.userService.userId);
        this.router.navigate(['/']);
    }
}
