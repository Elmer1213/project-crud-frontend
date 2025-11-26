import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProductService, Product } from 'src/app/services/product.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit, OnDestroy {
  // Para usar Math en el template
  Math = Math;
  
  products: Product[] = [];
  loading = true;
  private subscription?: Subscription;

  // PAGINACIÓN
  currentPage = 1;

  itemsPerPage = 10;
  totalPages = 0;
  paginatedProducts: Product[] = [];
  
  // Opciones para items por página
  itemsPerPageOptions = [10, 25, 50, 100];

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
    
    // Escuchar cambios en productos
    this.subscription = this.productService.productsChanged$.subscribe(() => {
      this.loadProducts();
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadProducts(): void {
    console.log('loadProducts EJECUTADO');
    this.loading = true;
    this.productService.getProducts().subscribe({
      next: (res) => {
        this.products = res.data || res;
        this.updatePagination();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.loading = false;
      }
    });
  }

  // ACTUALIZAR PAGINACIÓN
  updatePagination(): void {
    console.log('updatePagination EJECUTADO');
    console.log('Products recibidos:', this.products);

    this.totalPages = Math.ceil(this.products.length / this.itemsPerPage);
    
    // Asegurar que currentPage no sea mayor que totalPages
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages || 1;
    }
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedProducts = this.products.slice(startIndex, endIndex);

    //DEBUG
    console.log('=== PAGINACIÓN ===');
    console.log('Total productos:', this.products.length);
    console.log('Items por página:', this.itemsPerPage);
    console.log('Página actual:', this.currentPage);
    console.log('Total páginas:', this.totalPages);
    console.log('Productos paginados:', this.paginatedProducts.length);
    console.log('==================');
  }

  // CAMBIAR PÁGINA
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  // CAMBIAR ITEMS POR PÁGINA
  onItemsPerPageChange(event: any): void {
    this.itemsPerPage = Number(event.target.value);
    this.currentPage = 1;
    this.updatePagination();
  }

  // OBTENER ARRAY DE PÁGINAS PARA MOSTRAR
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  deleteProduct(id?: number): void {
    if (!id) return;
    if (confirm('¿Seguro que deseas eliminar este producto?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          alert('Producto eliminado con éxito');
        },
        error: (err) => {
          console.error('Error al eliminar producto:', err);
          alert('Error al eliminar producto');
        }
      });
    }
  }
}