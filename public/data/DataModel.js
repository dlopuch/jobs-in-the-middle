define(["jquery", "backbone", "data/promiseData"], function($, Backbone, promiseData) {
  return Backbone.Model.extend({

    initialize: function() {
      this.deferred = promiseData; // TODO: Move promiseData.js into this model, use BB fetch() wrapper, etc.

      var self = this;
      promiseData.done(function(data) {
        self._data = data;
        self.quintiles = data.quintiles;
        self.set({data: data.stats}); // TODO: collection more appropriate?
      });
    },

    // Job Growth, 2010-2012
    getJobGrowthAccessor: function() {
      return function(d) { return d.jobGrowth; };
    },

    // Average Annual Wage Growth ($M) -- job growth * avg wage
    getAvgWageGrowthAccessor: function() {
      return function(d) { return d.avgWageGrowth; };
    }

  });
});