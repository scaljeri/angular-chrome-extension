import { IData } from '../../shared/type';

export const findAutoActiveMock = (data: IData): string | void => {
  if (!data.activeMock && Object.keys(data.mocks).length > 0) {
    return Object.keys(data.mocks).sort()[0];
  }
}
