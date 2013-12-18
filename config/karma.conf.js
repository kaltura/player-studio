module.exports = function (config) {
    config.set({
        basePath: '../',

        files: [
            'app/bower_components/jquery/jquery.min.js',
            'app/bower_components/angular/angular.min.js',
            'app/bower_components/angular-*/angular-*.min.js',
            'app/bower_components/angular-mocks/angular-mocks.js',
            'app/js/**/*.js',
            'test/unit/**/*.js',
            'app/lib/jquery.timeago.js'
        ],

        autoWatch: true,

        frameworks: ['jasmine'],

        browsers: ['Chrome'],

        plugins: [
            'karma-junit-reporter',
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-jasmine'
        ],

        junitReporter: {
            outputFile: 'test_out/unit.xml',
            suite: 'unit'
        }

    })
}
