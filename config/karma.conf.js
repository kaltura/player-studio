module.exports = function (config) {
    config.set({
        basePath: '../',
        plugins: [
            'karma-junit-reporter',
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-jasmine',
            'karma-ng-html2js-preprocessor'
        ],
        preprocessors: {
            '**/*.coffee': 'coffee',
            'app/template/**/*.html': 'ng-html2js'
        },
        ngHtml2JsPreprocessor: {
            stripPrefix: 'app/',
            moduleName: 'templates'
        },

        files: [
            'app/bower_components/jquery/jquery.min.js',
            'app/bower_components/angular/angular.js',
            'app/bower_components/angular-*/angular-*.min.js',
            'app/bower_components/angular-mocks/angular-mocks.js',
            'app/lib/angular-ui-bootstrap/ui-bootstrap-tpls-0.7.0.min.js',
            'app/js/**/*.js',
            'app/lib/colorpicker/js/bootstrap-colorpicker-module.js',
            'app/bower_components/angular-ui-sortable/src/sortable.js',
            'app/bower_components/angular-ui-select2/src/select2.js',
            'test/unit/**/*.js',
            'app/lib/jquery.timeago.js',
            'app/template/**/*.html'
        ],

        autoWatch: true,

        frameworks: ['jasmine'],

        browsers: ['Chrome'],

        junitReporter: {
            outputFile: 'test_out/unit.xml',
            suite: 'unit'
        }

    })
}
