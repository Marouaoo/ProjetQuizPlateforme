/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { SocketClientService } from './websocket.service';

describe('SocketClientService', () => {
    let service: SocketClientService;
    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(SocketClientService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return an empty string if socket is not initialized', () => {
        const mockSocket: any = {
            id: '',
        };

        service.socket = mockSocket;

        const socketID = service.socketID;

        expect(socketID).toBe('');
    });

    it('should return the socket ID when socket is initialized', () => {
        (service as any).socket = { id: 'socketID' };

        const socketID = service.socketID;

        expect(socketID).toEqual('socketID');
    });

    it('should disconnect', () => {
        const spy = spyOn(service.socket, 'disconnect');
        service.disconnect();
        expect(spy).toHaveBeenCalled();
    });

    it('should call socket.on with an event', () => {
        const event = 'helloWorld';
        const action = () => {};
        const spy = spyOn(service.socket, 'on');
        service.on(event, action);
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(event, action);
    });

    it('should call socket.off with an event and action', () => {
        const event = 'goodbyeWorld';
        const action = () => {};
        const spy = spyOn(service.socket, 'off');
        service.off(event, action);
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(event, action);
    });

    it('should call socket.emit with an event and data', () => {
        const event = 'sendMessage';
        const data = 'Hello, world!';
        const spy = spyOn(service.socket, 'emit');

        service.send(event, data);

        expect(spy).toHaveBeenCalledWith(event, data);
    });

    it('should call socket.emit with only an event when data is not provided', () => {
        const event = 'sendMessage';
        const spy = spyOn(service.socket, 'emit');

        service.send(event);

        expect(spy).toHaveBeenCalledWith(event);
    });

    it('should call on when listen is called', () => {
        const expectedEvent = 'testEvent';
        const testData = 'Test Data';

        const onSpy = spyOn(service.socket, 'on').withArgs(expectedEvent, jasmine.any(Function)).and.callThrough();

        service.listen<string>(expectedEvent).subscribe((data: string) => {
            expect(data).toBe(testData);
            expect(onSpy).toHaveBeenCalledWith(expectedEvent, jasmine.any(Function));
        });
        onSpy.calls.mostRecent().args[1](testData);
    });
});
