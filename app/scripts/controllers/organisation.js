'use strict';

/**
 * @ngdoc function
 * @name itapapersApp.controller:OrganisationCtrl
 * @description
 * # OrganisationCtrl
 * Controller of the itapapersApp
 */
angular.module('itapapersApp')
  .controller('OrganisationCtrl', ['$scope', '$stateParams', '$document', 'store', 'hudson', 'debug', 'documentTypes', 'utils', 'csv', 'colours', function ($scope, $stateParams, $document, store, hudson, debug, documentTypes, utils, csv, colours) {
    $scope.views = ["chart", "list", "authors"];
    $scope.currentView = $scope.views[0];
    $scope.journalType = documentTypes.journal;
    $scope.externalConferenceType = documentTypes.external;
    $scope.patentType = documentTypes.patent;
    $scope.internalConferenceType = documentTypes.internal;
    $scope.technicalReportType = documentTypes.technical;
    $scope.otherDocumentType = documentTypes.other;
    $scope.journalInput = $scope.externalInput = $scope.patentInput = $scope.internalInput = $scope.technicalInput = $scope.otherInput = true;
    $scope.tipOpen = false;

    var lastHighlight = null;
    var types = documentTypes.nameMap;

    if ($stateParams.debug) {
      debug.set($stateParams.debug);
    }

    $scope.$on('question:added', function() {
      refreshHighlight();
    });

    $scope.showView = function (view) {
      $scope.currentView = view;
    };

    var refreshHighlight = function() {
      var qa = hudson.getLatestQuestion();

      if (lastHighlight) {
        $scope[lastHighlight] = false;
      }

      if (qa && qa.type === 'highlight') {
        $scope[qa.property + 'Highlight'] = true;
        lastHighlight = qa.property + 'Highlight';
      }
    };

    $scope.hideTips = function() {
      angular.element(".d3-tip").css("opacity", 0);
      angular.element(".d3-tip").css("display", "none");
      $scope.tipOpen = false;
    };

    $scope.filterPapers = function(value) {
      if (typeof value.type !== 'undefined') {
        return ($scope.journalInput &&
            value.type.indexOf(types[$scope.journalType]) > -1) ||
          ($scope.externalInput &&
            value.type.indexOf(types[$scope.externalConferenceType]) > -1) ||
          ($scope.patentInput &&
            value.type.indexOf(types[$scope.patentType]) > -1) ||
          ($scope.internalInput &&
            value.type.indexOf(types[$scope.internalConferenceType]) > -1) ||
          ($scope.technicalInput &&
            value.type.indexOf(types[$scope.technicalReportType]) > -1) ||
          ($scope.otherInput &&
            value.type.indexOf(types[$scope.otherDocumentType]) > -1);
      }
    };

    // get window size
    $scope.width = window.innerWidth;
    $scope.height = window.innerHeight;

    var height = $scope.height - 270;

    // set max-height of papers list
    var elem = angular.element("#org-papers-list");
    elem.css("height", (height + 20) + "px");

    elem = angular.element("#org-papers-list .results-list");
    elem.css("max-height", "calc(100% - 75px)");

    // set max-height of authors list
    elem = angular.element("#org-authors-list");
    elem.css("height", height + "px");

    elem = angular.element("#org-authors-list .results-list");
    elem.css("max-height", "calc(100% - 55px)");

    store.getOrganisation($stateParams.organisationId)
      .then(function(data) {
        var buckets = {};
        $scope.papers = {};
        $scope.variants = {};
        $scope.employees = {};
        var min, max;

        var properties = data.main_instance.property_values;
        var relatedInstances = data.related_instances;

        $scope.name = properties.name ? properties.name[0] : null;
        $scope.industry = properties.type ? properties.type[0] : null;
        $scope.country = properties["is located at"] ? properties["is located at"][0] : null;

        $scope.journalPapers = properties["journal paper count"] ? parseInt(properties["journal paper count"][0], 10) : 0;
        $scope.externalPapers = properties["external paper count"] ? parseInt(properties["external paper count"][0], 10) : 0;
        $scope.patents = properties["patent count"] ? parseInt(properties["patent count"][0], 10) : 0;
        $scope.internalPapers = properties["internal paper count"] ? parseInt(properties["internal paper count"][0], 10) : 0;
        $scope.technicalReports = properties["technical report count"] ? parseInt(properties["technical report count"][0], 10) : 0;
        $scope.otherDocuments = properties["other document count"] ? parseInt(properties["other document count"][0], 10) : 0;

//DSB - changed to use CE computed value
//        $scope.totalPublications = $scope.journalPapers + $scope.externalPapers + $scope.patents + $scope.internalPapers;
        $scope.totalPublications = properties["paper count"] ? parseInt(properties["paper count"][0], 10) : 0;

        var employees = properties.employs;
        var documentMap = {};
        var csvData = [];

        // loop through employees
        for (var i = 0; i < employees.length; ++i) {
          var authorId = employees[i];
          var author = relatedInstances[authorId];
          var authorProps = author.property_values;

          var authorName = authorProps["full name"] ? authorProps["full name"][0] : null;

          // count papers
          var thisJournalPapers = authorProps["journal paper count"] ? parseInt(authorProps["journal paper count"][0], 10) : 0;
          var thisExternalPapers = authorProps["external paper count"] ? parseInt(authorProps["external paper count"][0], 10) : 0;
          var thisPatentPapers = authorProps["patent count"] ? parseInt(authorProps["patent count"][0], 10) : 0;
          var thisInternalPapers = authorProps["internal paper count"] ? parseInt(authorProps["internal paper count"][0], 10) : 0;
//DSB - changed to use CE computed value
//          var totalCount = thisJournalPapers + thisExternalPapers + thisPatentPapers + thisInternalPapers;
          var totalCount = authorProps["total publication count"] ? parseInt(authorProps["total publication count"][0], 10) : 0;

          // add author to employee list
          $scope.employees[authorId] = {
            id: authorId,
            name: authorName,
            value: totalCount
          };

          var papers = authorProps.wrote;

          // loop through papers
          if (papers) {
            var j, k;
            for (j = 0; j < papers.length; ++j) {
              var paperId = papers[j];
              var paper = relatedInstances[paperId];
              var paperProps = paper.property_values;

              var paperTitle = paperProps.title ? paperProps.title[0] : null;
              var paperType = utils.getType(paper.direct_concept_names);
              var paperCitationCount = 0;

              // check variant hasn't already been added
              if (!documentMap[paperId]) {
                var variantFound = false;
                var maxCitations = 0;

                // find max variant
                if (paperProps.variant) {
                  for (k = 0; k < paperProps.variant.length; ++k) {
                    var variantId = paperProps.variant[k];

                    if (documentMap[variantId]) {
                      maxCitations = documentMap[variantId].citations > maxCitations ? documentMap[variantId].citations : maxCitations;
                      variantFound = variantId;
                    }
                  }
                }

                var citationId = paperProps["citation count"] ? paperProps["citation count"][0] : null;

                if (citationId) {
                  var citation = relatedInstances[citationId];
                  var citationProps = citation.property_values;

                  // set citation count in map
                  paperCitationCount = citationProps["citation count"] ? parseInt(citationProps["citation count"][0], 10) : 0;
                  if (!variantFound) {
                    documentMap[paperId] = {
                      citations: paperCitationCount,
                      index: j,
                      title: paperTitle,
                      noteworthy: paperProps["noteworthy reason"] ? paperProps["noteworthy reason"][0] : null,
                      types: [paperType],
                      venue: paperProps.venue ? paperProps.venue[0] : (paperProps["old venue"] ? paperProps["old venue"][0] : ""),
                      authors: paperProps["original authors string"] ? paperProps["original authors string"][0] : "",
                      weight: paperProps.weight ? paperProps.weight[0] : -1
                    };
                  } else {
                    if (maxCitations < paperCitationCount) {
                      var variantTypes = documentMap[variantFound].types.slice();
                      documentMap[variantFound] = null;
                      documentMap[paperId] = {
                        citations: paperCitationCount,
                        index: j,
                        title: paperTitle,
                        noteworthy: paperProps["noteworthy reason"] ? paperProps["noteworthy reason"][0] : null,
                        types: [paperType].concat(variantTypes),
                        venue: paperProps.venue ? paperProps.venue[0] : (paperProps["old venue"] ? paperProps["old venue"][0] : ""),
                        authors: paperProps["original authors string"] ? paperProps["original authors string"][0] : "",
                        weight: paperProps.weight ? paperProps.weight[0] : -1
                      };
                    } else {
                      documentMap[variantFound].types.push(paperType);
                    }
                  }

                  // get date properties
                  var dateId = null;
                  var month = null;
                  var year = null;

                  if (paperProps["final date"]) {
                    dateId = paperProps["final date"][0];
                    month = relatedInstances[dateId].property_values.month
                    year = relatedInstances[dateId].property_values.year
                  }

                  if (!month) {
                    month = '1';
                  }

                  // month indexed from 1 in CE
                  var date = new Date(year, month - 1);

                  if (!min || date < min) {
                    min = date;
                  }
                  if (!max || date > max) {
                    max = date;
                  }

                  if (!buckets[date]) {
                    buckets[date] = {};
                    buckets[date][types[$scope.journalType]] = [];
                    buckets[date][types[$scope.externalConferenceType]] = [];
                    buckets[date][types[$scope.patentType]] = [];
                    buckets[date][types[$scope.internalConferenceType]] = [];
                    buckets[date][types[$scope.technicalReportType]] = [];
                    buckets[date][types[$scope.otherDocumentType]] = [];
                  }

                  // buckets[date][paperType]++;
                  buckets[date][paperType].push({
                    id: paperId,
                    title: paperTitle,
                    citations: paperCitationCount
                  });
                }
              }
            }

            // recreate array - test for index to remove duplicate citations
            for (j = 0; j < papers.length; ++j) {
              var thisPaperId = papers[j];
              var thisPaper = documentMap[thisPaperId];

              if (thisPaper && thisPaper.index === j) {
                var paperItem = {
                  id: thisPaperId,
                  name: thisPaper.title,
                  noteworthy: thisPaper.noteworthy,
                  value: thisPaper.citations,
                  type: utils.sortTypes(thisPaper.types),
                  venue: thisPaper.venue,
                  authors: thisPaper.authors,
                  class: [],
                  weight: thisPaper.weight
                };

                for (k = 0; k < paperItem.type.length; ++k) {
                  paperItem.class.push(utils.getClassName(paperItem.type[k]));
                  csvData.push([paperItem.id, paperItem.name, paperItem.value, paperItem.type[k], paperItem.venue, paperItem.authors]);
                }

                $scope.papers[thisPaperId] = (paperItem);
              }
            }
          }
        }

        csv.setData(csvData);
        csv.setHeader(["paper id", "paper name", "citation count", "paper type", "venue", "authors"]);
        csv.setName($stateParams.organisationId);

        // build chart data
        if (min && max) {
          // add empty buckets
          var thisDate = min;
          while (thisDate.getTime() !== max.getTime()) {
            if (!buckets[thisDate]) {
              buckets[thisDate] = {};
              buckets[thisDate][types[$scope.journalType]] = [];
              buckets[thisDate][types[$scope.externalConferenceType]] = [];
              buckets[thisDate][types[$scope.patentType]] = [];
              buckets[thisDate][types[$scope.internalConferenceType]] = [];
              buckets[thisDate][types[$scope.technicalReportType]] = [];
              buckets[thisDate][types[$scope.otherDocumentType]] = [];
            }

            var thisMonth = thisDate.getMonth();
            if (parseInt(thisMonth, 10) < 11) {
              thisDate.setMonth(thisMonth + 1);
            } else {
              var thisYear = thisDate.getFullYear();
              thisDate.setMonth(0);
              thisDate.setFullYear(parseInt(thisYear, 10) + 1);
            }
          }

          var chartData = [];
          for (var date in buckets) {
            chartData.push({
              date: date,
              journal: buckets[date][types[$scope.journalType]],
              external: buckets[date][types[$scope.externalConferenceType]],
              patent: buckets[date][types[$scope.patentType]],
              internal: buckets[date][types[$scope.internalConferenceType]],
              technical: buckets[date][types[$scope.technicalReportType]],
              other: buckets[date][types[$scope.otherDocumentType]]
            });
          }

          var pieData = [{
            label: types[$scope.journalType],
            value: $scope.journalPapers
          }, {
            label: types[$scope.externalConferenceType],
            value: $scope.externalPapers
          }, {
            label: types[$scope.patentType],
            value: $scope.patents
          }, {
            label: types[$scope.internalConferenceType],
            value: $scope.internalPapers
          }, {
            label: types[$scope.technicalReportType],
            value: $scope.technicalReports
          }, {
            label: types[$scope.otherDocumentType],
            value: $scope.otherDocuments
          }];

          drawBarChart(chartData);
          drawPieChart(pieData);
          refreshHighlight();
        }
      });

    var drawPieChart = function(data) {
      var width = ($scope.width - 200) * 0.25;
      var height = $scope.height - 500;

      if ($scope.width < 1000 || height < 300) {
        width = 300;
        height = 300;
      }

      var radius = Math.min(width, height) / 2;
      var donutWidth = width / 6;
      var legendRectSize = 18;
      var legendSpacing = 5;

      var color = d3.scale.ordinal()
          .range(colours.papers);

      var svg = d3.select('#pie-chart')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr("class", "pie-svg")
        .append('g')
        .attr('transform', 'translate(' + (width / 2) +
          ',' + (height / 2) + ')');

      var arc = d3.svg.arc()
        .innerRadius(radius - donutWidth)
        .outerRadius(radius);

      var pie = d3.layout.pie()
        .value(function(d) { return d.value; })
        .sort(null);

      var path = svg.selectAll('path')
        .data(pie(data))
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', function(d, i) {
          return color(d.data.label);
        });

        var totals = [];
        var hiddenLegendRows = 0;

        var legend = svg.selectAll('.legend')
          .data(color.domain())
          .enter()
          .append('g')
          .attr('class', 'legend')
          .attr('display', function(d) {
            for (var i = 0; i < data.length; ++i) {
              if (data[i].label === d) {
                totals.push(data[i].value);
                if (!data[i].value) {
                  return 'none';
                }
              }
            }
          })
          .attr('transform', function(d, i) {
            hiddenLegendRows = totals[i] === 0 ? hiddenLegendRows + 1 : hiddenLegendRows;
            var height = legendRectSize + legendSpacing;
            var offset =  height * color.domain().length / 2;
            var horz = -2.5 * legendRectSize;
            var vert = (i - hiddenLegendRows) * height - offset;
            return 'translate(' + horz + ',' + vert + ')';
          });

        legend.append('rect')
          .attr('width', legendRectSize)
          .attr('height', legendRectSize)
          .style('fill', color)
          .style('stroke', color);

        legend.append('text')
          .attr('x', legendRectSize + legendSpacing)
          .attr('y', legendRectSize - legendSpacing)
          .attr('class', 'pie-legend-text')
          .text(function(d) { return d; });
    };

    var drawBarChart = function(data) {
      var margin = {top: 20, right: 20, bottom: 50, left: 40},
          width = ($scope.width - 150 - margin.left - margin.right) * 0.75,
          height = $scope.height - 370 - margin.top - margin.bottom;

      var x = d3.scale.ordinal()
          .rangeRoundBands([0, width], 0.1);

      var y = d3.scale.linear()
          .rangeRound([height, 0]);

      var color = d3.scale.ordinal()
          .range(colours.papers);

      var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "June",
        "July", "Aug", "Sept", "Oct", "Nov", "Dec"
      ];

      var xAxis = d3.svg.axis()
          .scale(x)
          .tickFormat(function(d, i) {
            var dateObj = new Date(d);

            if (x.domain().length < 12) {
              return monthNames[dateObj.getMonth()] + " " + dateObj.getFullYear();
            }

            if (dateObj.getMonth() === 0) {
              return dateObj.getFullYear();
            }
          })
          .orient("bottom");

      var yAxis = d3.svg.axis()
          .scale(y)
          .orient("left");

      var tip = d3.tip()
          .attr('class', 'd3-tip dark-tip')
          .offset([-10, 0])
          .html(function(d) {
            var html = "<ul class='org-tip-content results-list'>";

            for (var i = 0; i < d.papers.length; ++i) {
              var id = d.papers[i].id;
              var title = d.papers[i].title;
              html += "<li><a class='list-name' href='paper/" + id + "'>" + title + "</a></li>";
            }

            html += "</ul>";
            return html;
          });

      var svg = d3.select("#bar-chart").append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .attr("class", "organisation-bar-chart")
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      svg.call(tip);

      color.domain(d3.keys(data[0]).filter(function(key) { return key !== "date"; }));

      var totals = {
        journal: 0,
        external: 0,
        patent: 0,
        internal: 0,
        technical: 0,
        other: 0
      };

      data.forEach(function(d) {
        var y0 = 0;
        d.papers = color.domain().map(function(name) {
          return {
            name: name,
            y0: y0,
            y1: y0 += +d[name].length,
            papers: d[name].sort(function(a, b) {
              return b.citations - a.citations;
            })
          };
        });
        d.total = d.papers[d.papers.length - 1].y1;

        totals.journal += d.journal.length;
        totals.external += d.external.length;
        totals.patent += d.patent.length;
        totals.internal += d.internal.length;
        totals.technical += d.technical.length;
        totals.other += d.other.length;
      });

      data.sort(function(a, b) {
        var aDate = new Date(a.date);
        var bDate = new Date(b.date);
        return aDate - bDate;
      });

      x.domain(data.map(function(d) {
        return d.date;
      }));
      y.domain([0, d3.max(data, function(d) { return d.total; })]);

      svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis)
        .selectAll("text")
          .attr("x", -11)
          .attr("y", 10)
          .style("text-anchor", "start");

      svg.append("g")
          .attr("class", "y axis")
          .call(yAxis)
        .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", ".71em")
          .style("text-anchor", "end")
          .text("No. of papers");

      var bar = svg.selectAll(".bar")
          .data(data)
        .enter().append("g")
          .attr("class", "g")
          .attr("transform", function(d) { return "translate(" + x(d.date) + ",0)"; });

      bar.selectAll("rect")
          .data(function(d) { return d.papers; })
        .enter().append("rect")
          .attr("width", x.rangeBand())
          .attr("y", function(d) { return y(d.y1); })
          .attr("height", function(d) { return y(d.y0) - y(d.y1); })
          .style("fill", function(d) { return color(d.name); })
          .on('click', function(d) {
            if (!$scope.tipOpen) {
              angular.element(".d3-tip").css("display", "inline");
              tip.show(d);
              $scope.tipOpen = !$scope.tipOpen;
            }
          });

      // handle hiding tooltip
      $document.mouseup(function (e) {
        var container = angular.element("d3-tip");
        if ($scope.tipOpen && !container.is(e.target)) {
          $scope.hideTips();
        }
      });

      d3.selectAll("g.x.axis g.tick line")
          .attr("y2", function(d) {
            var dateObj = new Date(d);
            if (dateObj.getMonth() === 0) {
              return 6;
            } else {
              return 0;
            }
          });

      var hiddenLegendRows = 0;

      var legend = svg.selectAll(".legend")
          .data(color.domain().slice())
        .enter().append("g")
          .attr("class", "legend")
          .attr('display', function(d) {
            if (!totals[d]) {
              return 'none';
            }
          })
          .attr("transform", function(d, i) {
            hiddenLegendRows = totals[d] === 0 ? hiddenLegendRows + 1 : hiddenLegendRows;
            return "translate(0," + (i - hiddenLegendRows) * 20 + ")";
          });

      legend.append("rect")
          .attr("x", width - 18)
          .attr("width", 18)
          .attr("height", 18)
          .style("fill", color);

      legend.append("text")
          .attr("x", width - 24)
          .attr("y", 9)
          .attr("dy", ".35em")
          .style("text-anchor", "end")
          .text(function(d) {
            if (d === "journal") {
              return "Journal";
            } else if (d === "external") {
              return "External Conference";
            } else if (d === "patent") {
              return "Patent";
            } else if (d === "internal") {
              return "Internal Conference";
            } else if (d === "technical") {
              return "Technical Report";
            } else if (d === "other") {
              return "Other Document";
            }
          });
    };
  }]);
