'use strict';

/**
 * @ngdoc function
 * @name itapapersApp.controller:CollaborationCtrl
 * @description
 * # CollaborationCtrl
 * Controller of the itapapersApp
 */
angular.module('itapapersApp')
  .controller('CollaborationCtrl', ['$scope', '$stateParams', '$q', '$document', 'store', 'utils', 'documentTypes', 'csv', 'colours', function ($scope, $stateParams, $q, $document, store, utils, documentTypes, csv, colours) {
    $scope.authors = [];
    $scope.views = ["chart", "list"];
    $scope.currentView = $scope.views[0];
    $scope.journalInput = $scope.externalInput = $scope.patentInput = $scope.internalInput = $scope.technicalInput = $scope.otherInput = true;
    $scope.tipOpen = false;

    var types = documentTypes.nameMap;
    var buckets = {};
    var min, max;

    $scope.typeCount = {};
    $scope.typeCount[types[documentTypes.journal]] = 0;
    $scope.typeCount[types[documentTypes.external]] = 0;
    $scope.typeCount[types[documentTypes.patent]] = 0;
    $scope.typeCount[types[documentTypes.internal]] = 0;
    $scope.typeCount[types[documentTypes.technical]] = 0;
    $scope.typeCount[types[documentTypes.other]] = 0;

    // get window size
    $scope.width = window.innerWidth;
    $scope.height = window.innerHeight;

    var height = $scope.height - 270;

    // set max-height of papers list
    var elem = angular.element("#collaborations-papers-list");
    elem.css("height", (height + 20) + "px");

    elem = angular.element("#collaborations-papers-list .results-list");
    elem.css("max-height", "calc(100% - 75px)");

    $scope.showView = function (view) {
      $scope.currentView = view;
    };

    $scope.hideTips = function() {
      angular.element(".d3-tip").css("opacity", 0);
      angular.element(".d3-tip").css("display", "none");
      $scope.tipOpen = false;
    };

    $scope.filterPapers = function(value) {
      if (typeof value.type !== 'undefined') {
        return ($scope.journalInput &&
            value.type.indexOf(types[documentTypes.journal]) > -1) ||
          ($scope.externalInput &&
            value.type.indexOf(types[documentTypes.external]) > -1) ||
          ($scope.patentInput &&
            value.type.indexOf(types[documentTypes.patent]) > -1) ||
          ($scope.internalInput &&
            value.type.indexOf(types[documentTypes.internal]) > -1) ||
          ($scope.technicalInput &&
            value.type.indexOf(types[documentTypes.technical]) > -1) ||
          ($scope.otherInput &&
            value.type.indexOf(types[documentTypes.other]) > -1);
      }
    };

    var promises = [];
    var i, j;
    // get details for all authors
    for (i = 0; i < $stateParams.author.length; ++i) {
      promises.push(store.getAuthor($stateParams.author[i]));
    }

    $q.all(promises)
      .then(function(results) {
        var papers = [];

        // find papers written by all authors
        for (i = 0; i < results.length; ++i) {
          var result = results[i];
          var authorId = result.structured_response.main_instance._id;
          var props = result.structured_response.main_instance.property_values;

          // names
          var name = props["full name"] ? props["full name"][0] : null;
          $scope.authors.push({
            id: authorId,
            name: name
          });

          // papers
          if (i === 0) {
            papers = props.wrote;
          } else {
            var deleteIndexes = [];
            for (j = 0; j < papers.length; ++j) {
              var paper = papers[j];
              if (props.wrote) {
                if (props.wrote.indexOf(paper) < 0) {
                  deleteIndexes.push(j);
                }
              }
            }

            for (var k = deleteIndexes.length - 1; k >= 0; --k) {
              papers.splice(deleteIndexes[k], 1);
            }
          }
        }

        var relatedInstances = results[0].structured_response.related_instances;
        $scope.papers = [];
        var documentMap = {};
        var csvData = [];

        // generate papers list with details
        for (i = 0; i < papers.length; ++i) {
          var paperId = papers[i];
          var paperType = utils.getType(relatedInstances[paperId].direct_concept_names);
          var paperProps = relatedInstances[paperId].property_values;
          var paperName = paperProps.title ? paperProps.title[0] : null;
          var citations = 0;
          $scope.typeCount[paperType]++;

          if (!documentMap[paperId]) {
            var variantFound = false;
            var maxCitations = 0;

            // find max variant
            if (paperProps.variant) {
              for (j = 0; j < paperProps.variant.length; ++j) {
                var variantId = paperProps.variant[j];

                if (documentMap[variantId]) {
                  maxCitations = documentMap[variantId].citations > maxCitations ? documentMap[variantId].citations : maxCitations;
                  variantFound = variantId;
                }
              }
            }

            var citationId = paperProps["citation count"] ? paperProps["citation count"][0] : null;

            if (citationId) {
              var citationProps = relatedInstances[citationId].property_values;
              citations = citationProps["citation count"] ? citationProps["citation count"][0] : 0;

              if (!variantFound) {
                documentMap[paperId] = {
                  citations: citations,
                  index: i,
                  title: paperName,
                  noteworthy: paperProps["noteworthy reason"] ? paperProps["noteworthy reason"][0] : null,
                  types: [paperType],
                  venue: paperProps.venue ? paperProps.venue[0] : (paperProps["old venue"] ? paperProps["old venue"][0] : ""),
                  authors: paperProps["original authors string"] ? paperProps["original authors string"][0] : "",
                  weight: paperProps.weight ? paperProps.weight[0] : -1
                };
              } else {
                if (maxCitations < citations) {
                  var variantTypes = documentMap[variantFound].types.slice();
                  documentMap[variantFound] = null;
                  documentMap[paperId] = {
                    citations: citations,
                    index: i,
                    title: paperName,
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
            }
          }

          // get date properties
          var dateId = paperProps["final date"] ? paperProps["final date"][0] : null;
          if (dateId) {
            var month = relatedInstances[dateId].property_values.month;
            var year = relatedInstances[dateId].property_values.year;

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
              buckets[date][types[documentTypes.journal]] = [];
              buckets[date][types[documentTypes.external]] = [];
              buckets[date][types[documentTypes.patent]] = [];
              buckets[date][types[documentTypes.internal]] = [];
              buckets[date][types[documentTypes.technical]] = [];
              buckets[date][types[documentTypes.other]] = [];
            }

            buckets[date][paperType].push({
              id: paperId,
              title: paperName,
              citations: parseInt(citations, 10)
            });
          }
        }

        // recreate array - test for index to remove duplicate citations
        for (i = 0; i < papers.length; ++i) {
          var thisPaperId = papers[i];
          var thisPaper = documentMap[thisPaperId];

          if (thisPaper && thisPaper.index === i) {
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

            for (j = 0; j < paperItem.type.length; ++j) {
              paperItem.class.push(utils.getClassName(paperItem.type[j]));
              csvData.push([paperItem.id, paperItem.name, paperItem.value, paperItem.type[j], paperItem.venue, paperItem.authors]);
            }

            $scope.papers.push(paperItem);
          }
        }

        csv.setData(csvData);
        csv.setHeader(["paper id", "paper name", "citation count", "paper type", "venue", "authors"]);
        csv.setName($stateParams.author[0] + "_" + $stateParams.author[1] + "_collaborations");

        // calculate stats
        $scope.journalPapers = $scope.typeCount[types[documentTypes.journal]];
        $scope.externalPapers = $scope.typeCount[types[documentTypes.external]];
        $scope.patents = $scope.typeCount[types[documentTypes.patent]];
        $scope.internalPapers = $scope.typeCount[types[documentTypes.internal]];
        $scope.technicalReports = $scope.typeCount[types[documentTypes.technical]];
        $scope.otherDocuments = $scope.typeCount[types[documentTypes.other]];
        $scope.totalPublications = $scope.journalPapers + $scope.externalPapers + $scope.patents + $scope.internalPapers;

        // build chart data
        if (min && max) {
          // add empty buckets
          var thisDate = min;
          while (thisDate.getTime() !== max.getTime()) {
            if (!buckets[thisDate]) {
              buckets[thisDate] = {};
              buckets[thisDate][types[documentTypes.journal]] = [];
              buckets[thisDate][types[documentTypes.external]] = [];
              buckets[thisDate][types[documentTypes.patent]] = [];
              buckets[thisDate][types[documentTypes.internal]] = [];
              buckets[thisDate][types[documentTypes.technical]] = [];
              buckets[thisDate][types[documentTypes.other]] = [];
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
          for (var d in buckets) {
            chartData.push({
              date: d,
              journal: buckets[d][types[documentTypes.journal]],
              external: buckets[d][types[documentTypes.external]],
              patent: buckets[d][types[documentTypes.patent]],
              internal: buckets[d][types[documentTypes.internal]],
              technical: buckets[d][types[documentTypes.technical]],
              other: buckets[d][types[documentTypes.other]]
            });
          }

          drawBarChart(chartData);
        }

        var pieData = [{
          label: types[documentTypes.journal],
          value: $scope.journalPapers
        }, {
          label: types[documentTypes.external],
          value: $scope.externalPapers
        }, {
          label: types[documentTypes.patent],
          value: $scope.patents
        }, {
          label: types[documentTypes.internal],
          value: $scope.internalPapers
        }, {
          label: types[documentTypes.technical],
          value: $scope.technicalReports
        }, {
          label: types[documentTypes.other],
          value: $scope.otherDocuments
        }];

        drawPieChart(pieData);
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
        .attr('fill', function(d) {
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
          width = ($scope.width - 150 - margin.left - margin.right) * 0.66,
          height = $scope.height - 370 - margin.top - margin.bottom;
      var tipOpen = false;

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
              var citations = d.papers[i].citations;
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
