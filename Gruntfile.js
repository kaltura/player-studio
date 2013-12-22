/*global module:false*/
module.exports = function (grunt) {

    var shellOpts = {
        stdout: true,
        failOnError: true
    };

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
                        dest: 'app/_dist/app/'
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
                    'app/_dist/app/*.js',
                    'app/_dist/app/controllers/*.js',
                    'app/_dist/app/services/*.js'
                ],
                dest: 'app/_dist/main.js'
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
                    'app/_dist/main.min.js': ['<%= concat.dist.dest %>'],
                    'app/lib/libs.min.js': 'app/lib/libs.js'
                }
            }
        },
        cssmin: {
            combine: {
                files: {
                    'app/css/studio.css': ['app/css/app.css', 'app/css/edit.css', 'app/css/new.css', 'app/css/list.css', 'app/css/icons.css']
                }
            }
        },
        shell: {
            copyLatest: {
                command: [
                    'mkdir -p ~/Sites/kaltura/app/alpha/web/lib/js/kmc/<%= pkg.version %>',
                    'cp lib/js/kmc.js ~/Sites/kaltura/app/alpha/web/lib/js/kmc/<%= pkg.version %>/kmc.js',
                    'cp lib/js/kmc.min.js ~/Sites/kaltura/app/alpha/web/lib/js/kmc/<%= pkg.version %>/kmc.min.js',
                    'cp lib/css/kmc5.css ~/Sites/kaltura/app/alpha/web/lib/css/kmc5.css'
                ].join(' && '),
                options: shellOpts
            }
        }
    });

    // Add grunt plugins
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-ngmin');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-shell');

    // Default task.
    grunt.registerTask('default', ['cssmin', 'ngmin:dist', 'concat', 'uglify:dist']);
    //grunt.registerTask('default', ['cssmin']);
    grunt.registerTask('deploy', ['default', 'shell:copyLatest']);

};
