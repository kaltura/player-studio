/*global module:false*/
module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        meta: {
            banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
                '* https://github.com/kaltura/player-studio\n' +
                '* Copyright (c) <%= grunt.template.today("yyyy") %> ' +
                'Kaltura */\n'
        },
        jshint: {
            options: {
                "curly": false,
                "eqnull": false,
                "eqeqeq": false,
                "undef": false,
                '-W069': true,
                '-W061': true,
                '-W097': true,
                '-W093': true,
                '-W064': true,
                '-W083': true,
	            "smarttabs": true,
                "globals": {
                    "jQuery": true,
                    "cl": true,
                    "angular": true,
                    "$": true,
                    "kWidget": true,
                    "window": true,
                    "logTime": true,
                    "console": true,
                    "document": true,
                    "setTimeout": true,
                    "Spinner": true
                }
            },
            dev: ['app/js/**/*.js']
        },
        ngmin: {
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: 'app/js',
                        src: ['**/*.js'],
                        dest: '_dist/app/'
                    }
                ]
            }
        },
        concat: {
            options: {
                banner: '<%= meta.banner %>',
                stripBanners: true
            },
            dist: {
                src: [
                    '_dist/app/*.js',
                    '_dist/app/controllers/*.js',
                    '_dist/app/services/*.js'
                ],
                dest: '_dist/main.js'
            },
            libs: {
                src: [
                    'app/lib/malihu_custon_scrollbar/jquery.mousewheel.min.js',
                    'app/lib/malihu_custon_scrollbar/jquery.mCustomScrollbar.js',
                    'app/lib/angular-ui-bootstrap/ui-bootstrap-tpls-0.10.0.js',
                    'app/lib/localStorage/angular-local-storage.min.js',
                    'app/lib/sprintf.js',
                    'app/lib/spin.min.js',
	                'app/lib/spectrum.js',
                    'app/lib/jquery.timeago.js',
                    'app/ib/jquery.animate-colors-min.js',
                    'app/bower_components/jquery-ui/ui/minified/jquery.ui.core.min.js',
                    'app/bower_components/jquery-ui/ui/minified/jquery.ui.widget.min.js',
                    'app/bower_components/jquery-ui/ui/minified/jquery.ui.mouse.min.js',
                    'app/bower_components/jquery-ui/ui/minified/jquery.ui.sortable.min.js',
                    'app/bower_components/select2/select2.min.js',
                    'app/bower_components/angular-translate/angular-translate.js',
                    'app/bower_components/angular-translate-loader-static-files/angular-translate-loader-static-files.js',
                    'app/bower_components/angular-translate-handler-log/angular-translate-handler-log.js',
                    'app/bower_components/angular-route/angular-route.min.js',
                    'app/bower_components/angular-sanitize/angular-sanitize.min.js',
                    'app/bower_components/angular-animate/angular-animate.min.js',
                   ' app/bower_components/angular-ui-sortable/sortable.min.js',
                    'app/bower_components/angular-ui-select2/src/select2.min.js'
                ],
                dest: '_dist/lib/libs.js'
            },
            vendorModern: {
                src: [
                    'app/lib/modernizer.min.js',
                    'app/bower_components/jquery/jquery.min.js',
                    'app/bower_components/angular/angular.min.js',
	                'app/lib/jquery.xdomainrequest.min.js',
                    'app/lib/angular-spectrum-colorpicker.min.js',
                    'app/lib/jquery.alphanum.js',
                    'app/lib/json-edit/directives.js'
                ],
                dest: '_dist/vendor/vendor.min.js'
            },
            vendorOld: {
                src: [
                    'app/lib/modernizer.min.js',
                    'app/lib/html5shiv.js',
                    'app/lib/respond.min.js',
                    'app/lib/es5-shim.min.js',
                    'bower_components/selectivizr/selectivizr.js',
                    'app/lib/jquery-1.10.2.min.js',
                    'app/lib/jquery.xdomainrequest.min.js',
                    'app/bower_components/angular/angular.min.js',
	                'app/lib/angular-spectrum-colorpicker.min.js',
	                'app/lib/jquery.alphanum.js'
                ],
                dest: '_dist/vendor/vendorOld.min.js'
            }
        },
        uglify: {
            dist: {
                files: {
                    '_dist/main.min.js': '_dist/main.js',
                    '_dist/lib/libs.min.js': '_dist/lib/libs.js'
                }
            },
            libs:{
                files:{
                    'app/bower_components/angular-ui-select2/src/select2.min.js':'app/bower_components/angular-ui-select2/src/select2.js',
                    'app/bower_components/angular-ui-sortable/sortable.min.js':'app/bower_components/angular-ui-sortable/sortable.js'
                }

            }
        },
        cssmin: {
            combine: {
                files: {
                    //  '_dist/css/studio.css': ['app/css/app.css', 'app/css/edit.css', 'app/css/new.css', 'app/css/list.css', 'app/css/icons.css'],
                    '_dist/css/vendor.css': ['app/bower_components/bootstrap/dist/css/bootstrap.min.css', 'app/bower_components/select2/select2.css', 'app/css/spectrum.css', 'app/css/json-edit.css', 'app/lib/malihu_custon_scrollbar/jquery.mCustomScrollbar.css']
                }

            }
        },
        watch: {
            options: {
                interrupt: true,
                debounceDelay: 200,
                livereload: true

            },
            less: {
                files: ['app/less/*'],
                tasks: 'less:development'

            },
            html:{
                files: ['app/view/*']
            }
        },
        copy: {
            main: {
                files: [
                    // includes files within path
                    {
                        dot: true,
                        expand: true,
                        cwd: 'app/dist_src',
                        src: '**',
                        dest: '_dist/'
                    },
                    {
                        expand: true,
                        cwd: 'app/bower_components/angular/',
                        src: 'angular.min.js.map',
                        dest: '_dist/vendor/'
                    },
	                {
		                expand: true,
		                cwd: 'app/bower_components/angular-animate/',
		                src: 'angular-animate.min.js.map',
		                dest: '_dist/lib/'
	                },
                    {
                        src: 'app/bower_components/select2/select2x2.png',
                        dest: '_dist/css/select2x2.png'
                    },
	                {
		                src: 'app/bower_components/select2/select2.png',
		                dest: '_dist/css/select2.png'
	                },
                    {
                        src: 'app/bower_components/select2/select2-spinner.gif',
                        dest: '_dist/css/select2-spinner.gif'
                    },
                    {
                        src: 'app/js/services/defaultPlayer.json',
                        dest: '_dist/js/services/defaultPlayer.json'
                    },
	                {
                        src: 'app/js/services/kdp.xml',
                        dest: '_dist/js/services/kdp.xml'
                    },
                    {
                        expand: true,
                        cwd: 'app/img',
                        src: '**/*',
                        dest: '_dist/img'
                    },
                    {
                        expand: true,
                        cwd: 'app/lib/colorpicker/img',
                        src: '**/*',
                        dest: '_dist/img'
                    },
                    {
                        expand: true,
                        cwd: 'app/i18n',
                        src: '**/*.json',
                        dest: '_dist/i18n'
                    },
                    {
                        src: 'app/css/studio.css',
                        dest: '_dist/css/studio.css'
                    },
                    {
                        expand: true,
                        cwd: 'app/css/fonts',
                        src: '*',
                        dest: '_dist/css/fonts'
                    },
                    {
                        expand: true,
                        cwd: 'app/bower_components/bootstrap/dist/fonts',
                        src: '*',
                        dest: '_dist/fonts'
                    }
                ]
            }
        },
        less: {
            bootstrap: {
                files: {'app/bower_components/bootstrap/dist/css/bootstrap.min.css': 'app/bower_components/bootstrap/less/bootstrap.less'},
                options: {
                    compress: true,
                    cleancss: true
                }
            },
            development: {
                files: {
                    'app/css/studio.css': 'app/less/*.less'
                },
                options: {
                    compress: true,
                    cleancss: true,
                    ieCompat: true,
                    sourceMap: true
                }
            }
        },
        clean: {
            build: ["_dist"],
            release: ["_dist/app"]
        },
        ngtemplates: {
            KMCModule: {
                cwd: 'app',
	            src: ['templates/**/*.html', 'view/**/*.html'],
                dest: '_dist/templates.js',
                options: {
                    htmlmin: { collapseWhitespace: false, collapseBooleanAttributes: false }
                }
            }
        }
    });

    // Add grunt plugins
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-ngmin');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-angular-templates');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Default task.
    grunt.registerTask('default', ['jshint:dev', 'clean:build', 'less', 'copy', 'cssmin', 'ngmin:dist', 'uglify:libs', 'concat', 'uglify:dist', 'ngtemplates', 'clean:release']);

};
