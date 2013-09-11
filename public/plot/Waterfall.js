/**
 * Backbone View for a Waterfall stacked chart inside an SVG element
 *
 * Constructor:
 *   el: an SVG element
 *   options.data: {Object} stats and quintile data
 *   options.measureAccessor: {function(d)} Function that given a data element (box), returns a measure (numeric value) to waterfall
 *
 * Events:
 *   "newColorScale" (this, {d3.scale}): Emitted when a new measure has been assigned and we have a new color scale
 *   "boxSelected" (this, {object} data): Emitted when user hovers over a box to select the box data
 */
define(["jquery", "backbone", "d3"], function($, Backbone, d3) {

  var PADDING_LEFT = 60,
      PADDING_BOTTOM = 30,

      /** How long it takes for a box to tween into place */
      BOX_ANIMATE_MS = 800,

      /** How frequently another box appears (the pause between moving one box and the next) */
      BOX_THROUGHPUT_MS = 600;

  return Backbone.View.extend({

    events: {
      "mouseover rect": "_hoverCategory",
    },

    initialize: function(options) {
      if (!this.model)
        throw new Error("Model required");

      this.listenTo(this.model, "change:activeMeasure", this.changeMeasure);

      this.options.width = this.options.width || 600;
      this.options.height = this.options.height || 300;


      this.wfEl = d3.select(this.el)
      .attr("width", this.options.width)
      .attr("height", this.options.height)
      .classed("waterfall", true);

      this._processData(options.data);

      this._initScales();

      this.render();
    },

    /**
     * Change the waterfall to illustrate a different measure in the bound dataset
     * @param {function(d)} New function that given a data element (box), returns a measure (numeric value) to waterfall
     */
    changeMeasure: function(model, newMeasure) {
      this.options.measureAccessor = newMeasure.accessor;
      this._processData(this.options.data);
      this._initScales();
      this.render({noDelay: true});
      this.trigger("newColorScale", this, this.colorScale);
    },

    /**
     * Replay the waterfall construction
     */
    resetCascade: function() {
      this.seriesGs.selectAll("g.waterfall-connector line")
      .transition().duration(0)
      .attr("opacity", 0);

      this.seriesGs.selectAll("g.waterfall-net line")
      .transition().duration(0)
      .attr("y1", this.yScale(0))
      .attr("y2", this.yScale(0));

      // Resetting the position of the boxes is tricky.  The up-stack all gets reset to 0, but the
      // down stack gets reset to the series' sumUp value (because they waterfall down, not up)
      var self = this;
      this.seriesGs
      .each(function(seriesD) {
        var seriesG = d3.select(this);

        ["up", "down"].forEach(function(dir) {
          seriesG.selectAll("g.series-stack." + dir + " rect.stacked-box")
          .transition().duration(0)
          .attr("height", 0)
          .attr("y", function(d) { return self.yScale(dir === "up" ? 0 : seriesD.sumUp); });
        });
      });

      this.render();
    },

    _initScales: function() {
      var measureAccessor = this.options.measureAccessor; //convenience

      // If the scales don't exist, create them.  Otherwise, we'll change them for future transitions
      if (!this.xScale) {
        this.xScale = d3.scale.ordinal();
        this.yScale = d3.scale.linear();
        this.colorScale = d3.scale.linear();
        this.borderColorScale = d3.scale.linear();
      }

      this.xScale
      .domain([1,2,3,4,5]) // income quintiles
      .rangeBands([PADDING_LEFT, this.options.width - 2], 0.1, 0.1);

      this.yScale
      .domain([
        d3.min(this.seriesList, function(s) { return s.net }),
        d3.max(this.seriesList, function(s) { return s.sumUp })
      ])
      .range([this.options.height - PADDING_BOTTOM, 2]);

      this.colorScale
      .domain([d3.min(this.options.data, measureAccessor), 0, d3.max(this.options.data, measureAccessor)])
      .range(["#FC8D59", "#FFFFBF","#91BFDB"]);
      this.borderColorScale
      .domain([d3.min(this.options.data, measureAccessor), 0, d3.max(this.options.data, measureAccessor)])
      .range(["#fb6b27", "#ffec8c","#6ba9ce"]);
    },

    _hoverCategory: function(e) {
      console.log(e.currentTarget.__data__);
      this.trigger("boxSelected", this, e.currentTarget.__data__, e.currentTarget, true);
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
     * @param {Object} [options] Render options
     *   noDelay: {boolean} True to make everything move at once (eg changing measure)
     */
    render: function(options) {
      options = options || {};

      var self = this;

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
        .attr("class", "series-waterfall")
        .call(this._enterSeries, this);

      // Subsequent renders: everything is already created, now we just transition what needs to change
      } else {
        this.yAxisG.transition().duration(500).call(this.yAxis);
        this.xAxisG.transition().duration(500).attr("transform", "translate(0, " + this.yScale(0) + ")");
        this.seriesGs
          .data(this.seriesList) // re-bind to the newest data series objects (summations, etc.)
        .select("g.waterfall-connector line") // ...and transition the connector line
        .transition().duration(BOX_ANIMATE_MS)
        .attr("y1", function(seriesD) { return self.yScale(seriesD.sumUp)})
        .attr("y2", function(seriesD) { return self.yScale(seriesD.sumUp)})
      }

      var getBoxHeight = function(d) { return self.yScale(0) - self.yScale(Math.abs(self.options.measureAccessor(d))); },
          allBoxes = this.seriesGs.selectAll("rect.stacked-box");
      this.seriesGs
      .each(function(seriesD, seriesI) {

        var y=0,
            waterfallNet = d3.select(this).select("g.waterfall-net line"),
            waterfallConnector = d3.select(this).select("g.waterfall-connector line"),
            numPredecessorBoxes = 0;

        for (var i=0; i < seriesI; i++) {
          numPredecessorBoxes += allBoxes[i].length;
        }

        d3.select(this).selectAll("rect.stacked-box")
        .transition()
          .delay(function(d, i) {return options.noDelay ? 0 : (numPredecessorBoxes + i)*BOX_THROUGHPUT_MS})
          .duration(BOX_ANIMATE_MS)
        .attr("y", function(d) {
          d._targetY = self.yScale(y) - (d._isUp ? getBoxHeight(d) : 0);
          y += self.options.measureAccessor(d);
          return d._targetY;
        })
        .attr("height", getBoxHeight)
        .attr("fill", function(d) {
          return self.colorScale(self.options.measureAccessor(d));
        })
        .attr("stroke", function(d) {
          return self.borderColorScale(self.options.measureAccessor(d));
        })
        .each("start", function(d) {
          // When each box starts to move up, it will pull its waterfall-net line to the net position once the box
          // is in place
          waterfallNet
          .transition()
          .delay(options.noDelay ? 0 : BOX_THROUGHPUT_MS / 2)
          .duration(options.noDelay ? BOX_ANIMATE_MS : BOX_THROUGHPUT_MS)
          .attr("y1", d._targetY + (d._isUp ? 0 : getBoxHeight(d)))
          .attr("y2", d._targetY + (d._isUp ? 0 : getBoxHeight(d)));

          if (!options.noDelay)
            self.trigger("boxSelected", self, d, this);
        })
        .each("end", function(d) {
          if (d._isLastUp) {
            waterfallConnector
            .transition()
              .duration(250)
            .attr("opacity", 1.0);
          }
        });
      });
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
        seriesD.upDownScale = d3.scale.ordinal()
          .domain(["up", "down"])
          .rangeBands([self.xScale(seriesID), self.xScale(seriesID) + self.xScale.rangeBand()], 0.1);

        ["up", "down"].forEach(function(dir) {
          var g = seriesG.append("g")
          .attr("class", "series-stack " + dir)
          .attr("transform", "translate(" + seriesD.upDownScale(dir) + "0)");

          g.selectAll("rect")
            .data(seriesD[dir])
          .enter().append("rect")
            .attr("class", "stacked-box")
            .attr("x", 0)
            .attr("y", function(d) { return self.yScale(dir === "up" ? 0 : seriesD.sumUp); })
            .attr("width", seriesD.upDownScale.rangeBand())
            .attr("height", 0)
            .each(function(d, i) {
              d._isUp = dir === "up";
              d._isLastUp =   dir === "up"   && i === seriesD[dir].length -1;
              d._isLastDown = dir === "down" && i === seriesD[dir].length -1;
            })
            .attr("fill", function(d) {
              return self.colorScale(self._getMeasureAccessor()(d));
            })
            .attr("stroke", function(d) {
              return self.borderColorScale(self._getMeasureAccessor()(d));
            })
            .attr("shape-rendering", "crispEdges");
        });
      });

      // Now draw the waterfall connecting line
      seriesGs.append("g")
        .attr("class", "waterfall-connector")
      .append("line")
        .attr("y1", function(seriesD) { return self.yScale(seriesD.sumUp); }) //  this.yScale(this.series[seriesK].sumUp))
        .attr("y2", function(seriesD) { return self.yScale(seriesD.sumUp); })
        .attr("x1", function(seriesD) { return seriesD.upDownScale("up")})
        .attr("x2", function(seriesD) { return seriesD.upDownScale("down") + seriesD.upDownScale.rangeBand()})
        .attr("opacity", 0.0);


      // And the waterfall final position
      seriesGs.append("g")
        .attr("class", "waterfall-net")
      .append("line")
        .attr("y1", self.yScale(0)) // will animate with the bars, eventually ending at this.series[seriesK].net
        .attr("y2", self.yScale(0))
        .attr("x1", function(seriesD) { return seriesD.upDownScale("down")})
        .attr("x2", function(seriesD) { return seriesD.upDownScale("down") + seriesD.upDownScale.rangeBand()});
    }
  });
});