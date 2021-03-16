import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';

import { PageStateExplorerComponent } from './state-explorer.component';
import { RouterModule, Routes } from '@angular/router';
import { PageMockComponent } from '../mock/mock.component';
import { PageDataListComponent } from '../data-list/data-list.component';
import { ComponentsModule } from 'src/app/components/components.module';

const routes: Routes = [
  {
    path: '',
    component: PageStateExplorerComponent,
    children: [
      {
        path: ':domain',
        component: PageDataListComponent,
        data: { theme: 'light', context: 'clone' }
      },
      {
        path: ':domain/mocks/:mockIndex',
        component: PageMockComponent
      }
    ]
  }
];

@NgModule({
  declarations: [PageStateExplorerComponent],
  imports: [
    CommonModule,
    MatCardModule,
    MatExpansionModule,
    RouterModule.forChild(routes),
    ComponentsModule
  ],
  exports: [PageStateExplorerComponent]
})
export class StateExplorerModule { }
