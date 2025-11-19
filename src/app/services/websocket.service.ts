import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  private socket: WebSocket | null = null;

  connect(onMessage: (msg: any) => void) {
    this.socket = new WebSocket("ws://localhost:8000/ws/excel");

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
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
