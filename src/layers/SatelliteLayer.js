
import * as THREE from "three";
import * as satellite from "satellite.js";

export class SatelliteLayer {
    constructor() {
        this.satellites = [];
        this.group = new THREE.Group();
        this.infoPanel = null;
        this.lastUpdate = 0;

        // Time Simulation
        this.simStartTime = Date.now();
        this.simSpeed = 1000;
        this.isLive = false;
    }

    async init(scene, globe, infoPanel) {
        this.scene = scene;
        this.infoPanel = infoPanel;
        this.scene.add(this.group);

        // TLE DATA - PATCHED FOR 2025
        const tles = [
            {
                name: "ISS",
                color: "#ffaa00",
                l1: "1 25544U 98067A   25348.50407407  .00015076  00000-0  27576-3 0  9990",
                l2: "2 25544  51.6415 159.2618 0001859 293.7508 174.6853 15.49506692430263"
            },
            {
                name: "STARLINK-1007",
                color: "#00ffff",
                l1: "1 44713U 19074A   25348.24305556  .00001000  00000-0  80000-4 0  9990",
                l2: "2 44713  53.0538 175.7684 0001432  95.3218 264.8094 15.06394513227451"
            },
            {
                name: "HUBBLE",
                color: "#ff00ff",
                l1: "1 20580U 90037B   25347.16805556  .00001500  00000-0  60000-4 0  9990",
                l2: "2 20580  28.4699 285.4563 0003000  95.0000 265.0000 15.09000000000000"
            }
        ];

        tles.forEach(data => {
            const satrec = satellite.twoline2satrec(data.l1, data.l2);

            // Visual Geometry
            const geometry = new THREE.SphereGeometry(1.5, 8, 8);
            const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(data.color) });
            const mesh = new THREE.Mesh(geometry, material);

            this.group.add(mesh);

            // Orbit Line
            const lineGeo = new THREE.BufferGeometry();
            const lineMat = new THREE.LineBasicMaterial({
                color: new THREE.Color(data.color),
                opacity: 0.6,
                transparent: true
            });
            const line = new THREE.Line(lineGeo, lineMat);
            this.group.add(line);

            this.satellites.push({
                mesh,
                satrec,
                line,
                name: data.name,
                color: data.color,
                currentPos: null
            });
        });

        this.renderInfo();
    }

    renderInfo() {
        if (!this.infoPanel) return;

        const container = document.createElement('div');

        // 1. Controls
        const controlsDiv = document.createElement('div');
        Object.assign(controlsDiv.style, {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
            paddingBottom: '8px',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
        });

        const statusLabel = document.createElement('span');
        statusLabel.innerText = this.isLive ? "LIVE 🔴" : "FAST ⏩";
        statusLabel.style.fontSize = '12px';
        statusLabel.style.fontWeight = 'bold';
        statusLabel.style.color = this.isLive ? '#ff4444' : '#ffff00';

        const toggleBtn = document.createElement('button');
        toggleBtn.innerText = this.isLive ? "Go Fast" : "Go Live";
        Object.assign(toggleBtn.style, {
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            borderRadius: '4px',
            padding: '2px 8px',
            fontSize: '10px',
            cursor: 'pointer'
        });

        toggleBtn.onclick = () => {
            this.isLive = !this.isLive;
            if (!this.isLive) {
                this.simStartTime = Date.now();
            }

            statusLabel.innerText = this.isLive ? "LIVE 🔴" : "FAST ⏩";
            statusLabel.style.color = this.isLive ? '#ff4444' : '#ffff00';
            toggleBtn.innerText = this.isLive ? "Go Fast" : "Go Live";
        };

        controlsDiv.appendChild(statusLabel);
        controlsDiv.appendChild(toggleBtn);
        container.appendChild(controlsDiv);

        // 2. Data Container
        const dataDiv = document.createElement('div');
        dataDiv.id = 'sat-data-container';
        dataDiv.innerText = "Initializing... (Waiting for signal)";
        container.appendChild(dataDiv);

        this.infoPanel.addSection('satellites', 'Orbit 🛰️', container);
    }

    update(time) {
        if (!this.group.visible) return;

        let simDate;
        if (this.isLive) {
            simDate = new Date();
        } else {
            const elapsed = Date.now() - this.simStartTime;
            simDate = new Date(Date.now() + elapsed * this.simSpeed);
        }

        this.satellites.forEach(sat => {
            // Propagate
            const positionAndVelocity = satellite.propagate(sat.satrec, simDate);
            const positionEci = positionAndVelocity ? positionAndVelocity.position : null;

            if (positionEci) {
                const gmst = satellite.gstime(simDate);
                const positionGd = satellite.eciToGeodetic(positionEci, gmst);

                const longitude = satellite.degreesLong(positionGd.longitude);
                const latitude = satellite.degreesLat(positionGd.latitude);
                const altitudeKm = positionGd.height;
                const altitude = (altitudeKm / 6371) * 100 + 100 + 2;

                // Calculate speed (Magnitude of velocity vector)
                const vel = Math.sqrt(
                    Math.pow(positionAndVelocity.velocity.x, 2) +
                    Math.pow(positionAndVelocity.velocity.y, 2) +
                    Math.pow(positionAndVelocity.velocity.z, 2)
                );

                // Store
                sat.currentPos = {
                    lat: latitude.toFixed(2),
                    lng: longitude.toFixed(2),
                    alt: altitudeKm.toFixed(0),
                    vel: vel.toFixed(2)
                };

                // Move Mesh
                const phi = (90 - latitude) * (Math.PI / 180);
                const theta = (longitude + 180) * (Math.PI / 180);
                const x = -(altitude * Math.sin(phi) * Math.cos(theta));
                const z = (altitude * Math.sin(phi) * Math.sin(theta));
                const y = (altitude * Math.cos(phi));
                sat.mesh.position.set(x, y, z);
                sat.mesh.visible = true;

                // Update Line
                const points = [];
                const segments = 100;
                for (let i = 0; i <= segments; i++) {
                    const futureDate = new Date(simDate.getTime() + (i * (95 / segments)) * 60000);
                    const posVel = satellite.propagate(sat.satrec, futureDate);
                    const pos = posVel.position;
                    if (pos) {
                        const g = satellite.gstime(futureDate);
                        const pG = satellite.eciToGeodetic(pos, g);
                        const lng = satellite.degreesLong(pG.longitude);
                        const lat = satellite.degreesLat(pG.latitude);
                        const alt = (pG.height / 6371) * 100 + 100 + 2;

                        const phi = (90 - lat) * (Math.PI / 180);
                        const theta = (lng + 180) * (Math.PI / 180);

                        points.push(new THREE.Vector3(
                            -(alt * Math.sin(phi) * Math.cos(theta)),
                            (alt * Math.cos(phi)),
                            (alt * Math.sin(phi) * Math.sin(theta))
                        ));
                    }
                }
                if (points.length > 0) {
                    sat.line.geometry.setFromPoints(points);
                    sat.line.visible = true;
                } else {
                    sat.line.visible = false;
                }

            } else {
                sat.mesh.visible = false;
                sat.line.visible = false;
                sat.currentPos = null;
            }
        });

        const now = Date.now();
        if (now - this.lastUpdate > 100) {
            this.updatePanelUI();
            this.lastUpdate = now;
        }
    }

    updatePanelUI() {
        const dataContainer = document.getElementById('sat-data-container');
        if (!dataContainer) return;

        let activeCount = 0;
        let html = '';
        this.satellites.forEach(sat => {
            if (sat.currentPos) {
                activeCount++;
                html += `
                    <div style="margin-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:6px;">
                        <div style="color:${sat.color}; font-weight:bold; margin-bottom:2px; font-size:11px;">${sat.name}</div>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; font-size:10px; color:#ccc; row-gap:2px;">
                            <span>Alt: <span style="color:#fff">${sat.currentPos.alt} km</span></span>
                            <span>Vel: <span style="color:#fff">${sat.currentPos.vel} km/s</span></span>
                            <span style="color:#888;">Lat: ${sat.currentPos.lat}°</span>
                            <span style="color:#888;">Lng: ${sat.currentPos.lng}°</span>
                        </div>
                    </div>
                `;
            }
        });

        if (activeCount === 0) {
            dataContainer.innerHTML = '<div style="color:red; font-size:10px;">Signal Lost: TLE Expired</div>';
        } else {
            dataContainer.innerHTML = html;
        }
    }

    cleanup() {
        if (this.scene) {
            this.scene.remove(this.group);
            this.satellites = [];
            this.group = new THREE.Group();
        }
        if (this.infoPanel) {
            this.infoPanel.removeSection('satellites');
        }
    }
}
