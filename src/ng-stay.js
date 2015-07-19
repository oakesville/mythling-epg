'use strict';

var stayMod = angular.module('stay', []);

stayMod.directive('stay', ['$window', '$timeout', function($window, $timeout) {
  return {
    restrict: 'A',
    link: function link(scope, elem, attrs) {
    
      var scrollTimeout;
      var scLeft = 0, oldScLeft = 0;
      var scTop = 0, oldScTop = 0;
      var fixedOffset;
      var ua = $window.navigator.userAgent;
            
      elem.css('position', 'fixed');

      if (!fixedOffset) {
        $timeout(function() {
          // initialize here to support expression offset values
          if (attrs.stay == 'left')
            fixedOffset = elem[0].getBoundingClientRect().top;
          else if (attrs.stay == 'top') 
            fixedOffset = elem[0].getBoundingClientRect().left;
        }, 5);      
      }
      
      function scrollCheck() {
        if (elem.css('position') == 'absolute') {
          if (attrs.stay == 'left') {
            elem.css('position', 'fixed');
            elem.css('top', (fixedOffset - scTop) + 'px');
            elem.css('left', '0px');
          }
          else if (attrs.stay == 'top') {
            elem.css('position', 'fixed');
            elem.css('left', (fixedOffset - scLeft) + 'px');
            elem.css('top', '0px');
          }
        }
      }
      
      var scrollHandler = function() {
        
        if (scrollTimeout) {
          $timeout.cancel(scrollTimeout);
          scrollTimeout = null;
        }
      
        scLeft = this.pageXOffset;
        if (scLeft != oldScLeft) {
          if (attrs.stay == 'left') {
            if (elem.css('position') == 'absolute') {
              elem.css('position', 'fixed');
              elem.css('top', (fixedOffset - scTop) + 'px');
              elem.css('left', '0px');
            }
            if (attrs.stayTrack)
              scope.$eval(attrs.stayTrack + '(' + scLeft + ')');
          }
          else if (attrs.stay == 'top') {
            if (elem.css('position') == 'fixed') {
              elem.css('position', 'absolute');
              elem.css('left', fixedOffset + 'px');
              elem.css('top', scTop + 'px');
            }
          }
          oldScLeft = scLeft;
        }
        
        scTop = this.pageYOffset;
        if (scTop != oldScTop) {
          if (attrs.stay == 'left') {
            if (elem.css('position') == 'fixed') {
              elem.css('position', 'absolute');
              elem.css('top', fixedOffset + 'px');
              elem.css('left', scLeft + 'px');
            }
          }
          else if (attrs.stay == 'top') {
            if (elem.css('position') == 'absolute') {
              elem.css('position', 'fixed');
              elem.css('left', (fixedOffset - scLeft) + 'px');
              elem.css('top', '0px');
            }
            if (attrs.stayTrack)
              scope.$eval(attrs.stayTrack + '(' + scTop + ')');            
          }
          oldScTop = scTop;
        }
        
        if (attrs.stayRevertToFixed)
          scrollTimeout = $timeout(scrollCheck, parseInt(attrs.stayRevertToFixed));
      };

      angular.element($window).bind('scroll', scrollHandler);
      
      elem.on('$destroy', function() {
        $timeout.cancel(scrollCheck);
      });
      
      scope.$on('$destroy', function() {
        angular.element($window).unbind('scroll', scrollHandler);
      });
    }
  };
}]);