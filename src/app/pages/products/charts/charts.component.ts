// frontend/src/app/pages/products/charts/charts.component.ts
import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { ProductService, Product } from '../../../services/product.service';
import { WebsocketService } from '../../../services/websocket.service';

Chart.register(...registerables);

@Component({
  selector: 'app-product-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.scss']
})
export class ChartsComponent implements OnInit, OnDestroy, AfterViewInit {

  // Charts instances
  private barChart: Chart | null = null;
  private doughnutChart: Chart | null = null;
  private progressDonutChart: Chart | null = null; // ← Añadido

  // Progress info from WS
  progress = 0;
  step = 'Esperando...';

  // Data cache
  products: Product[] = [];

  // Optional: keep ws connected flag
  private wsConnected = false;

  constructor(
    private productService: ProductService,
    private wsService: WebsocketService
  ) {}

  ngOnInit(): void {
    // Nada aquí: cargamos en after view init para asegurar que los canvas existen
  }

  ngAfterViewInit(): void {
  // 1) Cargar productos iniciales y renderizar
  this.loadProductsAndRender();

  // Escuchar cambios desde otros componentes
  this.productService.productsChanged$.subscribe(() => {
    this.loadProductsAndRender();
  });
  
  // 2) Conectar WebSocket y reaccionar a mensajes
  this.wsService.connect((msg: any) => {
    // Algunos mensajes podrían venir sin progress (por seguridad)
    if (msg?.progress !== undefined) {
      // Animar el progreso de forma suave
      this.animateProgress(msg.progress);
    }
    if (msg?.step) {
      this.step = msg.step;
    }

    // Si el backend indica completado
    const completed = msg?.progress === 100 || 
      (typeof msg?.step === 'string' && msg.step.toLowerCase().includes('complet'));
    
    if (completed) {
      // Esperar un poco antes de recargar para que se vea el 100%
      setTimeout(() => {
        this.loadProductsAndRender();
      }, 500);
    }
  });
  this.wsConnected = true;
}

  ngOnDestroy(): void {
    // Cerrar WS
    try {
      this.wsService.close();
    } catch (e) {}
    this.destroyCharts();
  }

  private loadProductsAndRender(): void {
    this.productService.getProducts().subscribe({
      next: (resp: any) => {
        // Manejar diferentes formatos de respuesta
        const data = resp?.data ?? resp;
        this.products = Array.isArray(data) ? data : (data?.items ?? []);
        
        if (!Array.isArray(this.products) && resp?.data && Array.isArray(resp.data)) {
          this.products = resp.data;
        }
        if (!Array.isArray(this.products) && Array.isArray(resp)) {
          this.products = resp;
        }

        // Renderizar todos los gráficos
        this.renderBarChart();
        this.renderDoughnutChart();
        this.renderProgressDonut(); // ← Renderizar el donut de progreso
      },
      error: (err) => {
        console.error('Error fetching products for charts', err);
        this.products = [];
        this.renderBarChart();
        this.renderDoughnutChart();
        this.renderProgressDonut(); // ← Incluso en error, mostrar el donut
      }
    });
  }

  // Animar el progreso de forma suave
  private animateProgress(targetProgress: number): void {
  const currentProgress = this.progress;
  const difference = targetProgress - currentProgress;
  // Número de pasos para la animación
  const steps = 20; 
  const increment = difference / steps;
  // Milisegundos entre cada paso
  const delay = 30; 

  let currentStep = 0;
  const interval = setInterval(() => {
    currentStep++;
    this.progress = Math.min(currentProgress + (increment * currentStep), targetProgress);
    this.updateProgressDonut();

    if (currentStep >= steps || this.progress >= targetProgress) {
      this.progress = targetProgress;
      this.updateProgressDonut();
      clearInterval(interval);
    }
  }, delay);
}

  // -- Helpers para calcular rangos --
  private computePriceRanges(): { labels: string[]; values: number[] } {
    const ranges = [
      { label: '0 - 50K', min: 0, max: 50000 },
      { label: '50K - 100K', min: 50001, max: 100000 },
      { label: '100K - 200K', min: 100001, max: 200000 },
      { label: '200K+', min: 200001, max: Infinity }
    ];

    const counts = new Array(ranges.length).fill(0);
    this.products.forEach(p => {
      const price = Number(p.price) ?? 0;
      for (let i = 0; i < ranges.length; i++) {
        if (price >= ranges[i].min && price <= ranges[i].max) {
          counts[i]++;
          break;
        }
      }
    });

    return { labels: ranges.map(r => r.label), values: counts };
  }

  // Gráfico de Barras
  private renderBarChart(): void {
    const { labels, values } = this.computePriceRanges();

    if (this.barChart) {
      this.barChart.destroy();
      this.barChart = null;
    }

    const ctx = document.getElementById('barCanvas') as HTMLCanvasElement;
    if (!ctx) return;

    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Cantidad de productos',
          data: values,
          backgroundColor: 'rgba(99, 102, 241, 0.7)',
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 2,
          borderRadius: 8,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: { size: 14, weight: 600 },
              color: '#374151'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(31, 41, 55, 0.95)',
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 },
            padding: 12,
            cornerRadius: 8
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { 
              precision: 0,
              font: { size: 12 },
              color: '#6b7280'
            },
            grid: {
              color: 'rgba(229, 231, 235, 0.5)'
            }
          },
          x: {
            ticks: {
              font: { size: 12 },
              color: '#6b7280'
            },
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  // Gráfico Doughnut
  private renderDoughnutChart(): void {
    const eco = this.products.filter(p => Number(p.price) <= 100000).length;
    const caro = this.products.length - eco;

    if (this.doughnutChart) {
      this.doughnutChart.destroy();
      this.doughnutChart = null;
    }

    const ctx = document.getElementById('doughnutCanvas') as HTMLCanvasElement;
    if (!ctx) return;

    this.doughnutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Económicos (≤100K)', 'Costosos (>100K)'],
        datasets: [{
          data: [eco, caro],
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderColor: [
            'rgba(16, 185, 129, 1)',
            'rgba(239, 68, 68, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              font: { size: 14, weight: 600 },
              color: '#374151',
              padding: 15
            }
          },
          tooltip: {
            backgroundColor: 'rgba(31, 41, 55, 0.95)',
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 },
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const dataset = context.dataset.data as number[];
                const total = dataset.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  //  Donut de Progreso
  private renderProgressDonut(): void {
  const ctx = document.getElementById('progressDonut') as HTMLCanvasElement;
  if (!ctx) return;

  if (this.progressDonutChart) {
    this.progressDonutChart.destroy();
    this.progressDonutChart = null;
  }

  this.progressDonutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [this.progress, 100 - this.progress],
        backgroundColor: [
          'rgba(16, 185, 129, 0.9)',
          'rgba(229, 231, 235, 0.3)'
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '75%',
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 800 
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      }
    }
  });
}

  // Actualizar solo el donut de progreso
  private updateProgressDonut(): void {
    if (this.progressDonutChart && this.progressDonutChart.data.datasets[0]) {
      this.progressDonutChart.data.datasets[0].data = [this.progress, 100 - this.progress];
      this.progressDonutChart.update('active');
    } else {
      this.renderProgressDonut();
    }
  }

  private destroyCharts(): void {
    if (this.barChart) { 
      this.barChart.destroy(); 
      this.barChart = null; 
    }
    if (this.doughnutChart) { 
      this.doughnutChart.destroy(); 
      this.doughnutChart = null; 
    }
    if (this.progressDonutChart) { 
      this.progressDonutChart.destroy(); 
      this.progressDonutChart = null; 
    }
  }
}