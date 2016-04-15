'use strict';

/**
 * @ngdoc service
 * @name itapapersApp.utils
 * @description
 * # utils
 * Factory in the itapapersApp.
 */
angular.module('itapapersApp')
  .factory('utils', ['documentTypes', function (documentTypes) {
    var types = documentTypes.nameMap;

    return {
      getType: function (directConceptNames) {
        if (directConceptNames.indexOf(documentTypes.journal) > -1) {
          return types[documentTypes.journal];
        } else if (directConceptNames.indexOf(documentTypes.external) > -1) {
          return types[documentTypes.external];
        } else if (directConceptNames.indexOf(documentTypes.patent) > -1) {
          return types[documentTypes.patent];
        } else if (directConceptNames.indexOf(documentTypes.internal) > -1) {
          return types[documentTypes.internal];
        } else if (directConceptNames.indexOf(documentTypes.technical) > -1) {
          return types[documentTypes.technical];
        } else {
          return types[documentTypes.other];
        }
      },
      getClassName: function (type) {
        return type.toLowerCase().replace(/\s/g, '-');
      },
      sortTypes: function (docTypes) {
        docTypes.sort(function (a, b) {
          if (a === types[documentTypes.journal]) {
            return -1;
          } else if (b === types[documentTypes.journal]) {
            return 1;
          } else if (a === types[documentTypes.external]) {
            return -1;
          } else if (b === types[documentTypes.external]) {
            return 1;
          } else if (a === types[documentTypes.patent]) {
            return -1;
          } else if (b === types[documentTypes.patent]) {
            return 1;
          } else if (a === types[documentTypes.internal]) {
            return -1;
          } else if (b === types[documentTypes.internal]) {
            return 1;
          } else if (a === types[documentTypes.technical]) {
            return -1;
          } else if (b === types[documentTypes.technical]) {
            return 1;
          } else if (a === types[documentTypes.other]) {
            return -1;
          } else if (b === types[documentTypes.other]) {
            return 1;
          }
        });

        return docTypes;
      }
    };
  }]);
