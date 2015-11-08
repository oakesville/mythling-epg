'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: ';\n'
      },
      distEpg: {
        src: ['src/epg.js', 'src/ng-stay.js', 'src/calendar.js', 'src/search.js'],
        dest: 'dist/js/<%= pkg.name %>.js'
      },
      distEpgOmb: {
        src: ['src/epg.js', 'src/stay-omb.js', 'src/calendar.js', 'src/search.js'],
        dest: 'dist/js/<%= pkg.name %>-omb.js'
      }
    },
    uglify: {
      options: {
        preserveComments: 'some'
      },
      dist: {
        files: {
          'dist/js/<%= pkg.name %>.min.js': ['<%= concat.distEpg.dest %>'],
          'dist/js/<%= pkg.name %>-omb.min.js': ['<%= concat.distEpgOmb.dest %>'],
          'dist/js/ng-infinite-scroll-h-fix.min.js': ['js/ng-infinite-scroll-h-fix.js']
        }
      }
    },
    jshint: {
      files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
      options: {
        // options here to override JSHint defaults
        globalstrict: true,
        globals: {
          console: false,
          module: false,
          document: false,
          window: false,
          CustomEvent: false,
          angular: false,
          jsHandler: false,
          setPosition: true,
          setTimeout: true,
          // TODO: maybe can remove these globals?
          epgDebug: true,
          menuOpen: true,
          menuProgId: true,
          detailsOpen: true,
          setPopup: true,
          popHide: true
        }
      }
    },
    'string-replace': {
      dist: {
        files: {
          'dist/guide.html': ['guide.html'],
          'dist/guide-omb.html': ['guide-omb.html']
        },
        options: {
          replacements: [{
            pattern: /<script src="src\/ng-stay.js"[^]*<\/script>/m,
            replacement: '<script src="js/<%= pkg.name%>.js"></script>'
          }, {
            pattern: /<script src="src\/stay-omb.js"[^]*<\/script>/m,
            replacement: '<script src="js/<%= pkg.name%>-omb.js"></script>'
          }, {
            pattern: /<script src="js\/(.*).js".*<\/script>/,
            replacement: '<script src="js/$1.min.js"></script>'
          }, {
            pattern: /<script src="bower_components\/(.*).js".*<\/script>/g,
            replacement: '<script src="js/$1.min.js"></script>'
          }]
        }
      }
    },
    copy: {
      dist: {
        files: [{
          expand: true,
          src: [ 'css/**/*', 'images/**/*', 'views/**/*', 'js/**/*' ],
          dest: 'dist'
        }, {
          expand: true,
          cwd: 'bower_components',
          src: [ '**/*.min.js', '!angular-bootstrap/ui-bootstrap.min.js' ],
          dest: 'dist/js'
        }, {
          expand: true,
          cwd: 'src',
          src: [ 'epg-device.js', 'epg-firetv.js' ],
          dest: 'dist/js'
        }]
      },
      'push-gh-pages': {
        files: [{
          expand: true,
          cwd: 'dist',
          src: [ '**/*' ],
          dest: 'c:/git/mythling-gh-pages/epg/'
        }]
      },
      'push-mythling': {
        files: [{
          expand: true,
          cwd: 'dist',
          src: [ '**/*', '!**/demo/**', '!js/mythling-epg.min.js', '!mythling-epg-omb.min.js' ],
          dest: 'c:/git/mythling/assets/mythling-epg/'
        }]
      }
    },
    compress: {
      dist: {
        options: {
          mode: 'zip',
          archive: 'c:/git/mythling-gh-pages/epg/dist/<%= pkg.name %>-<%= pkg.version %>.zip'
        },
        expand: true,
        cwd: 'dist/',
        src: [ '**/*', '!**/demo/**' ]
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    },
    'demo-data': { // grunt demo-data --mythling-password=<pw>
      dist: {
        baseUrl: 'http://192.168.0.69',
        iconBaseUrl: 'http://192.168.0.69:6544',
        user: 'mythling',
        password: '<%= grunt.option("mythling-password") %>',
        startDate: new Date(),
        guideInterval: 24,
        requestCount: 14,  // 2 weeks at 24 hours per
        mythlingServices: true,
        dest: 'dist/demo/guide-data'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-string-replace');
  grunt.loadTasks('tasks');
  
  grunt.registerTask('test', ['jshint']);

  grunt.registerTask('default', ['jshint', 'concat', 'uglify', 'string-replace', 'copy:dist']);
  
  grunt.registerTask('push', ['copy:push-gh-pages', 'copy:push-mythling', 'compress']);
  
};