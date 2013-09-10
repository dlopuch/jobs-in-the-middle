define(["jquery", "backbone", "d3", "plot/Waterfall", "plot/Scale"], function($, Backbone, d3, WaterfallView, ScaleView) {
  var FULL_HEIGHT = 400,
      FULL_WIDTH = 1200,

      JOB_GROWTH_FORMAT = d3.format(".2s"),
      AVG_INCOME_FORMAT = d3.format("$.2s"),
      AVG_WAGE_GROWTH = function(v) {
        var si = JOB_GROWTH_FORMAT(v * 1000000);
        if (si.charAt(si.length - 1) === "G") {
          return "$" + si.substring(0, si.length - 1) + "B";
        } else {
          return "$" + si;
        }
      };

  return Backbone.View.extend({

    events: {
      "mouseout": "hideLabel"
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
      this.labelText = this.labelG.append("text").attr("class", "label-category")

      this.labelTextDetails1 = this.labelG.append("text").attr("y", 15).attr("class", "label-detail").attr("opacity", 0);
      this.labelTextDetails1.append("tspan").attr("class", "highlight");
      this.labelTextDetails1.append("tspan").attr("class", "rest");

      this.labelTextDetails2 = this.labelG.append("text").attr("y", 30).attr("class", "label-detail active").attr("opacity", 0);
      this.labelTextDetails2.append("tspan").attr("class", "rest");
      this.labelTextDetails2.append("tspan").attr("class", "highlight");

      this.listenTo(this.waterfall, "boxSelected", this.showLabel)
    },

    setMeasure: function(m) {
      (m === "jobs" ? this.labelTextDetails1 : this.labelTextDetails2).classed("active", true);
      (m === "jobs" ? this.labelTextDetails2 : this.labelTextDetails1).classed("active", false);
    },

    showLabel: function(waterfallView, boxD, boxEl, isHover) {
      this.labelText
      .text(boxD.category);

      this.labelTextDetails1.select("tspan.highlight")
        .text(JOB_GROWTH_FORMAT(Math.abs(boxD.jobGrowth)));
      this.labelTextDetails1.select("tspan.rest")
        .text(" jobs " + (boxD.jobGrowth >= 0 ? "created" : "lost" ) + " @ avg wage " + AVG_INCOME_FORMAT(boxD.avgWage));

      this.labelTextDetails2.select("tspan.rest")
        .text("Avg. wealth " + (boxD.avgWageGrowth >= 0 ? "created" : "lost") + ": ");
      this.labelTextDetails2.select("tspan.highlight")
        .text(AVG_WAGE_GROWTH(Math.abs(boxD.avgWageGrowth)));

      this.labelG.select("text.label-category")
      .transition().duration(200)
      .attr("opacity", 1)
      .attr("x", $(boxEl).offset().left - $(this.labelG[0]).offset().left);

      this.labelG.selectAll("text.label-detail")
      .transition().duration(200)
      .attr("opacity", isHover ? 1 : 0)
      .attr("x", $(boxEl).offset().left - $(this.labelG[0]).offset().left);

    },
    hideLabel: function() {
      this.labelG.selectAll("text")
      .transition().duration(250)
      .attr("opacity", 0);
    }
  });
});