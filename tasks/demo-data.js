'use strict';

var request = require('request');
var fs = require('fs');

module.exports = function(grunt) {

  grunt.registerMultiTask('demo-data', 'Grab JSON responses for Mythling EPG demo mode.', function() {
    if (this.files.length != 1 || !this.files[0].dest)
      grunt.fail.warn('Expects a single destination directory.');
    
    var destDir = this.files[0].dest;

    if (!this.data.baseUrl)
      grunt.fail.warn('Missing baseUrl.');
    
    var done = this.async();
    
    var baseUrl = this.data.baseUrl;
    var user = this.data.user ? this.data.user : null;
    var password = this.data.password ? this.data.password : null;
    var startTime = this.data.startDate ? this.data.startDate : new Date();
    var interval = this.data.guideInterval ? this.data.guideInterval * 3600000 : 8 * 3600000;
    var requestCount = this.data.requestCount ? this.data.requestCount : 1;
    var mythlingServices = this.data.mythlingServices ? this.data.mythlingServices : false;
    var channelGroupId = this.data.channelGroupId ? this.data.channelGroupId : 0;
    var iconBaseUrl = this.data.iconBaseUrl ? this.data.iconBaseUrl : null;
    var received = 0;
    var icons = {}; // iconFile to iconUrl
    var iconRequestCount = 0;
    var iconReceived = 0;
    
    // always start at midnight
    startTime.setHours(0);
    startTime.setMinutes(0);
    startTime.setSeconds(0);
    startTime.setMilliseconds(0);
    
    function retrieveIcon(iconFile, iconUrl) {
      request({url: iconUrl, encoding: null}, function(iconError, iconResponse, iconBody) {
        if (!iconError && iconResponse.statusCode == 200) {
          grunt.log.writeln('Retrieved Icon: ' + iconUrl);
          grunt.log.writeln('Writing: ' + iconFile);
          fs.writeFile(iconFile, iconBody, iconReceived >= iconRequestCount);
        }
        else {
          var iconMsg = iconUrl + '\n  Icon Request error:';
          if (iconError !== null)
            iconMsg += ' ' + iconError;
          if (iconResponse)
            iconMsg += ' (' + iconResponse.statusCode + ')';
          grunt.fail.warn(iconMsg);
        }
        iconReceived++;
        if (iconReceived >= iconRequestCount)
          done();
      });
    }
    
    function retrieve(startTime) {
      var endTime = new Date(startTime.getTime() + interval);
      var start = startTime.toISOString();
      var end = endTime.toISOString();
      var url = baseUrl;
      if (mythlingServices)
        url += '/mythling/media.php?type=guide&';
      else
        url += '/Guide/GetProgramGuide?';
      var path = 'StartTime=' + start + '&EndTime=' + end;
      if (channelGroupId > 0)
        path += "&ChannelGroupId=" + channelGroupId;
      url += path;
      
      var options = { url: url};
      if (user != null) {
        options.auth = {
          user: user,
          password: password,
          sendImmediately: false
        };
      }
      
      request(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
          grunt.log.writeln('Retrieved: ' + url);
          if (iconBaseUrl != null && received == 0) {
            var programGuide = JSON.parse(body).ProgramGuide;
            iconRequestCount = programGuide.Channels.length;
            for (var i = 0; i < programGuide.Channels.length; i++) {
              var channel = programGuide.Channels[i];
              var iconFile = destDir + '/icons/' + channel.ChanId + '.png';
              icons[iconFile] = iconBaseUrl + channel.IconURL;
              iconRequestCount++;
            }
          }
          
          var filepath = destDir + '/' + path.replace(/:/g, '-') + '.json';
          grunt.log.writeln('Writing: ' + filepath);
          grunt.file.write(filepath, body);
        }
        else {
          var msg = url + '\n  Request error:';
          if (error !== null)
            msg += ' ' + error;
          if (response)
            msg += ' (' + response.statusCode + ')';
          grunt.fail.warn(msg);
        }
        received++;
        if (received >= requestCount) {
          // icons after last request
          for (var property in icons) {
            if (icons.hasOwnProperty(property)) {
                retrieveIcon(property, icons[property]);
            }
          }
        }
      });
    }

    // guide data
    for (var i = 0; i < requestCount; i++) {
      retrieve(startTime);
      startTime.setTime(startTime.getTime() + interval);
    }
    
  });

};