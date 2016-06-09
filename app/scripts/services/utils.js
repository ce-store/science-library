'use strict';

/**
 * @ngdoc service
 * @name itapapersApp.utils
 * @description
 * # utils
 * Factory in the itapapersApp.
 */
angular.module('itapapersApp')
  .factory('utils', ['documentTypes', 'definitions', function (documentTypes, ce) {
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
      },
      getProperty: function(propertiesList, propertyName) {
        return propertiesList[propertyName] ? propertiesList[propertyName][0] : null;
      },
      getListProperty: function(propertiesList, propertyName) {
        return propertiesList[propertyName];
      },
      getUnknownProperty: function(propertiesList, propertyName) {
        var unknown = 'unknown';
        return propertiesList[propertyName] ? propertiesList[propertyName][0] : unknown;
      },
      getIntProperty: function(propertiesList, propertyName) {
        return propertiesList[propertyName] ? parseInt(propertiesList[propertyName][0], 10) : 0;
      },
      getDateProperty: function(propertiesList, propertyName) {
        return propertiesList[propertyName] ? Date.parse(propertiesList[propertyName][0]) : 0;
      },
      getIndustryFor: function (instance) {
        var result = null;
        var conceptNames = instance.direct_concept_names || instance.concept_names;

        if ((conceptNames.indexOf(ce.concepts.governmentOrganisation) > -1) || (conceptNames.indexOf(ce.concepts.governmentPerson) > -1)) {
          result = "GOV";
        } else if ((conceptNames.indexOf(ce.concepts.academicOrganisation) > -1) || (conceptNames.indexOf(ce.concepts.academicPerson) > -1)) {
          result = "AC";
        } else if ((conceptNames.indexOf(ce.concepts.industryOrganisation) > -1) || (conceptNames.indexOf(ce.concepts.industryPerson) > -1)) {
          result = "IND";
        } else {
          result = "Unknown";
        }

        return result;
      },
      isConcept: function (inst, conName) {
        var result =
          ((inst.concept_names != null) && (inst.concept_names.indexOf(conName) > -1)) ||
          ((inst.direct_concept_names != null) && (inst.direct_concept_names.indexOf(conName) > -1)) ||
          ((inst.inherited_concept_names != null) && (inst.inherited_concept_names.indexOf(conName) > -1))

          return result;
      }
    };
  }]);
