(function() {
  'use strict';
  GGO.MLManager = function(options) {
    this._options = options || {};
    this._mlModelsLoaded = false;
    this._modelSelected = false;
    this._modelDetailsFetched = false;
    this._modelFilteringInProgress = false;

    this._init();
  };
  GGO.MLManager.prototype = {
    _init: function() {
      this._setupListeners();
      this._numberFormatterInt = Intl.NumberFormat('fr', { useGrouping: true, maximumFractionDigits: 0 });
    },
    _setupListeners: function() {
      let self = this;
      GGO.EventBus.addEventListener(GGO.EVENTS.ZONESTATSCOMPUTED, function(e) {
        console.log(`MLManager received ${GGO.EVENTS.ZONESTATSCOMPUTED} event`);
        if (!self._mlModelsLoaded) {
          self._fetchMLModels();
        } else if (self._modelDetailsFetched) {
          self.updateModelForm();
        }
      });

      $('#combobox-ml-models')
        .off()
        .on('input', function(e) {
          let inputVal = $(this).val();
          if (inputVal !== self._searchModelInput) {
            self._searchModelInput = inputVal;
            if (self._searchModelTimerId) {
              clearTimeout(self._searchModelTimerId);
            }
            self._searchModelTimerId = setTimeout(function() {
              if ((self._searchModelInput !== '' && self._searchModelInput.length >= 3) || self._searchModelInput === '') {
                if (!self._modelFilteringInProgress) {
                  self.refreshModelsListBox(self._searchModelInput);
                }
              }
            }, 500);
          }
        })
        .focus(function(e) {
          $(this)
            .parent()
            .parent()
            .addClass('slds-is-open')
            .attr('aria-expanded', true);
        });

      $('#predict-btn').click(e => {
        this._handleClickPredictButton();
      });
    },
    _handleClickPredictButton: function() {
      const featureValues = this._validateFields();
      if (featureValues !== null) {
        let predictReqBody = $.extend({}, this._selectedModel);
        predictReqBody.featureValues = featureValues;
        this._doPrediction(predictReqBody);
      }
    },
    _validateFields: function() {
      let allIsOk = true;
      let fValues = {};
      this._selectedModel.featureColumns.forEach((fc, idx) => {
        const letfcInput = $(`#fc-${fc.name}`);
        const letfcInputVal = letfcInput.val();
        if (letfcInputVal.trim() === '') {
          allIsOk = false;
          letfcInput
            .parent()
            .parent()
            .addClass('slds-has-error');
        } else {
          letfcInput
            .parent()
            .parent()
            .removeClass('slds-has-error');
          fValues[fc.name] = this._getValueForPrediction(letfcInputVal, fc);
        }
      });
      return allIsOk ? fValues : null;
    },
    _getValueForPrediction: function(strVal, fc) {
      if (fc.type.typeKind === 'FLOAT64') {
        return parseFloat(strVal);
      }
      if (fc.type.typeKind === 'INT64') {
        return parseInt(strVal);
      }
      return strVal;
    },
    _doPrediction: function(requestBody) {
      let self = this;
      let url = `api/ml/models/${requestBody.modelId}/predict`;
      $.ajax({
        type: 'POST',
        url: url,
        data: JSON.stringify(requestBody),
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        success: function(response) {
          console.log(url, response);
          self._handlePredictionResponse(response);
        },
        error: function(jqXHR, textStatus, errorThrown) {
          console.log(textStatus, errorThrown);
        }
      });
    },
    _handlePredictionResponse: function(response) {
      console.log('_handlePrectionResponse', response);
    },
    _fetchMLModels: function() {
      let self = this;
      let url = `api/ml/models`;
      $.ajax({
        type: 'GET',
        url: url,
        success: function(response) {
          console.log('ML Models', response);
          self.handleMLModelsResponse(response);
        },
        error: function(jqXHR, textStatus, errorThrown) {
          if (textStatus === 'abort') {
            console.warn('ML Models request aborted');
          } else {
            console.error('Error for ML Models request: ' + textStatus, errorThrown);
          }
        }
      });
    },
    handleMLModelsResponse: function(response) {
      console.log('handleMLModelsResponse', response);
      this._mlModelsLoaded = true;
      //debugger;
      if (typeof response.models !== 'undefined' && Array.isArray(response.models)) {
        this._mlModels = response.models;
        this.buidlModelsSelectList();
        $('#ml-container')
          .parent()
          .removeClass('slds-hide');

        let ctnr = $('#listbox-ml-models').empty();
        this.buildModelsListBox(this._mlModels, ctnr);
        $('#combobox-ml-models').attr('disabled', false);
        this._modelFilteringInProgress = false;
      } else {
        this._mlModels = null;
      }
    },
    refreshModelsListBox: function(keyword) {
      this._modelFilteringInProgress = true;
      $('#combobox-ml-models').attr('disabled', true);

      let filteredModels = this._searchModelInput === '' ? this._mlModels : this._mlModels.filter(m => m.modelReference.modelId.indexOf(keyword) >= 0);
      let ctnr = $('#listbox-ml-models').empty();

      if (filteredModels.length === 0) {
        ctnr.append($('<div class="slds-p-around_small">Aucun résultat</div>'));
      } else {
        this.buildModelsListBox(filteredModels, ctnr);
      }
      $('#combobox-ml-models').attr('disabled', false);
      this._modelFilteringInProgress = false;
    },
    buildModelsListBox: function(models, container) {
      this._modelFilteringInProgress = true;
      $('#combobox-ml-models').attr('disabled', true);
      let modelsUL = $('<ul class="slds-listbox slds-listbox_vertical" role="presentation"></ul>');

      models.forEach((m, i) => {
        let content = $(`
          <li role="presentation" class="slds-listbox__item" data-modelId="${m.modelReference.modelId}" data-datasetId="${m.modelReference.datasetId}" data-projectId="${m.modelReference.projectId}">
            <div id="model_${m.modelReference.modelId}-${m.modelReference.datasetId}-${m.modelReference.projectId}" class="slds-media slds-listbox__option slds-listbox__option_entity slds-listbox__option_has-meta" role="option">
              <span class="slds-media__figure slds-listbox__option-icon">
                <span class="slds-icon_container slds-icon-standard-account">
                  <svg class="slds-icon slds-icon_small" aria-hidden="true">
                    <use xlink:href="/styles/slds/assets/icons/utility-sprite/svg/symbols.svg#einstein"></use>
                  </svg>
                </span>
              </span>
              <span class="slds-media__body">
                <span class="slds-listbox__option-text slds-listbox__option-text_entity">${m.modelReference.modelId}</span>
              </span>
            </div>
          </li>
        `);
        modelsUL.append(content);
      });
      // TODO click LI listeners

      container.append(modelsUL);
    },
    buidlModelsSelectList: function() {
      $('#ml-models-select')
        .empty()
        .append(
          $(`
            <option value="">Please select</option>
            ${this._mlModels.map(m => `<option data-modelid="${m.modelReference.modelId}" data-projectid="${m.modelReference.projectId}" data-datasetid="${m.modelReference.datasetId}">${m.modelReference.modelId}</option>`)}
          `)
        )
        .change(e => {
          let modelId = $(e.currentTarget.selectedOptions).attr('data-modelid');
          let projectId = $(e.currentTarget.selectedOptions).attr('data-projectid');
          let datasetId = $(e.currentTarget.selectedOptions).attr('data-datasetid');
          this.handleSelectModelChanged(modelId, datasetId, projectId);
        })
        .attr('disabled', false);
    },
    handleSelectModelChanged: function(modelId, datasetId, projectId) {
      if (typeof modelId === 'undefined' || typeof datasetId === 'undefined' || typeof projectId === 'undefined') {
        delete this._selectedModel;
        this._modelDetailsFetched = false;
      } else {
        const filteredModels = this._mlModels.filter(m => m.modelReference.modelId === modelId && m.modelReference.datasetId === datasetId && m.modelReference.projectId === projectId);
        if (filteredModels.length > 0) {
          this._selectedModel = {
            modelReference: {
              projectId: filteredModels[0].modelReference.projectId,
              datasetId: filteredModels[0].modelReference.datasetId,
              modelId: filteredModels[0].modelReference.modelId
            }
          };
          this.getModelDetails(this._selectedModel.modelReference);
        } else {
          delete this._selectedModel;
          this._modelDetailsFetched = false;
        }
      }
    },
    getModelDetails: function(modelProperties) {
      let self = this;
      let url = `api/ml/models/${modelProperties.modelId}`;
      $.ajax({
        type: 'GET',
        url: url,
        success: function(response) {
          console.log('ML Model Details', response);
          self.handleModelDetailsResponse(response);
        },
        error: function(jqXHR, textStatus, errorThrown) {
          if (textStatus === 'abort') {
            console.warn('ML Models request aborted');
          } else {
            console.error('Error for ML Models request: ' + textStatus, errorThrown);
          }
        }
      });
    },
    handleModelDetailsResponse: function(response) {
      console.log('handleModelDetailsResponse', response);
      this._selectedModel.featureColumns = response.featureColumns;
      this._selectedModel.labelColumns = response.labelColumns;
      this._selectedModel.description = response.description || '';

      this._modelDetailsFetched = true;
      $('#ml-buttons-div').removeClass('slds-hide');
      this.buildModelForm();
    },
    updateModelForm: function() {
      const dataMgr = GGO.DataManagerSingleton.getInstance();
      const zoneStats = dataMgr.zoneStats;
      this._selectedModel.featureColumns.forEach((fc, idx) => {
        console.log('Feature column', fc);
        switch (fc.name) {
          case 'POPZP':
            $(`#fc-${fc.name}`).val(parseInt(zoneStats.pop));
            break;
          case 'REVMOY':
            $(`#fc-${fc.name}`).val(parseInt(zoneStats.revenus_moyen));
            break;
          default:
            break;
        }
      });
    },
    buildModelForm: function(model) {
      let ctnr = $('#ml-model-properties-div-content').empty();
      const dataMgr = GGO.DataManagerSingleton.getInstance();
      const zoneStats = dataMgr.zoneStats;
      const zoneStatsKeySet = new Set(Object.keys(zoneStats));
      let featuresForm = $('<div class="slds-form"></div>');
      this._selectedModel.featureColumns.forEach((fc, idx) => {
        console.log('Feature column', fc);
        let formElt = this._getFormElementCtrlForFeatureColumn(fc);
        switch (fc.name) {
          case 'POPZP':
            formElt.find('input').val(parseInt(zoneStats.pop));
            break;
          case 'REVMOY':
            formElt.find('input').val(parseInt(zoneStats.revenus_moyen));
            break;
          default:
            break;
        }
        featuresForm.append(formElt);
      });
      ctnr.append(featuresForm);
      $('#ml-model-properties-div').removeClass('slds-hide');
    },
    _getFormElementCtrlForFeatureColumn: function(fc) {
      let formEltCtr = null;
      switch (fc.type.typeKind) {
        case 'FLOAT64':
          formEltCtr = $(`
            <div class="slds-form-element__control">
              <input type="number" id="fc-${fc.name}" step="0.1" class="slds-input" data-featurecolumn="${fc.name}" />
            </div>`);
          break;
        case 'INT64':
          formEltCtr = $(`
            <div class="slds-form-element__control">
              <input type="number" id="fc-${fc.name}" pattern="[0-9]{1,}" class="slds-input" data-featurecolumn="${fc.name}"/>
            </div>`);
          break;
        default:
          formEltCtr = $(`
            <div class="slds-form-element__control">
              <input type="text" id="fc-${fc.name}" placeholder="Placeholder Text" class="slds-input" data-featurecolumn="${fc.name}"/>
            </div>`);
      }
      let fLabel = fc.name;
      switch (fLabel) {
        case 'POPZP':
          fLabel = 'Population';
          break;
        case 'NBPDVCONC':
          fLabel = 'Nb Concurrents';
          break;
        case 'REVMOY':
          fLabel = 'Revenus moyens';
          break;
        default:
          break;
      }
      return $('<div class="slds-form-element"></div>')
        .append($(`<label class="slds-form-element__label" for="fc-${fc.name}">${fLabel}</label>`))
        .append(formEltCtr);
    }
  };

  GGO.MLManagerSingleton = (function() {
    let instance;
    function createInstance(options) {
      let dataMgr = new GGO.MLManager(options);
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
