'use strict';

// TODO: what is the exact API to /projects ?
angular.module('services')
  .factory('Projects', function ($resource) {
    return $resource('api/projects/:projectId', {
      projectId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  });
