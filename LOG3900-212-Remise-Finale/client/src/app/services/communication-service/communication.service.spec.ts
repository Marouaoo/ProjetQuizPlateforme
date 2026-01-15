/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-shadow */
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Game } from '@app/interfaces/game';
import { Password } from '@app/interfaces/password';
import { PlayData } from '@app/interfaces/play-data';
import { CommunicationService2 } from '@app/services/communication-service/communication.service';
import { Observable } from 'rxjs';

describe('CommunicationService', () => {
    let httpMock: HttpTestingController;
    let service: CommunicationService2;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [CommunicationService2],
        });

        service = TestBed.inject(CommunicationService2);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should get passwords', () => {
        const password: Password[] = [{ password: 'admin' }];

        service.getPassword().subscribe((passwords) => {
            expect(passwords).toEqual(password);
        });

        const req = httpMock.expectOne((service as any).baseUrl + '/password');
        expect(req.request.method).toBe('GET');
        req.flush(password);
    });

    it('should return an observable of Game[] for getGames', () => {
        const mockGames: Game[] = [
            {
                id: '1',
                title: 'Game 1',
                description: 'Description 1',
                duration: 60,
                lastModification: new Date(),
                isVisible: true,
                questions: [],
            },
        ];

        service.getGames().subscribe((games: Game[]) => {
            expect(games).toEqual(mockGames);
        });

        const req = httpMock.expectOne((service as any).baseUrl + '/game');
        expect(req.request.method).toBe('GET');
        req.flush(mockGames);
    });

    it('should return an observable of Game for getGame', () => {
        const mockGame: Game = {
            id: '1',
            title: 'Game 1',
            description: 'Description 1',
            duration: 60,
            lastModification: new Date(),
            isVisible: true,
            questions: [],
        };

        const gameId = '1';

        service.getGame(gameId).subscribe((game: Game) => {
            expect(game).toEqual(mockGame);
        });

        const req = httpMock.expectOne((service as any).baseUrl + '/game/' + gameId);
        expect(req.request.method).toBe('GET');
        req.flush(mockGame);
    });

    it('should send a DELETE request for deleteGame', () => {
        const gameId = '123';
        service.deleteGame(gameId).subscribe(() => {});

        const req = httpMock.expectOne((service as any).baseUrl + '/game/123');
        expect(req.request.method).toBe('DELETE');
        req.flush({});
    });

    it('should handle errors in deleteGame', () => {
        const gameId = '123';
        const errorMessage = 'Error deleting the game';

        spyOn(service['http'], 'delete').and.returnValue(
            new Observable((observer) => {
                observer.error(new Error(errorMessage));
            }),
        );

        let errorResponse: string | undefined;

        service.deleteGame(gameId).subscribe({
            error: (error) => {
                errorResponse = error.message;
            },
        });

        expect(errorResponse).toEqual(errorMessage);
    });

    it('should send a PATCH request for updateGame', () => {
        const mockGame: Game = {
            id: '1',
            title: 'Game 1',
            description: 'Description 1',
            duration: 60,
            lastModification: new Date(),
            isVisible: true,
            questions: [],
        };
        service.updateGame(mockGame.id, mockGame).subscribe(() => {});

        const req = httpMock.expectOne((service as any).baseUrl + '/game/1');
        expect(req.request.method).toBe('PATCH');
        req.flush({});
    });

    it('should send a POST request for postGameId', () => {
        const gameId = '123';
        service.postGameId(gameId).subscribe(() => {});

        const req = httpMock.expectOne((service as any).baseUrl + '/import/123');
        expect(req.request.method).toBe('POST');
        req.flush({});
    });

    it('should send a POST request with FormData for importFile', () => {
        const file = new File(['test'], 'test-file.txt', { type: 'text/plain' });

        service.importFile(file).subscribe(() => {});

        const req = httpMock.expectOne((request) => {
            return request.url === (service as any).baseUrl + `/import/${file}`;
        });

        expect(req.request.method).toBe('POST');
        expect(req.request.headers.get('Content-Type')).toBe(null);
        expect(req.request.body instanceof FormData).toBe(true);

        req.flush({});
    });

    it('should handle the import file error', () => {
        const file = new File(['test'], 'test-file.txt', { type: 'text/plain' });
        const mockError = new Error('Mock error message');
        const errorObservable = new Observable((observer) => {
            observer.error(mockError);
        });

        spyOn(service['http'], 'post').and.returnValue(errorObservable);

        service.importFile(file).subscribe({
            next: () => {
                fail();
            },
            error: (err: Error) => {
                expect(err).toEqual(mockError);
            },
        });
    });

    it('should create a game', () => {
        const newGame: Game = {
            id: '1',
            title: 'New Game',
            description: 'Description of the new game',
            duration: 60,
            lastModification: new Date(),
            isVisible: true,
            questions: [],
        };

        service.createGame(newGame).subscribe((response: HttpResponse<string>) => {
            expect(response.status).toBe(201);
            expect(response.body).toBe('');
        });

        const req = httpMock.expectOne((service as any).baseUrl + '/game');
        expect(req.request.method).toBe('POST');
        req.flush('', { status: 201, statusText: 'Created' });
    });

    it('should update a game', () => {
        const gameId = '1';
        const updatedGame: Game = {
            id: '1',
            title: 'Updated Game',
            description: 'Description of the updated game',
            duration: 90,
            lastModification: new Date(),
            isVisible: true,
            questions: [],
        };

        service.updateGame(gameId, updatedGame).subscribe(() => {});
        const req = httpMock.expectOne((service as any).baseUrl + `/game/${gameId}`);
        expect(req.request.method).toBe('PATCH');
        req.flush(null);
    });

    it('should send a POST request for deleteHistory', () => {
        const playData: PlayData = {
            accessCode: '1234',
            game: 'Test Game',
            startTime: new Date(),
            playersList: [],
        };

        service.deleteHistory(playData).subscribe((response: HttpResponse<string>) => {
            expect(response.status).toBe(200);
            expect(response.body).toBe('');
        });

        const req = httpMock.expectOne((service as any).baseUrl + '/play/[object Object]');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(playData);
        req.flush('', { status: 200, statusText: 'OK' });
    });
});
