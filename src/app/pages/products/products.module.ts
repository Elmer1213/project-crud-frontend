import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { ProductsRoutingModule } from './products-routing.module';
import { ProductsComponent } from './products.component';
import { ListComponent } from './list/list.component';
import { CreateComponent } from './create/create.component';
import { EditComponent } from './edit/edit.component';


@NgModule({
  declarations: [
    ProductsComponent,
    ListComponent,
    CreateComponent,
    EditComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule, 
    FormsModule,        
    ProductsRoutingModule
  ]
})
export class ProductsModule { }
