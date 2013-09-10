define(["jquery", "backbone", "d3", "plot/Waterfall", "plot/Scale"], function($, Backbone, d3, WaterfallView, ScaleView) {
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
        el: this.svg
            .append("g")[0],
        width: FULL_WIDTH,
        height: FULL_HEIGHT * 2/3,
        data: options.data,
        measureAccessor: this.options.measureAccessor
      });

      this.scale = new ScaleView({
        el: this.svg.append("g")
            .attr("class", "scale")
            .attr("transform", "translate(" + (FULL_WIDTH - 120) + ", 0)")
            [0][0],
        colorScale: this.waterfall.colorScale
      });

      this.listenTo(this.waterfall, "newColorScale", function(waterfallView, colorScale) {
        this.scale.setScale(colorScale);
      }.bind(this));
    }
  });
});