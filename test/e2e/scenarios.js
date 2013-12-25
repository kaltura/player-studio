'use strict';

/* http://docs.angularjs.org/guide/dev_guide.e2e-testing */

describe('my app', function() {

    beforeEach(function() {
        browser().navigateTo('../../app/index.html');
    });


    it('should automatically redirect to /login when location hash/fragment is empty and no login', function() {
        expect(browser().location().url()).toBe("/login");
    });


    describe('login', function() {

        beforeEach(function() {
            browser().navigateTo('#/login');
        });


        it('should render login when user navigates to /login', function() {
            expect(element('div[ng-view]').text()).
                toBeDefined('view/login.html');
        });

    });
    describe('list', function() {

        beforeEach(function() {

            browser().navigateTo('#/list');
        });


        it('should render list when user navigates to /list', function() {
            expect(element('div[ng-view]').text()).
                toBeDefined('view/list.html');
        });

    });

});
