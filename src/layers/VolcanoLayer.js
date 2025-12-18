
import * as THREE from "three";

export class VolcanoLayer {
    constructor() {
        this.infoPanel = null;
    }

    async init(scene, globe, infoPanel) {
        this.globe = globe;
        this.infoPanel = infoPanel;

        const volcanoes = [
            { name: "Mauna Loa", lat: 19.472, lng: -155.592, type: "Shield", loc: "Hawaii" },
            { name: "Kilauea", lat: 19.421, lng: -155.287, type: "Shield", loc: "Hawaii" },
            { name: "Etna", lat: 37.75, lng: 14.99, type: "Stratovolcano", loc: "Italy" },
            { name: "Mount Fuji", lat: 35.36, lng: 138.72, type: "Stratovolcano", loc: "Japan" },
            { name: "Popocatépetl", lat: 19.02, lng: -98.62, type: "Stratovolcano", loc: "Mexico" },
            { name: "Mount St. Helens", lat: 46.20, lng: -122.19, type: "Stratovolcano", loc: "USA" },
            { name: "Vesuvius", lat: 40.82, lng: 14.42, type: "Stratovolcano", loc: "Italy" },
            { name: "Krakatoa", lat: -6.10, lng: 105.42, type: "Stratovolcano", loc: "Indonesia" },
            { name: "Merapi", lat: -7.54, lng: 110.44, type: "Stratovolcano", loc: "Indonesia" },
            { name: "Rainier", lat: 46.85, lng: -121.76, type: "Stratovolcano", loc: "USA" },
            { name: "Cotopaxi", lat: -0.68, lng: -78.43, type: "Stratovolcano", loc: "Ecuador" }
        ];

        this.globe.objectsData(volcanoes)
            .objectLat('lat')
            .objectLng('lng')
            .objectAltitude(0) // Grounded
            .objectThreeObject(d => {
                const geometry = new THREE.ConeGeometry(1, 4, 16);

                // ROTATION CORRECTON: Point UP away from surface.
                geometry.rotateX(Math.PI / 2); // Default is Y. Rotate to Z.

                const material = new THREE.MeshLambertMaterial({ color: 0x555555 });
                const cone = new THREE.Mesh(geometry, material);

                const tipGeo = new THREE.ConeGeometry(0.3, 1, 16);
                // Rotate tip too!
                tipGeo.rotateX(Math.PI / 2);

                const tipMat = new THREE.MeshBasicMaterial({ color: 0xff4400 });
                const tip = new THREE.Mesh(tipGeo, tipMat);

                // Position logic changes if geometry is rotated.
                // If rotated X 90:
                // Old Y is now Z (depth)
                // Old Z is now -Y (down)
                // We want to move tip "up" along the new Z axis.
                tip.position.z = 2; // Was y=2

                cone.add(tip);
                cone.scale.set(2.0, 2.0, 2.0);

                return cone;
            });

        this.renderInfo(volcanoes);
    }

    renderInfo(volcanoes) {
        if (!this.infoPanel) return;

        const container = document.createElement('div');
        Object.assign(container.style, {
            maxHeight: '150px',
            overflowY: 'auto'
        });

        volcanoes.forEach(v => {
            const item = document.createElement('div');
            Object.assign(item.style, {
                marginBottom: '4px',
                fontSize: '11px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                paddingBottom: '2px',
                cursor: 'pointer',
                transition: 'background 0.2s'
            });

            item.innerHTML = `
                <span style="color:#ff8800; font-weight:bold;">${v.name}</span>
                <span style="color:#888;"> - ${v.loc}</span>
            `;

            item.addEventListener('mouseenter', () => item.style.backgroundColor = 'rgba(255,255,255,0.1)');
            item.addEventListener('mouseleave', () => item.style.backgroundColor = 'transparent');

            item.addEventListener('click', () => {
                this.globe.pointOfView({ lat: v.lat, lng: v.lng, altitude: 0.5 }, 1500);
            });

            container.appendChild(item);
        });

        const contentEl = this.infoPanel.addSection('volcanoes', 'Volcanoes 🌋', '');
        if (contentEl) {
            contentEl.appendChild(container);
        }
    }

    cleanup() {
        if (this.globe) {
            this.globe.objectsData([]);
        }
        if (this.infoPanel) {
            this.infoPanel.removeSection('volcanoes');
        }
    }
}
