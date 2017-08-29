'use strict';

module.exports = function (grunt) {

  // CONFIGURATION
  var globalConfig = {
    devBuild: "builds/dev",
    prodBuild: "builds/prod",
    assetsSrc: "assets/src",
    assetsDist: "assets/dist",
    assetsDestination: "assets"
  };

  require('jit-grunt')(grunt);

  grunt.initConfig({
    // load global config
    globalConfig: globalConfig,

    //////////
    // Watch
    /////////

    watch: {
      all: {
        files: ['app/**/*', '<%= globalConfig.assetsSrc %>/**/*'],
        tasks: ['build:dev'],
        options: {
          interrupt: true,
          interval: 1000
        }
      }
    },

    //////////
    // BASH
    /////////

    exec: {
      jekyllIncremental: {
        command: 'cd app; bundle exec jekyll build --incremental; cd ../',
        stderr: false,
        callback: function (error, stdout, stderr) {
          if (stderr) {
            grunt.warn(stderr)
          }
        }
      },
      jekyllFresh: {
        command: 'cd app; bundle exec jekyll build; cd ../',
        stderr: false,
        callback: function (error, stdout, stderr) {
          if (stderr) {
            grunt.warn(stderr)
          }
        }
      },
      cleanBuilds: {
        command: 'rm -rf builds/dev/*; rm -rf builds/prod/*',
        stderr: false,
        callback: function (error, stdout, stderr) {
          if (stderr) {
            grunt.warn(stderr)
          }
        }
      },
      cleanAssets: {
        command: 'cd <%= globalConfig.assetsDist %>; rm -rf *; cd ../',
        stderr: false,
        callback: function (error, stdout, stderr) {
          if (stderr) {
            grunt.warn(stderr)
          }
        }
      }
    },

    //////////
    // HTML
    /////////

    htmlmin: {
      prod: {
        options: {
          removeComments: true,
          collapseWhitespace: true,
          conservativeCollapse: true,
          removeEmptyAttributes: true,
          customAttrCollapse: /(srcset)|(sizes)/,
          includeAutoGeneratedTags: false
        },
        files: [{
          expand: true,
          cwd: '<%= globalConfig.devBuild %>',
          src: '**/*.html',
          dest: '<%= globalConfig.prodBuild %>/'
        }]
      }
    },

    //////////
    // CSS
    //////////

    // sass (libsass) config
    sass: {
      main: {
        options: {
          style: "expanded"
        },
        files: [{
          src: '<%= globalConfig.assetsSrc %>/scss/main.scss',
          dest: '<%= globalConfig.assetsDist %>/expanded/css/main.css'
        },{
          src: '<%= globalConfig.assetsSrc %>/scss/blog.scss',
          dest: '<%= globalConfig.assetsDist %>/expanded/css/blog.css'
        }]
      }
    },

    // purify css
    purifycss: {
      options: {},
      target: {
        src: ['<%= globalConfig.devBuild %>/**/*.html', '<%= globalConfig.assetsSrc %>/**/*.js'],
        css: ['<%= globalConfig.assetsDist %>/compressed/css/main.css'],
        dest: '<%= globalConfig.assetsDist %>/compressed/css/main.css'
      }
    },

    // minify css
    cssmin: {
      target: {
        files: [{
          src: '<%= globalConfig.assetsDist %>/compressed/css/main.css',
          dest: '<%= globalConfig.assetsDist %>/compressed/css/main.css',
        },{
          src: '<%= globalConfig.assetsDist %>/compressed/blog/main.css',
          dest: '<%= globalConfig.assetsDist %>/compressed/blog/main.css',
        }]
      }
    },


    //////////
    // Other Files to Move Around
    //////////

    copy: {
      // assets in src that are not otherwise processed, to dist/expanded
      fonts: {
        expand: true,
        nonull: true,
        cwd: '<%= globalConfig.assetsSrc %>/fonts',
        src: '*',
        dest: '<%= globalConfig.assetsDist %>/expanded/fonts/'
      },
      images: {
        expand: true,
        nonull: true,
        cwd: '<%= globalConfig.assetsSrc %>/images',
        src: '*',
        dest: '<%= globalConfig.assetsDist %>/expanded/images/'
      },
      javascripts: {
        expand: true,
        nonull: true,
        cwd: '<%= globalConfig.assetsSrc %>/javascripts',
        src: '*',
        dest: '<%= globalConfig.assetsDist %>/expanded/javascripts/'
      },
      thumbs: {
        expand: true,
        nonull: true,
        cwd: '<%= globalConfig.assetsSrc %>/thumbs',
        src: '**/*',
        dest: '<%= globalConfig.assetsDist %>/expanded/thumbs/'
      },
      // prepared assets from dist/expanded to dist/compressed, prior to compression
      expandedToCompressed: {
        expand: true,
        nonull: true,
        cwd: '<%= globalConfig.assetsDist %>/expanded',
        src: '**/*',
        dest: '<%= globalConfig.assetsDist %>/compressed/'
      },
      // prepared assets to dev build
      toDevBuild: {
        expand: true,
        nonull: true,
        cwd: '<%= globalConfig.assetsDist %>/expanded',
        src: '**/*',
        dest: '<%= globalConfig.devBuild %>/<%= globalConfig.assetsDestination %>/'
      },
      // prepared assets to prod build
      toProdBuild: {
        expand: true,
        nonull: true,
        cwd: '<%= globalConfig.assetsDist %>/compressed',
        src: '**/*',
        dest: '<%= globalConfig.prodBuild %>/<%= globalConfig.assetsDestination %>/'
      },
      // components of the jekyll-built site that are NOT transferred via htmlmin
      api: {
        expand: true,
        nonull: true,
        cwd: '<%= globalConfig.devBuild %>/api',
        src: '**/*',
        dest: '<%= globalConfig.prodBuild %>/api/'
      },
      feeds: {
        expand: true,
        nonull: true,
        cwd: '<%= globalConfig.devBuild %>/blog/feed',
        src: '**/*',
        dest: '<%= globalConfig.prodBuild %>/blog/feed/'
      },
      extras: {
        expand: true,
        nonull: true,
        cwd: '<%= globalConfig.devBuild %>',
        src: ['.htaccess', 'robots.txt', 'sitemap.xml'],
        dest: '<%= globalConfig.prodBuild %>/'
      }
    },

    //////////
    // Validation, etc.
    //////////

    // html validation
    htmllint: {
      dev: ["<%= globalConfig.devBuild %>/**/*.html"],
      prod: ["<%= globalConfig.prodBuild %>/**/*.html"]
    },

    // broken links
    linkChecker: {
      options: {
        initialProtocol: "http",
        ignoreInvalidSSL: true,
        maxConcurrency: 20,
        callback: function (crawler) {
          crawler.addFetchCondition(function(parsedURL) {
            // mailto links are obfuscated and confuse the crawler, exclude them
            return !parsedURL.path.match(/&$/i);
          });
          crawler.addFetchCondition(function(parsedURL) {
            // don't check the assets folder, causes error and doesn't make sense
            return !parsedURL.path.match(/assets/i);
          });
        }
      },
      dev: {
        site: '<%= globalConfig.linkCheckerURL %>',
      }
    }

  });

  ///////////////////////
  // Private grunt tasks. Don't call directly from the command line.

  // Hack to stop contrib concat (and maybe other things) from failing silently
  // https://github.com/gruntjs/grunt-contrib-concat/issues/17
  grunt.registerTask('warn-fail', 'Fail on warning log', function() {
    var log = grunt.log;
    var _warn = log.warn;
    log.warn = function() {
      _warn.apply(log, arguments);
      grunt.fail.warn("Warning log has triggered failure");
    };
  });

  grunt.registerTask('assets:expanded', [
    'warn-fail',
    'sass',
    'newer:copy:fonts',
    'newer:copy:images',
    'newer:copy:javascripts',
    'newer:copy:thumbs',
    'newer:copy:toDevBuild'
  ]);

  // Don't run this before building the site with jekyll;
  // if you do, purify css will remove virtually all styles :-)
  grunt.registerTask('assets:compressed', [
    'warn-fail',
    'copy:expandedToCompressed',
    'purifycss',
    'cssmin',
    'copy:toProdBuild'
  ]);

  /////////////////////
  // Public grunt tasks
  grunt.registerTask('build:dev', [
    'warn-fail',
    'exec:jekyllIncremental',
    'assets:expanded'
  ]);

  grunt.registerTask('build:prod', [
    'warn-fail',
    'exec:cleanBuilds',
    'exec:jekyllFresh',
    'exec:cleanAssets',
    'assets:expanded',
    'assets:compressed',
    'htmlmin',
    'copy:api',
    'copy:feeds',
    'copy:extras'
  ]);

  grunt.registerTask('build:noclean', [
    'warn-fail',
    'exec:jekyllFresh',
    'assets:expanded',
    'assets:compressed',
    'htmlmin',
    'copy:api',
    'copy:feeds',
    'copy:extras'
  ]);

  // Register the default task
  grunt.registerTask('default', ['build:dev', 'watch']);

};