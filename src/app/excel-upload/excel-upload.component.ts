import { Component } from '@angular/core';
import { ProductService } from '../services/product.service';
import { HttpEventType } from '@angular/common/http';
import { WebsocketService } from '../services/websocket.service';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-excel-upload',
  templateUrl: './excel-upload.component.html',
  styleUrls: ['./excel-upload.component.scss']
})
export class ExcelUploadComponent {

  selectedFile: File | null = null;
  selectedSheet: string | null = null;

  sheets: string[] = [];
  previewData: any[] = [];
  displayedColumns: string[] = [];

  uploadSuccess = false;
  uploadError: string | null = null;

  uploadProgress = 0;
  processingProgress = 0;
  processingStep = '';

  // Charts
  barChart: any;
  doughnutChart: any;

  constructor(
    private productService: ProductService,
    private wsService: WebsocketService
  ) {}

  // ========================
  // Seleccionar archivo
  // ========================
  onFileSelected(event: any): void {
    const file: File | undefined = event?.target?.files?.[0];

    if (!file) {
      this.uploadError = 'No seleccionaste ningún archivo.';
      return;
    }

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      this.uploadError = 'Solo se permiten archivos Excel.';
      this.selectedFile = null;
      return;
    }

    this.selectedFile = file;
    this.uploadError = null;
    this.uploadSuccess = false;
    this.previewData = [];
    this.displayedColumns = [];
    this.uploadProgress = 0;
    this.processingProgress = 0;
    this.processingStep = '';

    this.loadSheets();
  }

  // ========================
  // Cargar hojas del Excel
  // ========================
  loadSheets(): void {
    if (!this.selectedFile) return;

    this.productService.getExcelSheets(this.selectedFile).subscribe({
      next: (response) => {
        this.sheets = response.sheets;
      },
      error: () => {
        this.uploadError = "No se pudieron cargar las hojas.";
      }
    });
  }

  // ========================
  // Vista previa
  // ========================
  previewSheet(): void {
    if (!this.selectedFile || !this.selectedSheet) {
      this.uploadError = 'Debes seleccionar una hoja.';
      return;
    }

    this.productService.previewSheet(this.selectedFile, this.selectedSheet).subscribe({
      next: (response) => {
        this.previewData = response.preview;
        this.displayedColumns =
          this.previewData.length > 0 ? Object.keys(this.previewData[0]) : [];
      },
      error: () => {
        this.uploadError = "Error al previsualizar la hoja.";
      }
    });
  }

  // ========================
  // Importar Excel + WebSocket
  // ========================
  uploadFile(): void {
    if (!this.selectedFile) {
      this.uploadError = 'No seleccionaste un archivo.';
      return;
    }

    if (!this.selectedSheet) {
      this.uploadError = 'Debes seleccionar una hoja.';
      return;
    }

    this.uploadError = null;
    this.uploadSuccess = false;
    this.uploadProgress = 0;
    this.processingProgress = 0;
    this.processingStep = '';

    this.wsService.connect((msg) => {
      this.processingStep = msg.step;
      this.processingProgress = msg.progress;
    });

    this.productService.uploadExcel(this.selectedFile, this.selectedSheet).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round((event.loaded * 100) / event.total);
        }

        if (event.type === HttpEventType.Response) {
          this.uploadSuccess = true;
          this.uploadProgress = 100;

          // 📌 Aquí cargamos productos y dibujamos gráficos
          this.loadProductsForCharts();
        }
      },
      error: (err) => {
        this.uploadError = err?.error?.detail || 'Error al subir el archivo.';
      }
    });
  }

  // ========================
  // 📊 Cargar productos y armar gráficas
  // ========================
  loadProductsForCharts() {
    this.productService.getProducts().subscribe({
      next: (resp) => {
        const products = resp.data ?? resp;

        const labels = products.map((p: any) => p.name);
        const prices = products.map((p: any) => p.price);

        this.renderBarChart(labels, prices);
        this.renderDoughnutChart(labels, prices);
      }
    });
  }

  renderBarChart(labels: string[], data: number[]) {
    if (this.barChart) this.barChart.destroy();

    this.barChart = new Chart('barChartCanvas', {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Precio del producto', data }
        ]
      }
    });
  }

  renderDoughnutChart(labels: string[], data: number[]) {
    if (this.doughnutChart) this.doughnutChart.destroy();

    this.doughnutChart = new Chart('doughnutChartCanvas', {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          { label: 'Distribución de precios', data }
        ]
      }
    });
  }
}


