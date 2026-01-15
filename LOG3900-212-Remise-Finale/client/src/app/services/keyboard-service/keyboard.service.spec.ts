import { TestBed } from '@angular/core/testing';
import { KeyboardService } from './keyboard.service';

describe('KeyboardService', () => {
    let service: KeyboardService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(KeyboardService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should enable or disable button detection for chat area', () => {
        expect(service.isChatKeyboardChangeable).toBe(true);
        service.enableButtonDetect(false);
        expect(service.isChatKeyboardChangeable).toBe(false);
        service.enableButtonDetect(true);
        expect(service.isChatKeyboardChangeable).toBe(true);
    });
});
