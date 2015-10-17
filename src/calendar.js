'use strict';

var epgCalendar = angular.module('epgCalendar', []);

epgCalendar.controller('EpgCalController', ['$scope', '$timeout', function($scope, $timeout) {
  
  $scope.minDate = new Date($scope.guideData.zeroTime);
  $scope.maxDate = new Date($scope.minDate.getTime() + 1209600000); // two weeks
  
  $scope.openCalendar = function($event) {
    $event.preventDefault();
    $event.stopPropagation();
    if ($scope.calendarOpened)
      $scope.calendarOpened = false;
    else
      $scope.calendarOpened = true;
    
    if ($scope.popElem !== null) {
      $timeout(function() {
        $scope.popHide();
      }, 0);
    }
  };
  
  $scope.$watch('calendarOpened', function(isOpened) {
    $scope.fireEpgAction(isOpened ? 'open.calendar' : 'close.calendar');
  });  
  
  $scope.currentDate = function(newValue) {
    if (newValue) {
      var newTime = new Date(newValue);
      newTime.setMinutes(newTime.getMinutes() < 30 ? 0 : 30);
      newTime.setSeconds(0);
      newTime.setMilliseconds(0);
      var startTime = new Date(newTime);
      startTime.setHours(0);
      startTime.setMinutes(0);
      $scope.guideData.setStartTime(startTime);
      $scope.guideData.nextPage(null, newTime);
    }
    return $scope.guideData.curDate;
  };

}]);
