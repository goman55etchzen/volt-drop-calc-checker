import { neon } from '@neondatabase/serverless';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const databaseUrl = process.env.DATABASE_URL || '';
const sql = databaseUrl ? neon(databaseUrl) : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!sql) {
    return res.status(500).json({ error: 'DATABASE_URL is not set' });
  }

  const voltage = req.query.voltage ? Number(req.query.voltage) : undefined;
  const frequency_hz = req.query.frequency_hz ? Number(req.query.frequency_hz) : undefined;

  try {
    if (voltage) {
      const rows = await sql`
        SELECT 
          model,
          manufacturer AS maker,
          capacity_uf AS uf,
          rated_voltage_v AS voltage,
          frequency_hz
        FROM capacitors
        WHERE rated_voltage_v = ${voltage}
        ${frequency_hz ? sql`AND (frequency_hz = ${frequency_hz} OR frequency_hz IS NULL)` : sql``}
        ORDER BY capacity_uf ASC
      `;
      return res.status(200).json(rows);
    }

    const rows = await sql`
      SELECT 
        model,
        manufacturer AS maker,
        capacity_uf AS uf,
        rated_voltage_v AS voltage,
        frequency_hz
      FROM capacitors
      ORDER BY rated_voltage_v ASC, capacity_uf ASC
    `;
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ error: String(error) });
  }
}