'use strict';

var epgSearch = angular.module('epgSearch', []);

epgSearch.controller('EpgSearchController', ['$scope', '$timeout', 'search', function($scope, $timeout, search) {

  $scope.filterVal = "";
  
  $scope.searchOpened = false;
  $scope.searchClick = function($event) {
    $scope.searchOpened = !$scope.searchOpened;
  };
  
  $scope.searchForward = function() {
    $scope.resultsSummary = null;
    search.forward($scope.filterVal, $scope.guideData.curDate, $scope.showResult, $scope.guideData.mythlingServices);
  };
  
  $scope.searchBackward = function() {
    $scope.resultsSummary = null;
    search.backward($scope.filterVal, $scope.guideData.curDate, $scope.showResult, $scope.guideData.mythlingServices);
  };
  
  $scope.showResult = function(results) {
    $scope.resultsSummary = (results.index + 1) + ' / ' + results.programs.length;
    if (results.programs.length > 0) {
      var program = results.programs[results.index];
      var startTime = new Date(program.start);
      startTime.setMinutes(0);
      $scope.guideData.setStartTime(startTime);
      $scope.guideData.nextPage(program.id);
    }
  };
  
  $scope.isSearching = function() {
    return search.isBusy();
  };
  
  $scope.closeSearch = function() {
    $timeout(function() {
      $scope.fireEpgAction('search');
      document.getElementById('searchBtn').click();
    }, 5);
  };

  $scope.searchFilter = function(newValue) {
    if (newValue || newValue === '') {
      $scope.filterVal = newValue;
    }
    else {
      if (!$scope.guideData.isMyth28 && !$scope.guideData.mythlingServices)
        return 'Requires MythTV 0.28 or Mythling Services';
      else if ($scope.guideData.demoMode)
        return 'Search not available in demo';
    }
    return $scope.filterVal;
  };
}]);

epgSearch.factory('search', ['$http', '$q', function($http, $q) {
  
  var busy = false;
  var encodedFilter;
  var results = {
    index: -1,
    programs: [],
    addPrograms: function(progs) {
      for (var i = 0; i < progs.length; i++) {
        var prog = progs[i];
        if (!this.hasProgram(prog)) {
          prog.start = new Date(prog.StartTime);
          prog.id = 'ch' + prog.Channel.ChanId + 'pr' + prog.StartTime;
          this.programs.push(prog);
        }
      }
    },
    hasProgram: function(prog) {
      for (var i = 0; i < this.programs.length; i++) {
        var program = this.programs[i];
        if (program.StartTime == prog.StartTime && program.Channel.ChanId == prog.Channel.ChanId)
          return true;
      }
      return false;
    }
  };
  
  function doSearch(filter, curDate, callback, mythlingServices) {
    busy = true;
    results.index = -1;
    results.programs = [];
    encodedFilter = filter;

    var startTime = new Date();
    var baseUrl = mythlingServices ? '/mythling/media.php?type=guide&' : '/Guide/GetProgramList?';
    baseUrl += 'StartTime=' + startTime.toISOString();
    console.log('search base url: ' + baseUrl);
    
    var searches;
    if (mythlingServices) {
      searches = {
        mythlingSearch: $http.get(baseUrl + '&listingsSearch=' + encodedFilter),
      };
    }
    else {
      searches = {
        // title search redundant with keyword search
        // titleSearch: $http.get(baseUrl + '&TitleFilter=' + encodedFilter),
        personSearch: $http.get(baseUrl + '&PersonFilter=' + encodedFilter),
        keywordSearch: $http.get(baseUrl + '&KeywordFilter=' + encodedFilter)
      };
    }
    
    $q.all(searches).then(function(res) {

      busy = false;

      if (mythlingServices) {
        results.addPrograms(res.mythlingSearch.data.ProgramList.Programs);
      }
      else {
        results.addPrograms(res.personSearch.data.ProgramList.Programs);
        results.addPrograms(res.keywordSearch.data.ProgramList.Programs);
      }
      
      // initialize the index
      if (results.programs.length > 0) {
        results.index = 0;
        var prog = results.programs[results.index];
        var compareCurDate = new Date(curDate.getTime());
        compareCurDate.setMinutes(0);
        compareCurDate.setSeconds(0);
        compareCurDate.setMilliseconds(0);
        while (prog.start.getTime() < compareCurDate.getTime()) {
          results.index++;
          prog = results.programs[results.index];
        }
      }
      callback(results);
    });
  }
  
  return {
    forward: function(filter, curDate, callback, mythlingServices) {
      if (!filter || filter === '')
        return;
      var newFilter = encodeURIComponent(filter);
      if (newFilter != encodedFilter) {
        doSearch(newFilter, curDate, callback, mythlingServices);
      }
      if (results.programs.length > 0) {
        results.index++;
        if (results.index == results.programs.length)
          results.index = 0;
        callback(results);
      }
    },
    backward: function(filter, curDate, callback, mythlingServices) {
      if (!filter || filter === '')
        return;
      var newFilter = encodeURIComponent(filter);
      if (newFilter != encodedFilter) {
        doSearch(newFilter, curDate, callback, mythlingServices);
      }
      if (results.programs.length > 0) {
        results.index--;
        if (results.index == -1)
          results.index = results.programs.length - 1;
        callback(results);
      }
    },
    isBusy: function() {
      return busy;
    },
    getResults: function() {
      return results;
    } 
  };
}]);

epgSearch.directive('searchPreRender', ['$timeout', function($timeout) {
  return {
    restrict: 'A',
    link: function link(scope, elem, attrs) {
      $timeout(function() {
        elem[0].click();
        elem[0].click();
      }, 5);  
    }
  };
}]);
