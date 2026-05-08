module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const d = req.body;
  if (!d || !d.phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Partial lead capture (step-1 abandonment) — log but return immediately
  if (d._partial) {
    console.log('Partial lead captured:', { phone: d.phone, address: d.address, name: d.name });
    return res.status(200).json({ ok: true });
  }

  const name = d.name || [d.firstName, d.lastName].filter(Boolean).join(' ');
  const address = [d.address, d.city, d.state, d.zip].filter(Boolean).join(', ');
  const subject = `New Lead: ${address || 'Unknown Property'}${name ? ` — ${name}` : ''}`;

  const rows = [
    ['Property',          address],
    ['Type',              d.propertyType],
    ['Beds / Baths',      [d.bedrooms && `${d.bedrooms} bed`, d.bathrooms && `${d.bathrooms} bath`].filter(Boolean).join(' / ')],
    ['Sq Ft',             d.sqft],
    ['Year Built',        d.yearBuilt],
    ['Condition',         d.condition],
    ['Specific Issues',   d.issues],
    ['Occupancy',         d.occupancy],
    ['Lease Status',      d.leaseStatus],
    ['Reason',            d.reason],
    ['Timeline',          d.timeline],
    ['Challenge / Story', d.challenge],
    ['Mortgage',          d.mortgageStatus],
    ['Mortgage Balance',  d.mortgageBalance],
    ['Payment Status',    d.paymentStatus],
    ['Liens / Taxes',     d.liens],
    ['Est. Value',        d.estimatedValue],
    ['Price Expectation', d.priceExpectation],
    ['Creative Options',  d.creativeOpenness],
    ['Ownership',         d.ownership],
    ['Decision Align',    d.decisionAlignment],
    ['Best Time to Call', d.bestTimeToCall],
    ['Pref. Channel',     d.preferredChannel],
    ['Notes',             d.notes],
    ['Name',              name],
    ['Phone',             d.phone],
    ['Email',             d.email],
  ]
    .filter(([, v]) => v)
    .map(([k, v]) => `
      <tr>
        <td style="padding:8px 16px;font-weight:600;color:#0B1A2E;white-space:nowrap;border-bottom:1px solid #EAEDF1;vertical-align:top">${k}</td>
        <td style="padding:8px 16px;color:#2E3949;border-bottom:1px solid #EAEDF1">${v}</td>
      </tr>`)
    .join('');

  const html = `<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f5f7;padding:32px 0;margin:0">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
    <div style="background:#06101F;padding:28px 32px">
      <p style="color:#93A3B8;font-size:12px;margin:0 0 6px;letter-spacing:.12em;text-transform:uppercase">Silver Lynx Homes</p>
      <h1 style="color:#fff;font-size:22px;margin:0;font-weight:700">New Cash Offer Lead</h1>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      ${rows}
    </table>
    <div style="padding:20px 32px 28px;background:#FAFAF7;border-top:1px solid #EAEDF1">
      <p style="color:#6B7484;font-size:12px;margin:0;line-height:1.6">
        Submitted via silverlynxhomes.com
        ${d.email ? `· <a href="mailto:${d.email}" style="color:#2563EB">Reply to reach lead directly</a>` : ''}
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'Silver Lynx Leads <onboarding@resend.dev>',
        to: [process.env.LEAD_EMAIL || 'offers@silverlynxhomes.com'],
        reply_to: d.email || undefined,
        subject,
        html,
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      console.error('Resend error:', err);
      return res.status(502).json({ error: 'Failed to send notification' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('submit-lead error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
};
