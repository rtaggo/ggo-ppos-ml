(function() {
  GGO.PredictApp = function(options) {
    this._options = options || {};
    this._init();
  };

  GGO.PredictApp.prototype = {
    _init: function() {
      let modulesOptions = {
        app: this
      };
      this._mapManager = GGO.MapManagerSingleton.getInstance(modulesOptions);
      GGO.DataManagerSingleton.getInstance(modulesOptions);
      GGO.MLManagerSingleton.getInstance(modulesOptions);
      GGO.GeoServiceManagerSingleton.getInstance(modulesOptions);
    }
  };

  GGO.EVENTS = $.extend(
    {
      MAPISLOADED: 'mapisloaded',
      USERLOCATIONCHANGED: 'userlocationchanged',
      REVERSEGEOCODECOMPLETED: 'reversegeocodecompleted',
      DRIVETIMECOMPUTED: 'drivetimecomputed',
      SOCIODEMOCOMPUTED: 'sociodemocomputed',
      ZONESTATSCOMPUTED: 'zonestatscomputed'
    },
    GGO.EVENTS
  );
})();
