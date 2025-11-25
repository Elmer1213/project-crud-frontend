import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Páginas
import { ListComponent } from './pages/products/list/list.component';
import { CreateComponent } from './pages/products/create/create.component';
import { EditComponent } from './pages/products/edit/edit.component';

//charts
import { ChartsComponent } from './pages/products/charts/charts.component';

// Excel upload
import { ExcelUploadComponent } from './excel-upload/excel-upload.component';

@NgModule({
  declarations: [
    AppComponent,
    ListComponent,
    CreateComponent,
    EditComponent,
    ExcelUploadComponent,
    ChartsComponent
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
