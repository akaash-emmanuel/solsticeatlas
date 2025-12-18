
export class EarthquakeLayer {
    constructor() {
        this.infoPanel = null;
        this.data = null;
    }

    async init(scene, globe, infoPanel) {
        this.globe = globe;
        this.infoPanel = infoPanel;
        await this.fetchEarthquakes();
    }

    cleanup() {
        // Clear visualization
        if (this.globe) {
            this.globe.ringsData([]);
            this.globe.labelsData([]);
        }

        // Remove Info
        if (this.infoPanel) {
            this.infoPanel.removeSection('earthquakes');
        }
    }

    update(time) {
        // No manual updates needed
    }

    getQuakeColor(magnitude) {
        if (magnitude >= 8) return '#FF0000';
        if (magnitude >= 7) return '#FF3300';
        if (magnitude >= 6.5) return '#FF6600';
        if (magnitude >= 6) return '#FF9900';
        return '#FFCC00';
    }

    renderInfoPanel(data) {
        if (!this.infoPanel) return;

        let html = `
            <div style="margin-bottom:8px; font-weight:bold; color:#aaaaab;">
                Last 30 Days (6.0+ Mag Only)
            </div>
            <div style="max-height:200px; overflow-y:auto; padding-right:5px;">
        `;

        data.forEach(q => {
            const dateObj = new Date(q.time);
            const dateStr = dateObj.toLocaleDateString();
            const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            html += `
                <div style="margin-bottom:6px; border-bottom:1px solid #333; padding-bottom:4px; font-size:11px;">
                    <div style="display:flex; justify-content:space-between;">
                        <strong style="color:${q.color}">${q.mag}</strong>
                        <span style="color:#888">${dateStr} ${timeStr}</span>
                    </div>
                    <div>${q.place}</div>
                </div>
             `;
        });
        html += `</div>`;

        this.infoPanel.addSection('earthquakes', 'Earthquakes 📉', html);
    }

    fetchEarthquakes() {
        // 4.5+ Summary Feed
        return fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_month.geojson')
            .then(res => res.json())
            .then(data => {
                let quakes = data.features;

                // User Request: STRICT 6+ ONLY
                // "anything under 6 no need to show or mention"

                let combinedQuakes = quakes.filter(q => q.properties.mag >= 6.0); // Strict filter
                combinedQuakes.sort((a, b) => b.properties.time - a.properties.time);

                const processedData = combinedQuakes.map(q => ({
                    lat: q.geometry.coordinates[1],
                    lng: q.geometry.coordinates[0],
                    mag: q.properties.mag,
                    place: q.properties.place,
                    time: q.properties.time,
                    color: this.getQuakeColor(q.properties.mag),
                    maxR: q.properties.mag * 0.5,
                    propagationSpeed: 0.5 + (q.properties.mag / 20),
                    repeatPeriod: 1500 - (q.properties.mag * 100)
                }));

                this.originalData = processedData; // Store source for filtering
                this.updateVisualization(processedData);
            })
            .catch(err => console.error("Could not fetch earthquakes", err));
    }

    updateVisualization(data) {
        this.data = data;

        this.globe.ringsData(data)
            .ringColor('color')
            .ringMaxRadius('maxR')
            .ringPropagationSpeed('propagationSpeed')
            .ringRepeatPeriod('repeatPeriod')
            .ringAltitude(0.01)
            .ringResolution(32);

        // Label ALL of them since they are all major now
        this.globe.labelsData(data)
            .labelLat('lat')
            .labelLng('lng')
            .labelText(d => `${d.mag} - ${d.place}`)
            .labelSize(d => 1.5)
            .labelDotRadius(0.5)
            .labelColor(() => 'white')
            .labelResolution(2);

        this.renderInfoPanel(data);
    }

    filter(criteria) {
        if (!this.originalData) return;

        let filtered = this.originalData;

        if (criteria.minMag) {
            filtered = filtered.filter(d => d.mag >= criteria.minMag);
        }

        // Update View
        this.updateVisualization(filtered);
    }
}
