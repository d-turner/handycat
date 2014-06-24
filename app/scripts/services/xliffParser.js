// this service wraps the fileReader (fileReader implementation is done with promises)
// TODO: we need a service representing the XLIFF DOM at all times
// TODO: this service should be merged with the Document service

// TODO: remove session service dependency
angular.module('services').factory('XliffParser', ['$rootScope','fileReader','Document', 'session', '$http', '$log', function( $rootScope,fileReader,Document, session, $http,$log ) {
  // Persistent DOMParser
  var parser = new DOMParser();

  return {
    // call file reader, then parse the result as XML

// Only allow non-Upload controllers to touch this object once the file has been loaded and parsed
    readFile: function(file) {
      var self = this;
      $log.log("inside parse");

      var promise = fileReader.readAsText(file);
      promise.then(function(result) {
        self.parseXML(result);
      });
    },
    parseXML: function(rawText) {
      Document.init();
      var self = this;
      var xml = parser.parseFromString(rawText, "text/xml");
      // Set Document DOM to the parsed result
      Document.DOM = xml;

      var file = xml.querySelector("file");

      var sourceLang = file.getAttribute('source-language');
      var targetLang = file.getAttribute('target-language');

      // Working -- segmentation with <seg-source> and <mrk> tags is Optional -- add support for pure <source> and <target>
      var sourceSegments = this.getTranslatableSegments(xml);

      // for every segment, get its matching target mrk, if it exists - note: it may not exist
      var targetSegments = _.map(sourceSegments,
        function(seg) {
          $log.log("logging the source segment node:");
          $log.log(seg);
          if (seg.nodeName === 'mrk') {
            $log.log("nodeName is mrk");
            return self.getMrkTarget(xml, seg);
          }
          // there's no mrks inside <target>, just a <target> -- TODO: do we require target nodes to exist?
          return seg.parentNode.querySelector('target');
        }
      );

      // we can assume that translators will want to translate every segment, so there should be at least an
      // empty target node corresponding to each source node
      var sourceWithTarget = _.zip(sourceSegments, targetSegments);
      _.each(sourceWithTarget,
        function(seg) {
          var sourceText = seg[0].textContent;
          var targetText = seg[1] ? seg[1].textContent : '';
          if (!seg[1]) {
            //$log.log(' ' + seg[0]);
            $log.log(seg[0]);
            var mid = seg[0].getAttribute('mid');
            $log.log("target segment missing: " + mid);
            seg[1] = self.createNewMrkTarget(Document.DOM, seg[0], '', targetLang);
            $log.log(seg[1]);
          }

          var segPair = {
            source: sourceText,
            target: targetText,
            sourceDOM: seg[0],
            targetDOM: seg[1]
          };

          Document.sourceSegments.push(sourceText);
          Document.targetSegments.push(targetText);
          // Add the pairs so we can access both sides from a single ngRepeat
          Document.segments.push(segPair);

          // TODO: make this useful
          Document.translatableNodes.push(seg);

          Document.completedSegments.push(false);
        });
      Document.sourceLang = sourceLang;
      Document.targetLang = targetLang;
      // initialize the revision property on the document object
      Document.revision = 0;
      // flip the flag on the Document object
      Document.loaded = true;
      // tell the world that the document loaded
      $log.log("firing document-loaded");
      $rootScope.$broadcast('document-loaded');

      // TODO: remove this
      session.startSession();
    },
    // working - the source may not be segmented with <seg-source> tags -- there may only be a single <source> tag
    getTranslatableSegments: function(xmlDoc) {
      var transUnits = xmlDoc.querySelectorAll('trans-unit');
      var translatableSegments = [];
      angular.forEach(transUnits, function(transUnit) {
        // if seg-source, get <mrk> targets, else, get <target>
        if (transUnit.querySelector('seg-source')) {
          // querySelectorAll returns a node list, so we use Array.prototype.slice.call to make it a normal array
          translatableSegments = translatableSegments.concat(Array.prototype.slice.call((transUnit.querySelectorAll('seg-source > mrk[mtype="seg"]'))));
        } else {
          translatableSegments = translatableSegments.concat((transUnit.querySelector('source')));
        }
      });

//      return xmlDoc.querySelectorAll('seg-source > mrk[mtype="seg"]');
      return translatableSegments;
    },

    // note: <trans-units> are required to have the 'id' attribute
    getMrkTarget: function(xmlDoc, seg) {
      var segid = this.getSegId(seg);
      var tuid = this.getTransUnitId(seg);
      return xmlDoc.querySelector('trans-unit[id="'+tuid+'"] > target > mrk[mtype="seg"][mid="'+segid+'"]');
    },
    getSegId: function(seg) {
      return seg.getAttribute("mid");
    },
    getTransUnitId: function(seg) {
      var transunitNode = seg.parentNode.parentNode;
      return transunitNode.getAttribute("id");
    },
    getTransunit: function (xmlDoc, tuid) {
      return xmlDoc.querySelector('trans-unit[id="'+tuid+'"]');
    },
    getTarget: function (doc, seg) {
      var segid = this.getSegId(seg);
      var tuid = this.getTransUnitId(seg);
      return doc.querySelector('trans-unit[id="'+tuid+'"] > target');
    },
    // TODO: test these functions
    createNewMrkTarget: function (xmlDoc, seg, newValue, targetLang) {
      var segid = this.getSegId(seg);
      var tuid = this.getTransUnitId(seg);

      // create new mrk/target node
      var mrkTarget = xmlDoc.createElement('mrk');
      mrkTarget.setAttribute('mid', segid);
      mrkTarget.setAttribute('mtype', 'seg');
      mrkTarget.textContent = newValue;

      var targetNode = this.getTarget(xmlDoc, seg);
      if (!targetNode) {
        // There is no previous translation for this transunit
        // create new target node
        targetNode = xmlDoc.createElement('target');
        targetNode.setAttribute('xml:lang', targetLang);

        // append to specific transunit node
        var transUnit = this.getTransunit(xmlDoc, tuid);
        transUnit.appendChild(target_node);
      }

      // append  mrk_target to target node
      targetNode.appendChild(mrkTarget);

      return mrkTarget;
    },
    // utility function to grab a local file from a string url
    loadLocalFile: function(filepath) {
      // if filepath exists
      var xliffFile = '';
      if (filepath) xliffFile = filepath;

      var self = this;
      //This will make the request, then call the parser and fire the document loaded event
      $http.get(xliffFile)
        .success(function(data) {
          //$log.log("Local File Data: " + data); // tested
          self.parseXML(data);
        });
    }
  }
}]);
