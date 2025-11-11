import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  id?: number;
  name: string;
  description: string;
  price: number;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:8000/products'; // ajusta si corresponde

  constructor(private http: HttpClient) {}

  // Nota: el backend envuelve respuestas en {message, status, data}
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
}
