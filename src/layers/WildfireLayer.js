
export class WildfireLayer {
    constructor() {
        this.infoPanel = null;
    }

    async init(scene, globe, infoPanel) {
        this.globe = globe;
        this.infoPanel = infoPanel;

        const fires = [
            { lat: 39.0, lng: -121.0, weight: 1.0, name: "California (North)" },
            { lat: 37.0, lng: -119.0, weight: 0.8, name: "California (Central)" },
            { lat: -3.0, lng: -60.0, weight: 1.0, name: "Amazon Rainforest" },
            { lat: 5.0, lng: 20.0, weight: 0.5, name: "Central Africa" },
            { lat: -33.0, lng: 150.0, weight: 0.9, name: "New South Wales" }
        ];

        // Visualization Logic (same as before)
        let spreadFires = [];
        fires.forEach(f => {
            spreadFires.push(f);
            for (let i = 0; i < 5; i++) {
                spreadFires.push({
                    lat: f.lat + (Math.random() - 0.5) * 2,
                    lng: f.lng + (Math.random() - 0.5) * 2,
                    weight: f.weight * Math.random()
                });
            }
        });

        this.globe.heatmapsData([spreadFires])
            .heatmapPointLat('lat')
            .heatmapPointLng('lng')
            .heatmapPointWeight('weight')
            .heatmapBandwidth(1.0) // Tighter
            .heatmapColorSaturation(4.0) // More intense
            .heatmapTopAltitude(0.02); // Slightly higher

        this.renderInfo(fires);
    }

    renderInfo(fires) {
        if (!this.infoPanel) return;

        let html = `<div style="max-height:150px; overflow-y:auto;">`;
        fires.forEach(f => {
            let intensity = f.weight > 0.8 ? "Severe" : "Active";
            let color = f.weight > 0.8 ? "#ff3300" : "#ff8800";

            html += `
                <div style="margin-bottom:4px; font-size:11px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:2px;">
                    <div style="font-weight:bold; color:#ccc;">${f.name}</div>
                    <div style="color:${color}">${intensity}</div>
                </div>
            `;
        });
        html += `</div>`;

        this.infoPanel.addSection('wildfires', 'Active Fires 🔥', html);
    }

    cleanup() {
        if (this.globe) {
            this.globe.heatmapsData([]);
        }
        if (this.infoPanel) {
            this.infoPanel.removeSection('wildfires');
        }
    }
}
