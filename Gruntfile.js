/**
 * UProxy Grunt Build System
 * Support commands:
 * grunt
 *  build - Builds Chrome and Firefox extensions
 *  setup - Installs local dependencies and sets up environment
 *  test - Run unit tests
 *  watch - Watch for changes in 'common' and copy as necessary
 *  clean - Cleans up
 *  build_chrome - build Chrome files
 *  build_firefox - build Firefox
 *  everything - 'setup', 'test', then 'build'
 **/

var path = require("path");
var minimatch = require("minimatch");

//List of all files for each distribution
//NOTE: This is ultimately what gets copied, so keep this precise
//NOTE: Keep all exclusion paths ('!' prefix) at the end of the array
var chrome_files = [
  'common/**',
  '!common/freedom/node_modules/**',
  '!common/freedom/demo/**'
];
var firefox_files = [
  'common/**',
  '!common/freedom/node_modules/**',
  '!common/freedom/demo/**'
];


module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    copy: {
      chrome: {files: [{src: chrome_files, dest: 'chrome/'}]},
      firefox: {files: [{src: firefox_files, dest: 'firefox/'}]}
    },
    watch: {
      common: {//Watch everything
        //TODO this doesn't work as expected on VMsw
        files: ['common/**/*',
                // bower components should only change when grunt is
                // already being run
                '!**/bower_components/**'],
        tasks: ['copy:watch'],
        options: {spawn: false}
      }
    },
    shell: {
      git_submodule: {
        command: ['git submodule init', 'git submodule update'].join(';'),
        options: {stdout: true}
      },
      setup_freedom: {
        command: 'npm install',
        options: {stdout: true, stderr: true, failOnError: true, execOptions: {cwd: 'common/freedom'}}
      },
      freedom: {
        command: 'grunt',
        options: {stdout: true, stderr: true, failOnError: true, execOptions: {cwd: 'common/freedom'}}
      }
    },
    compress: {
      xpi: {
        options: {
          archive: 'firefox-runtime.xpi',
          mode: 'zip'
        },
        files: [{expand:true,  src: '**', cwd: 'firefox'}]
      }
    },
    clean: ['chrome/common/**',
            'firefox/common/**',
            'firefox-runtime.xpi']
  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-shell');

  //On file change, see which distribution it affects and
  //update the copy:watch task to copy only those files
  grunt.event.on('watch', function(action, filepath, target) {
    grunt.log.writeln(target + ': ' + filepath + ' has ' + action);
    var files = [];
    if (minimatchArray(filepath, chrome_files)) {
      grunt.log.writeln(filepath + ' - watch copying to Chrome app');
      files.push({src: filepath, dest: 'chrome/'});
    }
    if (minimatchArray(filepath, firefox_files)) {
      grunt.log.writeln(filepath + ' - watch copying to Firefox');
      files.push({src: filepath, dest: 'firefox/'});
    }
    grunt.config(['copy', 'watch', 'files'], files);
    grunt.log.writeln("copy:watch is now: " + JSON.stringify(grunt.config(['copy', 'watch'])));
  });

  grunt.registerTask('setup', [
    'shell:git_submodule',
    'shell:setup_freedom',
    'shell:freedom'
  ]);
  grunt.registerTask('test', [
  ]);
  //Build task
  grunt.registerTask('build_chrome', [
    'copy:chrome'
  ]);
  grunt.registerTask('build_firefox', [
    'copy:firefox'
  ]);
  grunt.registerTask('xpi', [
    'build_firefox',
    'compress:xpi'
  ]);
  grunt.registerTask('build', [
    'build_chrome',
    'build_firefox',
    'test'
  ]);
  grunt.registerTask('everything' ['setup', 'build']);
  // Default task(s).
  grunt.registerTask('default', ['build']);
};


/**
 * UTILITIES
 **/

//minimatchArray will see if 'file' matches the set of patterns
//described by 'arr'
//NOTE: all exclusion strings ("!" prefix) must be at the end
//of the array arr
function minimatchArray(file, arr) {
  var result = false;
  for (var i = 0; i < arr.length; i++) {
    if (arr[i].substr(0, 1) == "!") {
      result &= minimatch(file, arr[i]);
    } else {
      result |= minimatch(file, arr[i]);
    }
  }
  return result;
};
