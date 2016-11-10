angular.module('itapapersApp')

.directive('barChart', ['$parse', '$window', '$document', 'store', 'csv', 'colours', function ($parse, $window, $document, store, csv, colours) {
  'use strict';

  return {
    restrict: 'EA',
    template: '<div id="bar-chart"></div>',
    link: function postLink(scope, element, attrs) {
      var expData = $parse(attrs.data);
      var data = expData(scope);

      scope.$watchCollection(expData, function(newVal) {
        data = newVal;
        if (data && !data[0].total) {
          drawBarChart(data);
        }
      });

      var d3 = $window.d3;
      var tipOpen = false;

      var hideTips = function() {
        angular.element(".d3-tip").css("opacity", 0);
        angular.element(".d3-tip").css("display", "none");
        tipOpen = false;
      };

      var drawBarChart = function(data) {
        var margin = {top: 20, right: 20, bottom: 50, left: 40},
            width = (scope.width - 150 - margin.left - margin.right) * 0.75,
            height = scope.height - 370 - margin.top - margin.bottom;

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
              if (!tipOpen) {
                angular.element(".d3-tip").css("display", "inline");
                tip.show(d);
                tipOpen = !tipOpen;
              }
            });

        // handle hiding tooltip
        $document.mouseup(function (e) {
          var container = angular.element("d3-tip");
          if (tipOpen && !container.is(e.target)) {
            hideTips();
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
    }
  };
}]);
