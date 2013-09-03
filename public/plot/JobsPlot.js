define(["jquery", "backbone", "d3", "plot/Waterfall"], function($, Backbone, d3, WaterfallView) {
  var FULL_HEIGHT = 400,
      FULL_WIDTH = 1200;

  return Backbone.View.extend({

    events: {
    },

    initialize: function(options) {
      this.svg = d3.select(this.el).append("svg")
      .attr("width", FULL_WIDTH)
      .attr("height", FULL_HEIGHT);

      this.waterfall = new WaterfallView({
        el: this.svg[0],
        data: options.data
      });
    }
  });
});