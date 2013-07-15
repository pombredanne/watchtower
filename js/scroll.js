$(document).ready(function() {

  var NOT_SCROLLING_DELAY = 200;

  var queueNotScrolling = _.debounce(function() {
    $("body").addClass("not-scrolling");
  }, NOT_SCROLLING_DELAY);

  $(document).scroll(function(e) {
    console.log(e);
    if($("body").hasClass("not-scrolling")) {
      $("body").removeClass("not-scrolling");
    }
    queueNotScrolling();
  });

});
