import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  private socket: WebSocket | null = null;

  connect(onMessage: (msg: any) => void) {
    // Importante: ruta correcta según tu backend
    this.socket = new WebSocket("ws://localhost:8000/excel-progress");

    this.socket.onopen = () => {
      console.log("WebSocket conectado");
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (err) {
        console.warn("Mensaje no válido del servidor:", event.data);
      }
    };

    this.socket.onerror = () => {
      console.error("Error en WebSocket");
    };

    this.socket.onclose = () => {
      console.log("WebSocket cerrado");
    };
  }

  close() {
    this.socket?.close();
  }
}
