import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

const LOGO_URL = 'https://albertosite.vercel.app/assets/silver-lynx-horizontal-dark.png';

export default function handler() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(145deg, #06101F 0%, #0D1F38 60%, #06101F 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 80px',
        }}
      >
        {/* Silver accent line top */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, transparent, #C0C8D8, transparent)',
          display: 'flex',
        }} />

        {/* Logo */}
        <img
          src={LOGO_URL}
          style={{ width: 420, marginBottom: 32 }}
        />

        {/* Divider */}
        <div style={{
          width: 60,
          height: 1,
          background: 'rgba(147,163,184,0.4)',
          marginBottom: 28,
          display: 'flex',
        }} />

        {/* Primary slogan */}
        <p style={{
          color: '#E2E8F0',
          fontSize: 30,
          fontFamily: 'sans-serif',
          fontWeight: 600,
          letterSpacing: '0.06em',
          margin: 0,
          textAlign: 'center',
        }}>
          Sell Your House Fast for Cash
        </p>

        {/* Secondary line */}
        <p style={{
          color: '#93A3B8',
          fontSize: 20,
          fontFamily: 'sans-serif',
          fontWeight: 400,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          margin: '14px 0 0',
          textAlign: 'center',
        }}>
          Fair Offer in 24 Hours · Any Condition · No Fees
        </p>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
