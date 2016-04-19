'use strict';

/**
 * @ngdoc function
 * @name itapapersApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the itapapersApp
 */
angular.module('itapapersApp')
  .controller('MainCtrl', ['$scope', '$stateParams', '$location', '$sce', 'store', 'charts', 'debug', 'documentTypes', 'utils', 'csv', 'colours', 'localStorageService', 'server', function ($scope, $stateParams, $location, $sce, store, charts, debug, documentTypes, utils, csv, colours, localStorageService, server) {
    $scope.listTypes = ['papers', 'authors', 'venues', 'projects', 'organisations', 'co-authors'];
    $scope.listLength = 50;
    $scope.listName = $scope.listTypes[0];
    $scope.sortNames = ['authors', 'papers'];
    $scope.sortName = $scope.sortNames[0];
    $scope.sortValues = ['-value', '-papers'];
    $scope.sortValue = $scope.sortValues[0];
    $scope.journalType = documentTypes.journal;
    $scope.externalConferenceType = documentTypes.external;
    $scope.patentType = documentTypes.patent;
    $scope.internalConferenceType = documentTypes.internal;
    $scope.technicalReportType = documentTypes.technical;
    $scope.otherDocumentType = documentTypes.other;
    $scope.journalInput = $scope.externalInput = $scope.patentInput = $scope.internalInput = $scope.technicalInput = $scope.otherInput = $scope.acInput = $scope.indInput = $scope.govInput = true;

    $scope.scatterYAxisOpts = ["hIndex", "citations"];
    $scope.scatterYAxis = $scope.scatterYAxisOpts[0];
    var scatterYAxisNames = {};
    scatterYAxisNames[$scope.scatterYAxisOpts[0]] = "H-Index";
    scatterYAxisNames[$scope.scatterYAxisOpts[1]] = "Citation Count";

    var scatterColour = d3.scale.ordinal()
        .domain(["AC", "IND", "GOV"])
        .range(colours.areas);

    var legendMap = {
      'AC': 'Academic',
      'IND': 'Industry',
      'GOV': 'Government',
      'Unknown': 'Unknown'
    };

    var unknown = "unknown";
    var types = documentTypes.nameMap;
    var change;

    if ($stateParams.debug) {
      debug.set($stateParams.debug);
    }

    var resetTypeCount = function() {
      $scope.typeCount = {};
      $scope.typeCount[types[$scope.journalType]] = 0;
      $scope.typeCount[types[$scope.externalConferenceType]] = 0;
      $scope.typeCount[types[$scope.patentType]] = 0;
      $scope.typeCount[types[$scope.internalConferenceType]] = 0;
      $scope.typeCount[types[$scope.technicalReportType]] = 0;
      $scope.typeCount[types[$scope.otherDocumentType]] = 0;
    };

    resetTypeCount();

    $scope.select = function(type) {
      $scope.listName = type;
      $scope.list = [];
      getData(type);
    };

    $scope.sort = function(i) {
      $scope.sortName = $scope.sortNames[i];
      $scope.sortValue = $scope.sortValues[i];
      change();
    };

    $scope.reset = function () {
      localStorageService.clearAll();
      localStorage.clear();
    };

    // get window size
    $scope.width = window.innerWidth;
    $scope.height = window.innerHeight;

    // set max-height of results lists
    var resultsListElems = angular.element(".results-list");
    var maxHeight = $scope.height - 305;
    resultsListElems.css("max-height", maxHeight + "px");

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

    $scope.filterOrganisations = function(value) {
      return ($scope.acInput && value.area === "AC") ||
      ($scope.indInput && value.area === "IND") ||
      ($scope.govInput && value.area === "GOV");
    };

    var populateList = function(data, instances) {
      $scope.list = [];
      $scope.areaNames = [];
      $scope.projects = {};
      var csvData = [];
      var csvHeader;
      var csvName;

      resetTypeCount();

      // loop through results and extract relevant data
      for (var i = 0; i < data.length; ++i) {
        var id, citations, name, hIndex, totalPubs, type, className, value, papers, weight, noteworthy;
        var citationProps;
        var area, areaId;

        id = data[i][0];

        if ($scope.listName === $scope.listTypes[0]) {
          // papers page
          var paperProps = instances[data[i][0]].property_values;
          citationProps = instances[data[i][1]].property_values;

          name = paperProps.title ? paperProps.title[0] : unknown;
          citations = citationProps["citation count"] ? parseInt(citationProps["citation count"][0], 10) : 0;
          weight = paperProps.weight ? paperProps.weight[0] : -1;

          // set types for duplicates and non-duplicates
          var types = data[i][3];
          var j;
          if (types.length > 1) {
            type = utils.sortTypes(types);
            for (j in types) {
              $scope.typeCount[types[j]]++;
            }
          } else {
            type = [types[0]];
            $scope.typeCount[type]++;
          }

          // noteworthy
          noteworthy = paperProps["noteworthy reason"] ? paperProps["noteworthy reason"][0] : null;

          // generate class names
          className = [];
          for (j = 0; j < type.length; ++j) {
            className.push(utils.getClassName(type[j]));

            var venue = paperProps.venue ? paperProps.venue[0] : (paperProps["old venue"] ? paperProps["old venue"] : "");
            var authors = paperProps["original authors string"] ? paperProps["original authors string"][0] : "";
            csvData.push([id, name, citations, type[j], venue, authors]);
          }
        } else if ($scope.listName === $scope.listTypes[1]) {
          // authors page
          var personProps = instances[data[i][0]].property_values;
          citationProps = instances[data[i][1]].property_values;

          name = data[i][3];
          citations = personProps["ita citation count"] ? parseInt(personProps["ita citation count"][0], 10) : 0;
          hIndex = personProps["ita h-index"] ? parseInt(personProps["ita h-index"][0], 10) : 0;

          var journals = personProps["journal paper count"] ? parseInt(personProps["journal paper count"][0], 10) : 0;
          var conferences = personProps["conference paper count"] ? parseInt(personProps["conference paper count"][0], 10) : 0;
          totalPubs = journals + conferences;

          csvData.push([id, name, citations, hIndex]);
        } else if ($scope.listName === $scope.listTypes[2]) {
          // venues page
          name = data[i][1];

          csvData.push([id, name]);
        } else if ($scope.listName === $scope.listTypes[3]) {
          // projects page
          areaId = data[i][1];
          var projectProps = instances[id].property_values;
          name = projectProps.name ? projectProps.name[0] : null;
          value = projectProps.paper ? projectProps.paper.length : 0;
          area = instances[areaId].property_values.name ? instances[areaId].property_values.name[0] : null;

          csvData.push([areaId, area, id, name, value]);
        } else if ($scope.listName === $scope.listTypes[4]) {
          // organisations page
          var orgProps = instances[id].property_values;
          name = orgProps.name ? orgProps.name[0] : null;
          value = orgProps.employs ? orgProps.employs.length : 0;
          papers = orgProps["paper count"] ? orgProps["paper count"][0] : 0;
          area = orgProps.type ? orgProps.type[0] : null;
          if (area) {
            className = utils.getClassName(area);
          }

          csvData.push([id, name, area, value, papers]);
        }

        // set value property
        if ($scope.listName === $scope.listTypes[0]) {
          value = citations;
        } else if ($scope.listName === $scope.listTypes[1]) {
          value = totalPubs;
        }

        if ($scope.listName === $scope.listTypes[3]) {
          if (!$scope.projects[area]) {
            $scope.projects[area] = [];
            $scope.areaNames.push(area);
          }

          $scope.projects[area].push({
            id: id,
            name: name,
            value: parseInt(value, 10),
            papers: parseInt(papers, 10),
            class: className
          });
        } else {
          // push results to list
          $scope.list.push({
            id: id,
            name: name,
            value: parseInt(value, 10),
            papers: parseInt(papers, 10),
            area: area,
            areaId: areaId,
            type: type,
            class: className,
            weight: weight,
            noteworthy: noteworthy
          });
        }
      }

      if ($scope.listName === $scope.listTypes[0]) {
        csvHeader = ["paper id", "name", "citation count", "paper type", "venue", "authors"];
        csvName = "papers";
      } else if ($scope.listName === $scope.listTypes[1]) {
        csvHeader = ["author id", "name", "citation count", "h-index count"];
        csvName = "authors";
      } else if ($scope.listName === $scope.listTypes[2]) {
        csvHeader = ["venue id", "name"];
        csvName = "venues";
      } else if ($scope.listName === $scope.listTypes[3]) {
        csvHeader = ["technical area id", "technical area name", "project id", "project name", "papers count"];
        csvName = "projects";
      } else if ($scope.listName === $scope.listTypes[4]) {
        csvHeader = ["organisation id", "name", "type", "employee count", "papers count"];
        csvName = "organisations";
      }

      csv.setName(csvName);
      csv.setHeader(csvHeader);
      csv.setData(csvData);
    };

    var getData = function() {
      store.getLastUpdated()
        .then(function(response) {
          if (response.results.length > 0) {
            $scope.lastUpdated = response.results[0][1];
          }
        });

      if ($scope.listName === $scope.listTypes[0]) {
        store.getAcademicDocuments()
          .then(function(results) {
            populateList(results.data, results.instances);

            $scope.journalPapers = $scope.typeCount[types[$scope.journalType]];
            $scope.externalPapers = $scope.typeCount[types[$scope.externalConferenceType]];
            $scope.patents = $scope.typeCount[types[$scope.patentType]];
            $scope.internalPapers = $scope.typeCount[types[$scope.internalConferenceType]];
            $scope.technicalReports = $scope.typeCount[types[$scope.technicalReportType]];
            $scope.otherDocuments = $scope.typeCount[types[$scope.otherDocumentType]];

//DSB - changed to use only journal and external paper counts
//            $scope.totalPublications = $scope.journalPapers + $scope.externalPapers + $scope.internalPapers + $scope.technicalReports + $scope.otherDocuments;
            $scope.totalPublications = $scope.journalPapers + $scope.externalPapers;

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

            drawPieChart(pieData);
          });
      } else if ($scope.listName === $scope.listTypes[1]) {
        store.getPublishedPeople()
          .then(function(results) {
            populateList(results.data, results.instances);

            var opts = charts.getScatterData(results, server);
            drawScatterPlot(opts);
          });
      } else if ($scope.listName === $scope.listTypes[2]) {
        store.getEventSeries()
          .then(function(data) {
            populateList(data);
          });
      } else if ($scope.listName === $scope.listTypes[3]) {
        store.getProjects()
          .then(function(data) {
            populateList(data.results, data.instances);
          });
      } else if ($scope.listName === $scope.listTypes[4]) {
        store.getOrganisations()
          .then(function(data) {
            populateList(data.results, data.instances);

            var sunburstData = charts.getSunburstData(data);
            drawSunburst(sunburstData);
          });
      }
    };

    var drawScatterPlot = function(options) {
      var xMax = d3.max(options.hIndex, function(d) { return +d.totalPubs; }) * 1.3,
          xMin = -1,
          yMax = d3.max(options.hIndex, function(d) { return +d.yValue; }) * 1.3,
          yMin = -2;

      var margin = {top: 20, right: 20, bottom: 30, left: 40},
          width = angular.element("#chart").width() - margin.left - margin.right,
          height = $scope.height - 320 - margin.top - margin.bottom;

      var x = d3.scale.linear()
          .domain([xMin, xMax])
          .range([0, width]);

      var y = d3.scale.linear()
          .domain([yMin, yMax])
          .range([height, 0]);

      var xAxis = d3.svg.axis()
          .scale(x)
          .orient("bottom")
          .tickSize(-height);

      var yAxis = d3.svg.axis()
          .scale(y)
          .orient("left")
          .tickSize(-width);

      function zoomed() {
        svg.select(".x.axis").call(xAxis);
        svg.select(".y.axis").call(yAxis);
        svg.selectAll(".dot")
          .attr("transform", function(d) {
            return "translate(" + x(d.totalPubs) + "," + y(d.yValue) + ")";
          });
      }

      var zoom = d3.behavior.zoom()
          .x(x)
          .y(y)
          .scaleExtent([1, 10])
          .on("zoom", zoomed);

      var tip = d3.tip()
          .attr('class', 'd3-tip')
          .offset([-10, 0])
          .html(function(d) {
            var html = "<h2>" + d.name + " <small>(" + d.employer + ")</small></h2>" + "<dl><dt>H-Index</dt><dd>" + d.hIndex + "</dd><dt>Citation Count</dt><dd>" + d.citations + "</dd><dt>ITA Publications</dt><dd>" + d.totalPubs + "</dd></dl>";

            if (d.picture) {
              html += "<img src='" + d.picture + "' />";
            }

            return html;
          });

      // svg
      angular.element("#chart-svg").remove();
      var svg = d3.select("#chart")
        .append("svg")
          .attr("id", "chart-svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
          .call(zoom);

      // background
      svg.append("rect")
          .attr("width", width)
          .attr("height", height)
          .attr("fill", "#fff");

      // x axis
      svg.append("g")
          .attr("class", "x axis scatter-axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis)
        .append("text")
          .attr("class", "label")
          .attr("x", width - 5)
          .attr("y", -6)
          .style("text-anchor", "end")
          .text("Total (External)");

      // y axis
      svg.append("g")
          .attr("class", "y axis scatter-axis")
          .call(yAxis)
        .append("text")
          .attr("class", "label")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("x", -5)
          .attr("dy", ".71em")
          .style("text-anchor", "end");

      // dots svg
      var objects = svg.append("svg")
          .attr("class", "objects")
          .attr("width", width)
          .attr("height", height)
          .call(tip);

      // legend box
      svg.append("rect")
          .attr("x", width - 120)
          .attr("y", 10)
          .attr("width", 110)
          .attr("height", 80)
          .attr("class", "scatter-legend");

      // setup toggle
      d3.select("#h-index")
        .on("click", function() {
          $scope.scatterYAxis = $scope.scatterYAxisOpts[0];
          $scope.$apply();
          filterDots();
        });
      d3.select("#citation-count")
        .on("click", function() {
          $scope.scatterYAxis = $scope.scatterYAxisOpts[1];
          $scope.$apply();
          filterDots();
        });

      var filterDots = function () {
        var acInput = d3.select("#acInput");
        var indInput = d3.select("#indInput");
        var govInput = d3.select("#govInput");
        var ac = acInput ? acInput.property("checked") : null;
        var ind = indInput ? indInput.property("checked") : null;
        var gov = govInput ? govInput.property("checked") : null;

        var data = options[$scope.scatterYAxis];

        var filteredData = data.filter(function (d) {
          return (ac && d.industry === "AC") ||
            (ind && d.industry === "IND") ||
            (gov && d.industry === "GOV");
        });
        dots(filteredData, objects, scatterYAxisNames[$scope.scatterYAxis], tip, x, y, width, yAxis, scatterColour);
      };

      // filter data
      d3.selectAll(".scatterInput")
        .on("change", filterDots);

      dots(options.hIndex, objects, "H-Index", tip, x, y, width, yAxis, scatterColour);
    };

    var dots = function(data, objects, yTitle, tip, x, y, width, yAxis, scatterColour) {
      var yMax = d3.max(data, function(d) { return +d.yValue; }) * 1.3;
      var yMin = -(yMax / 100);

      var svg = d3.select("#chart-svg");

      // update y axis
      svg.select(".y.axis .label")
          .text(yTitle);

      y.domain([yMin, yMax]);
      svg.select(".y.axis")
          .transition().duration(300).ease("sin-in-out")
          .call(yAxis);

      // update dots
      var dots = objects.selectAll(".dot")
          .data(data);

      // enter
      dots.enter()
        .append("circle")
          .attr("class", function(d) {
            return "dot " + d.industry;
          })
          .style("fill", function(d) {
            return scatterColour(d.industry);
          })
          .on('mouseover', tip.show)
          .on('mouseout', tip.hide)
          .on('click', function(d) {
            tip.hide();
            var url = '/author/' + d.id;
            $location.url(url);
            $scope.$apply();
          });

      //exit
      dots.exit()
        .transition()
        .duration(300)
        .ease("exp")
          .remove();

      // transition
      dots
        .transition()
        .duration(300)
        .style("fill", function(d) {
          return scatterColour(d.industry);
        })
        .ease("quad")
          .attr("r", 3)
          .attr("transform", function(d) {
            return "translate(" + x(d.totalPubs) + "," + y(d.yValue) + ")";
          });

      // legend elements
      var legend = svg.selectAll(".legend")
          .data(scatterColour.domain())
        .enter().append("g")
          .attr("class", "legend")
          .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

      legend.append("rect")
          .attr("x", width - 10)
          .attr("y", 40)
          .attr("width", 18)
          .attr("height", 18)
          .style("fill", function(d) {
            return scatterColour(d);
          });

      legend.append("text")
          .attr("x", width - 16)
          .attr("y", 50)
          .attr("dy", ".35em")
          .style("text-anchor", "end")
          .text(function(d) { return legendMap[d]; });
    };

    var drawPieChart = function(data) {
      var width = ($scope.width - 200) * 0.33;
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

      angular.element(".pie-svg").remove();
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

      var legend = svg.selectAll('.legend')
        .data(color.domain())
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('display', function(d) {
          for (var i = 0; i < data.length; ++i) {
            if (data[i].label === d) {
              if (!data[i].value) {
                return 'none';
              }
            }
          }
        })
        .attr('transform', function(d, i) {
          var height = legendRectSize + legendSpacing;
          var offset =  height * color.domain().length / 2;
          var horz = -2.5 * legendRectSize;
          var vert = i * height - offset;
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

    var drawSunburst = function (root) {
      var width = ($scope.width - 150) * 0.5,
          height = $scope.height - 300,
          radius = Math.min(width, height) / 2;

      var legendRectSize = 18;
      var legendSpacing = 5;

      var x = d3.scale.linear()
          .range([0, 2 * Math.PI]);

      var y = d3.scale.sqrt()
          .range([0, radius]);

      var color = scatterColour;

      var tip = d3.tip()
          .attr('class', 'd3-tip dark-tip small-tip')
          .offset([-10, 0])
          .html(function(d) {
            if (d.name === "AC" || d.name === "IND" || d.name === "GOV") {
              return legendMap[d.name] + " <small class='highlight'>(" + d.value + " authors)</small>";
            } else {
              return d.name + " <small class='highlight'>(" + d.value + " authors, " + d.papers + " papers)</small>";
            }
          });

      angular.element(".sunburst-svg").remove();
      var svg = d3.select(".sunburst").append("svg")
          .attr("class", "sunburst-svg")
          .attr("width", width)
          .attr("height", height)
        .append("g")
          .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

      svg.call(tip);

      var partition = d3.layout.partition()
          .sort(null)
          .value(function(d) { return 1; });

      var arc = d3.svg.arc()
          .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
          .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
          .innerRadius(function(d) { return Math.max(0, y(d.y)); })
          .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });

      // Keep track of the node that is currently being displayed as the root.
      var node;

      node = root;
      var path = svg.datum(root).selectAll("path")
          .data(partition.nodes)
        .enter().append("path")
          .attr("stroke", "#fff")
          .attr("d", arc)
          .style("fill", function(d) {
            var name = (d.children ? d : d.parent).name;
            if (name === "flare") {
              return "#22394A";
            } else {
              return color(name);
            }
          })
          .on("click", click)
          .on("mouseover", function(d) {
            if (d.name !== "flare") {
              tip.show(d);
            }
          })
          .on("mouseout", tip.hide)
          .each(stash);

      change = function() {
        var value = function(d) {
          if (d.parent) {
            if (($scope.acInput && d.parent.name === "AC") ||
                ($scope.indInput && d.parent.name === "IND") ||
                ($scope.govInput && d.parent.name === "GOV")) {
              if ($scope.sortName === $scope.sortNames[0]) {
                return d.employees;
              } else if ($scope.sortName === $scope.sortNames[1]) {
                return d.papers;
              }
            }
          } else {
            return d.size;
          }
        };

        path.data(partition.value(value).nodes)
          .transition()
            .duration(1000)
            .attrTween("d", arcTweenData);
      };

      d3.selectAll("input").on("change", change);
      change();

      function click(d) {
        node = d;
        path.transition()
          .duration(1000)
          .attrTween("d", arcTweenZoom(d));
      }

      d3.select(self.frameElement).style("height", height + "px");

      var legend = svg.selectAll('.legend')
        .data(color.domain())
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('transform', function(d, i) {
          var height = legendRectSize + legendSpacing;
          var offset =  height * color.domain().length / 2;
          var horz = -2.5 * legendRectSize;
          var vert = i * height - offset;
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
        .text(function(d) { return legendMap[d]; });

      // Setup for switching data: stash the old values for transition.
      function stash(d) {
        d.x0 = d.x;
        d.dx0 = d.dx;
      }

      // When switching data: interpolate the arcs in data space.
      function arcTweenData(a, i) {
        var oi = d3.interpolate({x: a.x0, dx: a.dx0}, a);
        function tween(t) {
          var b = oi(t);
          a.x0 = b.x;
          a.dx0 = b.dx;
          return arc(b);
        }
        if (i === 0) {
         // If we are on the first arc, adjust the x domain to match the root node
         // at the current zoom level. (We only need to do this once.)
          var xd = d3.interpolate(x.domain(), [node.x, node.x + node.dx]);
          return function(t) {
            x.domain(xd(t));
            return tween(t);
          };
        } else {
          return tween;
        }
      }

      // When zooming: interpolate the scales.
      function arcTweenZoom(d) {
        if (d.name === "flare") {
          legend.attr("display", "inline");
        } else {
          legend.attr("display", "none");
        }

        var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
            yd = d3.interpolate(y.domain(), [d.y, 1]),
            yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
        return function(d, i) {
          return i
              ? function(t) { return arc(d); }
              : function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d); };
        };
      }
    };

    getData();
  }]);
