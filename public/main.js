// common configuration
require(["/sketchbook_config.js"], function() {

// sketch configuration
require(
  ["jquery", "data/DataModel", "plot/JobsPlot",
   "bootstrap"],
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
      $("#show-btns .btn").removeClass("btn-primary");
      $("#btn-avgWageGrowth").addClass("btn-primary");
      dataModel.setActiveMeasure("avgWageGrowth");
    });
    $("#btn-jobGrowth").click(function() {
      $("#show-btns .btn").removeClass("btn-primary");
      $("#btn-jobGrowth").addClass("btn-primary");
      dataModel.setActiveMeasure("jobGrowth");
    });
    $("#btn-replay").click(function() {
      waterfall.resetCascade();
    });
  }
);

});