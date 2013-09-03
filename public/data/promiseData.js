define(["jquery", "d3"], function($, d3) {

  var promiseData = $.Deferred();

  var jobsStats = $.Deferred();
  d3.csv('data/jobs-in-the-middle.csv',
    function(r) {
      // More dev-friendly transform
      return {
        category: r.Category,
        jobGrowth: +r["Job Growth, 2010-2012"],
        avgWage: +r["Average Annual Wage ($)"],
        quintile: +r["Average Wage Quintile"],
        avgWageGrowth: +r["Average Annual Wage Growth ($M)"]
      }
    },
    function(error, rows) {
      if (error) {
        console.log("[ParseData] Error parsing");
        jobsStats.reject(error);
      } else {
        console.log("[ParseData] Done retreiving and parsing " + rows.length + " job stats rows.");
        jobsStats.resolve(rows);
      }
    }
  );

  var quintiles = $.Deferred();
  d3.csv('data/us-income-quintiles.csv',
    function(r) {
      // Apply dev-friendly transform
      return {
        quintile: +r.Quintile,
        income: +r.Income,
        netWageGrowth: +r["Net Annual Wage Growth ($M)"]
      }
    },
    function(error, rows) {
      if (error) {
        console.log("[ParseData] Error parsing");
        quintiles.reject(error);
      } else {
        console.log("[ParseData] Done retreiving and parsing " + rows.length + " quintiles rows.");
        quintiles.resolve(rows);
      }
    }
  );

  console.log("[ParseData] Requesting data");

  $.when(jobsStats, quintiles)
  .then(function(jobsStats, quintiles) {
    promiseData.resolve({
      stats: jobsStats,
      quintiles: quintiles
    });
  })
  .fail(function(error) {
    promiseData.reject(error);
  });

  return promiseData.promise();

});