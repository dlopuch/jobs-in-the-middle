/**
 * Backbone View for a Waterfall stacked chart inside an SVG element
 *
 * Constructor:
 *   el: an SVG element
 *   options.data: {Object} stats and quintile data
 *   options.measureAccessor: {function(d)} Function that given a data element (box), returns a measure to waterfall
 */
define(["jquery", "backbone", "d3"], function($, Backbone, d3) {

  var PADDING_LEFT = 60,
      PADDING_BOTTOM = 50;

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

      this._processData(options.data.stats);

      this._initScales();

      this.render();
    },

    changeMeasure: function(newMeasureAccessor) {
      this.options.measureAccessor = newMeasureAccessor;
      this._processData(this.options.data.stats);
      this._initScales();
      this.render({noDelay: true});
    },

    _initScales: function() {
      var measureAccessor = this.options.measureAccessor; //convenience

      // If the scales don't exist, create them.  Otherwise, we'll change them for future transitions
      if (!this.xScale) {
        this.xScale = d3.scale.ordinal();
        this.yScale = d3.scale.linear();
        this.jobsCreatedColorScale = d3.scale.linear();
        this.jobsCreatedBorderColorScale = d3.scale.linear();
        this.jobsLostColorScale = d3.scale.linear();
        this.jobsLostBorderColorScale = d3.scale.linear();
      }

      this.xScale
      .domain([1,2,3,4,5]) // income quintiles
      .rangeBands([PADDING_LEFT, this.$el.width() - 2], 0.1, 0.1);

      this.yScale
      .domain([
        d3.min(this.seriesList, function(s) { return s.net }),
        d3.max(this.seriesList, function(s) { return s.sumUp })
      ])
      .range([this.$el.height() - PADDING_BOTTOM, 2]);

      this.jobsCreatedColorScale
      .domain([0, d3.max(this.options.data.stats, measureAccessor)])
      .range(["#FFFFBF","#91BFDB"]);
      this.jobsCreatedBorderColorScale
      .domain([0, d3.max(this.options.data.stats, measureAccessor)])
      .range(["#ffec8c","#6ba9ce"]);

      this.jobsLostColorScale
      .domain([d3.min(this.options.data.stats, measureAccessor), 0])
      .range(["#FC8D59", "#FFFFBF"]);
      this.jobsLostBorderColorScale
      .domain([d3.min(this.options.data.stats, measureAccessor), 0])
      .range(["#fb6b27", "#ffec8c"]);
    },

    _hoverCategory: function(e) {
      console.log(e.currentTarget.__data__);
    },

    /**
     * Processes stats to build up stacked series for each quantile.  Sets series into this.series.
     * @param {Object} data promiseData.stats
     */
    _processData: function(data) {
      var measureAccessor = this.options.measureAccessor,
          s = this.series = {
                1: {id: 1, up: [], down: []},
                2: {id: 2, up: [], down: []},
                3: {id: 3, up: [], down: []},
                4: {id: 4, up: [], down: []},
                5: {id: 5, up: [], down: []}
          };

      data.forEach(function(r) {
        s[r.quintile][measureAccessor(r) >= 0 ? "up" : "down"].push(r);
      });

      var sum = function(sum, cur) { return sum + measureAccessor(cur);};
      for (var k in s) {
        s[k].sumUp   = s[k].up.reduce(sum, 0);
        s[k].sumDown = s[k].down.reduce(sum, 0);
        s[k].net = s[k].sumUp + s[k].sumDown;
      }

      this.seriesList = [s['1'], s['2'], s['3'], s['4'], s['5']];
    },

    /**
     * A reference to get whatever the current measure accessor is rather than a specific measure accessor.
     */
    _getMeasureAccessor: function() {
      return this.options.measureAccessor;
    },

    /**
     * Renders elements against a dataset, or transitions a dataset to new positions and colorings.
     * (You can change what attributes of a dataset are used for the representation, but changing the underlying dataset
     *  is not supported).
     */
    render: function(options) {
      options = options || {};

      // First time: create axes and box elements
      if (!this._subsequentRender) {
        this._subsequentRender = true;

        this.seriesGs = this.wfEl.append("g").attr("class", "series")
        .selectAll("g").data(this.seriesList);

        this.yAxis = d3.svg.axis()
            .scale(this.yScale)
            .orient('left');
        this.yAxisG = this.wfEl.append("g")
          .attr("class", "axis y-axis")
          .attr("transform", "translate(" + PADDING_LEFT + ", 0)")
          .call(this.yAxis);

        this.xAxisG = this.wfEl.append("g")
          .attr("class", "axis x-axis")
          .attr("transform", "translate(0, " + this.yScale(0) +  ")")
          .call(d3.svg.axis()
            .scale(this.xScale)
            .orient('bottom')
            .tickFormat(function(quintileN) {
              return "Quintile " + quintileN;
            })
          );


        this.seriesGs
        .enter().append("g")
        .attr("data-series-id", function(d) { return d.id; })
        .call(this._enterSeries, this);

      // Subsequent renders: everything is already created, now we just transition what needs to change
      } else {
        this.yAxisG.transition().duration(500).call(this.yAxis);
        this.xAxisG.transition().duration(500).attr("transform", "translate(0, " + this.yScale(0) + ")");
      }

      var self = this,
          getBoxHeight = function(d) { return self.yScale(0) - self.yScale(Math.abs(self.options.measureAccessor(d))); };
      this.seriesGs
      .each(function(seriesD) {

        var y=0;

        d3.select(this).selectAll("rect.stacked-box")
        .transition()
        .delay(function(d, i) {return options.noDelay ? 0 : i * 400})
        .duration(500)
          .attr("y", function(d) {
            var prevY = y;
            y += self.options.measureAccessor(d);
            return self.yScale(prevY) - (d._isUp ? getBoxHeight(d) : 0);
          })
          .attr("height", getBoxHeight);
      });

      // this._renderSeries("1");
      // this._renderSeries("2");
      // this._renderSeries("3");
      // this._renderSeries("4");
      // this._renderSeries("5");
//
      // this.seriesG.selectAll("rect.stacked-box")
      // .transition()
      // .delay(function(d, i) {return i * 400})
      // .duration(500)
        // .attr("y", function(d) { return d.targetY; })
        // .attr("height", function(d) { return d.targetHeight; })
        // .each("start", function(d) {
          // // When each box starts to move up, it will pull its waterfall-net line to the net position once the box
          // // is in place
          // d.getWaterfallNet()
          // .transition()
          // .delay(200)
          // .duration(400)
          // .attr("y1", d.targetYIndicator)
          // .attr("y2", d.targetYIndicator);
        // })
        // .each("end", function(d) {
          // if (d.isLastUp) {
            // d.getWaterfallConnector()
            // .transition()
            // .duration(250)
              // .attr("opacity", 1.0);
          // }
        // });
    },

    /**
     * Instantiates each of the series boxes and elements
     * @param {d3.selection} seriesGs Selection of each this.seriesList element's g bound to its seriesList data.
     * @param {plot.Waterfall} this Backbone view instance (this function gets d3.selection.call()'d)
     */
    _enterSeries: function(seriesGs, self) {
      seriesGs.each(function(seriesD) {

        var seriesG = d3.select(this),
            seriesID = seriesD.id;

        // X sub-scale -- break each x ordinal up into an up and a down column
        var upDownScale = d3.scale.ordinal()
          .domain(["up", "down"])
          .rangeBands([self.xScale(seriesID), self.xScale(seriesID) + self.xScale.rangeBand()], 0.1);

        ["up", "down"].forEach(function(dir) {
          var g = seriesG.append("g")
          .attr("class", dir)
          .attr("transform", "translate(" + upDownScale(dir) + "0)");

          g.selectAll("rect")
            .data(seriesD[dir])
          .enter().append("rect")
            .attr("class", "stacked-box")
            .attr("x", 0)
            .attr("y", function(d) { return self.yScale(dir === "up" ? 0 : seriesD.sumUp); })
            .attr("width", upDownScale.rangeBand())
            .attr("height", 0)
            .each(function(d, i) {
              d._isUp = dir === "up";
              d._isLastUp =   dir === "up"   && i === seriesD[dir].length -1;
              d._isLastDown = dir === "down" && i === seriesD[dir].length -1;
            })
            .attr("fill", function(d) {
              return (dir === "up" ? self.jobsCreatedColorScale : self.jobsLostColorScale)(self._getMeasureAccessor()(d));
            })
            .attr("stroke", function(d) {
              return (dir === "up" ? self.jobsCreatedBorderColorScale : self.jobsLostBorderColorScale)(self._getMeasureAccessor()(d));
            })
            .attr("shape-rendering", "crispEdges");
        });
      });
    },

    _renderSeries: function(seriesK) {
      var upDownScale = d3.scale.ordinal()
            .domain(["up", "down"])
            .rangeBands([this.xScale(seriesK), this.xScale(seriesK) + this.xScale.rangeBand()], 0.1),
        w = upDownScale.rangeBand(),
        measureAccessor = this.options.measureAccessor;

      var y = 0,
          self = this,
          getBoxStart = function(d) { var prevY = y; y += measureAccessor(d); return self.yScale(prevY); },
          getBoxHeight = function(d) { return self.yScale(0) - self.yScale(Math.abs(measureAccessor(d))); },
          downTransition,
          waterfallConnector,
          waterfallNet;
      ["up", "down"].forEach(function(dir) {
        var g = self.seriesG.append("g");
        g.selectAll("rect")
          .data(self.series[seriesK][dir])
        .enter().append("rect")
          .attr("class", "stacked-box")
          .attr("x", function(d) { return upDownScale(dir); })
          .attr("y", function(d) { return self.yScale(dir === "up" ? 0 : self.series[seriesK].sumUp); })
          .attr("width", w)
          .attr("height", 0)
          .each(function(d, i) {
            // Save target attrs for transition
            d.targetY = dir === "up" ? getBoxStart(d) - getBoxHeight(d) : getBoxStart(d);
            d.targetHeight = getBoxHeight(d);
            d.targetYIndicator = dir === "up" ? d.targetY : d.targetY + d.targetHeight;
            d.getWaterfallConnector = function() {return waterfallConnector;}; // these vars aren't set, but they will be once lines drawn.  So save a reference to the var.
            d.getWaterfallNet = function() {return waterfallNet;};
            d.isLastUp = dir === "up" && i === self.series[seriesK][dir].length -1;
          })
          .attr("fill", function(d) {
            return (dir === "up" ? self.jobsCreatedColorScale : self.jobsLostColorScale)(measureAccessor(d));
          })
          .attr("stroke", function(d) {
            return (dir === "up" ? self.jobsCreatedBorderColorScale : self.jobsLostBorderColorScale)(measureAccessor(d));
          })
          .attr("shape-rendering", "crispEdges");
      });

      // Now draw the waterfall connecting line
      waterfallConnector = this.seriesG.append("g")
        .attr("class", "waterfall-connector")
      .append("line")
        .attr("y1", this.yScale(this.series[seriesK].sumUp))
        .attr("y2", this.yScale(this.series[seriesK].sumUp))
        .attr("x1", upDownScale("up"))
        .attr("x2", upDownScale("down") + w)
        .attr("opacity", 0.0);

      // And the waterfall final position
      waterfallNet = this.seriesG.append("g")
        .attr("class", "waterfall-net")
      .append("line")
        .attr("y1", this.yScale(0)) // will animate with the bars, eventually ending at this.series[seriesK].net
        .attr("y2", this.yScale(0))
        .attr("x1", upDownScale("down"))
        .attr("x2", upDownScale("down") + w);
    }
  });
});