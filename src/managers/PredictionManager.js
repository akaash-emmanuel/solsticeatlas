
export class PredictionManager {
    constructor() {
        this.datasets = [];
    }

    ingest(layerName, data) {
        this.datasets.push({ name: layerName, data: data });
    }

    clear() {
        this.datasets = [];
    }

    // Run the predictive model (v2.0 - Time Decay + Spatial Density)
    predict() {
        if (this.datasets.length === 0) return [];

        // Running Prediction Model v2.0

        const riskPoints = [];
        const NOW = Date.now();
        const ONE_DAY = 24 * 60 * 60 * 1000;

        this.datasets.forEach(set => {
            set.data.forEach(point => {
                let weight = 0;

                // 1. Base Intensity
                if (point.mag) weight = Math.pow(point.mag, 2); // Exponential for quakes (M6 is 100x M4)
                if (point.brightness) weight = point.brightness / 10; // Fires

                // 2. Time Decay (The "Prediction" Element)
                // Newer events = Higher probability of aftershocks/spread
                if (point.time) {
                    const age = NOW - point.time;
                    const daysOld = age / ONE_DAY;

                    if (daysOld < 1) weight *= 2.0; // Hot!
                    else if (daysOld < 7) weight *= 1.0; // Recent
                    else weight *= Math.max(0.1, 1 - (daysOld / 30)); // Decay to 0 over month
                }

                // 3. Add to pool
                if (weight > 0.1) {
                    riskPoints.push({
                        lat: point.lat,
                        lng: point.lng,
                        weight: weight
                    });
                }
            });
        });

        // Normalize weights for Heatmap (0.0 to 1.0)
        // We find the "98th percentile" max to avoid one huge outlier squashing everything else
        const weights = riskPoints.map(p => p.weight).sort((a, b) => a - b);
        const maxVal = weights[Math.floor(weights.length * 0.98)] || 10;

        return riskPoints.map(p => ({
            lat: p.lat,
            lng: p.lng,
            weight: Math.min(1.0, p.weight / maxVal) // Cap at 1.0
        }));
    }
}
