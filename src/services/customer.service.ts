import { Customer } from '../core/types';
import customerRepo from '../database/repositories/customer';

export class CustomerService {
  async createCustomer(name: string, phone: string, email?: string): Promise<Customer> {
    const existing = await customerRepo.findByPhone(phone);
    if (existing) throw new Error('Customer already exists');

    return customerRepo.create({ name, phone, email, status: 'regular', visitCount: 0, loyaltyPoints: 0 });
  }

  async getCustomer(customerId: number): Promise<Customer> {
    const customer = await customerRepo.findById(customerId);
    if (!customer) throw new Error('Customer not found');
    return customer;
  }

  async listCustomers(): Promise<Customer[]> {
    return customerRepo.findAll();
  }
}

export default new CustomerService();
