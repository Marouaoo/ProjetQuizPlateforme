import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrgGamePageComponent } from './org-game-page.component';

describe('OrgGamePageComponent', () => {
  let component: OrgGamePageComponent;
  let fixture: ComponentFixture<OrgGamePageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OrgGamePageComponent]
    });
    fixture = TestBed.createComponent(OrgGamePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
