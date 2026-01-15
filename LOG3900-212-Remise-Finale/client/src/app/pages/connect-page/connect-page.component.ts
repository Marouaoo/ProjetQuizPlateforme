import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '@app/services/account/user.service';
import { SocketService } from '@app/services/socket-service/socket-service';
import { Session } from '@common/session';
import { Subscription } from 'rxjs';

@Component({
    standalone: true,
    imports: [ CommonModule, FormsModule ],
    selector: 'app-connect-page',
    templateUrl: './connect-page.component.html',
    styleUrls: ['./connect-page.component.scss'],
})
export class ConnectPageComponent implements OnInit {
    username: string = '';
    password: string = '';
    isButtonEnabled: boolean = false;
    authenticationError: string = '';
    isPasswordVisible: boolean = false;
    messageSubscription: Subscription;

    constructor(
        private readonly router: Router,
        private readonly userService: UserService,
        private readonly socketService: SocketService,
    ) {
        this.router = router;
        this.userService = userService;
    }

    ngOnInit(): void {
        if (this.userService.userId) {
            this.router.navigate(['/homePage']);
        }

        this.messageSubscription = this.socketService.listen<{ message: string }>('authenticationError').subscribe((error) => {
            this.authenticationError = error.message;
            this.isButtonEnabled = true;
        });
    }

    checkFormCompletion(): void {
        this.isButtonEnabled = this.username.trim() !== '' && this.password.trim() !== '';
    }

    onUsernameChange(value: string): void {
        this.userService.user.username = value;
        this.checkFormCompletion();
    }

    onPasswordChange(value: string): void {
        this.userService.user.password = value;
        this.checkFormCompletion();
    }

    togglePasswordVisibility(): void {
        this.isPasswordVisible = !this.isPasswordVisible;
    }

    forgottenPassword(): void {
        this.router.navigate(['/reset-password']);
    }

    login(): void {
        const session: Session = {
            username: this.username,
            password: this.password,
        };
        this.socketService.sendMessage<Session>('login', session);
    }

    createAccount(): void {
        this.router.navigate(['/createAccount']);
    }
}
