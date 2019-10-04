(function() {
  'use strict';
  GGO.GeoServiceManager = function(options) {
    this._options = options || {};
    this._options.geoserviceURL = this._options.geoserviceURL || 'https://ggo-rest-api.appspot.com/api/rest/geoservice';
    this._options.geoserviceURL = 'http://localhost:8080/api/rest/geoservice';
    this._driveTimeConfig = {
      type: 'rurale',
      profile: 'driving-car',
      zones: [{ label: 'Zone primaire', timerange: 3 }]
    };

    this._init();
  };
  GGO.GeoServiceManager.prototype = {
    _init: function() {
      this._setupListeners();
    },
    _setupListeners: function() {
      let self = this;

      GGO.EventBus.addEventListener(GGO.EVENTS.USERLOCATIONCHANGED, function(e) {
        console.log(`GeoServiceManager received ${GGO.EVENTS.USERLOCATIONCHANGED} event`);
        let data = e.target;
        self._currentLocation = data;
        self.doReverseGeocode();
        self.computeDriveTime();
      });
      $('#isochrone-time-range-input').change(function(e) {
        self._driveTimeConfig.zones[0].timerange = parseInt($(this).val());
      });
      $('#isochroneDiv > .slds-icon_container').click(function(e) {
        let isoType = $(this).attr('data-isochonetype');
        console.log(`Click on ${isoType}`);
        self._driveTimeConfig.profile = isoType;
        $(this)
          .siblings()
          .removeClass('isochrone-type-active');
        $(this).addClass('isochrone-type-active');
      });
      $('#compute-isochrone-btn').click(function(e) {
        self.computeDriveTime();
      });
    },
    doReverseGeocode: function() {
      let self = this;
      if (typeof self._currentLocation !== 'undefined') {
        let url = `${this._options.geoserviceURL}/geocode/reverse?lat=${self._currentLocation.lat}&lng=${self._currentLocation.lng}`;
        $.ajax({
          type: 'GET',
          url: url,
          success: function(response) {
            console.log('reverse geocode', response);
            self.handleReverseGeocode(response);
          },
          error: function(jqXHR, textStatus, errorThrown) {
            if (textStatus === 'abort') {
              console.warn('Address Lookup request aborted');
            } else {
              console.error('Error for Address lookup request: ' + textStatus, errorThrown);
            }
          }
        });
      }
    },
    handleReverseGeocode: function(response) {
      console.log(`[GEOSERVICEMANAGER] >> handleReverseGeocode: `, response);
      GGO.EventBus.dispatch(GGO.EVENTS.REVERSEGEOCODECOMPLETED, response.features[0]);
    },
    computeDriveTime: function() {
      let self = this;
      let url = `${this._options.geoserviceURL}/direction/isochrone?center=${self._currentLocation.lat},${self._currentLocation.lng}&time_limits=${this._driveTimeConfig.zones
        .map(function(z) {
          return z.timerange;
        })
        .join(',')}&profile=${this._driveTimeConfig.profile}`;
      $.ajax({
        type: 'GET',
        url: url,
        success: function(response) {
          console.log('isochones', response);
          $('#notifierContainer')
            .empty()
            .addClass('slds-hide');
          self.handleDriveTimeResponse(response);
        },
        error: function(jqXHR, textStatus, errorThrown) {
          if (textStatus === 'abort') {
            console.warn('DriveTime request aborted');
          } else {
            console.error('Error for DriveTime request: ' + textStatus, errorThrown);
          }
        }
      });
    },
    handleDriveTimeResponse: function(response) {
      GGO.EventBus.dispatch(GGO.EVENTS.DRIVETIMECOMPUTED, response);
      this._querySocioDemo(response.features[0]);
    },
    _querySocioDemo: function(isoFeature) {
      let url = `/api/insee/carreaux`;
      $.ajax({
        type: 'POST',
        url: url,
        data: JSON.stringify(isoFeature),
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        success: function(response) {
          console.log('/api/insee/carreaux', response);
          GGO.EventBus.dispatch(GGO.EVENTS.SOCIODEMOCOMPUTED, response);
        },
        error: function(jqXHR, textStatus, errorThrown) {
          console.log(textStatus, errorThrown);
        }
      });
    },
    handleCarreauxResponse: function(response) {}
  };

  GGO.GeoServiceManagerSingleton = (function() {
    let instance;
    function createInstance(options) {
      let geoserviceMgr = new GGO.GeoServiceManager(options);
      return geoserviceMgr;
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
