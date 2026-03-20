export interface Customer {
  id: number;
  code: string;
  name: string;
  phone: string;
  email?: string;
  status: 'regular' | 'vip' | 'blacklist';
  visitCount: number;
  loyaltyPoints: number;
  createdAt: Date;
}

export interface Room {
  id: number;
  roomNumber: string;
  floor: number;
  type: 'single' | 'double' | 'suite' | 'deluxe';
  capacity: number;
  pricePerNight: number;
  amenities: string[];
  status: 'available' | 'occupied' | 'maintenance';
  createdAt: Date;
}

export interface Booking {
  id: number;
  code: string;
  customerId: number;
  roomId: number;
  checkIn: Date;
  checkOut: Date;
  totalNights: number;
  totalPrice: number;
  depositAmount: number;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  createdAt: Date;
}

export interface Payment {
  id: number;
  code: string;
  bookingId?: number;
  customerId?: number;
  amount: number;
  method: 'cash' | 'transfer' | 'card';
  status: 'completed' | 'pending';
  createdAt: Date;
}

export interface DailyReport {
  date: Date;
  occupancyRate: number;
  totalRooms: number;
  occupiedRooms: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}
