/*******************************************************************************
 * (C) Copyright IBM Corporation  2016, 2017
 * All Rights Reserved
 *******************************************************************************/

/* globals self: true */

angular.module('scienceLibrary')

.directive('sunburst', ['$parse', '$window', 'store', 'csv', 'colours', function ($parse, $window, store, csv, colours) {
  'use strict';

  return {
    restrict:'EA',
    template:"<div class='sunburst'></div>",
    link: function postLink(scope, element, attrs) {
      var expData = $parse(attrs.data);
      var data = expData(scope);
      var lastSort;

      if (scope.sort && scope.sort.names) {
        lastSort = scope.sort.names[0];
      }

      scope.$watchCollection(expData, function(newVal) {
        var oldData = data;
        data = newVal;

        if (oldData) {
          scope.change();
        } else if (data) {
          drawSunburst(data);
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

      var drawSunburst = function (root) {
        var width = (scope.width - 150) * 0.5,
            height = scope.height - 300,
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

        scope.change = function() {
          var value = function(d) {
            if (d.parent) {
              if ((scope.acInput && d.parent.name === "AC") ||
                  (scope.indInput && d.parent.name === "IND") ||
                  (scope.govInput && d.parent.name === "GOV")) {
                if (scope.sortName === scope.sort.names[0]) {
                  lastSort = scope.sort.names[0];
                  return d.employees;
                } else if (scope.sortName === scope.sort.names[1] || lastSort === scope.sort.names[1]) {
                  lastSort = scope.sort.names[1];
                  return d.papers;
                } else {
                  return d.employees;
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

        d3.selectAll("input").on("change", scope.change);
        scope.change();

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
            return i ? function(t) { return arc(d); }
                : function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d); };
          };
        }
      };
    }
  };
}]);
