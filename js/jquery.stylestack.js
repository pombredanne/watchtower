/*
 * jQuery StyleStack - Stack Frames for jQuery Styles
 * (c) 2013 Thomas Millar <millar.thomas@gmail.com>
 * Apache Licensed.
 *
 * http://github.com/thmsmlr/jquery.stylestack
 */

(function ($, window, document) {
    "use strict";
    var pluginName = "stylestack"
        , baseFunctions = {
            'transition' : $.fn.transition,
            'css' : $.fn.css
        }
        
    /**
    *   Wraps base functions to restore the default $.css functionality for the duration of the call
    */
    var _wrappedBaseFunctions = {}
    $.each( baseFunctions, function( key, value ) {
        if( key != 'css' ) {
            _wrappedBaseFunctions[key] = function() {
                var newCSS = $.fn.css;
                $.fn.css = baseFunctions['css'];
                var result = value.apply(this, arguments);
                $.fn.css = newCSS;
                return result;
            };
        } else {
            _wrappedBaseFunctions[key] = value
        }
    });
    baseFunctions = _wrappedBaseFunctions;
    
    /**
    * Constructor
    */
    
    $.fn[pluginName] = function (option) {
        var args = Array.prototype.slice.call(arguments);
        args.shift()
        return this.each(function () {
            var $this = $(this)
                , data = $this.data(pluginName)
                , action = typeof option == 'string' && option
            if (!data) $.data(this, pluginName, (data = new StyleStack(this)));
            if (action) data[action].apply(data, args);
        });
    };
    
    function StyleStack(element) {
        this.element = element;
        this.enabled = true;
        this.stack = [];
    }
    
    
    /**
    * Public Methods
    */
    
    StyleStack.prototype.enable = function() {
        this.enabled = true;
    };
    
    StyleStack.prototype.disable = function () {
        this.enabled = false;
    }
    
    StyleStack.prototype.pop = function(num, callback) {
        var actionStack = [];
        
        typeof num === "function" && (callback = num) && (num = this.stack.length);
        typeof num === "undefined" && (num = this.stack.length);
        
        if(this.stack) {
            for(var _i = 0, length = this.stack.length; _i < num && _i < length; _i++) {
                actionStack.push(this.stack.shift());
            }
            _popStyle.call(this.element, actionStack, callback);
        }
    }
    
    /**
    * Private Methods
    */
    
    var _popStyle = function(styles, callback) {
        
        var $this = $(this);
        if( styles.length > 0) {
            var style = styles.shift();
            
            style.popFunction.call($this, style.properties, function() {
                _popStyle.call($this, styles, callback);
            });
        } else {
            typeof callback === "function" && callback.call($this);
        }
        
    };
    
    var _pushStyle = function(style, popFunction) {
        var $this = $(this)
            , _this = this
            , oldStyle = { 'popFunction' : popFunction, 'properties' : {} }
            , styleStack = $this.data(pluginName);
            
        var styles = _cssTextParser(_this.style.cssText);
        $.each(style, function(key, value) {
            oldStyle.properties[key] = styles[key] ? styles[key] : '';
        });
    
        styleStack.stack.unshift(oldStyle)
    };
    
    var _cssTextParser = function(cssText) {
        var declarations = _removeWhiteSpace(cssText).split(';');
        var styles = {};
        for(var _i = 0; _i < declarations.length; _i++) {
            var style = _removeWhiteSpace(declarations[_i]).split(':');
            styles[style[0]] = style[1] && _removeWhiteSpace(style[1]);
        }
        return styles;
    };
    
    var _removeWhiteSpace = function (s) {
        return s.replace(/^[ \t]+/g, '').replace(/[ \t]+$/g, '')
    }
    
    
    /**
    * JQuery Function Overrides 
    */
    
    $.fn.transition = function(properties, duration, easing, callback) {
        var args = Array.prototype.slice.call(arguments);
        
        this.each(function () {
            if ( $(this).data(pluginName) && $(this).data(pluginName).enabled ) {
                _pushStyle.call(this, properties, function(oldStyle, cb) {
                    args.pop();
                    args.shift();
                    args.unshift(oldStyle);
                    args.push(cb);
                    baseFunctions['transition'].apply(this, args);
                });
            }
        });
        return baseFunctions['transition'].apply(this, arguments);
    }
    
    $.fn.css = function(properties, value) {
       if( typeof value !== "undefined" || 
            ( (properties instanceof Object) && !(properties instanceof Array) ) ) {
         
    
        this.each(function() {
            if ( $(this).data(pluginName) && $(this).data(pluginName).enabled ) {
                if ( typeof properties !== "string" ) {
                   var props = properties;  
                } else {
                    var props = { };
                    props[properties] = 0;
                }
                _pushStyle.call(this, props, function(oldStyle, cb) {
                    baseFunctions['css'].call(this, oldStyle);
                    cb();
                });
            }
        });   
        
       }
       return baseFunctions['css'].apply(this, arguments)
    }

        
    
})(jQuery, window, document);