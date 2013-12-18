/*global module:false*/
module.exports = function(grunt) {

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
                files: [{
                    expand: true,
                    cwd: 'app/js',
                    src: ['**/*.js'],
                    dest: 'app/_dist/app/'
                }]
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
            }
        },
        uglify: {
            options: {
                banner: '<%= meta.banner %>',
                mangle: false
            },
            dist: {
                files: {
                    'app/_dist/main.min.js': ['<%= concat.dist.dest %>']
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
    grunt.loadNpmTasks('grunt-ngmin');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-shell');

    // Default task.
    grunt.registerTask('default', ['ngmin:dist','concat:dist', 'uglify:dist']);
    //grunt.registerTask('default', ['concat:dist']);
    grunt.registerTask('deploy', ['default', 'shell:copyLatest']);

};
