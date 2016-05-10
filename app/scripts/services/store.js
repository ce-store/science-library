'use strict';

/**
 * @ngdoc factory
 * @name itapapersApp.store
 * @description
 * # store
 * Factory in the itapapersApp.
 */
angular.module('itapapersApp')
  .factory('store', ['$http', '$q', 'server', 'localStorageService', 'utils', function ($http, $q, server, localStorageService, utils) {
    var store = "DEFAULT";
    //var store = "extonly";

    function filterData (data) {
      var documentMap = {};
      var i, paperId;

      // loop through query results
      //    - remove results with multiple citations
      //    - select citation count with most citations
      //    - collapse variants into one entry
      for (i = 0; i < data.results.length; ++i) {
        paperId = data.results[i][0];
        var paperProps = data.instances[paperId].property_values;
        var citationId = paperProps["citation count"][0]; // take latest
        var citationProps = data.instances[citationId].property_values;
        var paperType = utils.getType(data.instances[paperId].direct_concept_names);

        // ignore duplicates
        if (!documentMap[paperId]) {
          var variantFound = false;
          var maxCitations = 0;

          // find max variant
          if (paperProps.variant) {
            for (var j = 0; j < paperProps.variant.length; ++j) {
              var variantId = paperProps.variant[j];

              if (documentMap[variantId]) {
                maxCitations = documentMap[variantId].citations > maxCitations ? documentMap[variantId].citations : maxCitations;
                variantFound = variantId;
              }
            }
          }

          // set citation count in map
          var citationCount = citationProps["citation count"] ? parseInt(citationProps["citation count"][0], 10) : 0;
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

      var filteredResults = [];

      // recreate array - test for index to remove duplicate citations
      for (i = 0; i < data.results.length; ++i) {
        paperId = data.results[i][0];
        if (documentMap[paperId] && documentMap[paperId].index === i) {
          data.results[i].push(documentMap[paperId].types);
          filteredResults.push(data.results[i]);
        }
      }

      var filteredData = {
        instances: data.instances,
        data: filteredResults
      };

      return filteredData;
    }

    function getDocuments () {
      var key = "document citations";

      if (localStorageService.isSupported) {
        var val = localStorageService.get(key + "-" + store);

        if (val) {
          return $q.when(val);
        } else {
          //DSB - switch request to open source ce-store
          var url = server + "/ce-store/stores/" + store + "/queries/" + key + "/execute?returnInstances=true";

          return $http.get(url)
            .then(function(response) {
              var filtered = filterData(response.data);
              localStorageService.set(key + "-" + store, filtered);

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

      var url = server + "/ce-store/stores/" + store + "/special/instances-for-multiple-concepts?conceptNames=" + conNames + '&style=summary';

      return $http.get(url);
    }

    function getPublishedPeople () {
      // This isn't working for some reason ???

      // var key = "published person citations";

      // if (localStorageService.isSupported) {
      //   var val = localStorageService.get(key);

      //   if (val) {
      //     console.log('published');
      //     console.log(val);
      //     return $q.when(val);
      //   } else {
      //     console.log('no published');
      //     var url = server + "/ce-store/stores/" + store + "/queries/" + key + "/execute";

      //     return $http.get(url)
      //       .then(function(response) {
      //         var filtered = filterData(response.data.results, 3);
      //         filtered.sort(sortByHIndex);
      //         localStorageService.set(key, filtered);
      //         console.log(filtered);

      //         return filtered;
      //       }, function(err) {
      //         return err;
      //       });
      //   }
      // }

      //DSB - switch request to open source ce-store
      var url = server + "/ce-store/stores/" + store + "/queries/published person citations/execute?returnInstances=true";

      return $http.get(url)
        .then(function(response) {
          // var filtered = filterData(response.data.results, 3);
          var filtered = response.data.results;

          return {
            data: filtered,
            instances: response.data.instances
          };
        }, function(err) {
          return err;
        });
    }

    // Not used
    function getEventSeries () {
      var key = "event series";

      if (localStorageService.isSupported) {
        var val = localStorageService.get(key + "-" + store);

        if (val) {
          return $q.when(val);
        } else {
          //DSB - switch request to open source ce-store
          var url = server + "/ce-store/stores/" + store + "/queries/" + key + "/execute";

          return $http.get(url)
            .then(function(response) {
              var filtered = response.data.results;
              localStorageService.set(key + "-" + store, filtered);

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
        var val = localStorageService.get(key + "-" + store);

        if (val) {
          return $q.when(val);
        } else {
          //DSB - switch request to open source ce-store
          var url = server + "/ce-store/stores/" + store + "/queries/" + key + "/execute?returnInstances=true";

          return $http.get(url)
            .then(function(response) {
              localStorageService.set(key + "-" + store, response.data);
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
        var val = localStorageService.get(key + "-" + store);

        if (val) {
          return $q.when(val);
        } else {
          //DSB - switch request to open source ce-store
          var url = server + "/ce-store/stores/" + store + "/queries/" + key + "/execute?returnInstances=true";

          return $http.get(url)
            .then(function(response) {
              localStorageService.set(key + "-" + store, response.data);
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
        var val = localStorageService.get(key + "-" + store);

        if (val) {
          return $q.when(val);
        } else {
          //DSB - switch request to open source ce-store
          var url = server + "/ce-store/stores/" + store + "/queries/" + key + "/execute?returnInstances=true";

          return $http.get(url)
            .then(function(response) {
              localStorageService.set(key + "-" + store, response.data);
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
        var val = localStorageService.get(key + "-" + store);

        if (val) {
          return $q.when(val);
        } else {
          //DSB - switch request to open source ce-store
          var url = server + "/ce-store/stores/" + store + "/queries/" + key + "/execute?returnInstances=true";

          return $http.get(url)
            .then(function(response) {
              localStorageService.set(key + "-" + store, response.data);
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
        var val = localStorageService.get(key + "-" + store);

        if (val) {
          return $q.when(val);
        } else {
          //DSB - switch request to open source ce-store
          var url = server + "/ce-store/stores/" + store + "/queries/" + key + "/execute";

          return $http.get(url)
            .then(function(response) {
              localStorageService.set(key + "-" + store, response.data);
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
          //DSB - switch request to open source ce-store
          var url = server + "/ce-store/stores/" + store + "/instances/" + authorName + "?showStats=true&steps=2&style=summary&referringInstances=false&limitRelationships=is%20employed%20by,wrote,author,final%20date,citation%20count,co-author,co-author%20statistic";

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
          //DSB - switch request to open source ce-store
          var url = server + "/ce-store/stores/" + store + "/instances/" + paperName + "?style=summary&steps=2&referringInstances=false";

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
          //DSB - switch request to open source ce-store
          var url = server + "/ce-store/stores/" + store + "/instances/" + location;

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
          //DSB - switch request to open source ce-store
          var url = server + "/ce-store/stores/" + store + "/instances/" + organisation + "?style=summary&referringInstances=false&steps=3&limitRelationships=is%20located%20at,employs,citation%20count,wrote,final%20date";

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
          //DSB - switch request to open source ce-store
          var url = server + "/ce-store/stores/" + store + "/instances/" + topic + "?style=summary&referringInstances=false&steps=3&limitRelationships=topic%20statistic,person,document,citation%20count";

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

    // Not used
    function getOrganisationPublications () {
      var key = "organisation publications";

      if (localStorageService.isSupported) {
        var val = localStorageService.get(key + "-" + store);

        if (val) {
          return $q.when(val);
        } else {
          //DSB - switch request to open source ce-store
          var url = server + "/ce-store/stores/" + store + "/queries/" + key + "/execute?returnInstances=true";

          return $http.get(url)
            .then(function(response) {
              localStorageService.set(key + "-" + store, response.data);
              return response.data;
            }, function(err) {
              return err;
            });
        }
      }
    }

    function getOrganisationDetails () {
      var key = "organisation details";

      if (localStorageService.isSupported) {
        var val = localStorageService.get(key + "-" + store);

        if (val) {
          return $q.when(val);
        } else {
          //DSB - switch request to open source ce-store
          var url = server + "/ce-store/stores/" + store + "/queries/" + key + "/execute?showStats=false&suppressCe=true";

          return $http.get(url)
            .then(function(response) {
              localStorageService.set(key + "-" + store, response.data);
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
        var val = localStorageService.get(key + "-" + store);

        if (val) {
          return $q.when(val);
        } else {
          //DSB - switch request to open source ce-store
          var url = server + "/ce-store/stores/" + store + "/queries/" + key + "/execute?showStats=false&suppressCe=true";

          return $http.get(url)
            .then(function(response) {
              localStorageService.set(key + "-" + store, response.data);
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
        var val = localStorageService.get(key + "-" + store);

        if (val) {
          return $q.when(val);
        } else {
          //DSB - switch request to open source ce-store
          var url = server + "/ce-store/stores/" + store + "/queries/" + key + "/execute?showStats=false&suppressCe=true";

          return $http.get(url)
            .then(function(response) {
              localStorageService.set(key + "-" + store, response.data);
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
        var val = localStorageService.get(key + "-" + store);

        if (val) {
          return $q.when(val);
        } else {
          //DSB - switch request to open source ce-store
          var url = server + "/ce-store/stores/" + store + "/queries/" + key + "/execute?showStats=false&suppressCe=true";

          return $http.get(url)
            .then(function(response) {
              localStorageService.set(key + "-" + store, response.data);
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
        var val = localStorageService.get(key + "-" + store);

        if (val) {
          return $q.when(val);
        } else {
          //DSB - switch request to open source ce-store
          var url = server + "/ce-store/stores/" + store + "/queries/" + key + "/execute?showStats=false&suppressCe=true";

          return $http.get(url)
            .then(function(response) {
              localStorageService.set(key + "-" + store, response.data);
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
          //DSB - switch request to open source ce-store
          var url = server + "/ce-store/stores/" + store + "/instances/" + project + "?steps=2&style=summary&referringInstances=false&limitRelationships=paper,technical%20area,citation%20count";
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

    // Not used
    function getEventSeriesDetails () {
      var key = 'event series details';

      if (localStorageService.isSupported) {
        var val = localStorageService.get(key + "-" + store);

        if (val) {
          return $q.when(val);
        } else {
          //DSB - switch request to open source ce-store
          var url = server + "/ce-store/stores/" + store + "/queries/" + key + "/execute?returnInstances=true";

          return $http.get(url)
            .then(function(response) {
              localStorageService.set(key + "-" + store, response.data);
              return response.data;
            }, function(err) {
              return err;
            });
        }
      }
    }

    function getComments () {
      var key = "comment";

      if (localStorageService.isSupported) {
        var val = localStorageService.get(key + "-" + store);

        if (val) {
          return $q.when(val);
        } else {
          //DSB - switch request to open source ce-store
          var url = server + "/ce-store/stores/" + store + "/concepts/" + key + "/instances";

          return $http.get(url)
            .then(function(response) {
              localStorageService.set(key + "-" + store, response.data);
              return response.data;
            }, function(err) {
              return err;
            });
        }
      }
    }

    function getIssues () {
      var key = "issue";

      if (localStorageService.isSupported) {
        var val = localStorageService.get(key + "-" + store);

        if (val) {
          return $q.when(val);
        } else {
          //DSB - switch request to open source ce-store
          var url = server + "/ce-store/stores/" + store + "/concepts/" + key + "/instances";

          return $http.get(url)
            .then(function(response) {
              localStorageService.set(key + "-" + store, response.data);
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
      getOrganisationPublications: getOrganisationPublications,
      getOrganisationDetails: getOrganisationDetails,
      getPersonDetails: getPersonDetails,
      getPeopleOrgs: getPeopleOrgs,
      getPersonDocument: getPersonDocument,
      getDocumentDetails: getDocumentDetails,
      getProject: getProject,
      getEventSeriesDetails: getEventSeriesDetails,
      getComments: getComments,
      getIssues: getIssues,
      getVoiceAcceptance: getVoiceAcceptance,
      setVoiceAcceptance: setVoiceAcceptance,
      getStatistics: getStatistics,
      getLastUpdated: getLastUpdated
    };
  }]);
