import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  id?: number;
  name: string;
  description?: string;
  price: number;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private readonly apiUrl = 'http://localhost:8000/products';
  private readonly excelSheetsUrl = 'http://localhost:8000/excel/sheets';
  private readonly excelPreviewUrl = 'http://localhost:8000/excel/preview';
  private readonly excelImportUrl = 'http://localhost:8000/excel/import';

  constructor(private http: HttpClient) {}

  getProducts(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  getProduct(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createProduct(data: Partial<Product>): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  updateProduct(id: number, data: Partial<Product>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // -------------------------
  // LISTAR HOJAS
  // -------------------------
  getExcelSheets(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(this.excelSheetsUrl, formData);
  }

  // -------------------------
  // PREVISUALIZAR HOJA
  // -------------------------
  previewSheet(file: File, sheetName: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.excelPreviewUrl}/${sheetName}`, formData);
  }

  // -------------------------
  // IMPORTAR HOJA
  // -------------------------
  uploadExcel(file: File, sheetName: string): Observable<HttpEvent<any>> {
    const formData = new FormData();
    formData.append('file', file);

    const req = new HttpRequest(
      'POST',
      `${this.excelImportUrl}/${sheetName}`,
      formData,
      { reportProgress: true, responseType: 'json', headers: undefined }
    );

    return this.http.request(req);
  }
}


