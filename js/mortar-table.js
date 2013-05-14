(function ($, window, document) {
    "use strict";
    
    var allInstances = [];
    
    var pluginName = "mortarTableExpandableCell",
        defaults = {
            previewSelector : '.mortar-table-expandable-cell-preview',
            contentSelector : '.mortar-table-expandable-cell-content',
            expandingSelector : '.mortar-table-expandable-cell-container',
            wrapperSelector : '.mortar-table-expandable-cell-wrapper',
            expandedContainerStyle : {
                'width'     : 250,
                'height'    : 180
            },
            expandedPreviewStyle : {
                'opacity'   : '0'
            },
            expandedContentStyle : {
                'opacity'   : '1'
            },
            expandInward : true,
            expansionBoundPadding : 1,
            globalBlocking : true 
        };
    
    function MortarTableExpandableCell(element, options) {
        this.element = element;
        this.options = $.extend({}, defaults, options);
        
        
        var item = $(this.element).find(this.options.expandingSelector)
            , preview = $(item).find(this.options.previewSelector)
            , content = $(item).find(this.options.contentSelector)
            , _this = this;
        
        item.stylestack('enable');
        preview.stylestack('enable');
        content.stylestack('enable');
        $(this.element).stylestack('enable');
        
        
        $(this.element).click( function(event) {
            _this.open();
        });
        $(this.element).find(this.options.contentSelector).click( function(event) {
            event.stopPropagation();
        });      
        
        allInstances.push(this);              
    }
        
    
    MortarTableExpandableCell.prototype.close = function () {
        if (!$(this.element).find(this.options.expandingSelector).hasClass('active')) {
            return;
        } 
        
        var self = this;
        $(this.element).find(this.options.expandingSelector).stylestack('pop', function () {
            $(this).removeClass('active'); 
            $(self.element).stylestack('pop');
        });
        $(this.element).find(this.options.previewSelector).stylestack('pop');
        $(this.element).find(this.options.contentSelector).stylestack('pop');
        
        $(this.element).trigger('MortarTableExpandableCell.Closed');
    };
    
    MortarTableExpandableCell.prototype.open = function() {
        var item = $(this.element).find(this.options.expandingSelector)
            , preview = $(item).find(this.options.previewSelector)
            , content = $(item).find(this.options.contentSelector)
            , containerStyles = _getStyleBasedOnPosition.call(this)
            , _this = this;
        
        if(!item.hasClass('active')) {
            item.css(containerStyles['containerStyle']);

            var wrapperWidth = $(this.element).outerWidth();
            var wrapperHeight = $(this.element).outerHeight();

            $(this.element).css({ 'height' : wrapperHeight, 'width' : wrapperWidth});
            
            // This is a hack to let the page reflow
            setTimeout(function() {
              item.addClass('active');
              content.css('display', 'block');
              
                item.transition(containerStyles['containerAnimatedStyle'], function() {
                    _this.opening = false;
                });
                preview.transition(_this.options.expandedPreviewStyle);
                content.transition(_this.options.expandedContentStyle);
                
                item.css({ 'z-index' : '1000' });
            }, 0);
        }
    }
    
    var _getStyleBasedOnPosition = function() {
        
        var containerStyle = {}
            , containerAnimatedStyle = {}
            , container = $(this.element).find(this.options.expandingSelector)
            , width = this.options.expandedContainerStyle.width
            , height = this.options.expandedContainerStyle.height
            , top = $(this.element).position().top
            , left = $(this.element).position().left 
            , boundWidth = $(this.element).offsetParent().outerWidth()
            , boundHeight = $(this.element).offsetParent().outerHeight(); 

        containerAnimatedStyle['top'] = '50%';
        containerAnimatedStyle['left'] = '50%';
        containerAnimatedStyle['margin-left'] = -(width / 2);
        containerAnimatedStyle['margin-top'] = -(height / 2);

        
        if (top + containerAnimatedStyle['margin-top'] + height > boundHeight) {
            containerAnimatedStyle['margin-top'] = -top + boundHeight - height - this.options.expansionBoundPadding;
        }
        if (left + containerAnimatedStyle['margin-left'] + width > boundWidth) {
            containerAnimatedStyle['margin-left'] = -left + boundWidth - width - this.options.expansionBoundPadding;
        }
        if (top + containerAnimatedStyle['margin-top'] < 0) {
            containerAnimatedStyle['margin-top'] = -top - ($(container).height() / 2) + this.options.expansionBoundPadding;
        }
        if (left + ($(container).width() / 2) + containerAnimatedStyle['margin-left'] < 0) {
            containerAnimatedStyle['margin-left'] = -left - ($(container).width() / 2) + this.options.expansionBoundPadding;
        }       
        
        containerAnimatedStyle = $.extend({}, containerAnimatedStyle, this.options.expandedContainerStyle);
        
        return { 'containerStyle' : containerStyle, 'containerAnimatedStyle' : containerAnimatedStyle };
    };
    
    var _closeAllInstances = function() {
      for(var i = 0; i < allInstances.length; i++) {
        allInstances[i].close();
      }
    };
    
    $(document).ready(function() {
        $('body').click( _closeAllInstances );
    });
    $(document).keyup(function(e) {
      if (e.keyCode == 27) { _closeAllInstances() }   // esc
    });
        
    $.fn[pluginName] = function (option) {
        return this.each(function () {
            var $this = $(this)
                , data = $this.data('plugin_' + pluginName)
                , options = typeof option == 'object' && option
                , action = typeof option == 'string' && option
            if (!data) $.data(this, 'plugin_' + pluginName, (data = new MortarTableExpandableCell(this, options)));
            if (action) data[action]();
        
        });
    };
        
    
})(jQuery, window, document);

