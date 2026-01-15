import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ChatroomService } from '@app/services/chatroom-service/chatroom.service';
import { GameService } from '@app/services/game/game.service';
import { SocketService } from '@app/services/socket-service/socket-service';
import { GameCreationEvents } from '@common/game-creation.gateway.events';
import { UserService } from '@app/services/account/user.service';
import {TranslateModule, TranslateService} from "@ngx-translate/core";  

@Component({
    standalone: true,
    imports: [ TranslateModule ],
    selector: 'app-confirmation-modal',
    templateUrl: './confirmation-modal.component.html',
    styleUrls: ['./confirmation-modal.component.scss'],
})

export class ConfirmationModalComponent implements OnInit {
    @Input() modalOpen: boolean = false;

    isWaitingRoom: boolean = false;
    isResultPage: boolean = false;

    confirmationMessage: string;

    constructor(
        private readonly router: Router,
        private readonly socketService: SocketService,
        private readonly gameService: GameService,
        private readonly chatroomService: ChatroomService,
        private readonly translate: TranslateService,
        private readonly userService: UserService,
    ) 
    {
        this.router = router;
        this.socketService = socketService;
        this.gameService = gameService;
        this.chatroomService = chatroomService;
        this.translate.setDefaultLang('fr');
	    this.translate.use(this.userService.user.language);

    }

    ngOnInit(): void {
        if (this.router.url.includes('waitingRoom')) {
            this.isWaitingRoom = true;
        }
    
        if (this.router.url.includes('resultsView')) {
            this.isResultPage = true;
        }

        if (this.isWaitingRoom) {
            this.confirmationMessage = "Êtes-vous sûr de vouloir quitter la salle d'attente ?";
        }

        if (this.isResultPage) {
            this.confirmationMessage = "Êtes-vous sûr de vouloir quitter la page des résultats ?";
        }
    }

    confirm() {
        if (this.isWaitingRoom) {
            this.socketService.sendMessage(GameCreationEvents.LeaveGame, this.gameService.game.id);
            this.gameService.resetGame();
            this.router.navigate(['/homePage']);
            this.modalOpen = false;
            return;
        }
        if (this.isResultPage) {
            this.socketService.sendMessage(GameCreationEvents.LeaveGame, this.gameService.game.id);
            this.gameService.resetGame();
            this.chatroomService.channelChat = [];
            this.router.navigate(['/homePage']);
            this.modalOpen = false;
        }
    }

    cancel() {
        this.modalOpen = false;
    }


}

