import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatsSettingsComponent } from './stats-settings.component';

describe('StatsSettingsComponent', () => {
  let component: StatsSettingsComponent;
  let fixture: ComponentFixture<StatsSettingsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StatsSettingsComponent]
    });
    fixture = TestBed.createComponent(StatsSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
