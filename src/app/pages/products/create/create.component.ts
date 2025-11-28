import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService, Product } from '../../../services/product.service';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss']
})
export class CreateComponent {
  product: Product = {
    name: '',
    description: '',
    price: 0
  };
  loading = false;

  constructor(private productService: ProductService, private router: Router) {}

  createProduct() {
    this.loading = true;
    this.productService.createProduct(this.product).subscribe({
      next: (res) => {
        alert('✅ Producto creado con éxito');
        this.router.navigate(['/products']);
      },
      error: (err) => {
        console.error('❌ Error al crear producto:', err);
        alert('Error al crear producto');
        this.loading = false;
      }
    });
  }
}
