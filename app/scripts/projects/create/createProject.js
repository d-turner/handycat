angular.module('controllers')
.controller('CreateProjectCtrl', ['XliffParser', 'Projects', '$state', '$log', '$scope', '$http', '$mdDialog', '$mdToast', 'fileReader',
    function(XliffParser, Projects, $state, $log, $scope, $http, $mdDialog, $mdToast, fileReader) {

      // set the default title
      $scope.name = 'Project Name';
      $scope.pending = {
        document: undefined
      }

      // add the hard-coded sample files
      $scope.sampleFiles = [
        {name: 'en-de-test1', url: 'data/PEARL_TS1.xlf'},
        {name: 'en-de-test2', url: 'data/PEARL_TS2.xlf'}
      ];

      // make sure the create modal closes if we change states
      $scope.$on('$stateChangeStart', function(ev, to, toParams, from, fromParams) {
        if (to.name !== 'projects.create') {
          $scope.closeDialog();
        }
      });

      // is the XLIFF already parsed? - there should be a validation check to make sure this is a valid XLIFF
      // the XLIFF parser must reject its promise if there is a parsing error
      $scope.create = function() {
        if ($scope.pending.document) {
          var project = newProject(projectName, $scope.pending.document);
          project.$save(function(response) {
            $state.go('projects.list');
          });

          $scope.name = "";
        } else {
          console.error('createProject: no pendingDocument on $scope');
          $scope.showErrorToast('Error: no XLIFF file available');
        }
      };

      $scope.closeDialog = function() {
        $mdDialog.hide();
      };

      $scope.showErrorToast = function(msg) {
          var toast = $mdToast.simple()
            .content(msg)
            .action('OK')
            .highlightAction(true)
            .position('top right');

          $mdToast.show(toast).then(function() {
            $state.go('projects.create')
          });
      };

      $scope.closeToast = function() {
        $mdToast.hide();
      }

      // This is primarily for the built-in demos
      // user specifies the URL of an XLIFF file, we grab it, parse it, then save it on the server
      $scope.createFromURL = function(xliffFileUrl) {
        $log.log('create from URL fired: ' + xliffFileUrl);
        $http.get(xliffFileUrl)
          .success(
          function (data) {
            XliffParser.parseXML(data).then(
              function (docObj) {
                var pendingDocument = docObj.DOM;
                var project = newProject($scope.name, pendingDocument)
                $scope.name = "";

                project.$save(function (response) {
                  // transition back to the project-list
                  $state.go('projects.list');
                });
              });
          }).
          error(function() {
            // show toast to user letting them know that this is not a valid XLIFF
            $scope.showErrorToast('Error: Xliff parsing failed - did you specify an XLIFF file?');
          });
      }

      var newProject = function (name, pendingDocument) {
        var newProject = new Projects({
          name: $scope.name,
          content: XliffParser.getDOMString(pendingDocument)
        })
        return newProject;
      }

      // does the browser support drag n drop? - assume yes
      $scope.fileAdded = false;
      $scope.dropSupported = false;
      $scope.selectedFiles = [];

      $scope.$watch(
        function() {
          return $scope.dropSupported;
        },
        function() {
          $log.log('UploadCtrl: dropSupported changed to: ' + $scope.dropSupported);
        }
      );

// TODO: get file type (assume xlf for now)
// TODO: this code depends upon $scope.pending.document being available in the parent scope
// TODO: refactor this component into a directive
      // this depends on ngFileUpload
      $scope.onFileSelect = function ($files) {
        $log.log("inside file select");
        $scope.fileAdded = true;

        // show the user what the selected files are
        // assume this is a single file for now
        $scope.selectedFiles = $files;

        // parse the file immediately when it is selected
        var xliffPromise = XliffParser.readFile($scope.selectedFiles[0]);
        xliffPromise.then(
          function(documentObj) {
            $scope.pending.document = documentObj.DOM;
          }
        );
      };

// TODO: implement fileProgress from the xliffParser
      $scope.$on("fileProgress", function(e, progress) {
        $scope.progress = progress.loaded / progress.total;
      });


    }]);

