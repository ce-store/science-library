/*******************************************************************************
 * (C) Copyright IBM Corporation  2016, 2017
 * All Rights Reserved
 *******************************************************************************/

angular.module('scienceLibrary')

.directive('scatterChart', ['$parse', '$window', '$location', 'store', 'csv', 'colours', function ($parse, $window, $location, store, csv, colours) {
  'use strict';

  return {
    restrict:'EA',
    template:'<div id="chart"></div>',
    link: function postLink(scope, elem, attrs) {
      var expOptions = $parse(attrs.options);
      var options = expOptions(scope);

      var scatterYAxisNames = {};
      scatterYAxisNames[scope.scatterYAxisOpts[0]] = 'Local H-Index';
      scatterYAxisNames[scope.scatterYAxisOpts[1]] = 'Local Citation Count';
      scatterYAxisNames[scope.scatterYAxisOpts[2]] = 'Overall H-Index';
      scatterYAxisNames[scope.scatterYAxisOpts[3]] = 'Overall Citation Count';

      scope.$watchCollection(expOptions, function(newVal) {
        options = newVal;
        if (options) {
          drawScatterPlot(options);
        }
      });

      var d3 = $window.d3;
      var scatterColour = d3.scale.ordinal()
        .domain(['AC', 'IND', 'GOV'])
        .range(colours.areas);
      var legendMap = {
        'AC': 'Academic',
        'IND': 'Industry',
        'GOV': 'Government',
        'Unknown': 'Unknown'
      };

      var drawScatterPlot = function(options) {
        var xMax = d3.max(options.hIndex, function(d) { return +d.totalPubs; }) * 1.3,
            xMin = -1,
            yMax = d3.max(options.hIndex, function(d) { return +d.yValue; }) * 1.3,
            yMin = -2;

        var margin = {top: 40, right: 25, bottom: 30, left: 40},
            width = angular.element('#chart').width() - margin.left - margin.right,
            height = scope.height - 340 - margin.top - margin.bottom;

        var x = d3.scale.linear()
            .domain([xMin, xMax])
            .range([0, width]);

        var y = d3.scale.linear()
            .domain([yMin, yMax])
            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient('bottom')
            .tickSize(-height);

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient('left')
            .tickSize(-width);

        function zoomed() {
          svg.select('.x.axis').call(xAxis);
          svg.select('.y.axis').call(yAxis);
          svg.selectAll('.dot')
            .attr('transform', function(d) {
              return 'translate(' + x(d.totalPubs) + ',' + y(d.yValue) + ')';
            });
        }

        var zoom = d3.behavior.zoom()
            .x(x)
            .y(y)
            .scaleExtent([1, 10])
            .on('zoom', zoomed);

        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
              var data = options[scope.scatterYAxis];

              var authors = [d];
              for (var i = 0; i < data.length; ++i) {
                if (data[i].id !== d.id && data[i].totalPubs === d.totalPubs && ((d.hIndex && data[i].hIndex === d.hIndex) || (d.citations && data[i].citations === d.citations))) {
                  authors.push(data[i]);
                }
              }

              var html = '';
              for (var j = 0; j < authors.length; ++j) {
                var a = authors[j];
                html += '<div><h2>' + a.name + ' <small>(' + a.employer + ')</small></h2>' + '<dl><dt>Local H-Index</dt><dd>' + a.hIndex + '</dd><dt>Local Citation Count</dt><dd>' + a.citations + '</dd><dt>ITA Publications</dt><dd>' + a.totalPubs + '</dd></dl>';

                if (a.picture) {
                  html += '<img src="' + a.picture + '" />';
                }

                html += '<div style="clear: both"></div></div>';

                if (j < authors.length - 1) {
                  html += '<hr>';
                }
              }

              return html;
            });

        // svg
        angular.element('#chart-svg').remove();
        var svg = d3.select('#chart')
          .append('svg')
            .attr('id', 'chart-svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
          .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
            .call(zoom);

        // background
        svg.append('rect')
            .attr('width', width)
            .attr('height', height)
            .attr('fill', '#fff');

        // x axis
        svg.append('g')
            .attr('class', 'x axis scatter-axis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(xAxis)
          .append('text')
            .attr('class', 'label')
            .attr('x', width - 5)
            .attr('y', -6)
            .style('text-anchor', 'end')
            .text('External publications');

        // y axis
        svg.append('g')
            .attr('class', 'y axis scatter-axis')
            .call(yAxis)
          .append('text')
            .attr('class', 'label')
            .attr('transform', 'rotate(-90)')
            .attr('y', 6)
            .attr('x', -5)
            .attr('dy', '.71em')
            .style('text-anchor', 'end');

        // dots svg
        var objects = svg.append('svg')
            .attr('class', 'objects')
            .attr('width', width)
            .attr('height', height)
            .call(tip);

        // legend box
        svg.append('rect')
            .attr('x', width - 150)
            .attr('y', 10)
            .attr('width', 140)
            .attr('height', 80)
            .attr('class', 'scatter-legend');

        // setup toggle
        d3.select('#local-h-index')
          .on('click', function() {
            scope.scatterYAxis = scope.scatterYAxisOpts[0];
            scope.$apply();
            filterDots();
          });
        d3.select('#local-citation-count')
          .on('click', function() {
            scope.scatterYAxis = scope.scatterYAxisOpts[1];
            scope.$apply();
            filterDots();
          });
        d3.select('#overall-h-index')
          .on('click', function() {
            scope.scatterYAxis = scope.scatterYAxisOpts[2];
            scope.$apply();
            filterDots();
          });
        d3.select('#overall-citation-count')
          .on('click', function() {
            scope.scatterYAxis = scope.scatterYAxisOpts[3];
            scope.$apply();
            filterDots();
          });

        var filterDots = function () {
          var acInput = d3.select('#acInput');
          var indInput = d3.select('#indInput');
          var govInput = d3.select('#govInput');
          var ac = acInput ? acInput.property('checked') : null;
          var ind = indInput ? indInput.property('checked') : null;
          var gov = govInput ? govInput.property('checked') : null;

          var data = options[scope.scatterYAxis];
          var filteredData = data.filter(function (d) {
            return (ac && d.industry === 'AC') ||
              (ind && d.industry === 'IND') ||
              (gov && d.industry === 'GOV');
          });
          dots(filteredData, objects, scatterYAxisNames[scope.scatterYAxis], tip, x, y, width, yAxis, scatterColour);
        };

        // filter data
        d3.selectAll('.scatterInput')
          .on('change', filterDots);

        dots(options.hIndex, objects, scatterYAxisNames[scope.scatterYAxisOpts[0]], tip, x, y, width, yAxis, scatterColour);
      };

      var dots = function(data, objects, yTitle, tip, x, y, width, yAxis, scatterColour) {
        var yMax = d3.max(data, function(d) { return +d.yValue; }) * 1.3;
        var yMin = -(yMax / 100);

        var svg = d3.select('#chart-svg');

        // update y axis
        svg.select('.y.axis .label')
            .text(yTitle);

        y.domain([yMin, yMax]);
        svg.select('.y.axis')
            .transition().duration(300).ease('sin-in-out')
            .call(yAxis);

        // update dots
        var dots = objects.selectAll('.dot')
            .data(data);

        // enter
        dots.enter()
          .append('circle')
            .attr('class', function(d) {
              return 'dot ' + d.industry;
            })
            .style('fill', function(d) {
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
          .ease('exp')
            .remove();

        // transition
        dots
          .transition()
          .duration(300)
          .style('fill', function(d) {
            return scatterColour(d.industry);
          })
          .ease('quad')
            .attr('r', 3)
            .attr('transform', function(d) {
              return 'translate(' + x(d.totalPubs) + ',' + y(d.yValue) + ')';
            });

        // legend elements
        var legend = svg.selectAll('.legend')
            .data(scatterColour.domain())
          .enter().append('g')
            .attr('class', 'legend')
            .attr('transform', function(d, i) { return 'translate(0,' + i * 20 + ')'; });

        legend.append('rect')
            .attr('x', width - 10)
            .attr('y', 60)
            .attr('width', 18)
            .attr('height', 18)
            .style('fill', function(d) {
              return scatterColour(d);
            });

        legend.append('text')
            .attr('x', width - 16)
            .attr('y', 70)
            .attr('dy', '.35em')
            .style('text-anchor', 'end')
            .text(function(d) { return legendMap[d]; });
      };
    }
  };
}]);
