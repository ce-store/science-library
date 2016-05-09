'use strict';

/**
 * @ngdoc directive
 * @name itapapersApp.directive:pieChart
 * @description
 * # pieChart
 */
angular.module('itapapersApp')
  .directive('pieChart', ['$parse', '$window', 'store', 'csv', 'colours', function ($parse, $window, store, csv, colours) {
    return {
      template: '<div class="small-pie" id="pie-chart"></div>',
      restrict: 'EA',
      link: function postLink(scope, element, attrs) {
        var expData = $parse(attrs.data);
        var data = expData(scope);

        scope.$watchCollection(expData, function(newVal) {
          data = newVal;
          if (data) {
            drawPieChart(data);
          }
        });

        var d3 = $window.d3;

        var drawPieChart = function(data) {
          var width = (scope.width - 200) * 0.33;
          var height = scope.height - 500;

          if (scope.width < 1000 || height < 300) {
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
      }
    };
  }]);
