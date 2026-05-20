'use strict';

(function (factory) {

    if (typeof define === 'function' && define.amd) {

        define(['leaflet'], factory);

    } else if (typeof module === 'object' && module.exports) {

        module.exports = factory(require('leaflet'));

    } else {

        factory(window.L);

    }

}(function (L) {

    L.BoxedWMS = L.TileLayer.WMS.extend({
        initialize: function(url, options) {
            this._fixedBounds = options.bounds || null;
            L.TileLayer.WMS.prototype.initialize.call(this, url, options);
        },

        createTile: function(coords, done) {
            const tile = L.TileLayer.WMS.prototype.createTile.call(this, coords, done);
            
            if (this._fixedBounds && this._map) {
                const tileBounds = this._tileCoordsToBounds(coords);
                
                if (this._fixedBounds.intersects(tileBounds)) {
                    const iWest = Math.max(tileBounds.getWest(), this._fixedBounds.getWest());
                    const iSouth = Math.max(tileBounds.getSouth(), this._fixedBounds.getSouth());
                    const iEast = Math.min(tileBounds.getEast(), this._fixedBounds.getEast());
                    const iNorth = Math.min(tileBounds.getNorth(), this._fixedBounds.getNorth());
                    
                    const isClipped = (iWest > tileBounds.getWest() || iSouth > tileBounds.getSouth() || 
                                       iEast < tileBounds.getEast() || iNorth < tileBounds.getNorth());
                    
                    if (isClipped) {
                        const crs = this._map.options.crs;
                        const zoom = coords.z;
                        
                        const tNW = crs.latLngToPoint(L.latLng(tileBounds.getNorth(), tileBounds.getWest()), zoom);
                        const tSE = crs.latLngToPoint(L.latLng(tileBounds.getSouth(), tileBounds.getEast()), zoom);
                        
                        const iNW = crs.latLngToPoint(L.latLng(iNorth, iWest), zoom);
                        const iSE = crs.latLngToPoint(L.latLng(iSouth, iEast), zoom);
                        
                        const tileSize = 256;
                        
                        const leftPct = ((iNW.x - tNW.x) / tileSize) * 100;
                        const topPct = ((iNW.y - tNW.y) / tileSize) * 100;
                        const rightPct = ((tSE.x - iSE.x) / tileSize) * 100;
                        const bottomPct = ((tSE.y - iSE.y) / tileSize) * 100;
                        
                        tile.style.clipPath = `inset(${topPct}% ${rightPct}% ${bottomPct}% ${leftPct}%)`;
                    }
                }
            }
            return tile;
        },

        getTileUrl: function(coords) {
            if (!this._fixedBounds) {
                return L.TileLayer.WMS.prototype.getTileUrl.call(this, coords);
            }

            var tileBounds = this._tileCoordsToBounds(coords);

            if (!this._fixedBounds.intersects(tileBounds)) {
                return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            }

            return L.TileLayer.WMS.prototype.getTileUrl.call(this, coords);
        }
    });

    L.boxedWms = function(url, options) {
        return new L.BoxedWMS(url, options);
    };

    return L.BoxedWMS;
}));
