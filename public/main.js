// common configuration
require(["/sketchbook_config.js"], function() {

// sketch configuration
require(
  ["data/promiseData", "plot/JobsPlot"],
  function(promiseData, JobsPlotView) {

    promiseData
    .done(function(data) {
      window.jobsPlot = new JobsPlotView({el: "#jobs-plot", data: data});
      window.waterfall = jobsPlot.waterfall; //convenience alias  TODO: REMOVE
    });
  }
);

});