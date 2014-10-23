// this directive dynamically adds the complex targetArea only when it is needed
angular.module('directives').directive('staticTarget', ['editSession', '$compile', '$log', function(session, $compile, $log) {
  return {
    restrict: 'E',
    // WORKING: pending, active, and completed are segment-level properties, and should be handled there
    template: '<div class="content-card frame"><div class="target">{{segment.target}}</div></div>',
    link: function($scope,el){
      $scope.index = $scope.id.index;
      // make the height the same as the source (max of source+target heights)

      el.on('click', function() {
        $log.log('targetText was clicked...');
        // TODO: don't scroll when the segment is activated in this way
        var newHtml = '<ng-include src="\'scripts/editArea/contentArea/segmentArea/targetArea/target-area.html\'"></div>'
        var compiledHtml = $compile(newHtml)($scope);
        el.replaceWith(compiledHtml);
        session.setSegment($scope.index);
      });

      $scope.$on('activate', function() {
        $log.log('the activate event fired');
        var newHtml = '<ng-include src="\'scripts/editArea/contentArea/segmentArea/targetArea/target-area.html\'"></div>'
        var compiledHtml = $compile(newHtml)($scope);
        el.replaceWith(compiledHtml);
      });

    }
  }
}]);
