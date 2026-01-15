import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommunicationService } from '@app/services/httpcommunication.service.ts/communication.service';
import { Subscription, firstValueFrom } from 'rxjs';

@Component({
    standalone: true,
    imports: [ FormsModule, CommonModule ],
    selector: 'app-reset-password',
    templateUrl: './reset-password.component.html',
    styleUrls: ['./reset-password.component.scss'],
})
export class PasswordRecoveryComponent {
    @ViewChildren('codeInput') codeInputs!: QueryList<ElementRef>;

    code: string[] = ['', '', '', '', '', ''];
    codeError: string = '';

    step: number = 1;

    email: string = '';
    userId: string = '';
    emailError: string = '';
    newPassword: string = '';
    confirmPassword: string = '';
    passwordError: string = '';
    messageSubscription: Subscription;
    emailValidation = { isValid: false };
    passwordMismatchError: string = '';
    isPasswordVisible: boolean = false;
    isPassword2Visible: boolean = false;

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

    constructor(
        private readonly router: Router,
        private readonly communicationService: CommunicationService,
    ) {}

    moveToNext(event: any, index: number): void {
        const input = event.target;
        const value = input.value.replace(/[^0-9]/g, '');
        input.value = value;

        if (value.length === 1 && index < 6) {
            const nextInput = this.codeInputs.toArray()[index];
            if (nextInput) {
                nextInput.nativeElement.focus();
            }
        }
    }

    async sendRecoveryEmail(): Promise<void> {
        try {
            const userId = await firstValueFrom(this.communicationService.basicGet<string>(`session/${this.email}`));

            if (!userId) {
                this.emailError = "Aucun compte n'est associé à cette adresse courriel";
                return;
            }

            this.userId = userId;
            await firstValueFrom(this.communicationService.basicPost<{ email: string }>(`auth/send-code`, { email: this.email }));

            this.step = 2;
        } catch (error) {
            console.error("Erreur lors de l'envoi du code :", error);
            this.emailError = "Une erreur s'est produite. Veuillez réessayer.";
        }
    }

    isCodeComplete(): boolean {
        return this.code.every((digit) => digit !== '');
    }

    async verifyCode(): Promise<void> {
        try {
            await firstValueFrom(
                this.communicationService.basicPost<{ email: string; code: number }>('auth/verify-code', {
                    email: this.email,
                    code: Number(this.code.join('')),
                }),
            );
            this.codeError = '';
            this.step = 3;
        } catch (error) {
            this.codeError = 'Erreur inattendue, veuillez réessayer plus tard...';
            if (error instanceof HttpErrorResponse && error.error) {
                try {
                    const errorObj = typeof error.error === 'string' ? JSON.parse(error.error) : error.error;
                    if (errorObj && typeof errorObj.message === 'string') {
                        this.codeError = errorObj.message;
                    } else if (errorObj && Array.isArray(errorObj.message)) {
                        this.codeError = errorObj.message.join(' ');
                    }
                } catch (e) {
                    console.error('Erreur lors du parsing JSON :', e);
                }
            }
        }
    }
    onPasswordChange(value: string): void {
        this.newPassword = value;
        this.updatePasswordValidation(value);
    }

    onPassword2Change(value: string): void {
        this.confirmPassword = value;
        this.passwordMismatchError = this.newPassword !== value ? 'Les mots de passe ne correspondent pas' : '';
    }

    updatePasswordValidation(password: string): void {
        this.passwordValidation.hasUpperCase = this.passwordRegExps.upperCase.test(password);
        this.passwordValidation.hasNumber = this.passwordRegExps.number.test(password);
        this.passwordValidation.hasSpecialChar = this.passwordRegExps.specialChar.test(password);
        this.passwordValidation.isValidLength = this.passwordRegExps.minLength.test(password);
    }

    togglePasswordVisibility(): void {
        this.isPasswordVisible = !this.isPasswordVisible;
    }

    togglePassword2Visibility(): void {
        this.isPassword2Visible = !this.isPassword2Visible;
    }

    canResetPassword(): boolean {
        return (
            this.passwordValidation.hasUpperCase &&
            this.passwordValidation.hasNumber &&
            this.passwordValidation.hasSpecialChar &&
            this.passwordValidation.isValidLength &&
            this.newPassword === this.confirmPassword
        );
    }

    async resetPassword(): Promise<void> {
        if (!this.canResetPassword()) {
            this.passwordError = 'Le mot de passe ne respecte pas les critères ou ne correspond pas';
            return;
        }
        try {
            await firstValueFrom(
                this.communicationService.basicPut<{ id: string; newPassword: string }>('auth/modify-pw', {
                    id: this.userId,
                    newPassword: this.newPassword,
                }),
            );
            this.router.navigate(['/']);
        } catch (error) {
            this.passwordError = 'Erreur inattendue, veuillez réessayer plus tard...';
            if (error instanceof HttpErrorResponse && error.error) {
                try {
                    const errorObj = typeof error.error === 'string' ? JSON.parse(error.error) : error.error;
                    if (errorObj && typeof errorObj.message === 'string') {
                        this.passwordError = errorObj.message;
                    } else if (errorObj && Array.isArray(errorObj.message)) {
                        this.passwordError = errorObj.message.join(' ');
                    }
                } catch (e) {
                    console.error('Erreur lors du parsing JSON :', e);
                }
            }
        }
    }

    validateEmail(email: string): void {
        if (this.email === '') {
            this.emailValidation.isValid = false;
        } else {
            this.emailValidation.isValid = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/.test(email);
            if (this.emailValidation.isValid === false) {
                this.emailError = 'Format de courriel invalide';
            } else {
                this.emailError = '';
            }
        }
    }

    onEmailChange(value: string): void {
        this.email = value;
        this.validateEmail(value);
    }
}
