// frontend/src/app/pages/products/charts/charts.component.ts
import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { ProductService, Product } from '../../../services/product.service';
import { WebsocketService } from '../../../services/websocket.service';
import { Subscription } from 'rxjs';

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

    // 2) Conectar WebSocket y reaccionar a mensajes
    this.wsService.connect((msg: any) => {
      // Algunos mensajes podrían venir sin progress (por seguridad)
      if (msg?.progress !== undefined) {
        this.progress = msg.progress;
      }
      if (msg?.step) {
        this.step = msg.step;
      }

      // Si el backend indica completado (por progress 100 o step 'Completado'), recargar productos
      const completed = msg?.progress === 100 || (typeof msg?.step === 'string' && msg.step.toLowerCase().includes('complet'));
      if (completed) {
        // recargar productos y actualizar gráficas
        this.loadProductsAndRender();
      }
    });
    this.wsConnected = true;
  }

  ngOnDestroy(): void {
    // Cerrar WS (tu service tiene close())
    try {
      this.wsService.close();
    } catch (e) {}
    this.destroyCharts();
  }

  private loadProductsAndRender(): void {
    this.productService.getProducts().subscribe({
      next: (resp: any) => {
        // Según tu product.service, el GET devuelve build_response con data; manejar ambos casos
        const data = resp?.data ?? resp;
        // Si la API devuelve { data: [...] } o directamente [...]
        this.products = Array.isArray(data) ? data : (data?.items ?? []);
        // En algunos de tus endpoints `build_response` envuelve: data = jsonable_encoder(items)
        // Si no es array, intentamos extraer más
        if (!Array.isArray(this.products) && resp?.data && Array.isArray(resp.data)) {
          this.products = resp.data;
        }
        // Si todavía no es array, intenta con resp (caso donde backend devolvió directamente array)
        if (!Array.isArray(this.products) && Array.isArray(resp)) {
          this.products = resp;
        }

        // Finalmente render
        this.renderBarChart();
        this.renderDoughnutChart();
      },
      error: (err) => {
        console.error('Error fetching products for charts', err);
        this.products = [];
        this.renderBarChart();
        this.renderDoughnutChart();
      }
    });
  }

  // -- Helpers para calcular rangos --
  private computePriceRanges(): { labels: string[]; values: number[] } {
    // Define rangos (ajusta si quieres)
    const ranges = [
      { label: '0 - 50.000', min: 0, max: 50000 },
      { label: '50.001 - 100.000', min: 50001, max: 100000 },
      { label: '100.001 - 200.000', min: 100001, max: 200000 },
      { label: '200.001+', min: 200001, max: Infinity }
    ];

    const counts = new Array(ranges.length).fill(0);
    this.products.forEach(p => {
      const price = Number(p.price) ?? 0;
      for (let i = 0; i < ranges.length; i++) {
        if (price >= ranges[i].min && price <= ranges[i].max) {
          counts[i]++;
          break;
        } else if (ranges[i].max === Infinity && price >= ranges[i].min) {
          counts[i]++;
          break;
        }
      }
    });

    return { labels: ranges.map(r => r.label), values: counts };
  }

  private renderBarChart(): void {
    const { labels, values } = this.computePriceRanges();

    // destruir si ya existe
    if (this.barChart) {
      this.barChart.destroy();
      this.barChart = null;
    }

    const ctx = (document.getElementById('barCanvas') as HTMLCanvasElement);
    if (!ctx) return;

    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Productos por rango de precio',
          data: values,
          // colors omitted — Chart.js will use defaults (you can add backgroundColor if you want)
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 }
          }
        }
      }
    });
  }

  private renderDoughnutChart(): void {
    // Económicos <= 100000 ; Costosos > 100000
    const eco = this.products.filter(p => Number(p.price) <= 100000).length;
    const caro = this.products.length - eco;

    if (this.doughnutChart) {
      this.doughnutChart.destroy();
      this.doughnutChart = null;
    }

    const ctx = (document.getElementById('doughnutCanvas') as HTMLCanvasElement);
    if (!ctx) return;

    this.doughnutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Económicos (<=100K)', 'Costosos (>100K)'],
        datasets: [{
          data: [eco, caro],
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  private destroyCharts(): void {
    if (this.barChart) { this.barChart.destroy(); this.barChart = null; }
    if (this.doughnutChart) { this.doughnutChart.destroy(); this.doughnutChart = null; }
  }
}
