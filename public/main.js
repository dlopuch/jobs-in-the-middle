// common configuration
require(["/sketchbook_config.js"], function() {

  // sketch configuration
  require(
    ["data/promiseData"],
    function(promiseData) {

      promiseData
      .done(function(data) {
        console.log("Got data: ", data);
      });
    }
  );

});