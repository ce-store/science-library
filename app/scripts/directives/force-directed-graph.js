'use strict';

/**
 * @ngdoc directive
 * @name itapapersApp.directive:forceDirectedGraph
 * @description
 * # forceDirectedGraph
 */
angular.module('itapapersApp')
  .directive('forceDirectedGraph', ['$parse', '$window', function ($parse, $window) {
    return {
      template: "<div id='force-directed-graph'></div>",
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
        var expNodes = $parse(attrs.nodes);
        var allNodes = expNodes(scope);
        var nodes = [];
        var links = [];
        var linksMap = {};

        scope.$watchCollection(expNodes, function(newVal) {
          allNodes = newVal;
          filterData();
        });

        var expAc = $parse(attrs.ac);
        var expInd = $parse(attrs.ind);
        var expGov = $parse(attrs.gov);
        var acInput = expAc(scope);
        var indInput = expInd(scope);
        var govInput = expGov(scope);

        scope.$watchCollection(expAc, function(newVal) {
          acInput = newVal;
          filterData();
        });
        scope.$watchCollection(expInd, function(newVal) {
          indInput = newVal;
          filterData();
        });
        scope.$watchCollection(expGov, function(newVal) {
          govInput = newVal;
          filterData();
        });

        var d3 = $window.d3;
        var width = scope.width * 0.75 - 100,
            height = scope.height - 320;
        var max = 0;
        var showInterlinks = true;

        var color = d3.scale.ordinal()
            .domain(["AC", "IND", "GOV"])
            .range(["#5596e6", "#ff7f0e", "#2ca02c"]);

        var tick = function() {
          link.attr("x1", function(d) { return d.source.x; })
              .attr("y1", function(d) { return d.source.y; })
              .attr("x2", function(d) { return d.target.x; })
              .attr("y2", function(d) { return d.target.y; });

          node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
        };

        var force = d3.layout.force()
            .linkStrength(function(d) {
              return d.value / max;
            })
            .size([width, height])
            .on("tick", tick);

        var tip = d3.tip()
            .attr('class', 'd3-tip dark-tip small-tip')
            .offset([-10, 0])
            .html(function(d) {
              var visibleCoAuthors = d3.selectAll(".link-" + d.id)[0].length;

              var html = "<span>Name: </span><span class='highlight'>" + d.name + "</span><br>";
              if (d.id !== allNodes[0].id) {
                html += "<span>Papers with " + allNodes[0].name + ": </span><span class='highlight'>" + d.count + "</span><br>";
              }
              html += "<span>Visible co-authors: </span><span class='highlight'>" + visibleCoAuthors + "</span>";

              return html;
            });

        var toggleInterlinks = function() {
          showInterlinks = d3.select("#interlinks").property("checked");
          filterData();
        };

        d3.select("#force-directed-graph")
          .append("label")
              .attr("class", "interlinks-label")
              .attr("for", "interlinks")
              .text("Show interlinks")
          .append("input")
              .attr("checked", true)
              .attr("type", "checkbox")
              .attr("id", "interlinks")
              .on('click', toggleInterlinks);

        var svg = d3.select("#force-directed-graph")
          .append("svg")
            .attr("width", width)
            .attr("height", height);

        var linkGroup = svg.append("g")
            .attr("class", "link-group");
        var nodeGroup = svg.append("g")
            .attr("class", "node-group");

        svg.call(tip);

        var node = nodeGroup.selectAll(".node");
        var link = linkGroup.selectAll(".link");

        var filterData = function() {
          if (allNodes) {
            nodes = [];
            links = [];
            linksMap = {};
            max = 0;

            var index = 0;
            var rootFound = false;

            var map = {};
            var rootId = allNodes[0].id;

            // generate nodes and root links
            allNodes.forEach(function(d, i) {
              if (d.group === "AC" && acInput ||
                d.group === "GOV" && govInput ||
                d.group === "IND" && indInput ||
                d.id === scope.authorId) {
                if (i === 0) {
                  rootFound = true;
                  linksMap[rootId] = linksMap[rootId] ? linksMap[rootId] : [];
                }

                if (rootFound) {
                  var id = d.id;
                  map[id] = index;

                  nodes.push(angular.copy(d));

                  if (i !== 0) {
                    links.push({
                      id: id,
                      source: 0,
                      target: index,
                      value: d.count
                    });

                    linksMap[rootId].push(id);
                    linksMap[id] = linksMap[id] ? linksMap[id] : [];
                    linksMap[id].push(rootId);

                    if (d.count > max) {
                      max = d.count;
                    }
                  }

                  index++;
                }
              }
            });

            // generate non-root links
            if (showInterlinks) {
              nodes.forEach(function(d) {
                if (d.links) {
                  for (var j in d.links) {
                    var stat = d.links[j];
                    var targetId = stat.authors[0] === d.id ? stat.authors[1] : stat.authors[0];
                    var target = map[targetId];

                    if (target && linksMap[targetId] && linksMap[targetId].indexOf(d.id) < 0) {
                      links.push({
                        id: stat.id,
                        source: map[d.id],
                        target: target,
                        value: stat.count
                      });

                      linksMap[targetId] = linksMap[targetId] ? linksMap[targetId] : [];
                      linksMap[targetId].push(d.id);
                      linksMap[d.id] = linksMap[d.id] ? linksMap[d.id] : [];
                      linksMap[d.id].push(targetId);

                      if (stat.count > max) {
                        max = stat.count;
                      }
                    }
                  }
                }
              });
            }

            var k = Math.sqrt(nodes.length / (width * height));

            force
                .nodes(nodes)
                .links(links)
                .charge(-20 / k)
                .gravity(100 * k)
                .start();

            updateGraph();
          }
        };

        var getInitials = function(name) {
          var words = name.split(" ");
          var initials = "";
          for (var i in words) {
            initials += words[i].charAt(0);
          }
          return initials.toUpperCase();
        };

        var getOpacity = function(d) {
          return Math.max(Math.sqrt(d.value) / Math.sqrt(max), 0.1);
        };

        var mousemove = function(d) {
          tip.show(d);

          d3.selectAll(".link-" + d.id)
              .style("opacity", 1);
          d3.select(".node-" + d.id + " circle")
              .style("stroke-width", 2)
              .style("stroke", "#fff");

          for (var i in linksMap[d.id]) {
            var targetId = linksMap[d.id][i];
            d3.select(".node-" + targetId + " circle")
                .style("stroke-width", 2)
                .style("stroke", "#fff");
          }
        };

        var mouseout = function(d) {
          tip.hide(d);

          d3.selectAll(".link-" + d.id)
              .style("opacity", getOpacity);
          d3.select(".node-" + d.id + " circle")
              .style("stroke-width", 0);

          for (var i in linksMap[d.id]) {
            var targetId = linksMap[d.id][i];
            d3.select(".node-" + targetId + " circle")
                .style("stroke-width", 0);
          }
        };

        var updateGraph = function() {
          link = link.data(force.links(), function(d) { return d.id; });

          var line = link.enter().append("line")
              .attr("class", function(d) {
                return "link link-" + d.source.id + " link-" + d.target.id;
              });

          line.style("stroke-width", function(d) { return Math.sqrt(d.value); })
              .style("opacity", getOpacity);

          link.exit()
            .remove();

          node = node.data(force.nodes(), function(d) { return d.id; });

          var g = node.enter().append("g")
              .attr("class", function(d) {
                return "node node-" + d.id;
              });

          g.filter(function(d, i) {
            return i === 0;
          }).append("circle")
              .attr("r", 25)
              .style("fill", function(d) { return color(d.group); })
              .call(force.drag)
              .on('mousemove', mousemove)
              .on('mouseout', mouseout);

          g.filter(function(d, i) {
            return i !== 0;
          }).append("circle")
              .attr("r", 14)
              .style("fill", function(d) { return color(d.group); })
              .call(force.drag)
              .on('mousemove', mousemove)
              .on('mouseout', mouseout)
              .on('click', function(d) {
                var url = "collaboration?author=" + nodes[0].id + "&author=" + d.id;
                window.location.href = url;
              });

          g.append("text")
              .attr("dy", ".35em")
              .text(function(d) { return getInitials(d.name); });

          node.exit()
            .remove();
        };
      }
    };
  }]);
