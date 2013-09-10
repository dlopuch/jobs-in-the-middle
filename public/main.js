// common configuration
require(["/sketchbook_config.js"], function() {

// sketch configuration
require(
  ["jquery", "data/DataModel", "plot/JobsPlot"],
  function($, DataModel, JobsPlotView) {

    window.dataModel = new DataModel();
    dataModel.deferred
    .done(function(data) {
      window.data = data;
      window.jobsPlot = new JobsPlotView({
        el: "#jobs-plot",
        data: data,
        measureAccessor: dataModel.getAvgWageGrowthAccessor()
      });
      window.waterfall = jobsPlot.waterfall; //convenience alias  TODO: REMOVE
    });

    $("#btn-avgWageGrowth").click(function() {
      jobsPlot.setMeasure("wealth");
      waterfall.changeMeasure(dataModel.getAvgWageGrowthAccessor());
    });
    $("#btn-jobGrowth").click(function() {
      jobsPlot.setMeasure("jobs");
      waterfall.changeMeasure(dataModel.getJobGrowthAccessor());
    });
    $("#btn-replay").click(function() {
      waterfall.resetCascade();
    });
  }
);

});