'use strict';

/**
 * @ngdoc factory
 * @name itapapersApp.store
 * @description
 * # store
 * Factory in the itapapersApp.
 */
angular.module('itapapersApp')
  .factory('store', ['$http', '$q', 'urls', 'localStorageService', 'utils', 'definitions', function ($http, $q, urls, localStorageService, utils, ce) {

    function filterData (instances) {
      var documentMap = {};

      // loop through query results
      //    - remove results with multiple citations
      //    - select citation count with most citations
      //    - collapse variants into one entry
      for (var i in instances) {
        var thisInst = instances[i];

        if (utils.isConcept(thisInst, "document")) {
          var paperId = thisInst._id;
          var paperProps = thisInst.property_values;

          // paper properties
          var citationCount = utils.getIntProperty(paperProps, ce.paper.citationCount);
          var variantList = utils.getListProperty(paperProps, ce.paper.variantList);
          var paperType = utils.getType(thisInst.concept_names || thisInst.direct_concept_names);

          // ignore duplicates
          if (!documentMap[paperId]) {
            var variantFound = false;
            var maxCitations = 0;

            // find max variant
            if (variantList) {
              for (var j = 0; j < variantList.length; ++j) {
                var variantId = variantList[j];

                if (documentMap[variantId]) {
                  maxCitations = documentMap[variantId].citations > maxCitations ? documentMap[variantId].citations : maxCitations;
                  variantFound = variantId;
                }
              }
            }

            // set citation count in map
            if (!variantFound) {
              documentMap[paperId] = {
                citations: citationCount,
                index: i,
                types: [paperType]
              };
            } else {
              if (maxCitations < citationCount) {
                var variantTypes = documentMap[variantFound].types.slice();
                documentMap[variantFound] = null;
                documentMap[paperId] = {
                  citations: citationCount,
                  index: i,
                  types: [paperType].concat(variantTypes)
                };
              } else {
                documentMap[variantFound].types.push(paperType);
              }
            }
          }
        }
      }

      var filteredResults = [];
      var instancesObj = {};

      // recreate array - test for index to remove duplicate citations
      for (var i in instances) {
        var thisInst = instances[i];
        paperId = thisInst._id;

        instancesObj[paperId] = thisInst;

        if (documentMap[paperId] && documentMap[paperId].index === i) {
          filteredResults.push([ paperId, documentMap[paperId].types ]);
        }
      }

      var filteredData = {
        instances: instancesObj,
        data: filteredResults
      };

      return filteredData;
    }

    function getDocuments () {
      var key = "document";

      if (localStorageService.isSupported) {
        var val = localStorageService.get(key + "-" + urls.ceStore);

        if (val) {
          return $q.when(val);
        } else {
          var url = urls.server + urls.ceStore + "/concepts/" + key + "/instances?style=minimal&onlyProperties=title,final date,number of citations,status,programme,weight,noteworthy reason,variant";

          return $http.get(url)
            .then(function(response) {
              var filtered = filterData(response.data);
              localStorageService.set(key + "-" + urls.ceStore, filtered);

              return filtered;
            }, function(err) {
              return err;
            });
        }
      }
    }

    function getDataForCompute (queryName) {
      var conNames = "";

      conNames += "published person,";
      conNames += "document,";
      conNames += "co-author statistic,";
      conNames += "paper citation count,";
      conNames += "ordered author,";
      conNames += "published organisation,";
      conNames += "topic-person statistic,";
      conNames += "topic-organisation statistic";

      var url = urls.server + urls.ceStore + "/special/instances-for-multiple-concepts?conceptNames=" + conNames + '&style=summary';

      return $http.get(url);
    }

    function getPublishedPeople () {
      var key = "core person";

      if (localStorageService.isSupported) {
        var val = localStorageService.get(key + "-" + urls.ceStore);

        if (val) {
          return $q.when(val);
        } else {
          var url = urls.server + urls.ceStore + "/concepts/" + key + "/instances?style=minimal&onlyProperties=full name,profile picture,writes documents for,local citation count,local h-index,overall citation count,overall h-index,document count,external document count,co-author count";

          return $http.get(url)
            .then(function(response) {
              var filtered = preparePublishedPeople(response.data);

              localStorageService.set(key + "-" + urls.ceStore, filtered);

              return filtered;
            }, function(err) {
              return err;
            });
        }
      }
    }

    function preparePublishedPeople(data) {
      var idList = [];
      var instObj = {}

      for (var i in data) {
        var thisInst = data[i];
        idList.push([thisInst._id]);
        instObj[thisInst._id] = thisInst;
      }

      var result = {
        data: idList,
        instances: instObj
      };

      return result;
    }

    // Not used
    function getEventSeries () {
      var key = "event series";

      if (localStorageService.isSupported) {
        var val = localStorageService.get(key + "-" + urls.ceStore);

        if (val) {
          return $q.when(val);
        } else {
          var url = urls.server + urls.ceStore + "/queries/" + key + "/execute";

          return $http.get(url)
            .then(function(response) {
              var filtered = response.data.results;
              localStorageService.set(key + "-" + urls.ceStore, filtered);

              return filtered;
            }, function(err) {
              return err;
            });
        }
      }
    }

    function getProjects () {
      var key = "projects";

      if (localStorageService.isSupported) {
        var val = localStorageService.get(key + "-" + urls.ceStore);

        if (val) {
          return $q.when(val);
        } else {
          var url = urls.server + urls.ceStore + "/queries/" + key + "/execute?returnInstances=true";

          return $http.get(url)
            .then(function(response) {
              localStorageService.set(key + "-" + urls.ceStore, response.data);
              return response.data;
            }, function(err) {
              return err;
            });
        }
      }
    }

    function getOrganisations () {
      var key = "organisations";

      if (localStorageService.isSupported) {
        var val = localStorageService.get(key + "-" + urls.ceStore);

        if (val) {
          return $q.when(val);
        } else {
          var url = urls.server + urls.ceStore + "/queries/" + key + "/execute?returnInstances=true";

          return $http.get(url)
            .then(function(response) {
              localStorageService.set(key + "-" + urls.ceStore, response.data);
              return response.data;
            }, function(err) {
              return err;
            });
        }
      }
    }

    function getTopics() {
      var key = "topics";

      if (localStorageService.isSupported) {
        var val = localStorageService.get(key + "-" + urls.ceStore);

        if (val) {
          return $q.when(val);
        } else {
          var url = urls.server + urls.ceStore + "/queries/" + key + "/execute?returnInstances=true";

          return $http.get(url)
            .then(function(response) {
              localStorageService.set(key + "-" + urls.ceStore, response.data);
              return response.data;
            }, function(err) {
              return err;
            });
        }
      }
    }

    function getStatistics () {
      var key = "totals";

      if (localStorageService.isSupported) {
        var val = localStorageService.get(key + "-" + urls.ceStore);

        if (val) {
          return $q.when(val);
        } else {
          var url = urls.server + urls.ceStore + "/queries/" + key + "/execute?returnInstances=true";

          return $http.get(url)
            .then(function(response) {
              localStorageService.set(key + "-" + urls.ceStore, response.data);
              return response.data;
            }, function(err) {
              return err;
            });
        }
      }
    }

    function getLastUpdated () {
      var key = "last updated";

      if (localStorageService.isSupported) {
        var val = localStorageService.get(key + "-" + urls.ceStore);

        if (val) {
          return $q.when(val);
        } else {
          var url = urls.server + urls.ceStore + "/queries/" + key + "/execute";

          return $http.get(url)
            .then(function(response) {
              localStorageService.set(key + "-" + urls.ceStore, response.data);
              return response.data;
            }, function(err) {
              return err;
            });
        }
      }
    }

    function getAuthor (authorName) {
      if (localStorageService.isSupported) {
        var val = localStorageService.get(authorName);

        if (val) {
          return $q.when(val);
        } else {
          var url = urls.server + urls.ceStore + "/instances/" + authorName + "?showStats=true&steps=2&style=summary&referringInstances=false&limitRelationships=default%20organisation,wrote,author,final%20date,citation%20count,co-author,co-author%20statistic";

          return $http.get(url)
            .then(function(response) {
              localStorageService.set(authorName, response.data);
              return response.data;
            }, function(err) {
              return err;
            });
        }
      }
    }

    function getPaper (paperName) {
      if (localStorageService.isSupported) {
        var val = localStorageService.get(paperName);

        if (val) {
          return $q.when(val);
        } else {
          var url = urls.server + urls.ceStore + "/instances/" + paperName + "?style=summary&steps=2&referringInstances=false";

          return $http.get(url)
            .then(function(response) {
              localStorageService.set(paperName, response.data);
              return response.data;
            }, function(err) {
              return err;
            });
        }
      }
    }

    function getVenue (location) {
      if (localStorageService.isSupported) {
        var val = localStorageService.get(location);

        if (val) {
          return $q.when(val);
        } else {
          var url = urls.server + urls.ceStore + "/instances/" + location;

          return $http.get(url)
            .then(function(response) {
              localStorageService.set(location, response.data);
              return response.data;
            }, function(err) {
              return err;
            });
        }
      }
    }

    function getOrganisation (organisation) {
      if (localStorageService.isSupported) {
        var val = localStorageService.get(organisation);

        if (val) {
          return $q.when(val);
        } else {
          var url = urls.server + urls.ceStore + "/instances/" + organisation + "?style=summary&referringInstances=false&steps=3&limitRelationships=is%20located%20at,employs,citation%20count,wrote,final%20date";

          return $http.get(url)
            .then(function(response) {
              localStorageService.set(organisation, response.data);
              return response.data;
            }, function(err) {
              return err;
            });
        }
      }
    }

    function getTopic (topic) {
      if (localStorageService.isSupported) {
        var val = localStorageService.get(topic);

        if (val) {
          return $q.when(val);
        } else {
          var url = urls.server + urls.ceStore + "/instances/" + topic + "?style=summary&referringInstances=false&steps=3&limitRelationships=topic%20statistic,person,document,citation%20count,organisation";

          return $http.get(url)
            .then(function(response) {
              localStorageService.set(topic, response.data);
              return response.data;
            }, function(err) {
              return err;
            });
        }
      }
    }

    function getGovOrganisationDetails () {
      var key = "gov organisation details";

      if (localStorageService.isSupported) {
        var val = localStorageService.get(key + "-" + urls.ceStore);

        if (val) {
          return $q.when(val);
        } else {
          var url = urls.server + urls.ceStore + "/queries/" + key + "/execute?showStats=false&suppressCe=true";

          return $http.get(url)
            .then(function(response) {
              localStorageService.set(key + "-" + urls.ceStore, response.data);
              return response.data;
            }, function(err) {
              return err;
            });
        }
      }
    }

    function getAcOrganisationDetails () {
        var key = "ac organisation details";

        if (localStorageService.isSupported) {
          var val = localStorageService.get(key + "-" + urls.ceStore);

          if (val) {
            return $q.when(val);
          } else {
            var url = urls.server + urls.ceStore + "/queries/" + key + "/execute?showStats=false&suppressCe=true";

            return $http.get(url)
              .then(function(response) {
                localStorageService.set(key + "-" + urls.ceStore, response.data);
                return response.data;
              }, function(err) {
                return err;
              });
          }
        }
      }

    function getIndOrganisationDetails () {
        var key = "ind organisation details";

        if (localStorageService.isSupported) {
          var val = localStorageService.get(key + "-" + urls.ceStore);

          if (val) {
            return $q.when(val);
          } else {
            var url = urls.server + urls.ceStore + "/queries/" + key + "/execute?showStats=false&suppressCe=true";

            return $http.get(url)
              .then(function(response) {
                localStorageService.set(key + "-" + urls.ceStore, response.data);
                return response.data;
              }, function(err) {
                return err;
              });
          }
        }
      }

    function getOrganisationPublications () {
      var key = "organisation publications";

      if (localStorageService.isSupported) {
        var val = localStorageService.get(key + "-" + urls.ceStore);

        if (val) {
          return $q.when(val);
        } else {
          var url = urls.server + urls.ceStore + "/queries/" + key + "/execute?returnInstances=true";

          return $http.get(url)
            .then(function(response) {
              localStorageService.set(key + "-" + urls.ceStore, response.data);
              return response.data;
            }, function(err) {
              return err;
            });
        }
      }
    }

    function getPersonDetails () {
      var key = "person details";

      if (localStorageService.isSupported) {
        var val = localStorageService.get(key + "-" + urls.ceStore);

        if (val) {
          return $q.when(val);
        } else {
          var url = urls.server + urls.ceStore + "/queries/" + key + "/execute?showStats=false&suppressCe=true";

          return $http.get(url)
            .then(function(response) {
              localStorageService.set(key + "-" + urls.ceStore, response.data);
              return response.data;
            }, function(err) {
              return err;
            });
        }
      }
    }

    function getPeopleOrgs () {
      var key = "published person -> organisation";

      if (localStorageService.isSupported) {
        var val = localStorageService.get(key + "-" + urls.ceStore);

        if (val) {
          return $q.when(val);
        } else {
          var url = urls.server + urls.ceStore + "/queries/" + key + "/execute?showStats=false&suppressCe=true";

          return $http.get(url)
            .then(function(response) {
              localStorageService.set(key + "-" + urls.ceStore, response.data);
              return response.data;
            }, function(err) {
              return err;
            });
        }
      }
    }

    function getPersonDocument () {
      var key = "person -> document";

      if (localStorageService.isSupported) {
        var val = localStorageService.get(key + "-" + urls.ceStore);

        if (val) {
          return $q.when(val);
        } else {
          var url = urls.server + urls.ceStore + "/queries/" + key + "/execute?showStats=false&suppressCe=true";

          return $http.get(url)
            .then(function(response) {
              localStorageService.set(key + "-" + urls.ceStore, response.data);
              return response.data;
            }, function(err) {
              return err;
            });
        }
      }
    }

    function getDocumentDetails () {
      var key = "document details";

      if (localStorageService.isSupported) {
        var val = localStorageService.get(key + "-" + urls.ceStore);

        if (val) {
          return $q.when(val);
        } else {
          var url = urls.server + urls.ceStore + "/queries/" + key + "/execute?showStats=false&suppressCe=true";

          return $http.get(url)
            .then(function(response) {
              localStorageService.set(key + "-" + urls.ceStore, response.data);
              return response.data;
            }, function(err) {
              return err;
            });
        }
      }
    }

    function getProject (project) {
      if (localStorageService.isSupported) {
        var val = localStorageService.get(project);

        if (val) {
          return $q.when(val);
        } else {
          var url = urls.server + urls.ceStore + "/instances/" + project + "?steps=2&style=summary&referringInstances=false&limitRelationships=paper,technical%20area,citation%20count";
          return $http.get(url)
            .then(function(response) {
              localStorageService.set(project, response.data);
              return response.data;
            }, function(err) {
              return err;
            });
        }
      }
    }

    function getEventSeriesDetails () {
      var key = 'event series details';

      if (localStorageService.isSupported) {
        var val = localStorageService.get(key + "-" + urls.ceStore);

        if (val) {
          return $q.when(val);
        } else {
          var url = urls.server + urls.ceStore + "/queries/" + key + "/execute?returnInstances=true";

          return $http.get(url)
            .then(function(response) {
              localStorageService.set(key + "-" + urls.ceStore, response.data);
              return response.data;
            }, function(err) {
              return err;
            });
        }
      }
    }

    function getVoiceAcceptance () {
      var key = "voice";

      if (localStorageService.isSupported) {
        var val = localStorageService.get(key);

        return $q.when(val);
      } else {
        return $q.when(false);
      }
    }

    function setVoiceAcceptance (accepted) {
      var key = "voice";

      if (localStorageService.isSupported) {
        localStorageService.set(key, accepted);
      }
    }

    return {
      getDataForCompute: getDataForCompute,
      getDocuments: getDocuments,
      getPublishedPeople: getPublishedPeople,
      getEventSeries: getEventSeries,
      getProjects: getProjects,
      getOrganisations: getOrganisations,
      getTopics: getTopics,
      getAuthor: getAuthor,
      getPaper: getPaper,
      getVenue: getVenue,
      getOrganisation: getOrganisation,
      getTopic: getTopic,
      getGovOrganisationDetails: getGovOrganisationDetails,
      getAcOrganisationDetails: getAcOrganisationDetails,
      getIndOrganisationDetails: getIndOrganisationDetails,
      getPersonDetails: getPersonDetails,
      getPeopleOrgs: getPeopleOrgs,
      getPersonDocument: getPersonDocument,
      getDocumentDetails: getDocumentDetails,
      getProject: getProject,
      getEventSeriesDetails: getEventSeriesDetails,
      getVoiceAcceptance: getVoiceAcceptance,
      setVoiceAcceptance: setVoiceAcceptance,
      getStatistics: getStatistics,
      getLastUpdated: getLastUpdated
    };
  }]);
