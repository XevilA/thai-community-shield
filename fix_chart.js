const fs = require('fs');
const files = [
  '/Volumes/MAC/Thai_Community/server/public/index.html',
  '/Volumes/MAC/Thai_Community/public/index.html'
];
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  
  html = html.replace(
    'function renderChart(level, forecast, threshold) {',
    `function renderChart(level, forecast, threshold) {
      if (level === undefined && typeof state !== 'undefined' && state.hydrology) {
        level = state.hydrology.waterLevelMeters || 0;
        forecast = state.hydrology.forecastLevel2200 || 1.0;
        threshold = 0.70;
      }
      level = level || 0;
      forecast = forecast || 1.0;
      threshold = threshold || 0.70;`
  );
  
  fs.writeFileSync(file, html);
}
