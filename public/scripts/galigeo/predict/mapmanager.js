(function() {
  'use strict';
  GGO.MapManager = function(options) {
    this._options = options || {};
    this._options.mapboxAccessToken = this._options.mapboxAccessToken || 'pk.eyJ1IjoicnRhZ2dvIiwiYSI6ImNqcXFvN3k1cTA0enA0Mm81czZhYm5wM3oifQ.vG1w7oOdnpOJA7Mfs1uRnA';
    this._options.mapDivId = this._options.mapDivId || 'map';
    this._clickableLayers = [];
    mapboxgl.accessToken = this._options.mapboxAccessToken;

    this._currentLocation = {};
    this._styles = {
      buckets: ['#2c7bb6', '#a6d96a', '#d7191c']
    };
    this._init();
  };

  GGO.MapManager.prototype = {
    _init: function() {
      this._setupListeners();
      this._setupMap();
    },
    _setupListeners: function() {
      let self = this;
      GGO.EventBus.addEventListener(GGO.EVENTS.DRIVETIMECOMPUTED, function(e) {
        console.log(`MapManager received ${GGO.EVENTS.DRIVETIMECOMPUTED} event`);
        let data = e.target;
        self.handleDriveTimeComputedEvent(data);
      });
      GGO.EventBus.addEventListener(GGO.EVENTS.SOCIODEMOCOMPUTED, function(e) {
        console.log(`MapManager received ${GGO.EVENTS.SOCIODEMOCOMPUTED} event`);
        let data = e.target;
        self.handleSocioDemoComputedEvent(data);
      });
    },
    _setupMap: function() {
      let self = this;
      this._mapStyle = 'mapbox://styles/mapbox/light-v9';
      this._mapStyle = 'mapbox://styles/mapbox/streets-v11';

      this._map = new mapboxgl.Map({
        container: 'map',
        style: this._mapStyle,
        hash: true,
        attributionControl: false
      })
        .addControl(new mapboxgl.NavigationControl())
        //.addControl(new MapboxTraffic())
        .addControl(new mapboxgl.AttributionControl({ compact: true }));
      this._map.on('load', function() {
        self._setupMapEvent();
        self._getCurrentLocation();
        GGO.EventBus.dispatch(GGO.EVENTS.MAPISLOADED);
      });
    },
    _setupMapEvent: function() {},
    _getCurrentLocation: function() {
      let self = this;
      navigator.geolocation.getCurrentPosition(
        function(position) {
          console.log('Position received: ', position);
          // sets default position to your position
          var lat = position.coords['latitude'];
          var lng = position.coords['longitude'];
          self.setCurrentLocation({ lat: lat, lng: lng });
          self._map.flyTo({
            center: [lng, lat],
            zoom: 14
          });
        },
        function(error) {
          console.log('Error: ', error);
        },
        {
          enableHighAccuracy: true
        }
      );
    },
    setCurrentLocation: function(coordinates, dispatchLocationChanges) {
      let self = this;
      if (typeof dispatchLocationChanges === 'undefined') {
        dispatchLocationChanges = true;
      }
      self._currentLocation.coordinates = coordinates;
      if (typeof self._currentLocation.marker === 'undefined') {
        self._createTargetMarker(coordinates);
      } else {
        self._currentLocation.marker.setLngLat([coordinates.lng, coordinates.lat]);
      }
      if (dispatchLocationChanges) {
        this.showOrHideCarreauxLayers('none');
        GGO.EventBus.dispatch(GGO.EVENTS.USERLOCATIONCHANGED, self._currentLocation.coordinates);
      }
    },
    _createTargetMarker: function(coordinates) {
      let self = this;
      let el = document.createElement('div');
      el.className = 'target-marker';
      self._currentLocation.marker = new mapboxgl.Marker(el, {
        draggable: true
      })
        .setLngLat([coordinates.lng, coordinates.lat])
        .addTo(this._map)
        .on('dragstart', function(e) {
          self.handleLocationMarkerDragStart(e);
        })
        .on('dragend', function(e) {
          self.handleLocationMarkerDragEnd(e);
        })
        .on('drag', function(e) {
          self.handleLocationMarkerDragging(e);
        });
    },
    handleLocationMarkerDragStart: function(e) {
      console.log('Start dragging marker', e);
      if (typeof this._map.getLayer('isochrones') !== 'undefined') {
        this._map.removeLayer('isochrones');
        this._map.removeSource('isochrones');
      }
    },
    handleLocationMarkerDragEnd: function(e) {
      this._currentLocation.coordinates = e.target.getLngLat();
      this.showOrHideCarreauxLayers('none');
      GGO.EventBus.dispatch(GGO.EVENTS.USERLOCATIONCHANGED, this._currentLocation.coordinates);
    },
    handleLocationMarkerDragging: function(e) {
      this._currentLocation.coordinates = e.target.getLngLat();
    },
    handleDriveTimeComputedEvent: function(response) {
      if (typeof this._map.getSource('drivetime') === 'undefined') {
        const stops = this._styles.buckets.map((e, i) => [i, e]); // [[0, '#2b83ba'], [1, '#abdda4'], [2, '#d7191c']];

        this._map.addSource('drivetime', { type: 'geojson', data: response });
        /*
        this._map.addLayer({
          id: 'drivetime',
          type: 'fill',
          source: 'drivetime',
          paint: {
            'fill-color': {
              property: 'bucket',
              stops: stops
            },
            'fill-opacity': 0.2,
            'fill-outline-color': '#FF00FF'
          }
        });
        */
        this._map.addLayer({
          id: 'drivetime',
          type: 'line',
          source: 'drivetime',
          paint: {
            'line-color': {
              property: 'bucket',
              stops: stops
            },
            'line-width': 2,
            'line-opacity': 0.75
          }
        });
      } else {
        this._map.getSource('drivetime').setData(response);
      }
    },
    handleSocioDemoComputedEvent: function(response) {
      if (typeof this._map.getSource('carreaux_source') === 'undefined') {
        this._map.addSource('carreaux_source', {
          type: 'geojson',
          data: response
        });
      } else {
        this._map.getSource('carreaux_source').setData(response);
      }
      /*
      const colorsRange = ['#ffffb2', '#fecc5c', '#fd8d3c', '#f03b20', '#bd0026'];
      this._classifiers = {
        carreaux: {
          pop: this.getDataClassifier(response, colorsRange, 'pop')
        }
      };
      */
      const dataMgr = GGO.DataManagerSingleton.getInstance();
      dataMgr.computeClassifier(response);
      /*
      if (typeof this._map.getLayer('carreaux_pop_outline') === 'undefined') {
        this._map.addLayer(
          {
            id: 'carreaux_pop_outline',
            type: 'line',
            source: 'carreaux_source',
            layout: {
              visibility: 'visible'
            },
            paint: {
              'line-color': '#FFFFFF',
              'line-width': 2,
              'line-opacity': 0.75
            }
          },
          'drivetime'
        );
      }

      */
      if (typeof this._map.getLayer('carreaux_pop') === 'undefined') {
        this._map.addLayer(
          {
            id: 'carreaux_pop',
            type: 'fill',
            source: 'carreaux_source',
            layout: {
              visibility: 'visible'
            },
            paint: {
              'fill-color': {
                property: 'revenus_moyen',
                stops: dataMgr.getClassifier('revenus').breaks //this._classifiers.carreaux.pop.breaks
              },
              'fill-opacity': 0.8,
              'fill-outline-color': 'white'
            }
          },
          'drivetime'
        );
      } else {
        this._map.setPaintProperty('carreaux_pop', 'fill-color', { property: 'revenus_moyen', stops: dataMgr.getClassifier('revenus').breaks });
      }
      this.showOrHideCarreauxLayers('visible');
      dataMgr.computeStats(response);
    },
    showOrHideCarreauxLayers: function(theVisibility) {
      if (typeof this._map.getLayer('carreaux_pop') !== 'undefined') {
        this._map.setLayoutProperty('carreaux_pop', 'visibility', theVisibility);
      }
      /*
      if (typeof this._map.getLayer('carreaux_pop_outline') !== 'undefined') {
        this._map.setLayoutProperty('carreaux_pop_outline', 'visibility', theVisibility);
      }
      */
    }
    /*
    getDataClassifier: function(data, colorsRange, property) {
      let self = this;
      let color = d3.scaleQuantile().range(colorsRange);
      const numberOfClasses = color.range().length - 1;
      const jenksNaturalBreaks = GGO.jenks(data.features.map(d => d.properties[property]), numberOfClasses);
      console.log('numberOfClasses', numberOfClasses);
      console.log('jenksNaturalBreaks', jenksNaturalBreaks);

      // set the domain of the color scale based on our data
      color.domain(jenksNaturalBreaks);
      let breaks = jenksNaturalBreaks.map(function(e, i) {
        console.log('i', i);
        console.log('e', e);
        return [e === null ? 0 : e, colorsRange[i]];
      });
      //return color;
      var classif = {
        property: property,
        classifier: color,
        breaks: breaks,
        min: d3.min(data.features, function(d) {
          return d.properties[property];
        }),
        max: d3.max(data.features, function(d) {
          return d.properties[property];
        })
      };
      
      return classif;
    }
    */
  };

  GGO.MapManagerSingleton = (function() {
    let instance;
    function createInstance(options) {
      let mapMgr = new GGO.MapManager(options);
      return mapMgr;
    }
    return {
      getInstance: function(options) {
        if (!instance) {
          instance = createInstance(options);
        }
        return instance;
      }
    };
  })();
})();
