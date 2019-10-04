/* START GGO: put code below in galigeo.js */
(function() {
  'use strict';
  var GGO = {
    version: 'GGO.0.0.1'
  };

  function expose() {
    var oldGGO = window.GGO;

    GGO.noConflict = function() {
      window.GGO = oldGGO;
      return this;
    };

    window.GGO = GGO;
  }

  /* define GGO for Node module pattern loaders, including Browserify */
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = GGO;

    /* define GGO as an AMD module */
  } else if (typeof define === 'function' && define.amd) {
    define(GGO);
  }

  /* define GGO as a global GGO variable, saving the original GGO to restore later if needed */
  if (typeof window !== 'undefined') {
    expose();
  }

  GGO.getRandomInteger = function(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  };

  GGO.invertColor = function(hexTripletColor) {
    var color = hexTripletColor;
    color = color.substring(1); // remove #
    color = parseInt(color, 16); // convert to integer
    color = 0xffffff ^ color; // invert three bytes
    color = color.toString(16); // convert to hex
    color = ('000000' + color).slice(-6); // pad with leading zeros
    color = '#' + color; // prepend #
    return color;
  };

  GGO.getContrastYIQ = function(hexcolor) {
    var col = hexcolor.indexOf('#') === 0 ? hexcolor.substr(1) : hexcolor;
    var r = parseInt(col.substr(0, 2), 16);
    var g = parseInt(col.substr(2, 2), 16);
    var b = parseInt(col.substr(4, 2), 16);
    var yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? 'black' : 'white';
  };

  GGO.getAllUrlParams = function(url) {
    // get query string from url (optional) or window
    var queryString = url ? url.split('?')[1] : window.location.search.slice(1);

    // we'll store the parameters here
    var obj = {};

    // if query string exists
    if (queryString) {
      // stuff after # is not part of query string, so get rid of it
      queryString = queryString.split('#')[0];

      // split our query string into its component parts
      var arr = queryString.split('&');

      for (var i = 0; i < arr.length; i++) {
        // separate the keys and the values
        var a = arr[i].split('=');

        // set parameter name and value (use 'true' if empty)
        var paramName = a[0];
        var paramValue = typeof a[1] === 'undefined' ? true : a[1];

        // (optional) keep case consistent
        paramName = paramName.toLowerCase();
        if (typeof paramValue === 'string') paramValue = paramValue.toLowerCase();

        // if the paramName ends with square brackets, e.g. colors[] or colors[2]
        if (paramName.match(/\[(\d+)?\]$/)) {
          // create key if it doesn't exist
          var key = paramName.replace(/\[(\d+)?\]/, '');
          if (!obj[key]) obj[key] = [];

          // if it's an indexed array e.g. colors[2]
          if (paramName.match(/\[\d+\]$/)) {
            // get the index value and add the entry at the appropriate position
            var index = /\[(\d+)\]/.exec(paramName)[1];
            obj[key][index] = paramValue;
          } else {
            // otherwise add the value to the end of the array
            obj[key].push(paramValue);
          }
        } else {
          // we're dealing with a string
          if (!obj[paramName]) {
            // if it doesn't exist, create property
            obj[paramName] = paramValue;
          } else if (obj[paramName] && typeof obj[paramName] === 'string') {
            // if property does exist and it's a string, convert it to an array
            obj[paramName] = [obj[paramName]];
            obj[paramName].push(paramValue);
          } else {
            // otherwise add the property
            obj[paramName].push(paramValue);
          }
        }
      }
    }

    return obj;
  };

  GGO.EVENTS = {
    APPISREDAY: 'appisready'
  };
})();
/* end GGO: put code below in galigeo.js */
