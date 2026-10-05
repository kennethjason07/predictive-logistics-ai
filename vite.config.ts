import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function inventoryApiPlugin(): Plugin {
  return {
    name: 'inventory-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/inventory/intelligence')) {
          try {
            const url = new URL(req.url, 'http://localhost:3000');
            const locationId =
              url.searchParams.get('location_id') ||
              url.searchParams.get('locationId') ||
              'loc-004';
            const supplyType =
              url.searchParams.get('supply_type') ||
              url.searchParams.get('supply_id') ||
              url.searchParams.get('supplyType') ||
              'Extreme Cold Climate Rations (ECC)';
            const periodDays = parseInt(url.searchParams.get('period_days') || '30', 10);
            const horizonDays = parseInt(url.searchParams.get('horizon_days') || '7', 10);
            const useForecast = url.searchParams.get('use_forecast') !== 'false';

            const { inventoryService } = await server.ssrLoadModule('/src/inventory/inventory.service.ts');
            const result = await inventoryService.getInventoryIntelligence({
              location_id: locationId,
              supply_type: supplyType,
              analysis_period_days: periodDays,
              planning_horizon_days: horizonDays,
              use_forecast: useForecast
            });

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result, null, 2));
            return;
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || String(err) }));
            return;
          }
        }

        if (req.url && req.url.startsWith('/api/inventory/overview')) {
          try {
            const url = new URL(req.url, 'http://localhost:3000');
            const periodDays = parseInt(url.searchParams.get('period_days') || '30', 10);
            const horizonDays = parseInt(url.searchParams.get('horizon_days') || '7', 10);

            const { inventoryService } = await server.ssrLoadModule('/src/inventory/inventory.service.ts');
            const result = await inventoryService.getMultiLocationInventoryOverview(periodDays, horizonDays);

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result, null, 2));
            return;
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || String(err) }));
            return;
          }
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), inventoryApiPlugin()],
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  define: {
    'process.env': {}
  },
  server: {
    port: 3000,
    open: false
  }
});
