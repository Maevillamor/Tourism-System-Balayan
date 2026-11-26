// Controllers: tumanggap ng request, tumawag sa Service, nagbalik ng response
import * as S from '../Services/appointmentService.js';

const fail = (res, e) => {
  if (e instanceof S.HttpError) return res.status(e.status).json({ error: e.message, errors: e.errors });
  console.error(e);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
};

export const getServices = async (_req, res) => {
  try { res.json(await S.listServices()); } catch (e) { fail(res, e); }
};
export const getAvailability = async (req, res) => {
  try { res.json(await S.getAvailability(req.query.serviceId, req.query.month)); } catch (e) { fail(res, e); }
};
export const getSlots = async (req, res) => {
  try { res.json(await S.getSlots(req.query.serviceId, req.query.date)); } catch (e) { fail(res, e); }
};
export const createAppointment = async (req, res) => {
  try { res.status(201).json(await S.createAppointment(req.body || {})); } catch (e) { fail(res, e); }
};

export const getAppointment = async (req, res) => {
  try { res.json(await S.getAppointment(req.params.reference)); } catch (e) { fail(res, e); }
};
export const rescheduleAppointment = async (req, res) => {
  try { res.json(await S.rescheduleAppointment(req.params.reference, req.body || {})); } catch (e) { fail(res, e); }
};
export const cancelAppointment = async (req, res) => {
  try { res.json(await S.cancelAppointment(req.params.reference, req.body || {})); } catch (e) { fail(res, e); }
};
