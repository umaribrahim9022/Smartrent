// Calculate Demand Indicator (High, Medium, Low) based on views & bookings
exports.calculateDemand = (viewsCount = 0, bookingsCount = 0) => {
  const score = (viewsCount * 1) + (bookingsCount * 5);
  if (score >= 20) return { level: 'High Demand', color: 'rose', icon: '🔥' };
  if (score >= 8) return { level: 'Popular', color: 'amber', icon: '⚡' };
  return { level: 'Standard', color: 'slate', icon: '🏠' };
};

// Calculate Location/Area Score based on location keywords (Static/Formula based)
exports.calculateLocationScore = (location = '') => {
  const loc = location.toLowerCase();
  let safetyScore = 8.0;
  let amenitiesScore = 7.5;

  if (loc.includes('gulberg') || loc.includes('dha') || loc.includes('bahria') || loc.includes('f-7')) {
    safetyScore = 9.5;
    amenitiesScore = 9.2;
  } else if (loc.includes('cantt') || loc.includes('johar')) {
    safetyScore = 8.8;
    amenitiesScore = 8.5;
  }

  const overallScore = ((safetyScore + amenitiesScore) / 2).toFixed(1);
  return {
    overallScore,
    safetyScore,
    amenitiesScore,
    walkability: Math.min(Math.round(amenitiesScore * 10), 98) + '%'
  };
};