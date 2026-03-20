import { Router } from 'express';
import customerService from '../../services/customer.service';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { name, phone, email } = req.body;
    const customer = await customerService.createCustomer(name, phone, email);
    res.json({ success: true, data: customer });
  } catch (error: any) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const customers = await customerService.listCustomers();
    res.json({ success: true, data: customers });
  } catch (error: any) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const customer = await customerService.getCustomer(parseInt(req.params.id));
    res.json({ success: true, data: customer });
  } catch (error: any) {
    next(error);
  }
});

export default router;
