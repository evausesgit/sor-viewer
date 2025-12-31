// Test file to verify imports work
import { Order, Venue, OrderBook } from './core/types/market';

const testOrder: Order = {
  id: '1',
  symbol: 'AAPL',
  side: 'BID' as any,
  type: 'MARKET' as any,
  quantity: 100,
  filledQuantity: 0,
  status: 'PENDING' as any,
  timestamp: Date.now(),
};

console.log('Test imports working:', testOrder);
