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

  // ── Internal notification email (to team) ──────────────────────────────────
  const internalHtml = `<!DOCTYPE html>
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

  // ── Seller confirmation email (to lead) ────────────────────────────────────
  const firstName = d.firstName || (name ? name.split(' ')[0] : null);
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,';
  const propertyLine = address
    ? `<p style="margin:0 0 24px;color:#2E3949;font-size:15px;line-height:1.7">We've received your request for a cash offer on <strong style="color:#0B1A2E">${address}</strong>. Our team is reviewing the details and will reach out to you shortly — typically within 24 hours.</p>`
    : `<p style="margin:0 0 24px;color:#2E3949;font-size:15px;line-height:1.7">We've received your request for a cash offer and our team is reviewing your details. You'll hear from us shortly — typically within 24 hours.</p>`;

  const confirmationHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>We received your request — Silver Lynx Homes</title></head>
<body style="margin:0;padding:0;background:#F4F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F5F7;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:580px;border-radius:14px;overflow:hidden;box-shadow:0 8px 32px rgba(11,26,46,.1)">

        <!-- Header -->
        <tr>
          <td style="background:#06101F;padding:32px 36px 28px">
            <p style="margin:0 0 4px;color:#8E96A4;font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:600">Silver Lynx Homes</p>
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;line-height:1.2;letter-spacing:-.02em">Real Estate, Resolved.</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:36px 36px 28px">
            <p style="margin:0 0 20px;color:#0B1A2E;font-size:18px;font-weight:700;line-height:1.3">${greeting}</p>
            <p style="margin:0 0 20px;color:#2E3949;font-size:15px;line-height:1.7">Thank you for reaching out to Silver Lynx Homes. We appreciate you taking the time to share your property details with us.</p>
            ${propertyLine}

            <!-- What happens next -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F8FA;border-radius:10px;border:1px solid #EAEDF1;margin-bottom:28px">
              <tr>
                <td style="padding:20px 24px">
                  <p style="margin:0 0 14px;color:#0B1A2E;font-size:13px;font-weight:700;letter-spacing:.1em;text-transform:uppercase">What Happens Next</p>
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;vertical-align:top">
                        <span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:#2563EB;color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:22px;margin-right:12px;flex-shrink:0">1</span>
                        <span style="color:#2E3949;font-size:14px;line-height:1.5">A member of our team reviews your property details.</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;vertical-align:top">
                        <span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:#2563EB;color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:22px;margin-right:12px;flex-shrink:0">2</span>
                        <span style="color:#2E3949;font-size:14px;line-height:1.5">We reach out within <strong>24 hours</strong> to introduce ourselves and ask a few quick questions.</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;vertical-align:top">
                        <span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:#2563EB;color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:22px;margin-right:12px;flex-shrink:0">3</span>
                        <span style="color:#2E3949;font-size:14px;line-height:1.5">We present a no-obligation cash offer — no repairs, no fees, no pressure.</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;color:#2E3949;font-size:15px;line-height:1.7">In the meantime, if you have any questions or want to reach us directly, don't hesitate to get in touch:</p>
            <p style="margin:0 0 4px;font-size:14px;color:#2E3949"><strong style="color:#0B1A2E">Email:</strong> <a href="mailto:Offers@SilverLynxhomes.com" style="color:#2563EB;text-decoration:none">Offers@SilverLynxhomes.com</a></p>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="background:#ffffff;padding:0 36px 36px;text-align:center">
            <a href="https://silverlynxhomes.com" style="display:inline-block;background:#2563EB;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;letter-spacing:-.01em">Visit Our Website</a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F7F8FA;border-top:1px solid #EAEDF1;padding:20px 36px;text-align:center">
            <p style="margin:0 0 6px;color:#8E96A4;font-size:12px;line-height:1.6">Silver Lynx Homes &nbsp;·&nbsp; Real Estate, Resolved.</p>
            <p style="margin:0;color:#B5BDC9;font-size:11px">You received this email because you submitted a cash offer request at silverlynxhomes.com.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const fromAddress = process.env.RESEND_FROM_EMAIL || 'Silver Lynx Homes <onboarding@resend.dev>';
  const toAddress  = process.env.LEAD_EMAIL || 'Offers@SilverLynxhomes.com';

  async function sendEmail(payload) {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const body = await r.json().catch(() => ({}));
      console.error('Resend rejected email:', JSON.stringify(body));
    }
    return r.ok;
  }

  try {
    // Always try to notify the team
    const teamOk = await sendEmail({
      from: fromAddress,
      to: [toAddress],
      reply_to: d.email || undefined,
      subject,
      html: internalHtml,
    });

    // Send confirmation to seller if they gave an email (best-effort)
    if (d.email) {
      sendEmail({
        from: fromAddress,
        to: [d.email],
        reply_to: toAddress,
        subject: 'We received your request — Silver Lynx Homes',
        html: confirmationHtml,
      }).catch(err => console.error('Confirmation email error:', err));
    }

    // Return success regardless of email result — the lead is captured
    // teamOk=false means we got the data but email failed; log is in sendEmail above
    if (!teamOk) console.warn('Team notification email failed — check Resend config/domain verification');
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('submit-lead error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
};
