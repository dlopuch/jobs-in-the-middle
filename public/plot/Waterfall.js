/**
 * Backbone View for a Waterfall stacked chart inside an SVG element
 *
 * Constructor:
 *   el: an SVG element
 *   options.data: {Object} stats and quintile data
 */
define(["jquery", "backbone", "d3"], function($, Backbone, d3) {

  var Y_AXIS_LEFT_PADDING = 50;

  return Backbone.View.extend({

    events: {
      "mouseover rect": "_hoverCategory",
     // "mouseout g[class=plot-area] circle": "_fadeConversation",
//
      // "mouseover g[class=plot-area-hitzone] circle": "_hoverConversation",
      // "mouseout g[class=plot-area-hitzone] circle": "_fadeConversation",
    },

    initialize: function(options) {
      this.wfEl = d3.select(this.el)
      .append("g")
      .classed("waterfall", true);

      this.processData(options.data.stats);

      this.xScale = d3.scale.ordinal()
      .domain([1,2,3,4,5]) // income quintiles
      .rangeBands([Y_AXIS_LEFT_PADDING, this.$el.width() - 2], 0.1, 0.1);

      this.yScale = d3.scale.linear()
      .domain([
        d3.min(this.seriesList, function(s) { return s.sumDown }),
        d3.max(this.seriesList, function(s) { return s.sumUp })
      ])
      .range([this.$el.height() - 2, 2]);

      this.jobsCreatedColorScale = d3.scale.linear()
      .domain([0, d3.max(options.data.stats, function(d) {return d.avgWageGrowth; })])
      .range(["#FFFFBF","#91BFDB"]);

      this.jobsLostColorScale = d3.scale.linear()
      .domain([d3.min(options.data.stats, function(d) {return d.avgWageGrowth; }), 0])
      .range(["#FC8D59", "#FFFFBF"]);

      this.render();
    },

    _hoverCategory: function(e) {
      console.log(e.currentTarget.__data__);
    },

    /**
     * Processes stats to build up stacked series for each quantile.  Sets series into this.series.
     * @param {Object} data promiseData.stats
     */
    processData: function(data) {
      var s = this.series = {
        1: {up: [], down: []},
        2: {up: [], down: []},
        3: {up: [], down: []},
        4: {up: [], down: []},
        5: {up: [], down: []}
      };

      data.forEach(function(r) {
        s[r.quintile][r.avgWageGrowth >= 0 ? "up" : "down"].push(r);
      });

      var sum = function(sum, cur) { return sum + cur.avgWageGrowth;};
      for (var k in s) {
        s[k].sumUp   = s[k].up.reduce(sum, 0);
        s[k].sumDown = s[k].down.reduce(sum, 0);
        s[k].net = s[k].sumUp + s[k].sumDown;
      }

      this.seriesList = [s['1'], s['2'], s['3'], s['4'], s['5']];
    },

    render: function() {
      this.wfEl.html("");

      var
        xAxisG = this.wfEl.append("g")
          .attr("class", "axis x-axis")
          .attr("transform", "translate(0, " + this.yScale(0) +  ")")
          .call(d3.svg.axis()
            .scale(this.xScale)
            .orient('bottom')
          ),
        yAxisG = this.wfEl.append("g")
          .attr("class", "axis y-axis")
          .attr("transform", "translate(" + Y_AXIS_LEFT_PADDING + ", 0)")
          .call(d3.svg.axis()
            .scale(this.yScale)
            .orient('left')
          );

      this.seriesG = this.wfEl.append("g").attr("class", "series");

      this._renderSeries("1");
      this._renderSeries("2");
      this._renderSeries("3");
      this._renderSeries("4");
      this._renderSeries("5");
    },

    _renderSeries: function(seriesK) {
      var upDownScale = d3.scale.ordinal()
            .domain(["up", "down"])
            .rangeBands([this.xScale(seriesK), this.xScale(seriesK) + this.xScale.rangeBand()], 0.1),
        w = upDownScale.rangeBand();

      var y = 0,
          self = this,
          getBoxStart = function(d) { var prevY = y; y += d.avgWageGrowth; return self.yScale(prevY); },
          getBoxHeight = function(d) { return self.yScale(0) - self.yScale(Math.abs(d.avgWageGrowth)); };
      ["up", "down"].forEach(function(dir) {
        var g = self.seriesG.append("g");
        g.selectAll("rect")
          .data(self.series[seriesK][dir])
        .enter().append("rect")
          .attr("x", function(d) { return upDownScale(dir); })
          .attr("y", function(d) {
            return dir === "up" ? getBoxStart(d) - getBoxHeight(d) : getBoxStart(d);
          })
          .attr("width", w)
          .attr("height", getBoxHeight)
          .attr("fill", function(d) {
            return (dir === "up" ? self.jobsCreatedColorScale : self.jobsLostColorScale)(d.avgWageGrowth);
          })
      });
    }
  });
});