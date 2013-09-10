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
        height: FULL_HEIGHT * 5/6,
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

      // Initialize label
      this.labelG = this.svg.append("g").attr("class", "labels").attr("transform", "translate(0, " + (FULL_HEIGHT * 5/6 + 20) + ")");
      this.labelG.append("rect").attr({x:0, y:0, width:1, height:1, opacity:0}); // Fix offset reference
      this.labelText = this.labelG.append("text");
      this.listenTo(this.waterfall, "boxSelected", this.showLabel)
    },

    showLabel: function(waterfallView, boxD, boxEl) {
      this.labelText
      .text(boxD.category)
      .transition().duration(200)
      .attr("x", $(boxEl).offset().left - $(this.labelG[0]).offset().left);
    }
  });
});