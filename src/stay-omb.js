'use strict';

//in case js string does not supply startsWith() and endsWith()
if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function(prefix) {
    return this.indexOf(prefix) === 0;
  };
}
if (typeof String.prototype.endsWith !== 'function') {
  String.prototype.endsWith = function(suffix) {
      return this.indexOf(suffix, this.length - suffix.length) !== -1;
  };
}

function parseCssDim(dim) {
  if (dim.endsWith('px'))
    dim = dim.substring(0, dim.lastIndexOf('px'));
  return parseInt(dim);
}

// for old mobile browsers
var stayOmbMod = angular.module('stay', []);

//layout parameters
var labelWidth = 105; 
var headerHeight = 50;
for (var i = 0; i < document.styleSheets.length; i++) {
  var sheet = document.styleSheets[i];
  if (sheet.href !== null && sheet.href.endsWith('mythling.css'))  { // allows override (my-mythling.css)
    for (var j = 0; j < sheet.cssRules.length; j++) {
      var rule = sheet.cssRules[j];
      if (rule.selectorText === '.header-height')
        headerHeight = parseCssDim(rule.style.height);
      else if (rule.selectorText === '.label-width')
        labelWidth = parseCssDim(rule.style.width);
    }
  }
}

var timeslotRowA, channelColA, timeslotRowF, channelColF;

var sl,oldSl = 0;
var st,oldSt = 0;

document.addEventListener('DOMContentLoaded', function(event) { 
  timeslotRowA = document.getElementById('timeslot-row-a');
  channelColA = document.getElementById('channel-column-a');
  timeslotRowF = document.getElementById('timeslot-row-f');
  channelColF = document.getElementById('channel-column-f');
});

function scrollHandler() {
  sl = window.pageXOffset;
  if (sl != oldSl) {
    timeslotRowF.style.visibility = 'hidden';
    timeslotRowA.style.visibility = 'visible';
    channelColA.style.visibility = 'hidden';
    channelColF.style.visibility = 'visible';
    
    timeslotRowF.style.left = (labelWidth - sl) + 'px';
    channelColA.style.left = sl + 'px';
    
    oldSl = sl;
    setPosition(sl);
  }

  st = window.pageYOffset;
  if (st != oldSt) {
    channelColF.style.visibility = 'hidden';
    channelColA.style.visibility = 'visible';
    timeslotRowA.style.visibility = 'hidden';
    timeslotRowF.style.visibility = 'visible';
    
    channelColF.style.top = (headerHeight - st) + 'px';
    
    timeslotRowA.style.top = st + 'px';
    
    oldSt = st;
  }
}

window.onscroll = function() {
  scrollHandler();
};