var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var VisMetadataModel = require('../../../data/vis-metadata-model');
var template = require('./map-metadata.tpl');
var FooterView = require('./footer/footer-view');
var templateError = require('./map-metadata-error.tpl');
var templateLoading = require('../../loading/render-loading');
var FormView = require('./form/form-view');
var saveMetadata = require('./save-metadata-map');
var errorParser = require('../../../helpers/error-parser');
var Notifier = require('../../../components/notifier/notifier');

/**
 * Add layer dialog, typically used from editor
 */
module.exports = CoreView.extend({
  events: {
    'click .js-back': '_onBackFromError'
  },

  className: 'Dialog-content Dialog-content--expanded',

  initialize: function (opts) {
    if (!opts.modalModel) throw new TypeError('modalModel is required');
    if (!opts.visDefinitionModel) throw new TypeError('visDefinitionModel is required');

    this._modalModel = opts.modalModel;
    this._visDefinitionModel = opts.visDefinitionModel;

    this._visMetadataModel = new VisMetadataModel({
      name: this._visDefinitionModel.get('name'),
      description: this._visDefinitionModel.get('description'),
      tags: this._visDefinitionModel.get('tags')
    });

    this._stateModel = new Backbone.Model({
      status: 'show'
    });

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    if (this._hasError()) {
      this._renderError();
    } else if (this._isLoading()) {
      this._renderLoading();
    } else {
      this.$el.html(template());
      this._initViews();
    }
    return this;
  },

  _initViews: function () {
    var formView = new FormView({
      visDefinitionModel: this._visDefinitionModel,
      visMetadataModel: this._visMetadataModel
    });

    this.$('.js-content').append(formView.render().el);
    this.addView(formView);

    var footerView = new FooterView({
      visMetadataModel: this._visMetadataModel,
      onSaveAction: this._onSave.bind(this)
    });

    this.$('.js-footer').append(footerView.render().el);
    this.addView(footerView);
  },

  _renderError: function () {
    var error = this._stateModel.get('error');
    this.$el.html(templateError({
      error: _t('components.modals.maps-metadata.error.subtitle', {error: error})
    }));
  },

  _renderLoading: function () {
    this.$el.html(
      templateLoading({
        title: _t('components.modals.maps-metadata.loading')
      })
    );
  },

  _initBinds: function () {
    this._stateModel.on('change:status', this.render, this);
    this.add_related_model(this._stateModel);
  },

  _hasError: function () {
    return this._stateModel.get('status') === 'error';
  },

  _isLoading: function () {
    return this._stateModel.get('status') === 'loading';
  },

  _onSave: function () {
    this._stateModel.set({status: 'loading'});

    saveMetadata({
      onSuccess: this._onSuccessSave.bind(this),
      onError: this._onErrorSave.bind(this),
      visDefinitionModel: this._visDefinitionModel,
      name: this._visMetadataModel.get('name'),
      description: this._visMetadataModel.get('description'),
      tags: this._visMetadataModel.get('tags')
    });
  },

  _onSuccessSave: function () {
    var self = this;
    Notifier.addNotification({
      status: 'success',
      info: _t('components.modals.maps-metadata.success', {
        name: self._visMetadataModel.get('name')
      }),
      closable: true,
      delay: Notifier.DEFAULT_DELAY
    });

    this._modalModel.destroy();
  },

  _onErrorSave: function (e) {
    this._stateModel.set({
      status: 'error',
      error: errorParser(e)
    });
  },

  _onBackFromError: function () {
    this._stateModel.set({status: 'show'});
  }
});
