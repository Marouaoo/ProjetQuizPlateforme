import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SocketClientService {
    socket: Socket;
    private readonly url: string = environment.socketUrl;

    constructor() {
        this.connect();
    }
    get socketID() {
        return this.socket.id ? this.socket.id : '';
    }

    connect() {
        this.socket = io(this.url, { transports: ['websocket'] });
    }

    disconnect() {
        this.socket.disconnect();
    }
    
    on<T>(event: string, action: (data: T) => void): void {
        this.socket.on(event, action);
    }

    off<T>(event: string, action: (data: T) => void): void {
        this.socket.off(event, action);
    }

    send<T>(event: string, data?: T): void {
        if (data) {
            this.socket.emit(event, data);
        } else {
            this.socket.emit(event);
        }
    }

    listen<T>(event: string): Observable<T> {
        return new Observable((observer) => {
            this.socket.on(event, (data: T) => {
                observer.next(data);
            });
        });
    }
}
