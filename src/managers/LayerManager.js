
import { InfoPanel } from "../ui/InfoPanel.js";

export class LayerManager {
    constructor(scene, globe) {
        this.scene = scene;
        this.globe = globe;
        this.layers = {};
        this.activeLayers = new Set();
        this.infoPanel = new InfoPanel();
    }

    registerLayer(name, layer) {
        this.layers[name] = layer;
    }

    async toggleLayer(name) {
        if (this.activeLayers.has(name)) {
            await this.disableLayer(name);
        } else {
            await this.enableLayer(name);
        }
    }

    async enableLayer(name) {
        const layer = this.layers[name];
        if (layer && !this.activeLayers.has(name)) {
            // Enabling layer
            await layer.init(this.scene, this.globe, this.infoPanel);
            this.activeLayers.add(name);
            return true;
        }
        return false;
    }

    async disableLayer(name) {
        const layer = this.layers[name];
        if (layer && this.activeLayers.has(name)) {
            // Disabling layer
            layer.cleanup();
            this.activeLayers.delete(name);
            return true;
        }
        return false;
    }

    update(time) {
        this.activeLayers.forEach(name => {
            const layer = this.layers[name];
            if (layer.update) {
                layer.update(time);
            }
        });
    }

    // Reset everything (Home button functionality)
    async clearAll() {
        for (const name of this.activeLayers) {
            await this.disableLayer(name);
        }
    }

    // New: Toggle visibility of all active layers (for View Switching)
    setGlobalVisibility(visible) {
        this.activeLayers.forEach(name => {
            const layer = this.layers[name];
            // 1. If layer has a group, toggle it
            if (layer.group) {
                layer.group.visible = visible;
            }
            // 2. If layer has specific hide/show methods (optional future proofing)
            if (visible && layer.show) layer.show();
            if (!visible && layer.hide) layer.hide();
        });

        // Also toggle Info Panel?
        if (visible) {
            this.infoPanel.container.style.display = 'flex';
        } else {
            this.infoPanel.container.style.display = 'none';
        }
    }
    filterLayer(name, criteria) {
        const layer = this.layers[name];
        if (layer && this.activeLayers.has(name) && layer.filter) {
            // Filtering layer
            layer.filter(criteria);
            return true;
        }
        return false;
    }

    getAllData() {
        const datasets = [];
        this.activeLayers.forEach(name => {
            const layer = this.layers[name];
            if (layer.data && Array.isArray(layer.data)) {
                datasets.push({ name: name, data: layer.data });
            }
        });
        return datasets;
    }
}
