import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppComponentModule } from '../components/app-components.module';
import { NavigatePage } from './navigate.page';
import { RouterModule, Routes } from '@angular/router';
import { IonicSelectableComponent } from "ionic-selectable";

const routes: Routes = [
  {
    path: '',
    component: NavigatePage,
  }
];

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    AppComponentModule,
    IonicSelectableComponent
  ],
  declarations: [
    NavigatePage
  ]
})
export class NavigatePageModule {}
