import {
  State,
  Action,
  StateContext,
  Selector,
  createSelector
} from '@ngxs/store';
import { Injectable } from '@angular/core';
import {
  ChangeDomain,
  DeleteData,
  DeleteMock,
  InitState,
  ResetState,
  Toggle,
  UpdateDataResponse,
  UpdateDataUrl,
  UpsertData,
  UpsertMock,
  ViewChangeOrderItems,
  ViewReset
} from './actions';
import {
  IData,
  IState,
  IUpdateDataUrl,
  IOhMyMock,
  IStore,
  IMock,
  IOhMyViewItemsOrder,
  IOhMyToggle,
  IOhMyContext,
  ohMyMockId,
  ohMyDataId,
  IUpsertMock,
} from '@shared/type';
import * as view from './views';
import { MOCK_JS_CODE, STORAGE_KEY } from '@shared/constants';
import { url2regex } from '@shared/utils/urls';
import { arrayAddItem, arrayMoveItem, arrayRemoveItem } from '@shared/utils/array';
import * as contentParser from 'content-type-parser';
import { addTestData } from '../migrations/test-data';
import { addCurrentDomain } from '../migrations/current-domain';
import { uniqueId } from '@shared/utils/unique-id';
import { findMocks } from '@shared/utils/find-mock';

@State<IOhMyMock>({
  name: STORAGE_KEY,
  defaults: {
    domains: {},
    version: ''
  }
})
@Injectable()
export class OhMyState {
  static domain: string;

  @Selector()
  static mainState(store: IStore): IState {
    return this.getActiveState(store);
  }

  static getState(state: IStore): IOhMyMock {
    return state[STORAGE_KEY];
  }

  static getActiveState(state: IStore | IOhMyMock, domain = OhMyState.domain): IState {
    if (state[STORAGE_KEY]) {
      return state[STORAGE_KEY].domains[domain];
    } else {
      return (state as IOhMyMock).domains[domain];
    }
  }

  @Action(InitState)
  init(ctx: StateContext<IOhMyMock>, { payload, domain }: { payload: IOhMyMock, domain?: string }) {
    const activeDomain = domain || OhMyState.domain;
    const state = addCurrentDomain(addTestData({ ...ctx.getState(), ...payload }), activeDomain);

    ctx.setState(state);
  }

  @Action(ChangeDomain)
  changeDomain(ctx: StateContext<IOhMyMock>, { payload }: { payload: string }) {
    OhMyState.domain = payload;
    const state = addCurrentDomain(ctx.getState(), payload);

    ctx.setState(state);
  }

  @Action(ResetState) // payload === domain string (optional)
  reset(ctx: StateContext<IOhMyMock>, { payload, domain }: { payload: string, domain?: string }) {
    const state = ctx.getState();
    // const activeDomain = domain || OhMyState.domain;
    const domains = { ...state.domains };

    // TODO: unclear what `domain` argument is doing here, is it needed, don't think so?
    if (payload) {
      domains[payload] = { domain: payload, data: [], toggles: {}, views: { normal: [], hits: [] } };
      ctx.setState({ ...state, domains });
    } else {
      ctx.setState(addCurrentDomain(addTestData({ domains: {}, version: state.version }), OhMyState.domain));
    }
  }

  @Action(UpsertMock)
  upsertMock(ctx: StateContext<IOhMyMock>, { payload, domain }: { payload: IUpsertMock, domain?: string }) {
    const state = ctx.getState();
    const activeDomain = domain || OhMyState.domain;
    const domainState = { ...OhMyState.getActiveState(state, domain) };

    const { index, data } = OhMyState.findData(domainState, payload);

    const dataList = [...domainState.data];
    const mocks = { ...data.mocks };
    let mock = {
      jsCode: MOCK_JS_CODE,
      delay: 0,
      ...(payload.mock.id && { ...mocks[payload.mock.id] }),
    } as IMock;

    if (mock.id) { // update
      mock.modifiedOn = new Date().toISOString();
    } else { // new mock
      if (payload.clone) {
        mock = { ...(data.mocks[payload.clone as ohMyMockId] || data.mocks[data.activeMock]) };
      }

      mock.id = uniqueId();
      mock.createdOn = new Date().toISOString();
    }

    Object.keys(payload.mock).forEach(k => mock[k] = payload.mock[k]);
    if (payload.mock.response && !mock.responseMock) {
      mock.responseMock = mock.response;
    }
    if (payload.mock.headers && !mock.headersMock) {
      mock.headersMock = mock.headers;
    }

    if (mock.headersMock) {
      const contentType = contentParser(mock.headersMock['content-type']);

      if (contentType) {
        mock.type = contentType.type;
        mock.subType = contentType.subtype;
      }
    }

    if (payload.makeActive) {
      data.activeMock = mock.id;
    }

    data.mocks = { ...mocks, [mock.id]: mock };

    if (index === -1) {
      dataList.push(data);
    } else {
      dataList[index] = data;
    }
    domainState.data = dataList;

    const domains = { ...state.domains };
    domains[activeDomain] = domainState;

    if (index === -1) {
      ctx.dispatch(new UpsertData(data, domain));
    } else {
      ctx.setState({ ...state, domains });
    }
  }

  @Action(UpsertData)
  upsertData(ctx: StateContext<IOhMyMock>, { payload, domain }: { payload: IData, domain?: string }) {
    const state = ctx.getState();
    const activeDomain = domain || OhMyState.domain;
    const domainState = { ...OhMyState.getActiveState(state, domain) };

    const { index, data } = OhMyState.findData(domainState, payload);

    let dataList;

    if (index === -1) { // new
      domainState.views = Object.entries({ ...domainState.views }).reduce((out, [name, list]) => {
        out[name] = view.add(0, list);
        return out;
      }, {});
      dataList = arrayAddItem(domainState.data, data, 0);
    } else {
      dataList = [...domainState.data];
      dataList[index] = data;
    }

    Object.keys(payload).forEach((key) => (data[key] = payload[key]));

    if (index === -1 && !payload.id) {
      data.url = url2regex(payload.url);
    }

    domainState.data = dataList;
    const domains = { ...state.domains };
    domains[activeDomain] = domainState;

    ctx.setState({ ...state, domains });
  }

  @Action(DeleteMock)
  deleteMock(ctx: StateContext<IOhMyMock>, { payload, domain }: { payload: { dataId: ohMyDataId, mockId: ohMyMockId }, domain?: string }) {
    const state = ctx.getState();
    const activeDomain = domain || OhMyState.domain;
    const domainState = { ...OhMyState.getActiveState(state, domain) };

    const { index, data } = OhMyState.findData(domainState, { id: payload.dataId });

    const mocks = { ...data.mocks };
    delete mocks[payload.mockId];
    data.mocks = mocks;

    if (data.activeMock === payload.mockId) {
      data.activeMock = null;
    }
    const dataList = [...domainState.data];
    dataList[index] = data;

    domainState.data = dataList;
    const domains = { ...state.domains };
    domains[activeDomain] = domainState;

    ctx.setState({ ...state, domains });
  }

  @Action(DeleteData)
  deleteData(ctx: StateContext<IOhMyMock>, { payload, domain }: { payload: string, domain?: string }) {
    const state = ctx.getState();
    const activeDomain = domain || OhMyState.domain;
    const domainState = { ...OhMyState.getActiveState(state, domain) };

    const data = findMocks(domainState, { id: payload });
    const index = domainState.data.indexOf(data);

    domainState.views = Object.entries({ ...domainState.views }).reduce((out, [name, data]) => {
      out[name] = view.remove(index, data);
      return out;
    }, {});
    domainState.data = arrayRemoveItem<IData>(domainState.data, index)[0];

    const domains = { ...state.domains };
    domains[activeDomain] = domainState;

    ctx.setState({ ...state, domains });
  }

  @Action(UpdateDataUrl)
  updateDataUrl(ctx: StateContext<IOhMyMock>, { payload, domain }: { payload: IUpdateDataUrl, domain?: string }) {
    const state = ctx.getState();
    const activeDomain = domain || OhMyState.domain;
    const domainState = { ...OhMyState.getActiveState(state) };

    const { index, data } = OhMyState.findData(domainState, payload);

    data.url = payload.newUrl;
    const dataList = [...domainState.data];

    if (index === -1) {
      dataList.push(data);
    } else {
      dataList[index] = data;
    }

    domainState.data = dataList;
    const domains = { ...state.domains };
    domains[activeDomain] = domainState;

    ctx.setState({ ...state, domains });
  }

  @Action(UpdateDataResponse)
  updateDataStatusCode(ctx: StateContext<IOhMyMock>, { payload, domain }: { payload: { id: ohMyDataId, mockId: ohMyMockId }, domain?: string }) {
    const state = ctx.getState();
    const activeDomain = domain || OhMyState.domain;
    const domainState = { ...OhMyState.getActiveState(state, activeDomain) };

    const { index, data } = OhMyState.findData(domainState, { id: payload.id });
    data.activeMock = payload.mockId;

    const dataList = [...domainState.data];

    if (index === -1) {
      dataList.push(data);
    } else {
      dataList[index] = data;
    }

    domainState.data = dataList;
    const domains = { ...state.domains };
    domains[activeDomain] = domainState;

    ctx.setState({ ...state, domains });
  }

  @Action(ViewChangeOrderItems)
  viewChangeOrderOfItems(ctx: StateContext<IOhMyMock>, { payload }: { payload: IOhMyViewItemsOrder }) {
    const state = ctx.getState();
    const domainState = { ...OhMyState.getActiveState(state) };

    const views = { ...domainState.views };

    if (!views[payload.name]) { // init
      views[payload.name] = domainState.data.map((_, i) => i);
    }

    views[payload.name] = arrayMoveItem<number>(views[payload.name], payload.from, payload.to);
    domainState.views = views;

    const domains = { ...state.domains };
    domains[OhMyState.domain] = domainState;

    ctx.setState({ ...state, domains });
  }

  @Action(Toggle)
  toggle(ctx: StateContext<IOhMyMock>, { payload }: { payload: IOhMyToggle }) {
    const state = ctx.getState();
    const domainState = { ...OhMyState.getActiveState(state) };
    domainState.toggles = { ...domainState.toggles, [payload.name]: payload.value };

    const domains = { ...state.domains, [OhMyState.domain]: domainState };
    ctx.setState({ ...state, domains });
  }

  @Action(ViewReset)
  viewReset(ctx: StateContext<IOhMyMock>, { payload }: { payload: string }) {
    const state = ctx.getState();
    const domainState = { ...OhMyState.getActiveState(state) };
    const views = { ...domainState.views, [payload]: domainState.data.map((_, i) => i) };
    domainState.views = views;

    const domains = { ...state.domains, [OhMyState.domain]: domainState };
    ctx.setState({ ...state, domains });
  }

  static findData(
    state: IState,
    context: IOhMyContext
  ): { index: number; data: IData } {
    const data = findMocks(state, context) ||
    {
      url: context.url,
      id: uniqueId(),
      method: context.method,
      type: context.type,
      mocks: {},
      activeMock: null
    };

    return { index: state.data.indexOf(data), data: { ...data } };
  }

  static cloneMock(mock: IMock): Partial<IMock> {
    if (!mock) {
      return { jsCode: MOCK_JS_CODE, delay: 0 };
    } else {
      const output = {
        ...mock,
        headers: { ...mock.headers },
        headersMock: { ...mock.headersMock }
      };
      delete output.modifiedOn;

      return output;
    }
  }
}
