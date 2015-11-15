/*! mythling-epg v1.2.1
 *  Copyright 2015 Donald Oakes
 *  License: Apache-2.0 */
'use strict';

var preventProgramBindings = true;

document.addEventListener('DOMContentLoaded', function(event) {
  document.getElementById('calendarBtn').focus();
});

var searchForward = function() {
  document.getElementById('searchForwardBtn').click();
};
var searchBackward = function() {
  document.getElementById('searchBackwardBtn').click();
};

document.addEventListener('DOMContentLoaded', function(event) {
  document.getElementById('calendarBtn').focus();
});

var searchClosedOnce = false;
var menuProgElem = null;

document.addEventListener('epgAction', function(event) {
  if (event.detail == 'open.menu') {
    menuProgElem = document.activeElement;
    setTimeout(function() { 
      var menuItem = document.getElementById('menu-details');
      var ulElem = menuItem.parentElement.parentElement; 
      var items = ulElem.querySelectorAll('li > a').length;
      fireTvJsHandler.setMenuItems(items);
      menuItem.focus();
    }, 0);
  }
  else if (event.detail == 'open.search') {
      var searchInput = document.getElementById('searchInput');
      if (searchInput !== null) { // not from preload
        searchInput.value = ''; // prevent remembering previous (causes funny behavior)
        searchInput.addEventListener('change', function(event) {
          var searchFwdBtn = document.getElementById('searchForwardBtn');
          if (searchInput.value !== '') {
            searchFwdBtn.click();
          }
        });
        searchInput.addEventListener('focus', function(event) {
          fireTvJsHandler.setSearchFocus(searchInput.id);
        });
        searchInput.addEventListener('blur', function(event) {
          fireTvJsHandler.setSearchFocus(null);
        });
        var searchCloseBtn = document.getElementById('searchCloseBtn');
        searchCloseBtn.addEventListener('focus', function(event) {
          fireTvJsHandler.setSearchFocus(searchCloseBtn.id);
        });
        searchCloseBtn.addEventListener('blur', function(event) {
          fireTvJsHandler.setSearchFocus(null);
        });
        var searchForwardBtn = document.getElementById('searchForwardBtn');
        searchForwardBtn.addEventListener('focus', function(event) {
          fireTvJsHandler.setSearchFocus(searchForwardBtn.id);
        });
        searchForwardBtn.addEventListener('blur', function(event) {
          fireTvJsHandler.setSearchFocus(null);
        });
        var searchBackwardBtn = document.getElementById('searchBackwardBtn');
        searchBackwardBtn.addEventListener('focus', function(event) {
          fireTvJsHandler.setSearchFocus(searchBackwardBtn.id);
        });
        searchBackwardBtn.addEventListener('blur', function(event) {
          fireTvJsHandler.setSearchFocus(null);
        });
      }
  }
  else if (event.detail == 'close.menu') {
    if (menuProgElem) {
      document.getElementById(menuProgElem.id).focus();
    }
  }
  else if (event.detail == 'close.calendar') {
    setTimeout(function() { 
      document.getElementById('calendarBtn').focus();
    }, 0);
  }
  else if (event.detail == 'close.search') {
    if (searchClosedOnce) { // not initial preload
      if (!document.activeElement || !document.activeElement.id || document.activeElement.id.startsWith('search'))
        document.getElementById('searchBtn').focus();
      fireTvJsHandler.setSearchFocus(null);
    }
    searchClosedOnce = true;
  }
});

var offset = 0;

function getOffset(progElem) {
  if (!progElem || !progElem.parentElement)
    return 0;
  return parseInt(progElem.dataset.offset);
}

function getWidth(progElem) {
  var w = progElem.parentElement.style.width;
  return parseInt(w.substring(0, w.length - 2));
}

function getSiblingElementBySeq(progElem, seq) {
  var chanRowElem = progElem.parentElement.parentElement.parentElement; 
  return chanRowElem.querySelector('div[data-seq="' + seq + '"]');
}

function getChanProgElementForOffset(chanIdx, offset) {
  if (epgDebug) {
    console.log('offset: ' + offset);
    console.log('querySel: ' + 'div[data-seq="ch' + chanIdx + 'pr1"]');
  }
  var firstProgElem = document.querySelector('div[data-seq="ch' + chanIdx + 'pr1"]');
  if (epgDebug)
    console.log('firstProgElem: ' + firstProgElem);
  if (!firstProgElem)
    return null;
  if (epgDebug)
    console.log('firstProgElem.id: ' + firstProgElem.id);
  var chanRowElem = firstProgElem.parentElement.parentElement.parentElement;
  var chanProgElems = chanRowElem.querySelectorAll('div[data-seq]');
  var progElem = null;
  for (var i = 0; i < chanProgElems.length; i++) {
    progElem = chanProgElems[i];
    var w = getWidth(progElem);
    var progOffset = getOffset(progElem);
    if (epgDebug)
      console.log('progOffset: ' + progOffset);
    if (progOffset >= offset)
      break;
    var progEndOffset = getOffset(progElem) + getWidth(progElem);
    if (epgDebug)
      console.log('progEndOffset: ' + progEndOffset);
    if (progEndOffset >= (offset + 83)) // ~10 minutes overlap
      break;
  }
  return progElem;
}

var focused = null;

function webViewKey(key) {
  if (epgDebug)
    console.log('webViewKey(): ' + key);
  
  var foc = document.activeElement;
  if (foc && foc.id) {
    
    if (foc.id == 'calendarBtn') {
      if (key == 'right')
        focused = document.getElementById('searchBtn');
      else if (key == 'down') {
        focused = document.querySelector('div[data-seq="ch1pr1"]');
        offset = getOffset(focused);
      }
    }
    else if (foc.id == 'searchBtn') {
      if (key == 'left')
        focused = document.getElementById('calendarBtn');
      else if (key == 'right' || key == 'down') {
        focused = document.querySelector('div[data-seq="ch1pr1"]');
        offset = getOffset(focused);
      }
    }
    else if (foc.id && foc.id.startsWith('ch')) {
      if ((foc.dataset.seq == 'ch1pr1' && key == 'left') ||
            (foc.dataset.seq.startsWith('ch1pr') && key == 'up')) {
          focused = document.getElementById('searchBtn');
      }
      else {
        var seq = foc.dataset.seq;
        if (seq) {
          var prIdx = seq.indexOf('pr');
          if (prIdx > 0) {
            var focChan = parseInt(seq.substring(2, prIdx));
            var focProg = parseInt(seq.substring(prIdx + 2));
            if ('right' == key) {
              focused = getSiblingElementBySeq(foc, 'ch' + focChan + 'pr' + (focProg + 1));
              offset = getOffset(focused);
            }
            else if ('left' == key) {
              focused = getSiblingElementBySeq(foc, 'ch' + focChan + 'pr' + (focProg - 1));
              offset = getOffset(focused);
              if (offset === 0)
                document.body.scrollLeft = 0; 
            }
            else if ('up' == key) {
              if (focChan === 0) {
                focused = document.getElementById('searchBtn');
              }
              else {
                focused = getChanProgElementForOffset(focChan - 1, offset);
              }
            }
            else if ('down' == key) {
              focused = getChanProgElementForOffset(focChan + 1, offset);
            }
          }
        }
      }
    }    
  }

  if (focused !== null) {
    focused.focus();
//    if (searchOpen && !focused.id.startsWith('ch') && !focused.id.startsWith('cal'))
//      closePopup();
    if (epgDebug)
      console.log('new focused id: ' + focused.id);
  }
}