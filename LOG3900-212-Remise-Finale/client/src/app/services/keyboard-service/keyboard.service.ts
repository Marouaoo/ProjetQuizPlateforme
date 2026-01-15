import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class KeyboardService {
    isChatKeyboardChangeable: boolean = true;

    enableButtonDetect(enableButtonDetect: boolean) {
        this.isChatKeyboardChangeable = enableButtonDetect;
    }
}
