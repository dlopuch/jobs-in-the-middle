/**
 * Backbone View for a scale legend in an SVG element
 *
 * Constructor:
 *   el: an SVG or g element.  Appends a g into this SVG to draw the scale
 *   options.colorScale {d3.scale} Scale with a domain and color range set
 */
define(["jquery", "backbone", "d3"], function($, Backbone, d3) {

  var W = 100,
      H = 40,
      NUM_INTERVALS = 10;

  return Backbone.View.extend({

    tagName: "g",

    initialize: function(options) {
      if (!this.model)
        throw new Error("Model required");

      this.listenTo(this.model, "change:activeMeasure", function(model, m) {
        this.scaleLabel.text(m.name);
      }.bind(this));

      if (!this.options.colorScaleEmitter)
        throw new Error("Backbone view that sets/emits colorScales required");

      this._handleNewColorScale(this.options.colorScaleEmitter, this.options.colorScaleEmitter.colorScale);
      this.listenTo(this.options.colorScaleEmitter, "newColorScale", this._handleNewColorScale);

      this.render();
    },

    /**
     * Changes the legend scale to match the passed d3.scale
     * @param {Backbone.View} View that emitted the new color scale
     * @param {d3.scale} colorScale object
     */
    _handleNewColorScale: function(emitter, colorScale) {
      var domain = colorScale.domain();

      this._hasZero = domain[0] < 0 && domain[domain.length - 1] > 0;

      this.options.colorScale = colorScale;

      if (!this.axis) {
        this.axisScale = d3.scale.linear();

        // Our axis is going to show three points: min, 0, and max (assuming range is: min < 0 < max)
        // Create a special tick formatter that returns no value (blank tick) for the zero point
        var origTickFormat = this.axisScale.tickFormat;
        this.axisScale.tickFormat = function(count) {
          return function(v) {
            if (v === 0) return "";
            return origTickFormat(count)(v);
          }
        }

        this.axis = d3.svg.axis()
        .orient('bottom');
      }
      this.axis
      .scale(this.axisScale
             .domain([domain[0], domain[2]])
             .range([0, W])
            )
      .tickValues([domain[0], 0, domain[domain.length - 1]]);

      this._transitionAxis();
    },

    _transitionAxis: function() {
      // First time (initialization) is a no-op... later times we do the actual transition
      this._transitionAxis = this._realTransitionAxis;
    },
    _realTransitionAxis: function() {
      d3.select(this.el)
      .select("g.axis")
      .transition()
      .duration(500)
      .call(this.axis);

      this.render();
    },

    render: function() {
      // First create the box data
      var data = new Array(NUM_INTERVALS),
          domain = this.options.colorScale.domain(),
          boxScale = d3.scale.linear()
          .domain([domain[0], domain[2]])
          .range([0, W]),

          step = (domain[domain.length - 1] - domain[0]) / NUM_INTERVALS,
          curStep = domain[0],
          self = this;

      for (var i=0; i < NUM_INTERVALS; i++) {
        data[i] = curStep;
        curStep += step;
      }

      var firstRender = false;

      // Create any elements if first render call
      if (!this.scaleEl) {
        firstRender = true;

        this.scaleLabel = d3.select(this.el)
        .append("text")
        .attr("transform", "translate(" + W/2 + ",13)")
        .attr("text-anchor", "middle")
        .text(this.model.get("activeMeasure").name);

        this.colorG = d3.select(this.el)
        .append("g")
        .attr("width", W)
        .attr("transform", "translate(0, 15)")
        .attr("class", "color-scale");

        this.colorG.selectAll("rect").data(data)
        .enter()
        .append("rect")
        .attr("x", function(d) { return boxScale(d); })
        .attr("width", W / NUM_INTERVALS)
        .attr("height", H - 15 - H * 1/3);

        this.scaleEl = d3.select(this.el)
        .append("g")
        .attr("class", "axis")
        .attr("width", W)
        .attr("transform", "translate(0, " + (H * 2/3) + ")")
        .call(this.axis);
      }

      // Update what needs to be updated
      var rects = this.colorG.selectAll("rect").data(data);

      if (!firstRender) rects = rects.transition().duration(500);

      rects
      .attr("fill", function(d) { return self.options.colorScale(d + step/2); });
    }
  });
});