// common configuration
require(["/sketchbook_config.js"], function() {

  // sketch configuration
  require(
    ["jquery", "boilerplate/ExampleView"],
    function($, ExampleView) {

      var v1 = new ExampleView({
        el: $("#example-view-el")
      });
      v1.render();
    }
  );

});