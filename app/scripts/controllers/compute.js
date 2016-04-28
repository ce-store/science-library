'use strict';

/**
 * @ngdoc function
 * @name itapapersApp.controller:ComputeCtrl
 * @description
 * # ComputeCtrl
 * Controller of the itapapersApp
 */
angular.module('itapapersApp')
  .controller('ComputeCtrl', ['$scope', '$stateParams', 'store', 'debug', 'server', function ($scope, $stateParams, store, debug, server) {

    if ($stateParams.debug) {
      debug.set($stateParams.debug);
    }

    store.getDataForCompute()
      .then(function(results) {
          var papers = {};
          var oas = {}
          var people = {};
          var organisations = {};
          var citations = {};
          var cas = {};
          var dates = {};

          $scope.computedCe = [];

          for (var i in results.data["academic document"]) {
            var inst = results.data["academic document"][i];
            inst.instances = {};
            inst.values = {};

            inst.instances["citation count"] = [];
            inst.instances["ordered authors"] = [];
            inst.instances["written by"] = [];
            inst.values["citation count"] = null;
            inst.values["original authors string"] = null;
            inst.values["weight"] = null;
            inst.values["alternative weight 1"] = null;
            inst.values["alternative weight 2"] = null;
            inst.extraTypes = [];

            papers[inst._id] = inst;
          }

          for (var i in results.data["ordered author"]) {
            var inst = results.data["ordered author"][i];
            inst.instances = {};
            inst.values = {};

            inst.instances["author person"] = null;

            oas[inst._id] = inst;
          }

          for (var i in results.data["published person"]) {
            var inst = results.data["published person"][i];
            inst.instances = {};
            inst.values = {};

            inst.instances["wrote"] = [];
            inst.instances["is employed by"] = null;
            inst.values["citation count"] = null;
            inst.values["h-index"] = null;

            people[inst._id] = inst;
          }

          for (var i in results.data["published organisation"]) {
            var inst = results.data["published organisation"][i];
            inst.instances = {};
            inst.values = {};

            inst.instances["employs"] = [];

            organisations[inst._id] = inst;
          }

          for (var i in results.data["paper citation count"]) {
              var inst = results.data["paper citation count"][i];
              inst.instances = {};
              inst.values = {};

              citations[inst._id] = inst;
          }

          for (var i in results.data["co-author statistic"]) {
            var inst = results.data["co-author statistic"][i];
            inst.instances = {};
            inst.values = {};

            inst.values["co-author count"] = [];

            cas[inst._id] = inst;
          }

          buildLinks(papers, citations, oas, people, organisations, cas, dates);

          computeDocumentOriginalAuthors(papers);
          computePersonCitations(people);
          computePersonHIndex(people);
          computeDocumentWeights(papers, people, organisations);
          computeDocumentTypes(papers);
          computeCoauthorCounts(cas, people);

          ceForDocumentOriginalAuthors(papers);
          ceForPersonCitations(people);
          ceForDocumentWeights(papers);
          ceForDocumentTypes(papers);
          ceForCoauthorCounts(cas);

          computeTotals(dates, papers);
          ceForTotals(dates);

          saveCeToStore();
      });

      function saveCeToStore() {
        var url = server + "/ce-store/stores/DEFAULT/sources/computedCe?showStats=true&action=save";
        var ce = "";

        for (var i in $scope.computedCe) {
          ce += $scope.computedCe[i] + "\n\n";
        }

        $.ajax({
          type: "POST",
          url: url,
          data: ce,
          contentType: "text/plain;charset=UTF-8"
        });
      }

      function buildLinks(papers, citations, oas, people, organisations, cas, dates) {
        for (var key in papers) {
          if (papers.hasOwnProperty(key)) {
            var paper = papers[key];
            
            var pubYear = paper.property_values["publication year"];

            if (pubYear) {
            	dates[pubYear] = { papers: [], people: [] };
            }

            linkPaperCitationCounts(paper, citations);
            linkPaperOrderedAuthors(paper, oas, people);
          }
        }

        for (var key in people) {
          if (people.hasOwnProperty(key)) {
            var person = people[key];

            linkPersonOrgs(person, organisations);
          }
        }

        dates["all"] = { papers: [], people: [] };
      }

      function linkPaperCitationCounts(paper, citations) {
      	var ccNames = paper.property_values["citation count"];

    	if (ccNames) {
          for (var i = 0; i < ccNames.length; ++i) {
            var ccName = ccNames[i];
            var ccInst = citations[ccName];

            if (ccInst) {
              paper.instances["citation count"].push(ccInst);
              paper.values["citation count"] = 0;
              if (ccInst.property_values["citation count"]) {
                paper.values["citation count"] = ccInst.property_values["citation count"][0] || 0;
              }
            } else {
              console.log("No ccInst for " + paper._id);
            }
          }
        } else {
          console.log("No ccNames for " + paper._id);
      	}
      }
      
      function linkPersonOrgs(person, organisations) {
        var orgNames = person.property_values["is employed by"];

      	if (orgNames) {
      	  var org = organisations[orgNames[0]];

      	  if (org) {
          	person.instances["is employed by"] = org;
          	org.instances["employs"].push(person);
          } else {
            console.log("No org for " + person._id);
          }
        } else {
          console.log("No orgNames for " + person._id);
        }
      }

      function linkPaperOrderedAuthors(paper, oas, people) {
      	var oaNames = paper.property_values["author"];

    	if (oaNames) {
          for (var i = 0; i < oaNames.length; ++i) {
            var oaName = oaNames[i];
            var oaInst = oas[oaName];

            if (oaInst) {
              paper.instances["ordered authors"].push(oaInst);
              var personNames = oaInst.property_values["author person"];

              for (var j = 0; j < personNames.length; ++j) {
                var personName = personNames[j];
                var person = people[personName];

                oaInst.instances["author person"] = person;
                person.instances["wrote"].push(paper);
                paper.instances["written by"].push(person);
              }
            } else {
              console.log("No oaInst for " + paper._id);
            }
          }
        } else {
          console.log("No oaNames for " + paper._id);
    	}
      }

      function computeDocumentOriginalAuthors(papers) {
        for (var paperId in papers) {
          if (papers.hasOwnProperty(paperId)) {
            var authorListText = "";
            var paper = papers[paperId];

            for (var oaId in paper.instances["ordered authors"]) {
              var oa = paper.instances["ordered authors"][oaId];
              var person = oa.instances["author person"];

              if (person) {
                var fullName = person.property_values["full name"][0];
                  	
                if (fullName) {
                  if (authorListText != "") {
                    authorListText += ", ";	
                  }
                  authorListText += fullName;
                }
              }
            }

            paper.values["original authors string"] = authorListText;
          }
        }
      }

      function computePersonCitations(people) {
        for (var personId in people) {
          if (people.hasOwnProperty(personId)) {
            var person = people[personId];
            var pcc = 0;

            for (var paperId in person.instances["wrote"]) {
              var paper = person.instances["wrote"][paperId];

              pcc += parseInt(paper.values["citation count"]);
            }

            person.values["citation count"] = pcc;
          }
        }
      }

      function computePersonHIndex(people) {
        for (var personId in people) {
          if (people.hasOwnProperty(personId)) {
            var person = people[personId];
            var ccList = [];

            for (var paperId in person.instances["wrote"]) {
              var paper = person.instances["wrote"][paperId];
              var pcc = paper.values["citation count"];
              
              if (pcc > 0) {
                ccList.push(parseInt(pcc));
              }
            }

            person.values["h-index"] = calculateHIndex(ccList);
          }
        }
      }

      function computeDocumentWeights(papers, people, organisations) {
        for (var paperId in papers) {
          var types = [];
      	  var weight = 0;
    	  var altWeight1 = 0;
    	  var altWeight2 = 0;

          if (papers.hasOwnProperty(paperId)) {
            var paper = papers[paperId];
            var authors = paper.instances["written by"];

            for (var i in authors) {
              var person = authors[i];
              var org = person.instances["is employed by"];
              var type = null;

              if (org.property_values["type"]) {
                type = org.property_values["type"][0];
              }

              if (types.indexOf(type) == -1) {
            	types.push(type);
              }
              
              if (person.direct_concept_names.indexOf("ITA person") > -1) {
            	weight += 100;
            	altWeight1 += 100;
            	altWeight2 += 100;
              } else {
                altWeight2 -= 100;
              }
            }
          }

          weight += types.length * 1000;

          if (types.indexOf("GOV") > -1) {
              altWeight1 += 2000;
              altWeight1 += (types.length -1) * 1000;

              altWeight2 += 2000;
              altWeight2 += (types.length -1) * 1000;
          } else {
              altWeight1 += types.length * 1000;
              altWeight2 += types.length * 1000;
          }
          
          paper.values["weight"] = weight;
          paper.values["alternative weight 1"] = altWeight1;
          paper.values["alternative weight 2"] = altWeight2;
        }        
      }

      function computeDocumentTypes(papers) {
        for (var paperId in papers) {
          if (papers.hasOwnProperty(paperId)) {
            var paper = papers[paperId];
            var allOrgs = [];

            for (var personId in paper.instances["written by"]) {
              var person = paper.instances["written by"][personId];

              var org = person.instances["is employed by"];
              if (allOrgs.indexOf(org) == -1) {
                allOrgs.push(org);
              }
            }

            if (allOrgs.length == 1) {
              paper.extraTypes.push("a single institute document");
            } else {
              var countries = []

              for (var i in allOrgs) {
                var org = allOrgs[i];
                var country = null;

                if (org.property_values["is affiliated to"]) {
                  country = org.property_values["is affiliated to"][0];
                }

                //Remove this if/when countries other than US and UK will be counted
                if ((country == "UK") || (country == "US")) {
                  if (countries.indexOf(country) == -1) {
                    countries.push(country);
                  }
                }
              }

              if (allOrgs.length > 1) {
            	paper.extraTypes.push("a collaborative document");
              } 

              if (countries.length > 1) {
              	paper.extraTypes.push("an international document");
              } 
            }
          }
        }
      }

      function computeCoauthorCounts(cas, people) {
        for (var casId in cas) {
          if (cas.hasOwnProperty(casId)) {
            var ca = cas[casId];

            var caNames = ca.property_values["co-author"];
            
            if (caNames.length == 2) {
            	var ca1 = people[caNames[0]];
            	var ca2 = people[caNames[1]];
                var papers1 = ca1.instances["wrote"];
                var papers2 = ca2.instances["wrote"];
                var joint = [];
                
                for (var i1 in papers1) {
                	var p1 = papers1[i1];
                    for (var i2 in papers2) {
                    	var p2 = papers1[i2];
                    	
                    	if (p1 == p2) {
                    		if (joint.indexOf(p1) == -1) {
                        		joint.push(p1);
                    		}
                    	}
                    }
                }

                ca.values["co-author count"] = joint.length;
                } else {
            	console.log("Unexpected number of co-authors (" + caNames.length + ") for co-author statistic " + ca._id);
            }
          }
        }
      }

      function computeTotals(dates, papers) {
    	  for (var i in dates) {
    		  var date = dates[i];

    		  for (var j in papers) {
    			  var paper = papers[j];

    			  if (paper.property_values["publication year"] == i) {
    				  date.papers.push(paper);
    				  
    				  for (var k in paper.instances["written by"]) {
    					  var person = paper.instances["written by"][k];
    					  
    					  if (date.people.indexOf(person) == -1) {
        					  date.people.push(person);
    					  }
    				  }
    			  }
    		  }
    	  }
    	  
		  for (var i in dates) {
    		  var date = dates[i];
    		  var siCount = 0;
    		  var cCount = 0;
    		  var iCount = 0;
    		  var gCount = 0;
    		  var jCount = 0;
    		  var ecCount = 0;
    		  var pCount = 0;
    		  var ccTot = 0;
    		  var iAuths = 0;
    		  var itaAuthors = [];
    		  var nonItaAuthors = [];

    		  date.stats = {};
    		  date.stats["total paper count"] = date.papers.length;
    		  
    		  for (var j in date.papers) {
    			  var paper = date.papers[j];

    			  for (var k in paper.instances["written by"]) {
    				  var person = paper.instances["written by"][k];
    				  
    				  if (person) {
    					  if (person.direct_concept_names.indexOf("ITA person") > -1) {
    						  if (itaAuthors.indexOf(person) == -1) {
    							  itaAuthors.push(person);
    						  }
    					  } else {
    						  if (nonItaAuthors.indexOf(person) == -1) {
    							  nonItaAuthors.push(person);
    						  }
    					  }
    				  }
    			  }

    			  if (paper.extraTypes.indexOf("a single institute document") > -1) {
    				  ++siCount;
    			  }
    			  if (paper.extraTypes.indexOf("a collaborative document") > -1) {
    				  ++cCount;
    			  }
    			  if (paper.extraTypes.indexOf("an international document") > -1) {
    				  ++iCount;
    			  }
    			  if (paper.direct_concept_names.indexOf("government document") > -1) {
    				  ++gCount;
    			  }
    			  if (paper.direct_concept_names.indexOf("journal document") > -1) {
    				  ++jCount;
    			  }
    			  if (paper.direct_concept_names.indexOf("external conference document") > -1) {
    				  ++ecCount;
    			  }
    			  if (paper.direct_concept_names.indexOf("patent") > -1) {
    				  ++pCount;
    			  }
    			  
    			  var cc = paper.instances["citation count"][0];

    			  if (cc) {
    				  ccTot += parseInt(cc.property_values["citation count"][0] || "0");
    			  }
    		  }

    		  date.stats["single institute paper count"] = siCount;
    		  date.stats["collaborative paper count"] = cCount;
    		  date.stats["international paper count"] = iCount;
    		  date.stats["government paper count"] = gCount;
    		  date.stats["journal paper count"] = jCount;
    		  date.stats["external conference paper count"] = ecCount;
    		  date.stats["patent count"] = pCount;
    		  date.stats["total citations"] = ccTot;
    		  date.stats["ITA authors"] = itaAuthors.length;
    		  date.stats["non-ITA authors"] = nonItaAuthors.length;
    	  }

    	  var tTotal = 0;
    	  var siTotal = 0;
    	  var cTotal = 0;
    	  var iTotal = 0;
    	  var gTotal = 0;
    	  var jTotal = 0;
    	  var ecTotal = 0;
    	  var pTotal = 0;
    	  var totCc = 0;
    	  var totIa = 0;
    	  var totNa = 0;

    	  for (var i in dates) {
    		  var date = dates[i];
    		  
    		  if (i != "all") {
    			  tTotal += date.stats["total paper count"];
    			  siTotal += date.stats["single institute paper count"];
    			  cTotal += date.stats["collaborative paper count"];
    			  iTotal += date.stats["international paper count"];
        		  gTotal += date.stats["government paper count"];
        		  jTotal += date.stats["journal paper count"];
        		  ecTotal += date.stats["external conference paper count"];
        		  pTotal += date.stats["patent count"];
        		  totCc += date.stats["total citations"];
        		  totIa += date.stats["ITA authors"];
        		  totNa += date.stats["non-ITA authors"];
    		  }
    	  }
    	  
    	  dates["all"].stats["total paper count"] = tTotal;
    	  dates["all"].stats["single institute paper count"] = siTotal;
    	  dates["all"].stats["collaborative paper count"] = cTotal;
    	  dates["all"].stats["international paper count"] = iTotal;
		  dates["all"].stats["government paper count"] = gTotal;
		  dates["all"].stats["journal paper count"] = jTotal;
		  dates["all"].stats["external conference paper count"] = ecTotal;
		  dates["all"].stats["patent count"] = pTotal;
		  dates["all"].stats["total citations"] = totCc;
		  dates["all"].stats["ITA authors"] = totIa;
		  dates["all"].stats["non-ITA authors"] = totNa;
      }

      function calculateHIndex(ccList) {
        var h, i, j = null;

        if (ccList.length == 0) {
          h = 0;
        } else if (ccList.length == 1) {
          h = 1;
        } else {
          ccList.sort(function(a,b) { return a-b;});
      	  h = 1

          for (i in ccList) {
            var cc = ccList[i];
            var gt = 0;

            for (j in ccList) {
              if (ccList[j] >= cc) {
                gt++;
              }
            }

            if (gt >= cc) {
              h = cc;
            }
          }
        }

        return h;
      }

      function ceForDocumentOriginalAuthors(papers) {
        var hdrText = "";
        hdrText += "--------------------------------------------\n";
        hdrText += "-- academic document:original authors string\n";
        hdrText += "--------------------------------------------\n";
        $scope.computedCe.push(hdrText);

        for (var paperId in papers) {
          if (papers.hasOwnProperty(paperId)) {
            var paper = papers[paperId];
            var authList = paper.values["original authors string"];

            var ceText = "";
            ceText += "the academic document '" + encodeForCe(paperId) + "'\n";
            ceText += "  has '" + encodeForCe(authList) + "' as original authors string.";
            
            $scope.computedCe.push(ceText);
          }
        }
      }

      function ceForPersonCitations(people) {
        var hdrText = "";
    	hdrText += "---------------------------------------------------\n";
    	hdrText += "-- published person:ita citation count, ita h-index\n";
    	hdrText += "---------------------------------------------------\n";
        $scope.computedCe.push(hdrText);

        for (var personId in people) {
          if (people.hasOwnProperty(personId)) {
            var person = people[personId];
            var cc = person.values["citation count"];
            var h = person.values["h-index"];

            var ceText = "";
            ceText += "the published person '" + encodeForCe(person._id) + "'\n";
            ceText += "  has '" + encodeForCe(cc) + "' as ita citation count and\n";
            ceText += "  has '" + encodeForCe(h) + "' as ita h-index.";

            $scope.computedCe.push(ceText);
          }
        }
      }

      function ceForDocumentWeights(papers) {
        var hdrText = "";
      	hdrText += "-----------------------------------------------------------------------\n";
      	hdrText += "-- academic document:weight, alternative weight 1, alternative weight 2\n";
      	hdrText += "-----------------------------------------------------------------------\n";
        $scope.computedCe.push(hdrText);

        for (var paperId in papers) {
          if (papers.hasOwnProperty(paperId)) {
            var paper = papers[paperId];
            var ceText = "";
            
            ceText += "the academic document '" + encodeForCe(paper._id) + "'\n";
            ceText += "  has '" + encodeForCe(paper.values["weight"]) + "' as weight and\n";
            ceText += "  has '" + encodeForCe(paper.values["alternative weight 1"]) + "' as alternative weight 1 and\n"
            ceText += "  has '" + encodeForCe(paper.values["alternative weight 2"]) + "' as alternative weight 2.";

            $scope.computedCe.push(ceText);
          }
        }
      }

      function ceForDocumentTypes(papers) {
        var hdrText = "";
        hdrText += "-------------------------\n";
        hdrText += "-- compute document types\n";
        hdrText += "-------------------------\n";
        $scope.computedCe.push(hdrText);

        for (var paperId in papers) {
          var paper = papers[paperId];
          var ceText = "";
          var firstTime = true;

          ceText = "the academic document '" + encodeForCe(paper._id) + "'\n";

          for (var typeId in paper.extraTypes) {
            var extraType = paper.extraTypes[typeId];

        	if (!firstTime) {
              ceText += " and\n";
            }

            ceText += "  is " + extraType;
            firstTime = false;
          }

          ceText += ".";
          $scope.computedCe.push(ceText);
        }
      }

      function ceForCoauthorCounts(cas) {
          var hdrText = "";
          hdrText += "--------------------------------------\n";
          hdrText += "-- co-author statistic:co-author count\n";
          hdrText += "--------------------------------------\n";
          $scope.computedCe.push(hdrText);

          for (var i in cas) {
            var ca = cas[i];
            var ceText = "";

            ceText += "the co-author statistic '" + encodeForCe(ca._id) + "'\n";
            ceText += "  has '" + ca.values["co-author count"] + "' as co-author count.";

        	$scope.computedCe.push(ceText);
          }
        }

      function ceForTotals(dates) {
        var hdrText = "";
        hdrText += "-------------------------\n";
        hdrText += "-- total:(all properties)\n";
        hdrText += "-------------------------\n";
        $scope.computedCe.push(hdrText);

        for (var i in dates) {
          var date = dates[i];
          var ceText = "";

          ceText += "the total 'total_" + i + "'\n";
          ceText += "  has '" + i + "' as scope and\n";
          ceText += "  has '" + date.stats["total paper count"] + "' as total paper count and\n";
          ceText += "  has '" + date.stats["single institute paper count"] + "' as single institute paper count and\n";
          ceText += "  has '" + date.stats["collaborative paper count"] + "' as collaborative paper count and\n";
          ceText += "  has '" + date.stats["international paper count"] + "' as international paper count and\n";
          ceText += "  has '" + date.stats["government paper count"] + "' as government paper count and\n";
          ceText += "  has '" + date.stats["journal paper count"] + "' as journal paper count and\n";
          ceText += "  has '" + date.stats["external conference paper count"] + "' as external conference paper count and\n";
          ceText += "  has '" + date.stats["patent count"] + "' as patent count and\n";
          ceText += "  has '" + date.stats["ITA authors"] + "' as active ITA authors and\n";
          ceText += "  has '" + date.stats["non-ITA authors"] + "' as active non-ITA authors and\n";
          ceText += "  has '" + date.stats["total citations"] + "' as total citations.";

          $scope.computedCe.push(ceText);
        }
      }

      function ceForTotals(dates) {
        var hdrText = "";
        hdrText += "-------------\n";
        hdrText += "-- UI message\n";
        hdrText += "-------------\n";
        $scope.computedCe.push(hdrText);

        var ceText = "";
        ceText += "there is a UI message named 'msg computed' that\n";
        ceText += "  has 'All data has been computed for the Science Library' as message text.";
        $scope.computedCe.push(ceText);
      }

      var encodeForCe = function(pValue) {
        var result = null;

        if (pValue != null) {
          result = String(pValue);
          result = result.replace(/\\/g, '\\\\');
          result = result.replace(new RegExp('\'', 'g'), '\\\'');
          result = result.replace(new RegExp('‘', 'g'), '\\‘');
          result = result.replace(new RegExp('’', 'g'), '\\’');
          result = result.replace(new RegExp('“', 'g'), '\\“');
          result = result.replace(new RegExp('”', 'g'), '\\”');
          result = result.replace(/(?:\r\n|\r|\n)/g, ' ');
        } else {
          result = '';
        }

        return result;
      }
  }]);
