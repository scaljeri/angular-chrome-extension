import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxsModule } from '@ngxs/store';
import { MatTableModule } from '@angular/material/table';

import { DataListComponent } from './data-list.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('DataListComponent', () => {
  let component: DataListComponent;
  let fixture: ComponentFixture<DataListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DataListComponent],
      schemas: [NO_ERRORS_SCHEMA],
      imports: [RouterTestingModule.withRoutes([]), NgxsModule.forRoot([]), MatTableModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DataListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});