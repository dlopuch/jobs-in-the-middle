/**
 * Event-emitting model that switches between different measures in the dataset.
 *
 * A measure is defined by an {function(data)} accessor -- given a row in the dataset, returns the measure value.
 *
 * Listen to the change:activeMeasure event to get the activeMeasure.name and activeMeasure.accessor
 */
define(["jquery", "backbone", "data/promiseData"], function($, Backbone, promiseData) {

  // The supported measures
  var MEASURES = {
    jobGrowth: {
      name: "Job Growth, 2010-2012",
      accessor: function(d) {
        return d.jobGrowth;;
      }
    },

    avgWageGrowth: {
      name: "Avg Wealth Growth ($M/yr)",
      accessor: function(d) {
        return d.avgWageGrowth;;
      }
    }
  };

  var m = Backbone.Model.extend({

    initialize: function() {
      this.deferred = promiseData; // TODO: Move promiseData.js into this model, use BB fetch() wrapper, etc.

      var self = this;
      promiseData.done(function(data) {
        self._data = data;
        self.quintiles = data.quintiles;
        self.set({
          data: data.stats, // TODO: collection more appropriate?
          activeMeasure: MEASURES.jobGrowth,
        });
        self.trigger("sync", self);
      });
    },

    setActiveMeasure: function(measureKey) {
      this.set("activeMeasure", MEASURES[measureKey] || MEASURES.jobGrowth);
    }
  });

  m.MEASURES = MEASURES;
  return m;
});