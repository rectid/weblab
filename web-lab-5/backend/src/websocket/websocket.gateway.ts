import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayInit } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"],
    credentials: true
  }
})
export class WebsocketGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    console.log('WebSocket Gateway initialized');
  }

  sendPriceUpdate(data: any) {
    this.server.emit('priceUpdate', data);
  }

  sendTradingState(data: any) {
    this.server.emit('tradingState', data);
  }

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    return 'Hello from server!';
  }
}