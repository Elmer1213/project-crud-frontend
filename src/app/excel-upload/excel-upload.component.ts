import { Component, OnInit } from '@angular/core';
import { ProductService } from '../services/product.service';
import { HttpEventType } from '@angular/common/http';
import { WebsocketService } from '../services/websocket.service';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-excel-upload',
  templateUrl: './excel-upload.component.html',
  styleUrls: ['./excel-upload.component.scss']
})
export class ExcelUploadComponent implements OnInit {

  // HISTORIAL DE ARCHIVOS
  uploadHistory: Array<{
    fileName: string;
    sheetName: string;
    date: Date;
    recordsImported: number;
    status: 'success' | 'error';
  }> = [];

  selectedFile: File | null = null;
  selectedSheet: string | null = null;

  sheets: string[] = [];
  previewData: any[] = [];
  displayedColumns: string[] = [];

  uploadSuccess = false;
  uploadError: string | null = null;
  duplicateWarning: string | null = null;

  uploadProgress = 0;
  processingProgress = 0;
  processingStep = '';

  constructor(
    private productService: ProductService,
    private wsService: WebsocketService
  ) { 
    this.loadHistoryFromStorage();
  }

  ngOnInit(): void {
    // Inicialización del componente
  }

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
    this.duplicateWarning = null;
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
      next: (response: any) => {
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

    //Verificar duplicados al previsualizar
    this.checkForDuplicates();

    this.productService.previewSheet(this.selectedFile, this.selectedSheet).subscribe({
      next: (response: any) => {
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
  //VERIFICAR DUPLICADOS
  // ========================
  private checkForDuplicates(): void {
    if (!this.selectedFile || !this.selectedSheet) return;

    const isDuplicate = this.uploadHistory.some(
      (record) =>
        record.fileName === this.selectedFile!.name &&
        record.sheetName === this.selectedSheet &&
        record.status === 'success'
    );

    if (isDuplicate) {
      this.duplicateWarning = `⚠️ Ya existe un registro exitoso de "${this.selectedFile.name}" - hoja "${this.selectedSheet}".`;
    } else {
      this.duplicateWarning = null;
    }
  }

  // ========================
  // VALIDAR ANTES DE IMPORTAR
  // ========================
  private isDuplicateUpload(): boolean {
    if (!this.selectedFile || !this.selectedSheet) return false;

    return this.uploadHistory.some(
      (record) =>
        record.fileName === this.selectedFile!.name &&
        record.sheetName === this.selectedSheet &&
        record.status === 'success'
    );
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

    //VALIDAR DUPLICADO ANTES DE SUBIR
    if (this.isDuplicateUpload()) {
      const userConfirmed = confirm(
        `El archivo "${this.selectedFile.name}" con la hoja "${this.selectedSheet}" ya fue importado exitosamente.\n\n¿Deseas importarlo nuevamente?`
      );

      if (!userConfirmed) {
        this.uploadError = 'Importación cancelada: archivo duplicado.';
        return;
      }
    }

    this.uploadError = null;
    this.uploadSuccess = false;
    this.duplicateWarning = null;
    this.uploadProgress = 0;
    this.processingProgress = 0;
    this.processingStep = '';

    const currentFileName = this.selectedFile.name;
    const currentSheetName = this.selectedSheet;

    this.wsService.connect((msg: any) => {
      this.processingStep = msg.step;
      this.processingProgress = msg.progress;
    });

    this.productService.uploadExcel(this.selectedFile, this.selectedSheet).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round((event.loaded * 100) / event.total);
        }

        if (event.type === HttpEventType.Response) {
          this.uploadSuccess = true;
          this.uploadProgress = 100;

          // 📌 Agregar al historial
          this.uploadHistory.unshift({
            fileName: currentFileName,
            sheetName: currentSheetName,
            date: new Date(),
            recordsImported: event.body?.count || 0,
            status: 'success'
          });

          // Guardar en localStorage
          this.saveHistoryToStorage();

          this.productService.notifyProductsChanged();
        }
      },
      error: (err: any) => {
        this.uploadError = err?.error?.detail || 'Error al subir el archivo.';

        // Agregar error al historial
        this.uploadHistory.unshift({
          fileName: currentFileName,
          sheetName: currentSheetName,
          date: new Date(),
          recordsImported: 0,
          status: 'error'
        });

        this.saveHistoryToStorage();
      }
    });
  }

  // Guardar historial en localStorage
  private saveHistoryToStorage(): void {
    localStorage.setItem('excel_upload_history', JSON.stringify(this.uploadHistory));
  }

  // Cargar historial desde localStorage
  private loadHistoryFromStorage(): void {
    const saved = localStorage.getItem('excel_upload_history');
    if (saved) {
      this.uploadHistory = JSON.parse(saved);
    }
  }

  // Limpiar historial
  clearHistory(): void {
    if (confirm('¿Estás seguro de que deseas limpiar el historial?')) {
      this.uploadHistory = [];
      localStorage.removeItem('excel_upload_history');
      this.duplicateWarning = null;
    }
  }
}