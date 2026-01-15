import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ChatAreaComponent } from '@app/components/chat-area/chat-area.component';
import { MessagePopupComponent } from '@app/components/message-popup/message-popup.component';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { AudioService } from '@app/services/audio-service/audio.service';
import { SocketClientService } from '@app/services/websocket-service/websocket.service';
import { of } from 'rxjs';
import { GamePageComponent } from './game-page.component';

describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    let socketService: jasmine.SpyObj<SocketClientService>;
    let audioService: AudioService;
    let testData: unknown;
    let router: Router;
    let dialog: MatDialog;

    beforeEach(async () => {
        socketService = jasmine.createSpyObj('SocketClientService', ['send', 'listen']);
        socketService.listen.and.returnValue(of(testData));
        TestBed.configureTestingModule({
            declarations: [GamePageComponent, PlayAreaComponent, MessagePopupComponent, ChatAreaComponent],
            imports: [MatDialogModule, RouterTestingModule, FormsModule],
            providers: [{ provide: SocketClientService, useValue: socketService }, AudioService, MatDialog],
        });
        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
        socketService = TestBed.inject(SocketClientService) as jasmine.SpyObj<SocketClientService>;
        audioService = TestBed.inject(AudioService);
        dialog = TestBed.inject(MatDialog);
        router = TestBed.inject(Router);
        spyOn(audioService, 'playAudio');
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should open a popup message with the correct data', () => {
        const messageToSend = 'Test Message';
        const dialogOpenSpy = spyOn(dialog, 'open');

        component.openPopupMessage(messageToSend);

        expect(dialogOpenSpy).toHaveBeenCalledWith(MessagePopupComponent, {
            data: { message: messageToSend },
        });
    });

    it('should call openPopupMessage and route.navigate when "playDeleted" event is received', () => {
        const openPopupMessageSpy = spyOn(component, 'openPopupMessage').and.stub();
        const navigateSpy = spyOn(router, 'navigate');
        const originalListen = socketService.listen;
        socketService.listen = jasmine.createSpy().and.callFake((eventName: string) => {
            if (eventName === 'playDeleted') {
                return of({});
            } else {
                return originalListen.call(socketService, eventName);
            }
        });

        component.ngOnInit();
        expect(openPopupMessageSpy).toHaveBeenCalledWith("L'organisateur a quitté la partie");
        expect(navigateSpy).toHaveBeenCalledWith(['/home']);
        socketService.listen = originalListen;
    });

    it('should call openPopupMessage and route.navigate when "playEnded" event is received', () => {
        const navigateSpy = spyOn(router, 'navigate');
        const originalListen = socketService.listen;

        socketService.listen = jasmine.createSpy().and.callFake((eventName: string) => {
            if (eventName === 'playEnded') {
                return of({});
            } else {
                return originalListen.call(socketService, eventName);
            }
        });

        component.ngOnInit();
        expect(navigateSpy).toHaveBeenCalledWith(['/resultsView']);
        socketService.listen = originalListen;
    });

    it('should open a popup message with the correct data', () => {
        const messageToSend = 'Test Message';
        const dialogOpenSpy = spyOn(dialog, 'open');

        component.openPopupMessage(messageToSend);

        expect(dialogOpenSpy).toHaveBeenCalledWith(MessagePopupComponent, {
            data: { message: messageToSend },
        });
    });

    it('should call openPopupMessage and route.navigate when "playDeleted" event is received', () => {
        const openPopupMessageSpy = spyOn(component, 'openPopupMessage').and.stub();
        const navigateSpy = spyOn(router, 'navigate');
        const originalListen = socketService.listen;

        socketService.listen = jasmine.createSpy().and.callFake((eventName: string) => {
            if (eventName === 'playDeleted') {
                return of({});
            } else {
                return originalListen.call(socketService, eventName);
            }
        });

        component.ngOnInit();
        expect(openPopupMessageSpy).toHaveBeenCalledWith("L'organisateur a quitté la partie");
        expect(navigateSpy).toHaveBeenCalledWith(['/home']);
        socketService.listen = originalListen;
    });

    it('should play or pause when playSound is called', () => {
        const pauseAudioSpy = spyOn(audioService, 'pauseAudio');
        const loadAudioSpy = spyOn(audioService, 'loadAudio');
        const numberSubscriptions = 4;
        component.playSound();
        expect(socketService.listen).toHaveBeenCalledWith('questionEnd');
        expect(socketService.listen).toHaveBeenCalledWith('getQRLWrittenAnswers');
        expect(socketService.listen).toHaveBeenCalledWith('playSound');
        expect(pauseAudioSpy).toHaveBeenCalledTimes(2);
        expect(loadAudioSpy).toHaveBeenCalled();
        expect(component.subscriptions.length).toBe(numberSubscriptions);
    });
});
