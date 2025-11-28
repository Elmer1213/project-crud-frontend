import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ProductService, Product } from '../../../services/product.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit, OnDestroy {
  // Para usar Math en el template
  Math = Math;
  
  products: Product[] = [];
  filteredProducts: Product[] = [];
  paginatedProducts: Product[] = [];
  loading = true;
  private subscription?: Subscription;

  // FILTROS Y ORDENAMIENTO
  searchTerm = '';
  currentSort: 'none' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'date-asc' | 'date-desc' = 'none';

  // PAGINACIÓN
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
  
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
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.loading = false;
      }
    });
  }

  // BÚSQUEDA
  onSearch(event: any): void {
    this.searchTerm = event.target.value.toLowerCase();
    this.currentPage = 1;
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  // APLICAR FILTROS Y ORDENAMIENTO
  applyFilters(): void {
    let result = [...this.products];

    // Aplicar búsqueda
    if (this.searchTerm) {
      result = result.filter(p => 
        p.name?.toLowerCase().includes(this.searchTerm) ||
        p.description?.toLowerCase().includes(this.searchTerm)
      );
    }

    // Aplicar ordenamiento
    switch (this.currentSort) {
      case 'name-asc':
        result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'name-desc':
        result.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
      case 'price-asc':
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-desc':
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'date-asc':
        result.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateA - dateB;
        });
        break;
      case 'date-desc':
        result.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        break;
    }

    this.filteredProducts = result;
    this.updatePagination();
  }

  // ORDENAMIENTO
  applySorting(sortType: typeof this.currentSort): void {
    this.currentSort = sortType;
    this.currentPage = 1;
    this.applyFilters();
  }

  // LIMPIAR FILTROS
  clearFilters(): void {
    this.searchTerm = '';
    this.currentSort = 'none';
    this.currentPage = 1;
    this.applyFilters();
  }

  // ACTUALIZAR PAGINACIÓN
  updatePagination(): void {
    console.log('updatePagination EJECUTADO');
    console.log('Filtered products:', this.filteredProducts.length);

    this.totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
    
    // Asegurar que currentPage no sea mayor que totalPages
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages || 1;
    }
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedProducts = this.filteredProducts.slice(startIndex, endIndex);

    //DEBUG
    console.log('=== PAGINACIÓN ===');
    console.log('Total productos:', this.products.length);
    console.log('Productos filtrados:', this.filteredProducts.length);
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