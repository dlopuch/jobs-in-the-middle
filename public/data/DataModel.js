/*  JobsPlot DataModel: Domain and data model for the JobsInTheMiddle application
 *  Copyright (C) 2012  Daniel Lopuch <dlopuch@gmail.com>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see [http://www.gnu.org/licenses/].
 */

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