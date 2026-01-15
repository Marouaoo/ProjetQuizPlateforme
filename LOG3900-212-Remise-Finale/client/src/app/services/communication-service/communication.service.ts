import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Game } from '@app/interfaces/game';
import { Password } from '@app/interfaces/password';
import { PlayData } from '@app/interfaces/play-data';
import { Observable, catchError } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class CommunicationService2 {
    passwordModel: Password;
    private readonly baseUrl: string = environment.serverUrl;
    constructor(private readonly http: HttpClient) {}

    getPassword(): Observable<Password[]> {
        return this.http.get<Password[]>(`${this.baseUrl}/password`);
    }

    getGames(): Observable<Game[]> {
        return this.http.get<Game[]>(`${this.baseUrl}/game`);
    }

    getGame(id: string): Observable<Game> {
        return this.http.get<Game>(`${this.baseUrl}/game/${id}`);
    }

    getPlays(): Observable<PlayData[]> {
        return this.http.get<PlayData[]>(`${this.baseUrl}/play`);
    }

    deleteGame(id: string): Observable<string> {
        return this.http.delete<string>(`${this.baseUrl}/game/${id}`).pipe(
            catchError((error) => {
                throw error;
            }),
        );
    }

    deleteHistory(playData: PlayData): Observable<HttpResponse<string>> {
        return this.http.post(`${this.baseUrl}/play/${playData}`, playData, { observe: 'response', responseType: 'text' });
    }

    postGameId(id: string): Observable<HttpResponse<string>> {
        return this.http.post(`${this.baseUrl}/import/${id}`, id, { observe: 'response', responseType: 'text' });
    }

    importFile(file: File): Observable<unknown> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post(`${this.baseUrl}/import/${file}`, formData).pipe(
            catchError((error) => {
                throw error;
            }),
        );
    }

    createGame(newGame: Game): Observable<HttpResponse<string>> {
        return this.http.post(`${this.baseUrl}/game`, newGame, { observe: 'response', responseType: 'text' });
    }

    updateGame(id: string, updatedGame: Game): Observable<void> {
        return this.http.patch<void>(`${this.baseUrl}/game/${id}`, updatedGame);
    }
}
