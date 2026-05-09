module.exports = (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
  res.json({ key: process.env.GOOGLE_MAPS_KEY || '' });
};
