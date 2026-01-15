import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule } from '@angular/forms';
import { UserService } from '@app/services/account/user.service';
import { SocketService } from '@app/services/socket-service/socket-service';
import { DECREMENT, DEFAULT_INDEX, INCREMENT, VISIBLE_AVATARS, ZERO } from '@common/constants';
import { Avatar } from '@common/session';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-create-account-page',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './create-account-page.component.html',
    styleUrls: ['./create-account-page.component.scss'],
})
export class CreateAccountPageComponent implements OnInit {
    email = this.userService.user.email;
    username = this.userService.user.username;
    password = this.userService.user.password;

    password2: string = '';

    passwordMismatchError: string = '';
    emailError: string = '';
    usernameError: string = '';

    isButtonEnabled: boolean = false;

    isEmailAvailable = false;
    isUsernameAvailable = false;

    isPasswordVisible: boolean = false;
    isPassword2Visible: boolean = false;

    messageSubscription: Subscription;

    registerForm = new FormGroup({
        email: new FormControl<string>('', [Validators.pattern(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/)]),
        username: new FormControl<string>(''),
        password: new FormControl<string>('', [Validators.pattern(/^(?=[^A-Z]*[A-Z])(?=\D*\d)(?=.*[!@#$%^&*]).{6,}$/)]),
    });

    constructor(
        private readonly userService: UserService,
        private readonly socketService: SocketService,
    ) {
        this.updateVisibleAvatars();
    }

    ngOnInit(): void {
        this.messageSubscription = this.socketService.listen<boolean>('emailAvailability').subscribe((isEmailAvailable) => {
            this.isEmailAvailable = isEmailAvailable;
            if (!this.isEmailAvailable) {
                this.emailError = 'Cet email est déjà utilisé';
            } else {
                this.emailError = '';
            }
            this.checkFormCompletion();
        });

        this.messageSubscription = this.socketService.listen<boolean>('usernameAvailability').subscribe((isUsernameAvailable) => {
            this.isUsernameAvailable = isUsernameAvailable;
            if (!this.isUsernameAvailable) {
                this.usernameError = 'Ce pseudonyme est déjà pris';
            } else {
                this.usernameError = '';
            }
            this.checkFormCompletion();
        });
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
    ];

    startIndex: number = DEFAULT_INDEX;
    visibleAvatars: { preview: string; id: Avatar }[] = [];
    selectedAvatar: number = DEFAULT_INDEX;

    emailValidation = { 
        hasFirstChar: false,
        hasAtSymbol: false,
        hasSecondPart: false,
        hasDot: false,
        hasEnd: false,
    };

    passwordValidation = {
        hasUpperCase: false,
        hasNumber: false,
        hasSpecialChar: false,
        isValidLength: false,
    };

    passwordRegExps = {
        upperCase: /[A-Z]/,
        number: /\d/,
        specialChar: /[!@#$%^&*]/,
        minLength: /.{6,}/,
    };

    emailValidationRegExp = {
        hasFirstChar: /[a-zA-Z]/,
        hasAtSymbol: /@/,
        hasSecondPart: /\.[a-zA-Z]{2,}/,
        hasDot: /\./,
        hasEnd: /.[a-z]{2,4}/,
    }

    checkFormCompletion(): void {
        this.isButtonEnabled =
            this.userService.user.email.trim() !== '' &&
            this.userService.user.username.trim() !== '' &&
            this.userService.user.password.trim() !== '' &&
            this.password2.trim() !== '' &&
            this.isEmailAvailable &&
            this.isUsernameAvailable;
    }

    onEmailChange(value: string): void {
        this.email = value;
        this.userService.user.email = value;
        this.socketService.sendMessage<string>('isEmailAvailable', this.email);
        this.checkFormCompletion();
    }

    onUsernameChange(value: string): void {
        this.username = value;
        this.userService.user.username = value;
        this.socketService.sendMessage<string>('isUsernameAvailable', this.username);
        this.checkFormCompletion();
    }

    onPasswordChange(value: string): void {
        this.password = value;
        this.userService.user.password = value;
        this.updatePasswordValidation(value);
        this.checkFormCompletion();
    }

    onPassword2Change(value: string): void {
        this.password2 = value;
        this.updatePasswordMatch(value);
        this.checkFormCompletion();
    }

    validateEmail(email: string): void {
        if (email.length === ZERO) {
            this.emailError = '';
        } 
        if (email.length > ZERO && this.emailValidationRegExp.hasFirstChar.test(email) && 
            this.emailValidationRegExp.hasAtSymbol.test(email) && this.emailValidationRegExp.hasSecondPart.test(email) && 
            this.emailValidationRegExp.hasDot.test(email) && this.emailValidationRegExp.hasEnd.test(email)) {
            this.emailValidation.hasFirstChar = true;
            this.emailValidation.hasAtSymbol = true;
            this.emailValidation.hasSecondPart = true;
            this.emailValidation.hasDot = true;
            this.emailValidation.hasEnd = true;
            this.emailError = '';
        } else {
                this.emailError = 'Format de courriel invalide';
        }
    }

    updatePasswordValidation(password: string): void {
        this.passwordValidation.hasUpperCase = this.passwordRegExps.upperCase.test(password);
        this.passwordValidation.hasNumber = this.passwordRegExps.number.test(password);
        this.passwordValidation.hasSpecialChar = this.passwordRegExps.specialChar.test(password);
        this.passwordValidation.isValidLength = this.passwordRegExps.minLength.test(password);
    }

    updatePasswordMatch(password2: string): void {
        if (this.userService.user.password !== password2 && password2 !== '') {
            this.passwordMismatchError = 'Les mots de passe ne correspondent pas';
        } else {
            this.passwordMismatchError = '';
        }
        this.checkFormCompletion();
    }

    updateVisibleAvatars() {
        const endIndex = this.startIndex + VISIBLE_AVATARS;
        this.visibleAvatars = this.avatars.slice(this.startIndex, Math.min(endIndex, this.avatars.length));
    }

    scrollAvatars(direction: string): void {
        if (direction === 'left' && this.startIndex > DEFAULT_INDEX) {
            this.startIndex -= DECREMENT;
        } else if (direction === 'right' && this.startIndex + VISIBLE_AVATARS < this.avatars.length) {
            this.startIndex += INCREMENT;
        }
        this.updateVisibleAvatars();
    }

    selectAvatar(selectedAvatar: number): void {
        const actualIndex = this.startIndex + selectedAvatar;
        this.selectedAvatar = actualIndex;
        this.userService.user.avatar = this.avatars[actualIndex].id;
    }

    async register(): Promise<void> {
        this.isButtonEnabled = false;
        const errorMessage = await this.userService.register();
        if (errorMessage === 'Cet email est déjà utilisé') {
            this.emailError = 'Cet email est déjà utilisé';
            this.userService.user.password = '';
            this.password = '';
            this.password2 = '';
            this.isButtonEnabled = true;
        } else if (errorMessage === 'Ce pseudonyme est déjà pris') {
            this.usernameError = errorMessage;
            this.userService.user.password = '';
            this.password = '';
            this.password2 = '';
            this.isButtonEnabled = true;
        }
    }

    togglePasswordVisibility(): void {
        this.isPasswordVisible = !this.isPasswordVisible;
    }

    togglePassword2Visibility(): void {
        this.isPassword2Visible = !this.isPassword2Visible;
    }
}
