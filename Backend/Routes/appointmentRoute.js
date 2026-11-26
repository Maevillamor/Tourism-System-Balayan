import { Router } from 'express';
import * as C from '../Controllers/appointmentController.js';

const router = Router();
router.get('/services', C.getServices);
router.get('/availability', C.getAvailability);
router.get('/slots', C.getSlots);
router.post('/appointments', C.createAppointment);
router.get('/appointments/:reference', C.getAppointment);
router.patch('/appointments/:reference/reschedule', C.rescheduleAppointment);
router.patch('/appointments/:reference/cancel', C.cancelAppointment);

export default router;
