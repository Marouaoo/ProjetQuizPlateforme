import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameChatroomComponent } from './game-chatroom.component';

describe('ChatroomComponent', () => {
    let component: GameChatroomComponent;
    let fixture: ComponentFixture<GameChatroomComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [GameChatroomComponent],
        });
        fixture = TestBed.createComponent(GameChatroomComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
