import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { DeletePopupComponent } from '@app/components/delete-popup/delete-popup.component';
import { MessagePopupComponent } from '@app/components/message-popup/message-popup.component';
import { SocketClientService } from '@app/services/websocket-service/websocket.service';
import { of } from 'rxjs';
import { WaitingViewPageComponent } from './waiting-view-page.component';

describe('WaitingViewPageComponent', () => {
    let component: WaitingViewPageComponent;
    let fixture: ComponentFixture<WaitingViewPageComponent>;
    let dialog: MatDialog;
    let socketService: SocketClientService;
    let router: Router;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [WaitingViewPageComponent, MessagePopupComponent, DeletePopupComponent],
            imports: [MatDialogModule, RouterTestingModule],
            providers: [SocketClientService, MatDialog],
        });
        fixture = TestBed.createComponent(WaitingViewPageComponent);
        component = fixture.componentInstance;
        socketService = TestBed.inject(SocketClientService);
        dialog = TestBed.inject(MatDialog);
        router = TestBed.inject(Router);
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

    it('should call socketService.send("quitPlay") and go to home page when quitPlay() is called', () => {
        const navigateSpy = spyOn(router, 'navigate');
        const sendSpy = spyOn(socketService, 'send');

        component.quitPlay();

        expect(navigateSpy).toHaveBeenCalledWith(['/home']);
        expect(sendSpy).toHaveBeenCalledWith('quitPlay');
    });

    it('should call openPopupMessage and route.navigate when "kickPlayer" event is received', () => {
        const openPopupMessageSpy = spyOn(component, 'openPopupMessage').and.stub();
        const navigateSpy = spyOn(router, 'navigate');

        const originalListen = socketService.listen;

        socketService.listen = jasmine.createSpy().and.callFake((eventName: string) => {
            if (eventName === 'kickPlayer') {
                return of({});
            } else {
                return originalListen.call(socketService, eventName);
            }
        });

        component.ngOnInit();

        expect(openPopupMessageSpy).toHaveBeenCalledWith('Vous avez été banni de la partie.');
        expect(navigateSpy).toHaveBeenCalledWith(['/home']);

        socketService.listen = originalListen;
    });

    it('should call send and route.navigate when "playDeleted" event is received', () => {
        const sendSpy = spyOn(socketService, 'send');
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
        expect(sendSpy).toHaveBeenCalledWith('quitPlay');
        expect(navigateSpy).toHaveBeenCalledWith(['/home']);

        socketService.listen = originalListen;
    });

    it('should navigate when "countdown" event is received', () => {
        const navigateSpy = spyOn(router, 'navigate');
        const originalListen = socketService.listen;
        socketService.listen = jasmine.createSpy().and.callFake((eventName: string) => {
            if (eventName === 'countdown') {
                return of(0);
            } else {
                return originalListen.call(socketService, eventName);
            }
        });
        component.ngOnInit();
        expect(navigateSpy).toHaveBeenCalledWith(['/game']);
        socketService.listen = originalListen;
    });

    it('should update playersList when "getPlayersNames" event is received', () => {
        const playersListData = ['Player1', 'Player2'];
        const originalListen = socketService.listen;
        socketService.listen = jasmine.createSpy().and.callFake((eventName: string) => {
            if (eventName === 'getPlayersNames') {
                return of(playersListData);
            } else {
                return originalListen.call(socketService, eventName);
            }
        });
        component.ngOnInit();
        expect(component.players).toEqual(playersListData);
        socketService.listen = originalListen;
    });

    it('should call quitOnLoad and navigate to /joinGame', () => {
        const quitOnLoadSpy = spyOn(component, 'quitOnLoad').and.callThrough();
        const openPopupMessageSpy = spyOn(component, 'openPopupMessage').and.stub();
        const navigateSpy = spyOn(router, 'navigate');

        window.dispatchEvent(new Event('load'));

        expect(quitOnLoadSpy).toHaveBeenCalled();
        expect(navigateSpy).toHaveBeenCalledWith(['/joinGame']);
        expect(openPopupMessageSpy).toHaveBeenCalledWith('Vous avez quitté la partie.');
    });

    it('should call quitPlay when quitBeforeLoad event is triggered', () => {
        const quitPlaySpy = spyOn(component, 'quitPlay').and.callThrough();
        const openPopupMessageSpy = spyOn(component, 'openPopupMessage').and.stub();
        const navigateSpy = spyOn(router, 'navigate');

        component.quitBeforeLoad();

        expect(quitPlaySpy).toHaveBeenCalled();
        expect(navigateSpy).toHaveBeenCalledWith(['/home']);
        expect(openPopupMessageSpy).toHaveBeenCalledWith('Vous avez quitté la partie.');
    });

    it('should call quitPopstate and openPopupMessage when window:popstate event is triggered', () => {
        const quitPopstateSpy = spyOn(component, 'quitPopstate').and.callThrough();
        const quitPlaySpy = spyOn(component, 'quitPlay').and.callThrough();
        window.dispatchEvent(new Event('popstate'));
        expect(quitPopstateSpy).toHaveBeenCalled();
        expect(quitPlaySpy).toHaveBeenCalled();
    });

    it('should quit play if confirmQuitPlay() is true', () => {
        const dialogData: { actionToAsk: string } = {
            actionToAsk: 'quitter la partie',
        };

        const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        dialogRefSpyObj.afterClosed.and.returnValue(of('Oui'));

        const dialogOpenSpy = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(dialogRefSpyObj);
        const quitPlayspy = spyOn(component, 'quitPlay').and.callThrough();

        component.confirmQuitPlay();

        expect(dialogOpenSpy).toHaveBeenCalledOnceWith(DeletePopupComponent, { data: dialogData });
        expect(quitPlayspy).toHaveBeenCalled();
    });
});
