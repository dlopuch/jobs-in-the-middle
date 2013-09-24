/*  JobsPlot: SVG Containter for a Waterfall plot
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

define([
"jquery", "backbone", "d3",
"data/DataModel",
"plot/Waterfall",
"plot/Scale"

], function(

$, Backbone, d3,
DataModel,
WaterfallView,
ScaleView) {

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
      if (!this.model)
        throw new Error("Model required");

      this.svg = d3.select(this.el).append("svg")
      .attr("width", FULL_WIDTH)
      .attr("height", FULL_HEIGHT);

      this.model.deferred
      .done(function() {

        this.listenTo(this.model, "change:activeMeasure", this.setMeasure);
        this._activeMeasure = DataModel.MEASURES.jobGrowth.accessor;

        this.waterfall = new WaterfallView({
          el: this.svg
              .append("g")[0],
          model: this.model,
          width: FULL_WIDTH,
          height: FULL_HEIGHT * 5/6,
          data: this.model.get("data"),
          measureAccessor: this.model.get("activeMeasure").accessor
        });

        this.scale = new ScaleView({
          el: this.svg.append("g")
              .attr("class", "scale")
              .attr("transform", "translate(" + (FULL_WIDTH - 120) + ", 0)")
              [0][0],
          model: this.model,
          colorScaleEmitter: this.waterfall
        });


        // Initialize labels
        // -------

        this._labelGy = (FULL_HEIGHT * 5/6 + 20);
        this.labelG = this.svg.append("g")
        .attr("class", "labels")
        .attr("transform", "translate(0, " + this._labelGy + ")")
        .attr("opacity", 0);
        this._labelGReference = this.svg.append("rect").attr({x:0, y:0, width:1, height:1, opacity:0}); // Fixed reference point for offset calcs

        this.labelText = this.labelG.append("text").attr("class", "label-category")
        this.labelTextUp   = this.labelG.append("text").style("text-anchor", "end").attr("x", -5).attr("class", "label-dir up").text("▲");
        this.labelTextDown = this.labelG.append("text").style("text-anchor", "end").attr("x", -5).attr("class", "label-dir down").text("▼");

        this.labelTextDetails1 = this.labelG.append("text").attr("y", 15).attr("class", "label-detail");
        this.labelTextDetails1.append("tspan").attr("class", "highlight");
        this.labelTextDetails1.append("tspan").attr("class", "rest");

        this.labelTextDetails2 = this.labelG.append("text").attr("y", 30).attr("class", "label-detail active");
        this.labelTextDetails2.append("tspan").attr("class", "rest");
        this.labelTextDetails2.append("tspan").attr("class", "highlight");

        this.listenTo(this.waterfall, "boxSelected", this.showJobDrilldown);
        this.listenTo(this.waterfall, "netBoxSelected", this.showNetDrilldown);

      }.bind(this))
      .fail(function() {
        throw new Error("[JobsPlot] Error loading model data");
      });
    },

    setMeasure: function(model, m) {
      (m === DataModel.MEASURES.jobGrowth ? this.labelTextDetails1 : this.labelTextDetails2).classed("active", true);
      (m === DataModel.MEASURES.jobGrowth ? this.labelTextDetails2 : this.labelTextDetails1).classed("active", false);
      this._activeMeasure = m;
    },

    showJobDrilldown: function(waterfallView, boxD, boxEl) {
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

      this.labelTextUp.attr("opacity", this._activeMeasure.accessor(boxD) >= 0 ? 1 : 0)
      .attr("fill", this.waterfall.colorScale(this._activeMeasure.accessor(boxD)));
      this.labelTextDown.attr("opacity", this._activeMeasure.accessor(boxD) >= 0 ? 0 : 1)
      .attr("fill", this.waterfall.colorScale(this._activeMeasure.accessor(boxD)));

      this.labelG
      .transition().duration(200)
      .attr("opacity", 1)
      .attr("transform", "translate(" + ($(boxEl).offset().left - $(this._labelGReference[0]).offset().left) + ", " + this._labelGy + ")");
    },

    showNetDrilldown: function(waterfallView, boxD, boxEl, opts) {
      this.labelText.text("Net " + this._activeMeasure.name + ", Quintile " + boxD.quintile);

      this.labelTextDetails1.select("tspan.highlight")
        .text(JOB_GROWTH_FORMAT(Math.abs(boxD.jobGrowth)));
      this.labelTextDetails1.select("tspan.rest")
        .text(" jobs " + (boxD.jobGrowth >= 0 ? "created" : "lost" ));

      this.labelTextDetails2.select("tspan.rest")
        .text("Avg. wealth " + (boxD.avgWageGrowth >= 0 ? "created" : "lost") + ": ");
      this.labelTextDetails2.select("tspan.highlight")
        .text(AVG_WAGE_GROWTH(Math.abs(boxD.avgWageGrowth)));

      this.labelTextUp.attr("opacity", this._activeMeasure.accessor(boxD) >= 0 ? 1 : 0)
      .attr("fill", "steelblue");
      this.labelTextDown.attr("opacity", this._activeMeasure.accessor(boxD) >= 0 ? 0 : 1)
      .attr("fill", "steelblue");

      this.labelG
      .transition().duration(0) // cancel any active transitions
      .attr("opacity", opts.opacity || 1)
      .attr("transform", "translate(" + ($(boxEl).offset().left - $(this._labelGReference[0]).offset().left) + ", " + this._labelGy + ")");
    },

    hideLabel: function() {
      this.labelG
      .transition().duration(250)
      .attr("opacity", 0);
    }
  });
});