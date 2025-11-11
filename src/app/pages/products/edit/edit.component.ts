import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../../../services/product.service';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss']
})
export class EditComponent implements OnInit {
  form: FormGroup;
  id: number = 0;
  loading: boolean = true;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    const paramId = this.route.snapshot.paramMap.get('id');
    if (paramId) {
      this.id = Number(paramId);
      this.loadProduct();
    } else {
      this.loading = false;
    }
  }

  loadProduct(): void {
    this.productService.getProduct(this.id).subscribe({
      next: (data: any) => {
        // Se asegura de tomar los nombres correctos del backend
        this.form.patchValue({
          name: data.name ?? data.Nombre ?? data.nombre,
          description: data.description ?? data.Descripción ?? data.descripcion,
          price: data.price ?? data.Precio ?? data.precio
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando el producto:', err);
        alert('No se pudo cargar el producto');
        this.loading = false;
      }
    });
  }

  // 👉 Este método se llama cuando das clic en "Guardar cambios"
  onSubmit(): void {
    if (this.form.valid) {
      this.productService.updateProduct(this.id, this.form.value).subscribe({
        next: () => {
          alert('✅ Producto actualizado correctamente');
          this.router.navigate(['/products']);
        },
        error: (err) => {
          console.error('Error al actualizar producto:', err);
          alert('❌ No se pudo actualizar el producto');
        }
      });
    } else {
      alert('Por favor completa todos los campos correctamente');
    }
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }
}
