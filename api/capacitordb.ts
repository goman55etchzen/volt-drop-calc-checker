// capacitordb.ts (または api/capacitors.ts)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCapacitorsFromDb, sql } from './db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!sql) {
    return res.status(500).json({ error: 'DATABASE_URL is not set' });
  }

  const voltage = req.query.voltage ? Number(req.query.voltage) : undefined;
  const frequency_hz = req.query.frequency_hz ? Number(req.query.frequency_hz) : undefined;

  try {
    const rows = await getCapacitorsFromDb(voltage, frequency_hz);
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ error: String(error) });
  }
}