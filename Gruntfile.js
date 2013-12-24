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
                banner: '<%= meta.banner %>'
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
                    'app/lib/sprintf.js',
                    'app/lib/localize.js',
                    'app/lib/spin.min.js',
                    'app/lib/lib/jquery.timeago.js.js',
                    'app/ib/jquery.animate-colors-min.js'
                ],
                dest: 'app/lib/libs.js'
            }
        },
        uglify: {
            options: {
                banner: '<%= meta.banner %>'
            },
            dist: {
                files: {
                    '_dist/main.min.js': ['<%= concat.dist.dest %>'],
                    'app/lib/libs.min.js': 'app/lib/libs.js'
                }
            }
        },
        cssmin: {
            combine: {
                files: {
                    '_dist/css/studio.css': ['app/css/app.css', 'app/css/edit.css', 'app/css/new.css', 'app/css/list.css', 'app/css/icons.css'],
                    '_dist/css/vendor.css': ['app/bower_components/select2/select2.css', 'app/lib/prettycheckable/dist/prettyCheckable.css', 'app/lib/colorpicker/css/colorpicker.css', 'app/lib/spinedit/css/bootstrap-spinedit.css', 'app/lib/malihu_custon_scrollbar/jquery.mCustomScrollbar.css']
                }

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
                        cwd: 'app/',
                        src: 'lib/**/*.js',
                        dest: '_dist/'
                    },
                    {
                        expand: true,
                        cwd: 'app/',
                        src: 'bower_components/**/*.min.js',
                        dest: '_dist/'
                    },
                    {
                        src: 'app/bower_components/select2/select2.png',
                        dest: '_dist/css/select2.png'
                    },
                    {
                        src: 'app/lib/prettycheckable/img/prettyCheckable.png',
                        dest: '_dist/img/prettyCheckable.png'
                    },
                    {
                        src: 'app/js/services/editableProperties.json',
                        dest: '_dist/js/services/editableProperties.json'
                    },
                    {
                        expand: true,
                        cwd: 'app/img',
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
                        expand: true,
                        cwd: 'app/css/fonts',
                        src: '*',
                        dest: '_dist/css/fonts'
                    }
                ]
            }
        },
        clean: {
            build: ["_dist"],
            release: ["_dist/app"]
        },
        ngtemplates: {
            KMCModule: {
                cwd: 'app',
                src: ['template/**/*.html', 'view/**/*.html'],
                dest: '_dist/templates.js',
                options: {
                    htmlmin: { collapseWhitespace: true, collapseBooleanAttributes: true }
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
    grunt.loadNpmTasks('grunt-angular-templates');

    // Default task.
    grunt.registerTask('default', ['clean:build', 'copy', 'cssmin', 'ngmin:dist', 'concat', 'uglify:dist', 'ngtemplates', 'clean:release']);

};
