var Mortar = Mortar || {};
(function(Mortar) {
  Mortar.ErrorPanel = (function() {
    return {
      showError : function(error_level, error_message, cb) {
        var error_html = _.template($("#template_error").html())({
          error_level : error_level,
          error_message : error_message
        });
        $("#error-container").html(error_html);
        $("#error-container > div").css('margin-top', -$("#error-container > div").outerHeight());
        $("#error-container > div").animate({'margin-top': 0}, cb);
      },
      clearError : function(cb) {
        $("#error-container > div").animate({'margin-top' : -$("#error-container > div").outerHeight()}, cb);
      }
    }
  })();
})(Mortar);
