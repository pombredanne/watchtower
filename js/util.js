var Mortar = Mortar || {};
(function(Mortar) {
  Mortar.Util = (function() {

    return {

      /* Public: Truncate the given text to the maximum number of characters
       *
       * text - The text to be truncated
       * max_num_chars - Maximum number of character
       * token - The token by which the truncation should be shown (default: ...)
       */
      truncate : function(text, max_num_chars, token) {
        var token = typeof token !== 'undefined' ? token : " ... ";
        
        var text_length = text.length;
        if (text_length <= max_num_chars) {
            return text;
        }

        var num_chars_to_remove = text_length + token.length - max_num_chars;
        var mid_point = (text_length > 1) ? Math.floor(text_length / 2) : 1;
        var left_chars_to_remove = Math.floor(num_chars_to_remove / 2);
        var right_chars_to_remove = num_chars_to_remove - left_chars_to_remove;
        return text.slice(0, mid_point - left_chars_to_remove) +
            token +
            text.slice(mid_point + right_chars_to_remove);
      },
    };
  })();
})(Mortar);
