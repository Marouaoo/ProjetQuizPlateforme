import { TestBed } from '@angular/core/testing';
import { AudioService } from './audio.service';

describe('AudioService', () => {
    let service: AudioService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(AudioService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should pause audio when pauseAudio is called', () => {
        const audioPauseSpy = spyOn(service.audio, 'pause');
        service.pauseAudio();
        expect(audioPauseSpy).toHaveBeenCalled();
    });

    it('should load audio when loadAudio is called', () => {
        const audioLoadSpy = spyOn(service.audio, 'load');
        service.loadAudio();
        expect(audioLoadSpy).toHaveBeenCalled();
    });

    it('should play audio when playAudio is called', () => {
        const audioPlaySpy = spyOn(service.audio, 'play');
        service.playAudio();
        expect(audioPlaySpy).toHaveBeenCalled();
    });
});
