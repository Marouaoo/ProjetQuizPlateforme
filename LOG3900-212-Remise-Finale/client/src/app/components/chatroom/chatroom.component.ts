import { Component, OnInit, OnDestroy } from '@angular/core';
import { Message } from '@common/message';
import { Subscription } from 'rxjs';
import { ChatEvents } from '@common/events/chat.events';
import {
    EMPTY_MESSAGE,
    FOCUS_DELAY,
    FORBIDDEN_WORD__ERROR_MESSAGE,
    INCREMENT,
    MAX_FILE_SZIE,
    MAX_MESSAGE_LENGTH,
    SCROLL_SPEED,
    SCROLL_TO_BOTTOM_DELAY,
    UPLOAD_DELAY,
    ZERO,
} from '@common/constants';
import { Router } from '@angular/router';
import { SocketService } from '@app/services/socket-service/socket-service';
import { UserService } from '@app/services/account/user.service';
import { Avatar, User } from '@common/session';
import { ChatroomService } from '@app/services/chatroom-service/chatroom.service';
import { AwsService } from '@app/services/aws/aws.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { CommunicationService } from '@app/services/httpcommunication.service.ts/communication.service';

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule],
    selector: 'app-chatroom',
    templateUrl: './chatroom.component.html',
    styleUrls: ['./chatroom.component.scss'],
})
export class ChatroomComponent implements OnInit, OnDestroy {
    user: User = this.userService.user;
    messageText: string = '';

    fileUrl: string = '';

    isChatOpen: boolean = true;
    isHomePage: boolean;
    isWaitingRoom: boolean;
    isGamePage: boolean;
    isEndGame: boolean;

    messageSubscription: Subscription;
    isForbiddenWord: boolean = false;

    isImageUploading: boolean = false;
    isVideoUploading: boolean = false;
    uploadProgress: number = 0;

    previewFiles: Array<{
        file: File;
        type: 'image' | 'video';
        previewUrl: string;
    }> = [];

    get isUploading(): boolean {
        return this.isImageUploading || this.isVideoUploading;
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

    constructor(
        public readonly chatService: ChatroomService,
        public readonly socketService: SocketService,
        public readonly communicationService: CommunicationService,
        private readonly router: Router,
        public readonly userService: UserService,
        private readonly translate: TranslateService,
        private readonly awsService: AwsService,
    ) {
        this.socketService = socketService;
        this.socketService.connect();
        this.translate.setDefaultLang('fr');
        this.translate.use(this.userService.user.language);
    }

    ngOnInit(): void {
        this.isHomePage = this.router.url.includes('/homePage');
        this.isWaitingRoom = this.router.url.includes('/waiting-room');

        if (!this.userService.userId || this.userService.userId === '') {
            this.router.navigate(['/']);
        }

        this.messageSubscription = this.socketService.listen<Message[]>(ChatEvents.PreviousMessages).subscribe((messages: Message[]) => {
            this.scrollToBottom();
        });

        this.messageSubscription = this.socketService.listen<Message>(ChatEvents.NewMessage).subscribe((message) => {
            this.scrollToBottom();
        });

        this.messageSubscription = this.socketService.listen<Message>('forbiddenWord').subscribe((message) => {
            this.isForbiddenWord = true;
            this.messageText = this.translate.instant('Message de censure');
            setTimeout(() => {
                this.messageText = '';
                this.fileUrl = '';
                this.isForbiddenWord = false;

                setTimeout(() => {
                    const input = document.getElementById('messageInput') as HTMLInputElement;
                    if (input) input.focus();
                }, FOCUS_DELAY);
            }, FORBIDDEN_WORD__ERROR_MESSAGE);
        });

        this.scrollToBottom();
    }

    async onImageUpload(event: Event): Promise<void> {
        const files = (event.target as HTMLInputElement).files;
        if (files) {
            this.isImageUploading = true;
            try {
                for (const file of Array.from(files)) {
                    if (!file.type.startsWith('image/')) {
                        const temp = this.messageText;
                        this.isForbiddenWord = true;
                        this.messageText = this.translate.instant('WrongFileType');
                        setTimeout(() => {
                            this.messageText = temp;
                            this.isForbiddenWord = false;
                            setTimeout(() => {
                                const input = document.getElementById('messageInput') as HTMLInputElement;
                                if (input) input.focus();
                            }, FOCUS_DELAY);
                        }, UPLOAD_DELAY);
                        continue;
                    } else if (file.size > MAX_FILE_SZIE) {
                        const temp = this.messageText;
                        this.isForbiddenWord = true;
                        this.messageText = this.translate.instant('LargePhoto');
                        setTimeout(() => {
                            this.messageText = temp;
                            this.isForbiddenWord = false;
                            setTimeout(() => {
                                const input = document.getElementById('messageInput') as HTMLInputElement;
                                if (input) input.focus();
                            }, FOCUS_DELAY);
                        }, UPLOAD_DELAY);
                        continue;
                    } else if (file.type.startsWith('image/')) {
                        try {
                            const s3Url = await this.awsService.uploadFile(file, 'image');
                            this.previewFiles.push({
                                file,
                                type: 'image',
                                previewUrl: s3Url,
                            });
                        } catch (error: any) {}
                    }
                }
            } finally {
                this.isImageUploading = false;
                (event.target as HTMLInputElement).value = '';
                const input = document.getElementById('messageInput');
                if (input) {
                    input.focus();
                }
            }
        }
        const input = document.getElementById('messageInput');
        if (input) {
            input.focus();
        }
    }

    async onVideoUpload(event: Event): Promise<void> {
        const files = (event.target as HTMLInputElement).files;
        if (files) {
            this.isVideoUploading = true;
            try {
                for (const file of Array.from(files)) {
                    if (!file.type.startsWith('video/')) {
                        const temp = this.messageText;
                        this.isForbiddenWord = true;
                        this.messageText = this.translate.instant('WrongFileType');
                        setTimeout(() => {
                            this.messageText = temp;
                            this.isForbiddenWord = false;
                            setTimeout(() => {
                                const input = document.getElementById('messageInput') as HTMLInputElement;
                                if (input) input.focus();
                            }, FOCUS_DELAY);
                        }, UPLOAD_DELAY);
                        continue;
                    } else if (file.size > MAX_FILE_SZIE) {
                        const temp = this.messageText;
                        this.isForbiddenWord = true;
                        this.messageText = this.translate.instant('LargeVideo');
                        setTimeout(() => {
                            this.messageText = temp;
                            this.isForbiddenWord = false;
                            setTimeout(() => {
                                const input = document.getElementById('messageInput') as HTMLInputElement;
                                if (input) input.focus();
                            }, FOCUS_DELAY);
                        }, UPLOAD_DELAY);
                        continue;
                    } else if (file.type.startsWith('video/')) {
                        try {
                            const s3Url = await this.awsService.uploadFile(file, 'video');

                            this.previewFiles.push({
                                file,
                                type: 'video',
                                previewUrl: s3Url,
                            });
                        } catch (error: any) {}
                    }
                }
            } finally {
                this.isVideoUploading = false;
                (event.target as HTMLInputElement).value = '';
                const input = document.getElementById('messageInput');
                if (input) {
                    input.focus();
                }
            }
        }
        const input = document.getElementById('messageInput');
        if (input) {
            input.focus();
        }
    }

    async removePreview(index: number): Promise<void> {
        await this.awsService.deleteFile(this.previewFiles[index].previewUrl);
        this.previewFiles.splice(index, INCREMENT);
    }

    isImage(url: string): boolean {
        return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
    }

    isVideo(url: string): boolean {
        return /\.(mp4|webm|ogg|mov)$/i.test(url);
    }

    sendMessage(): void {
        const hasValidText = this.messageText.trim().length > EMPTY_MESSAGE && this.messageText.trim().length <= MAX_MESSAGE_LENGTH;
        const hasMedia = this.previewFiles.length > ZERO;

        if (!hasValidText && !hasMedia) {
            return;
        }

        if (hasValidText) {
            const textMessage: Message = {
                avatar: this.userService.user.avatar,
                author: this.userService.user.username,
                text: this.messageText.trim(),
                timestamp: new Date(),
                channelId: 'global',
            };
            this.socketService.sendMessage(ChatEvents.Message, { channelId: 'global', message: textMessage });
        }

        if (hasMedia) {
            this.previewFiles.forEach((preview) => {
                const newMessage: Message = {
                    avatar: this.userService.user.avatar,
                    author: this.userService.user.username,
                    text: '',
                    timestamp: new Date(),
                    channelId: 'global',
                    fileUrl: preview.previewUrl,
                };
                this.socketService.sendMessage(ChatEvents.Message, { channelId: 'global', message: newMessage });
            });
        }

        this.messageText = '';
        this.previewFiles = [];

        const input = document.getElementById('messageInput');
        if (input) {
            input.focus();
        }
    }

    scrollToBottom(): void {
        setTimeout(() => {
            const messageArea = document.getElementById('chat-messages');
            if (messageArea) {
                messageArea.scrollTop = messageArea.scrollHeight;
            }
        }, SCROLL_TO_BOTTOM_DELAY);
    }

    toggleChat(): void {
        this.isChatOpen = !this.isChatOpen;
        this.scrollToBottom();
    }

    closeChat(): void {
        this.isChatOpen = false;
    }

    ngOnDestroy(): void {
        if (this.messageSubscription) {
            this.messageSubscription.unsubscribe();
        }
    }

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

    getUploadInputId(): string {
        if (this.previewFiles.length === ZERO) {
            return 'imageUpload';
        }
        return this.previewFiles[ZERO].type === 'image' ? 'imageUpload' : 'videoUpload';
    }

    onPreviewScroll(event: WheelEvent): void {
        event.preventDefault();
        const container = event.currentTarget as HTMLElement;
        const scrollSpeed = SCROLL_SPEED;

        if (event.deltaY > ZERO) {
            container.scrollLeft += scrollSpeed;
        } else {
            container.scrollLeft -= scrollSpeed;
        }
    }
}
