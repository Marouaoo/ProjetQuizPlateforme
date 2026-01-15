import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class AudioService {
    audio = new Audio('./assets/panic-sound.wav');
    pauseAudio() {
        this.audio.pause();
    }

    loadAudio() {
        this.audio.load();
    }

    playAudio() {
        this.audio.play();
    }
}
