import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Importa los componentes de las páginas
import { ListComponent } from './pages/products/list/list.component';
import { CreateComponent } from './pages/products/create/create.component';
import { EditComponent } from './pages/products/edit/edit.component';
import { ExcelUploadComponent } from './excel-upload/excel-upload.component';
import { ChartsComponent } from './pages/products/charts/charts.component';

const routes: Routes = [
  { path: '', redirectTo: '/products', pathMatch: 'full' },
  { path: 'products', component: ListComponent },
  { path: 'products/create', component: CreateComponent },
  { path: 'products/edit/:id', component: EditComponent },
  { path: 'upload-excel', component: ExcelUploadComponent }, 
  { path: 'products/charts', component: ChartsComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
