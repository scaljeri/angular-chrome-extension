import {
  Component,
  Input,
  OnChanges,
  OnInit
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Dispatch } from '@ngxs-labs/dispatch-decorator';
import { IData, requestMethod, requestType, statusCode } from '@shared/type';
import { CreateStatusCodeComponent } from 'src/app/components/create-status-code/create-status-code.component';
import { NgApiMockCreateMockDialogWrapperComponent } from 'src/app/plugins/ngapimock/dialog/ng-api-mock-create-mock-dialog-wrapper/ng-api-mock-create-mock-dialog-wrapper.component';
import { findAutoActiveMock } from '../../../utils/data';

import {
  CreateStatusCode,
  UpdateDataStatusCode,
  UpdateDataUrl
} from 'src/app/store/actions';

@Component({
  selector: 'app-mock-header',
  templateUrl: './mock-header.component.html',
  styleUrls: ['./mock-header.component.scss']
})
export class MockHeaderComponent implements OnInit, OnChanges {
  @Input() data: IData;
  @Input() domain: string;

  public statusCode: statusCode;
  public codes: statusCode[];

  @Dispatch() createStatusCode = (statusCode: statusCode) =>
    new CreateStatusCode({
      url: this.data.url,
      method: this.data.method,
      type: this.data.type,
      statusCode,
      activeStatusCode: statusCode
    }, this.domain);
  @Dispatch() updateDataUrl = (
    url: string,
    method: requestMethod,
    type: requestType,
    newUrl: string
  ) => new UpdateDataUrl({ url, method, type, newUrl });

  @Dispatch() updateActiveStatusCode = (statusCode: statusCode) =>
    new UpdateDataStatusCode({
      url: this.data.url,
      method: this.data.method,
      type: this.data.type,
      statusCode
    });

  constructor(public dialog: MatDialog) { }

  ngOnInit(): void {
    setTimeout(() => {
      if (this.data.activeStatusCode === undefined && Object.keys(this.data.mocks).length > 0) {
        this.onSelectStatusCode(findAutoActiveMock(this.data));
      }
    });
  }

  ngOnChanges(): void {
    this.codes = this.data
      ? Object.keys(this.data.mocks).map(Number).sort()
      : [];
  }

  onUrlUpdate(url: string): void {
    this.updateDataUrl(this.data.url, this.data.method, this.data.type, url);
  }

  onSelectStatusCode(statusCode: statusCode | void): void {
    if (statusCode) {
      this.updateActiveStatusCode(statusCode);
    }
  }

  openAddStatusCodeDialog(): void {
    const dialogRef = this.dialog.open(CreateStatusCodeComponent, {
      width: '250px',
      height: '250px',
      data: { existingStatusCodes: this.codes }
    });

    dialogRef.afterClosed().subscribe((newStatusCode) => {
      if (newStatusCode) {
        this.statusCode = newStatusCode;
        this.createStatusCode(newStatusCode);
      }
    });
  }

  exportNgApiMock(): void {
    this.dialog.open(NgApiMockCreateMockDialogWrapperComponent, {
      data: this.data
    });
  }
}
