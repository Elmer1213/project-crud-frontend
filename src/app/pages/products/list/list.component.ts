import { Component, OnInit } from '@angular/core';
import { ProductService, Product } from 'src/app/services/product.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {
  products: Product[] = [];
  loading = true;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (res) => {
        this.products = res.data || res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.loading = false;
      }
    });
  }

  deleteProduct(id?: number): void {
    if (!id) return;
    if (confirm('¿Seguro que deseas eliminar este producto?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          alert('🗑️ Producto eliminado con éxito');
          this.loadProducts();
        },
        error: (err) => {
          console.error('Error al eliminar producto:', err);
          alert('Error al eliminar producto');
        }
      });
    }
  }
}

