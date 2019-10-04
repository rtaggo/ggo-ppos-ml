(function() {
  'use strict';
  GGO.DataManager = function(options) {
    this._options = options || {};
    this.colorsRange = ['#ffffb2', '#fecc5c', '#fd8d3c', '#f03b20', '#bd0026'];
    this._init();
  };
  GGO.DataManager.prototype = {
    _init: function() {
      this._numberFormatterInt = Intl.NumberFormat('fr', { useGrouping: true, maximumFractionDigits: 0 });
      this._setupListeners();
    },
    _setupListeners: function() {
      let self = this;
      /*
      GGO.EventBus.addEventListener(GGO.EVENTS.SOCIODEMOCOMPUTED, function(e) {
        console.log(`DataManager received ${GGO.EVENTS.SOCIODEMOCOMPUTED} event`);
        let data = e.target;
        self.handleSocioDemoComptedEvent(data);
      });
      */
      GGO.EventBus.addEventListener(GGO.EVENTS.REVERSEGEOCODECOMPLETED, function(e) {
        console.log(`DataManager received ${GGO.EVENTS.REVERSEGEOCODECOMPLETED} event`);
        let data = e.target;
        $('#addr-search-input').val(data.properties.label);
      });
    },
    computeClassifier: function(data) {
      this._classifiers = {
        carreaux: {
          revenus: this.getDataClassifier(data, this.colorsRange, 'revenus_moyen')
        }
      };
    },
    getClassifier: function(prop) {
      return this._classifiers.carreaux[prop];
    },
    computeStats: function(data) {
      console.log('handleSocioDemoComptedEvent', data);
      this.zoneStats = data.features.reduce(
        (acc, item, index) => {
          acc.men += item.properties.men;
          acc.pop += item.properties.pop;
          acc.revenus += item.properties.revenus;
          acc.pop_age1 += item.properties.pop_age1;
          acc.pop_age2 += item.properties.pop_age2;
          acc.pop_age3 += item.properties.pop_age3;
          acc.pop_age4 += item.properties.pop_age4;
          acc.pop_age5 += item.properties.pop_age5;
          acc.pop_age6 += item.properties.pop_age6;
          acc.pop_age7 += item.properties.pop_age7;
          acc.pop_age8 += item.properties.pop_age8;

          return acc;
        },
        {
          men: 0,
          pop: 0,
          revenus: 0,
          pop_age1: 0,
          pop_age2: 0,
          pop_age3: 0,
          pop_age4: 0,
          pop_age5: 0,
          pop_age6: 0,
          pop_age7: 0,
          pop_age8: 0
        }
      );
      this.zoneStats.revenus_moyen = this.zoneStats.revenus / this.zoneStats.pop;
      GGO.EventBus.dispatch(GGO.EVENTS.ZONESTATSCOMPUTED);
      $('#legendContent')
        .empty()
        .append(this.buildLegend(this._classifiers.carreaux.revenus.classifier, 'Revenus Moyens'))
        .removeClass('slds-hide');
      this.buildZoneDetailsStats();
      $('#legendAndStatsDiv')
        .parent()
        .removeClass('slds-hide');
    },
    buildZoneDetailsStats: function() {
      // zoneDetailsStats
      /*
      let zd = $(`
      <dl class="slds-list_horizontal slds-wrap slds-m-left_small">
        <dt class="slds-item_label slds-text-color_weak slds-truncate" style="width:30%;">Ménages:</dt>
        <dd class="slds-item_detail slds-truncate" style="width:70%;">${this._numberFormatterInt.format(this.zoneStats.men)}</dd>
        <dt class="slds-item_label slds-text-color_weak slds-truncate" style="width:30%;">Population:</dt>
        <dd class="slds-item_detail slds-truncate" style="width:70%;">
          <dl class="slds-list_horizontal slds-wrap">
            <dt class="slds-item_label slds-text-color_weak slds-truncate" style="width:50%;">Total: </dt>
            <dd class="slds-item_detail slds-truncate" style="width:50%; text-align: right;">${this._numberFormatterInt.format(this.zoneStats.pop)}</dd>
            <dt class="slds-item_label slds-text-color_weak slds-truncate" style="width:50%;">0 à 3 ans </dt>
            <dd class="slds-item_detail slds-truncate" style="width:50%; text-align: right;">${this._numberFormatterInt.format(this.zoneStats.pop_age1)}</dd>
            <dt class="slds-item_label slds-text-color_weak slds-truncate" style="width:50%;">4 à 5 ans </dt>
            <dd class="slds-item_detail slds-truncate" style="width:50%; text-align: right;">${this._numberFormatterInt.format(this.zoneStats.pop_age2)}</dd>
            <dt class="slds-item_label slds-text-color_weak slds-truncate" style="width:50%;">6 à 10 ans </dt>
            <dd class="slds-item_detail slds-truncate" style="width:50%; text-align: right;">${this._numberFormatterInt.format(this.zoneStats.pop_age3)}</dd>
            <dt class="slds-item_label slds-text-color_weak slds-truncate" style="width:50%;">11 à 14 ans </dt>
            <dd class="slds-item_detail slds-truncate" style="width:50%; text-align: right;">${this._numberFormatterInt.format(this.zoneStats.pop_age4)}</dd>
            <dt class="slds-item_label slds-text-color_weak slds-truncate" style="width:50%;">15 à 17 ans </dt>
            <dd class="slds-item_detail slds-truncate" style="width:50%; text-align: right;">${this._numberFormatterInt.format(this.zoneStats.pop_age5)}</dd>
            <dt class="slds-item_label slds-text-color_weak slds-truncate" style="width:50%;">25 à 64 ans </dt>
            <dd class="slds-item_detail slds-truncate" style="width:50%; text-align: right;">${this._numberFormatterInt.format(this.zoneStats.pop_age6)}</dd>
            <dt class="slds-item_label slds-text-color_weak slds-truncate" style="width:50%;">65 à 74 ans </dt>
            <dd class="slds-item_detail slds-truncate" style="width:50%; text-align: right;">${this._numberFormatterInt.format(this.zoneStats.pop_age7)}</dd>
            <dt class="slds-item_label slds-text-color_weak slds-truncate" style="width:50%;">75 ans et plus </dt>
            <dd class="slds-item_detail slds-truncate" style="width:50%; text-align: right;">${this._numberFormatterInt.format(this.zoneStats.pop_age8)}</dd>
          </dl>
        </dd>
      </dl>
      `);
      */
      let zd = $(`
      <dl class="slds-list_horizontal slds-wrap slds-m-left_small">
        <dt class="slds-item_label slds-text-color_weak slds-truncate" style="width:50%; text-align: right;">Ménages:</dt>
        <dd class="slds-item_detail slds-truncate" style="width:50%;">${this._numberFormatterInt.format(this.zoneStats.men)}</dd>
        <dt class="slds-item_label slds-text-color_weak slds-truncate" style="width:50%; text-align: right;">Population:</dt>
        <dd class="slds-item_detail slds-truncate" style="width:50%;">${this._numberFormatterInt.format(this.zoneStats.pop)}</dd>
        <dt class="slds-item_label slds-text-color_weak slds-truncate" style="width:50%; text-align: right;">Revenus moyens:</dt>
        <dd class="slds-item_detail slds-truncate" style="width:50%;">${this._numberFormatterInt.format(this.zoneStats.revenus_moyen)} €</dd>        
      </dl>
      `);
      $('#zoneDetailsStats')
        .empty()
        .append(zd);
      $('#zoneDetailsStatsFieldSet').removeClass('slds-hide');
      /*
      $('#zoneDetailsStatsFieldSet > legend')
        .off()
        .click(function(e) {
          e.preventDefault();
          let detailsCtnr = $('#zoneDetailsStats');
          if (detailsCtnr.hasClass('slds-hide')) {
            detailsCtnr.removeClass('slds-hide');
          } else {
            detailsCtnr.addClass('slds-hide');
          }
        });
      */
    },
    buildLegend: function(classifier, title) {
      var rangeColors = classifier.range(),
        outlabels = [],
        outspans = [],
        from,
        to,
        invertExt;

      for (var i = 0; i < rangeColors.length; i++) {
        invertExt = classifier.invertExtent(rangeColors[i]);
        from = invertExt[0];
        to = invertExt[1];

        outspans.push(`<span style="background:${rangeColors[i]};"></span>`);
        outlabels.push(`<label>${this._numberFormatterInt.format(to)}</label>`);
      }

      let lgds = `
      <legend class="slds-form-element__legend slds-form-element__label">${title}</legend>
      <div class="slds-form-element__control" class="slds-p-around-xx_small">
        <nav class="legend clearfix" style="height:40px;">
          ${outspans.join('')} ${outlabels.join('')}
        </nav>
      </div>
      `;
      return lgds;
    },
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
      /*
      $.each(data.features, function(idx, val) {
        val.properties['height_' + property] = self.calculateHeight(val.properties[property], classif.min, classif.max);
      });
      */

      return classif;
    }
  };

  GGO.DataManagerSingleton = (function() {
    let instance;
    function createInstance(options) {
      let dataMgr = new GGO.DataManager(options);
      return dataMgr;
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
