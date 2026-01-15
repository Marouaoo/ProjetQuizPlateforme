import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '@app/services/account/user.service';
import { CommunicationService } from '@app/services/httpcommunication.service.ts/communication.service';
import { SocketService } from '@app/services/socket-service/socket-service';
import { Avatar, Language, Theme } from '@common/session';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AVATAR_PRICE, MESSAGE_DURATION, THEME_PRICE } from '@common/constants'; 

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule],
    selector: 'app-account-settings',
    templateUrl: './account-settings.component.html',
    styleUrls: ['./account-settings.component.scss'],
})
export class AccountSettingsComponent {
    username: string = this.userService.user.username;
    avatar: Avatar = this.userService.user.avatar;
    newPassword: string = '';

    ClearTheme = Theme.lightTheme;
    DarkTheme = Theme.darkTheme;
    Theme3 = Theme.arielTheme;
    Theme4 = Theme.donaldTheme;
    Theme5 = Theme.stitchTheme;
    Theme6 = Theme.cinderellaTheme;

    fr = Language.french;
    en = Language.english;

    languageOptions: Language[] = [Language.french, Language.english];
    language: Language = this.userService.user.language;

    themeOptions: Theme[] = [Theme.lightTheme, Theme.darkTheme, Theme.arielTheme, Theme.donaldTheme, Theme.stitchTheme, Theme.cinderellaTheme];
    selectedTheme: Theme = this.userService.user.theme;

    private readonly unsubscribe$ = new Subject<void>();
    messageSubscription: Subscription;

    isUsernameAvailable = true;
    usernameError: string = '';

    successMessage: string = '';
    errorMessage: string = '';

    isEditingPassword: boolean = false;
    isEditingUsername: boolean = false;

    isPasswordVisible: boolean = false;

    modalOpen: boolean = false;
    purchaseAvatarId: Avatar | null;
    purchaseThemeId: Theme | null;

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

    themes = [
        { id: Theme.lightTheme, name: 'Disney classique', preview: 'assets/avatars/mickey_mouse.png' },
        { id: Theme.darkTheme, name: 'Disney classique', preview: 'assets/avatars/ursula.png' },
        { id: Theme.arielTheme, name: 'Disney Ariel', preview: 'assets/avatars/ariel.png' },
        { id: Theme.donaldTheme, name: 'Disney Donald', preview: 'assets/avatars/donald_duck.png' },
        { id: Theme.stitchTheme, name: 'Disney Cendrillon', preview: 'assets/avatars/stitch.png' },
        { id: Theme.cinderellaTheme, name: 'Disney Stitch', preview: 'assets/avatars/cinderella.png' },
    ];

    constructor(
        public readonly userService: UserService,
        private readonly communicationService: CommunicationService,
        private readonly socketService: SocketService,
        private readonly translate: TranslateService,
    ) {
        this.messageSubscription = this.socketService
            .listen<boolean>('usernameAvailability')
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((isUsernameAvailable) => {
                this.isUsernameAvailable = isUsernameAvailable;
                this.usernameError = isUsernameAvailable ? '' : 'Ce pseudonyme est déjà pris';
            });
        this.translate.addLangs(['en', 'fr']);
        this.translate.setDefaultLang('fr');
        this.translate.use(this.userService.user.language);
    }

    togglePasswordVisibility() {
        this.isPasswordVisible = !this.isPasswordVisible;
    }

    buyAvatar(avatarId: Avatar) {
        if (this.userService.user.avatarsAquired.includes(avatarId)) {
            this.modifyAvatar(avatarId);
        } else {
            this.purchaseAvatarId = avatarId;
            this.modalOpen = true;
        }
    }

    buyTheme(themeId: Theme) {
        if (this.userService.user.themesAquired.includes(themeId)) {
            this.modifyTheme(themeId);
        } else {
            this.purchaseThemeId = themeId;
            this.modalOpen = true;
        }
    }

    private showConfirmationMessage(message: string) {
        this.successMessage = message;
        this.errorMessage = '';
        setTimeout(() => (this.successMessage = ''), MESSAGE_DURATION);
    }

    private showErrorMessage(message: string) {
        this.errorMessage = message;
        this.successMessage = '';
        setTimeout(() => (this.errorMessage = ''), MESSAGE_DURATION);
    }

    enablePasswordEdit() {
        this.isEditingPassword = true;
        this.newPassword = '';
    }

    enableUsernameEdit() {
        this.isEditingUsername = true;
    }

    saveNewPassword() {
        if (!this.newPassword) return;
        this.communicationService
            .basicPut(`auth/modify-pw`, { id: this.userService.userId, newPassword: this.newPassword })
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe({
                next: () => {
                    this.isEditingPassword = false;
                    this.newPassword = '';
                    this.showConfirmationMessage('Votre mot de passe a bien été modifié ✅');
                },
                error: () => this.showErrorMessage('Erreur lors de la modification du mot de passe ❌'),
            });
    }

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

    getUserAvatar(avatar: Avatar): string {
        if (avatar) {
            const avatarPreview = this.avatars.find((a) => a.id === avatar)?.preview;
            if (avatarPreview) {
                return avatarPreview;
            } else {
                return '';
            }
        } else {
            return '';
        }
    }

    modifyAvatar(avatar: Avatar) {
        if (this.userService.user.avatarsAquired.includes(avatar)) {
            this.communicationService
                .basicPatch(`session/update-avatar`, { userId: this.userService.userId, newAvatar: avatar })
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe({
                    next: () => {
                        this.userService.user.avatar = avatar;
                        this.avatar = avatar;
                        this.showConfirmationMessage('Votre avatar a bien été modifié ✅');
                    },
                    error: () => this.showErrorMessage("Erreur lors de la modification de l'avatar ❌"),
                });
        } else if (this.userService.user.money >= AVATAR_PRICE) {
            this.buyAvatar(avatar);
        } else {
            this.showErrorMessage("Vous n'avez pas assez de fonds pour acheter cet avatar ❌");
        }
    }

    modifyUsername() {
        if (!this.isUsernameAvailable) return;
        this.communicationService
            .basicPatch(`session/update-username`, { userId: this.userService.userId, newUsername: this.username })
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe({
                next: () => {
                    this.userService.user.username = this.username;
                    this.isEditingUsername = false;
                    this.showConfirmationMessage("Votre nom d'utilisateur a bien été modifié ✅");
                },
                error: () => this.showErrorMessage("Erreur lors de la modification du nom d'utilisateur ❌"),
            });
    }

    onUsernameChange(): void {
        if (this.username === this.userService.user.username) {
            this.isUsernameAvailable = true;
        }
        this.socketService.sendMessage<string>('isUsernameAvailable', this.username);
    }

    switchLanguage(language: Language) {
        this.communicationService
            .basicPatch(`session/update-language`, { userId: this.userService.userId, newLanguage: language })
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe({
                next: () => {
                    this.showConfirmationMessage('Votre langue a bien été modifiée ✅');
                    this.userService.user.language = language;
                },
                error: () => this.showErrorMessage('Erreur lors de la modification de la langue ❌'),
            });

        this.userService.user.language = language;
        this.translate.use(language);
    }

    modifyTheme(theme: Theme) {
       if (this.userService.user.themesAquired.includes(theme)) {
            this.communicationService
                .basicPatch(`session/update-theme`, { userId: this.userService.userId, newTheme: theme })
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe({
                    next: () => {
                        this.showConfirmationMessage('Votre thème a bien été modifié ✅');
                        this.userService.user.theme = theme;
                    },
                    error: () => this.showErrorMessage('Erreur lors de la modification du thème ❌'),
                });
            
            this.userService.user.theme = theme;
            document.body.setAttribute('data-theme', theme);
        } else if (this.userService.user.money >= THEME_PRICE) {
            this.buyTheme(theme);
        } else {
            this.showErrorMessage("Vous n'avez pas assez de fonds pour acheter ce thème ❌");
        }
    }

    confirmPurchase(): void {
        if (this.purchaseAvatarId != null) {
            this.socketService.sendMessage('buyAvatar', this.purchaseAvatarId);
            this.avatar = this.purchaseAvatarId;
            this.userService.user.avatarsAquired.push(this.avatar);
            this.modifyAvatar(this.avatar);
            this.userService.user.money -= AVATAR_PRICE;
        } else if (this.purchaseThemeId != null) {
            this.socketService.sendMessage('buyTheme', this.purchaseThemeId);
            this.selectedTheme = this.purchaseThemeId;
            this.userService.user.themesAquired.push(this.selectedTheme);
            this.modifyTheme(this.selectedTheme);
            this.userService.user.money -= THEME_PRICE;
        }
        this.closeModal();
    }

    closeModal(): void {
        this.modalOpen = false;
        this.purchaseAvatarId = null;
        this.purchaseThemeId = null;
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
