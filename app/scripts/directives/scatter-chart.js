/*******************************************************************************
 * (C) Copyright IBM Corporation  2016, 2017
 * All Rights Reserved
 *******************************************************************************/

angular.module('slApp')

.directive('scatterChart', ['$parse', '$window', '$location', 'store', 'csv', 'colours', function ($parse, $window, $location, store, csv, colours) {
  'use strict';

  return {
    restrict:'EA',
    template:"<div id='chart'></div>",
    link: function postLink(scope, elem, attrs) {
      var expOptions = $parse(attrs.options);
      var options = expOptions(scope);

      var scatterYAxisNames = {};
      scatterYAxisNames[scope.scatterYAxisOpts[0]] = "Local H-Index";
      scatterYAxisNames[scope.scatterYAxisOpts[1]] = "Local Citation Count";
      scatterYAxisNames[scope.scatterYAxisOpts[2]] = "Overall H-Index";
      scatterYAxisNames[scope.scatterYAxisOpts[3]] = "Overall Citation Count";

      scope.$watchCollection(expOptions, function(newVal) {
        options = newVal;
        if (options) {
          drawScatterPlot(options);
        }
      });

      var d3 = $window.d3;
      var scatterColour = d3.scale.ordinal()
        .domain(["AC", "IND", "GOV"])
        .range(colours.areas);
      var legendMap = {
        'AC': 'Academic',
        'IND': 'Industry',
        'GOV': 'Government',
        'Unknown': 'Unknown'
      };

      var drawScatterPlot = function(options) {
        var xMax = d3.max(options.localHIndex, function(d) { return +d.totalPubs; }) * 1.3,
            xMin = -1,
            yMax = d3.max(options.localHIndex, function(d) { return +d.yValue; }) * 1.3,
            yMin = -2;

        var margin = {top: 20, right: 20, bottom: 30, left: 40},
            width = angular.element("#chart").width() - margin.left - margin.right,
            height = scope.height - 320 - margin.top - margin.bottom;

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
              var data = options[scope.scatterYAxis];

              var authors = [d];
              for (var i = 0; i < data.length; ++i) {
                if (data[i].id !== d.id) {
                    if (data[i].totalPubs === d.totalPubs) {
                        if (data[i][scope.scatterYAxis] === d[scope.scatterYAxis]) {
                            authors.push(data[i]);
                        }
                    }
                }
              }

              var html = "";
              for (var j = 0; j < authors.length; ++j) {
                var a = authors[j];
                var imgHtml = "";
                var colspan = 3;

                if (a.picture) {
                  imgHtml += "<td rowspan=\"4\"><img src='" + a.picture + "'/></td>";
                  colspan = 4;
                }

                html += "<table>";
                html += "<tr><td colspan=\"" + colspan + "\"><h2>" + a.name + " <small>(" + a.employer + ")</small></h2></td></tr>";
                html += "<tr><td></td><td>Local</td><td>Overall</td>" + imgHtml + "</tr>";
                html += "<tr><td>Citation Count</td><td>" + a.localCitations + "</td><td>" + a.overallCitations + "</td></tr>";
                html += "<tr><td>H-Index</td><td>" + a.localHIndex + "</td><td>" + a.overallHIndex + "</td></tr>";
                html += "<tr><td>External Papers</td><td colspan=\"2\">" + a.totalPubs + "</td></tr>";
                html += "</table>";

                if (j < authors.length - 1) {
                  html += "<hr/>";
                }
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
            .attr("fill", "#22394a");

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
            .text("External publications");

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
        d3.select("#local-h-index")
          .on("click", function() {
            scope.scatterYAxis = scope.scatterYAxisOpts[0];
            scope.$apply();
            filterDots();
          });
        d3.select("#local-citation-count")
          .on("click", function() {
            scope.scatterYAxis = scope.scatterYAxisOpts[1];
            scope.$apply();
            filterDots();
          });
        d3.select("#overall-h-index")
          .on("click", function() {
            scope.scatterYAxis = scope.scatterYAxisOpts[2];
            scope.$apply();
            filterDots();
          });
        d3.select("#overall-citation-count")
          .on("click", function() {
            scope.scatterYAxis = scope.scatterYAxisOpts[3];
            scope.$apply();
            filterDots();
          });

        var filterDots = function () {
          var acInput = d3.select("#acInput");
          var indInput = d3.select("#indInput");
          var govInput = d3.select("#govInput");
          var ac = acInput ? acInput.property("checked") : null;
          var ind = indInput ? indInput.property("checked") : null;
          var gov = govInput ? govInput.property("checked") : null;
console.log(scope.scatterYAxis);
console.log(options);
          var data = options[scope.scatterYAxis];
          var filteredData = data.filter(function (d) {
            return (ac && d.industry === "AC") ||
              (ind && d.industry === "IND") ||
              (gov && d.industry === "GOV");
          });
          dots(filteredData, objects, scatterYAxisNames[scope.scatterYAxis], tip, x, y, width, yAxis, scatterColour);
        };

        // filter data
        d3.selectAll(".scatterInput")
          .on("change", filterDots);

        dots(options.localHIndex, objects, "H-Index", tip, x, y, width, yAxis, scatterColour);
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
              var url = scope.scienceLibrary + '/author/' + d.id;
              $location.url(url);
              scope.$apply();
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
    }
  };
}]);
