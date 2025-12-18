
import * as THREE from "three";

export class PredictionLayer {
    constructor() {
        this.infoPanel = null;
        this.globe = null;
    }

    init(scene, globe, infoPanel) {
        this.globe = globe;
        this.infoPanel = infoPanel;
    }

    visualize(predictions) {
        if (!this.globe) return;

        // Visualizing Spikes

        // 1. CLEAR OLD LAYERS (Heatmaps/Hex)
        this.globe.heatmapsData([]);
        this.globe.hexBinPointsData([]);

        // 2. DATA SPIKES (Precision Viz)
        // Thin, glowing vertical lines indicating intensity
        const spikes = predictions.filter(p => p.weight > 0.05); // Filter noise

        this.globe.pointsData(spikes)
            .pointLat('lat')
            .pointLng('lng')
            .pointAltitude(p => p.weight * 0.3) // Height = Risk
            .pointRadius(0.15) // Thin spikes
            .pointColor(p => {
                // Gradient: Red -> Orange -> White
                if (p.weight > 0.8) return '#ffffff'; // Super Critical
                if (p.weight > 0.5) return '#ffaa00'; // High
                return '#ff0000'; // Moderate
            })
            .pointResolution(8); // Sharper circles

        // 3. RINGS (High Risk Alerts)
        // Only for top 10% hottest zones
        const highRisk = predictions.filter(p => p.weight > 0.8);

        this.globe.ringsData(highRisk)
            .ringColor(() => '#ff0000') // Bright Red
            .ringMaxRadius(3)
            .ringPropagationSpeed(3) // Faster
            .ringRepeatPeriod(600)
            .ringAltitude(0.01);

        this.renderInfoPanel(highRisk.length);
    }

    cleanup() {
        if (this.globe) {
            this.globe.heatmapsData([]);
            this.globe.ringsData([]);
        }
        if (this.infoPanel) {
            this.infoPanel.removeSection('prediction');
        }
    }

    renderInfoPanel(highRiskCount) {
        if (!this.infoPanel) return;

        let html = `
            <div style="margin-bottom:8px; color: #ff55ff; border-bottom: 1px solid rgba(255, 0, 255, 0.3); padding-bottom: 5px;">
                <strong>🔮 RISK ANALYSIS</strong>
            </div>
            
            <div style="margin-bottom:12px;">
                <div style="font-size: 11px; color: #ccc; margin-bottom: 4px;">SEISMIC SPIKE INTENSITY</div>
                <div style="
                    height: 12px; 
                    width: 100%; 
                    background: linear-gradient(to right, #ff0000, #ffaa00, #ffffff); 
                    border-radius: 6px;
                    margin-bottom: 4px;
                    border: 1px solid rgba(255,255,255,0.2);
                "></div>
                <div style="display: flex; justify-content: space-between; font-size: 9px; color: #aaa;">
                    <span>MODERATE</span>
                    <span>HIGH</span>
                    <span style="color:#ffffff;">CRITICAL</span>
                </div>
            </div>

            <div style="margin-bottom:12px; font-size: 10px; line-height: 1.5; color: #ddd; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">
                 <strong>🧠 MODEL LOGIC:</strong>
                 <ul style="padding-left: 12px; margin: 4px 0;">
                    <li style="margin-bottom: 2px;"><strong>Time Decay:</strong> Events < 24h old are weighted 200% higher. Older events fade to 0 over 30 days.</li>
                    <li style="margin-bottom: 2px;"><strong>Swarm Density:</strong> Clusters of spikes indicate tectonic instability.</li>
                    <li><strong>Magnitude Scale:</strong> Risk increases exponentially with magnitude (M6 = 100x M4).</li>
                 </ul>
                 <div style="margin-top: 6px; color: #aaa; font-style: italic;">
                    "White Spikes" represent zones where all three factors (Freshness, Density, Power) align.
                 </div>
            </div>

            <div>
                 <strong>Active Hotspots:</strong> <span style="color:white; font-weight:bold;">${highRiskCount}</span>
            </div>
        `;
        this.infoPanel.addSection('prediction', 'Prediction Model 🔮', html);
    }
}
