import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Dispatch } from '@ngxs-labs/dispatch-decorator';
import { Select } from '@ngxs/store';
import { IData, IState, ohMyMockId } from '@shared/type';
import { findMocks } from '@shared/utils/find-mock';
import { Observable, Subscription } from 'rxjs';
import { UpdateDataResponse, UpsertData } from 'src/app/store/actions';
import { OhMyState } from 'src/app/store/state';
import { findAutoActiveMock } from 'src/app/utils/data';

@Component({
  selector: 'oh-my-page-mock',
  templateUrl: './mock.component.html',
  styleUrls: ['./mock.component.scss']
})
export class PageMockComponent implements OnInit {
  public data: IData;
  private subscription: Subscription;

  @Select(OhMyState.mainState) state$: Observable<IState>;
  @Dispatch() upsertData = (data: IData) => new UpsertData({ id: this.data.id, ...data });

  constructor(private activeRoute: ActivatedRoute) { }

  ngOnInit(): void {
    const dataId = this.activeRoute.snapshot.params.dataId;

    this.subscription = this.state$.subscribe((state: IState) => {
      this.data = findMocks(state, { id: dataId });

      if (!this.data.activeMock && Object.keys(this.data.mocks).length) {
        const mockId = findAutoActiveMock(this.data);

        if (mockId) {
          this.upsertData({ activeMock: mockId });
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
