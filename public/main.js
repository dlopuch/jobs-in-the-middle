// common configuration
require(["/sketchbook_config.js"], function() {

// sketch configuration
require(
  ["jquery", "data/DataModel", "plot/JobsPlot"],
  function($, DataModel, JobsPlotView) {

    window.dataModel = new DataModel();
    window.jobsPlot = new JobsPlotView({
      el: "#jobs-plot",
      model: dataModel
    });
    dataModel.deferred
    .done(function(data) {
      window.data = data;
      window.waterfall = jobsPlot.waterfall; //convenience alias  TODO: REMOVE
    });

    $("#btn-avgWageGrowth").click(function() {
      dataModel.setActiveMeasure("avgWageGrowth");
      // jobsPlot.setMeasure("wealth");
      // waterfall.changeMeasure(dataModel.getAvgWageGrowthAccessor());
    });
    $("#btn-jobGrowth").click(function() {
      dataModel.setActiveMeasure("jobGrowth");
      // jobsPlot.setMeasure("jobs");
      // waterfall.changeMeasure(dataModel.getJobGrowthAccessor());
    });
    $("#btn-replay").click(function() {
      waterfall.resetCascade();
    });
  }
);

});