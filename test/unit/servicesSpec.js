'use strict';

/* jasmine specs for services go here */

describe('SortService', function() {
    var sortSvc;
    beforeEach(module('KMC.services'));
    beforeEach(inject(function($injector) {
        sortSvc = $injector.get('sortSvc');
    }));

    it('should exist and return an object ', function() {
        expect(typeof sortSvc).toBe('object');
    });
    it('should keep a track of what we give it  ', function() {
        var model = {model: 'testModel', container: 'test', sortVal: 1};
        sortSvc.register('test', model);
        expect(sortSvc.getObjects().test).toBeDefined();
        expect(sortSvc.getObjects().test.elements[0]).toEqual(model);
    });
    it('should move an element from one container to a new one successfully ', function() {
        var model = {model: 'testModel', container: 'test', sortVal: 1};
        var model2 = {model: 'testModel2', container: 'test', sortVal: 2};
        sortSvc.register('testContainer', model);
        sortSvc.register('testContainer', model2);
        sortSvc.update('newContainer', 'testContainer', model);
        var objects = sortSvc.getObjects();
        expect(objects.newContainer).toBeDefined();
        expect(objects.newContainer.elements[0]).toEqual(model);
        expect(objects.testContainer.elements[0]).not.toEqual(model);
    });
});
