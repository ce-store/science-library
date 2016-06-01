'use strict';

/**
 * @ngdoc directive
 * @name itapapersApp.directive:edgeBundleChart
 * @description
 * # edgeBundleChart
 */
 angular.module('itapapersApp')
 .directive('edgeBundleChart', ['$parse', '$window', 'store', 'csv', 'urls', function ($parse, $window, store, csv, urls) {

  return {
    restrict:'EA',
    template:"<div id='edge-bundle-chart'></div>",
    link: function postLink(scope, elem, attrs) {
      var expAc = $parse(attrs.ac);
      var expInd = $parse(attrs.ind);
      var expGov = $parse(attrs.gov);
      var acInput = expAc(scope);
      var indInput = expInd(scope);
      var govInput = expGov(scope);
      var listLength = 50;

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
      var authors = {};
      var orgs = {};
      var orgList = [];
      var papers = {};
      var linkages = {};
      var sectors = {};
      var secList = [];

      var govOrgsData;
      var acOrgsData;
      var indOrgsData;
      var peopleData;
      var peopleOrgsData;
      var papersData;
      var paperDetailsData;

      function sortAuthors(a, b) {
        if (a.org === null) {
          return -1;
        } else if (b.org === null) {
          return 1;
        } else {
          var secA = orgs[a.org].sector;
          var secB = orgs[b.org].sector;
          if (secA < secB ) {
            return -1;
          } else if (secA > secB) {
            return 1;
          } else {
            if (a.org < b.org) {
              return -1;
            } else if (a.org > b.org) {
              return 1;
            } else {
              if (a.name < b.name) {
                return -1;
              } else if (a.name > b.name) {
                return 1;
              }
            }
          }
        }
        return 0;
      }

      var w, h;

      if (scope.width > scope.height) {
        w = h = scope.height - 270;
      } else {
        w = h = scope.width - 50;
      }

      var rx = w / 2,
      ry = h / 2,
      radius = Math.min(w, h) / 2;

      var cluster = d3.layout.cluster()
          .size([360, ry - 130])
          .sort(sortAuthors);

      var bundle = d3.layout.bundle();

      var line = d3.svg.line.radial()
      .interpolate("bundle")
      .tension(0.95)
      .radius(function(d) { return d.y; })
      .angle(function(d) { return d.x / 180 * Math.PI; });

      var div = d3.select("#edge-bundle-chart").insert("div", "h2")
      .style("width", w + "px")
      .style("height", w + "px")
      .style("margin","auto")
      .style("-webkit-backface-visibility", "hidden");

      var svg = div.append("svg:svg")
      .attr("width", w)
      .attr("height", w);

      var wheel = svg.append("svg:g")
      .attr("transform", "translate(" + rx + "," + ry + ")");

      var network = svg.append("svg:g")
      .attr("transform", "translate(" + rx + "," + ry + ")")
      .style("display","none");

      network.append("svg:rect").attr("x",-w/2).attr("y",-h/2).attr("width",w).attr("height",h).attr("opacity",0.9).attr("stroke","#f00");
      network.append("svg:g")
      .attr("transform","translate("+ (-rx) + "," + (-ry) + ")");

      var orgArc = d3.svg.arc().outerRadius(radius - 20).innerRadius(radius - 130);
      var secArc = d3.svg.arc().outerRadius(radius).innerRadius(radius - 130);

      var orgPie = d3.layout.pie()
      .sort(null)
      .value(function(d) { return d.authors.length; });

      function angle(d) {
        var a = (d.startAngle + d.endAngle) * 90 / Math.PI;
        return (a > 90 && a < 270) ? a - 180 : a;
      }
      function orgLabelOffset(d) {
        var a = (d.startAngle + d.endAngle) * 90 / Math.PI;
        return (a > 90 && a < 270) ? "52px" : "-46px";
      }
      function secLabelOffset(d) {
        var a = (d.startAngle + d.endAngle) * 90 / Math.PI;
        return (a > 90 && a < 270) ? "59px" : "-50px";
      }

      var secPie = d3.layout.pie()
      .sort(null)
      .value(function(d) { return d.authorCount; });

      // var baseColors = ["#1B4B3C","#726D29","#725529"];
      var baseColors = ["#5596e6", "#2ca02c", "#ff7f0e"];
      var sectorNames = {
        AC: "Academia",
        GOV: "Government",
        IND: "Industry"
      };
      var secColor = d3.scale.ordinal().domain(Object.keys(sectorNames)).range(baseColors);

      function getData() {
        loadGovOrgs()
          .then(loadAcOrgs)
          .then(loadIndOrgs)
          .then(loadPeople)
          .then(loadPeopleOrgs)
          .then(loadPapers)
          .then(loadPaperDetails)
          .then(function() {
            filterData();
          });
      }

      getData();

      function loadGovOrgs() {
        return store.getGovOrganisationDetails()
          .then(function (data) {
            govOrgsData = data;
          });
      }

      function loadAcOrgs() {
          return store.getAcOrganisationDetails()
            .then(function (data) {
              acOrgsData = data;
            });
        }

      function loadIndOrgs() {
          return store.getIndOrganisationDetails()
            .then(function (data) {
              indOrgsData = data;
            });
        }

      function loadPeople() {
        return store.getPersonDetails()
          .then(function (data) {
            peopleData = data;
          });
      }

      function loadPeopleOrgs() {
        return store.getPeopleOrgs()
          .then(function (data) {
            peopleOrgsData = data;
          });
      }

      function loadPapers() {
        return store.getPersonDocument()
          .then(function (data) {
            papersData = data;
          });
      }

      function loadPaperDetails() {
        return store.getDocumentDetails()
          .then(function (data) {
            paperDetailsData = data;
          });
      }

      function buildPeople() {
        if (peopleData && peopleData.results) {
          peopleData.results.forEach(function(el) {
            var name = el[0];
            var fn = el[1];
            var sn = el[2];
            var cc = el[3];

            authors[name] = {
              name: name,
              fn: fn,
              sn: sn,
              cc: cc,
              papers: []
            };
          });
        }
      }

      function buildPapers() {
        if (papersData && papersData.results) {
          papersData.results.forEach(function(el) {
            var author = el[0];
            var doc = el[1];
            if (authors[author]) {
              papers[doc] = papers[doc] || { key:doc, authors:[] };
              papers[doc].authors.push(author);
              authors[author].papers.push(doc);
            }
          });
        }
      }

      function buildGovOrgs() {
        if (govOrgsData && govOrgsData.results) {
          govOrgsData.results.forEach(function(el) {
            var org = el[0];
            var name = el[1];
            var shortName = el[0];
            var sector = "GOV";
            var country = el[2];

            orgs[org] = {
              id: org,
              name: name,
              shortName: shortName,
              sector: sector,
              country: country,
              authors: []
            };
            sectors[sector] = sectors[sector] || {id:sector, orgs:[]};
          });
        }
      }

      function buildIndOrgs() {
          if (indOrgsData && indOrgsData.results) {
            indOrgsData.results.forEach(function(el) {
              var org = el[0];
              var name = el[1];
              var shortName = el[0];
              var sector = "IND";
              var country = el[2];

              orgs[org] = {
                id: org,
                name: name,
                shortName: shortName,
                sector: sector,
                country: country,
                authors: []
              };
              sectors[sector] = sectors[sector] || {id:sector, orgs:[]};
            });
          }
        }

      function buildAcOrgs() {
          if (acOrgsData && acOrgsData.results) {
            acOrgsData.results.forEach(function(el) {
              var org = el[0];
              var name = el[1];
              var shortName = el[0];
              var sector = "AC";
              var country = el[2];

              orgs[org] = {
                id: org,
                name: name,
                shortName: shortName,
                sector: sector,
                country: country,
                authors: []
              };
              sectors[sector] = sectors[sector] || {id:sector, orgs:[]};
            });
          }
        }

      function buildAuthorOrgs() {
        if (peopleOrgsData && peopleOrgsData.results) {
          peopleOrgsData.results.forEach(function(el) {
            var name = el[0];
            var org = el[1];

            if (authors[name]) {
              authors[name].org = org;
            }
          });
        }
      }

      function buildOrgAuthors() {
        if (peopleOrgsData && peopleOrgsData.results) {
          peopleOrgsData.results.forEach(function(el) {
            var name = el[0];
            var org = el[1];
            if (authors[name]) {
              orgs[org].authors.push(name);
            }
          });
        }
      }

      function buildPaperDetails() {
        if (paperDetailsData && paperDetailsData.results) {
          paperDetailsData.results.forEach(function(el) {
            var doc = el[0];
            var title = el[1];
            var month = el[2];
            var year = el[3];
            if (papers[doc]) {
              if (title) {
                papers[doc].title = title;
              }
              papers[doc].month = month;
              papers[doc].year = year;
            }
          });
        }
      }

      function buildSectors() {
        for (var org in orgs) {
          var sector = orgs[org].sector;
          sectors[sector].orgs.push(org);
        }
      }

      function filterData() {
        authors = {};
        orgs = {};
        orgList = [];
        papers = {};
        linkages = {};
        sectors = {};
        secList = [];

        secPie = d3.layout.pie()
          .sort(null)
          .value(function(d) { return d.authorCount; });

        buildPeople();
        buildPapers();
        buildGovOrgs();
        buildAcOrgs();
        buildIndOrgs();
        buildAuthorOrgs();

        var compareCoAuthors = function(a, b) {
          return b.cc - a.cc;
        };

        var filteredAuthors = {};
        var sortedAuthors = [];

        var id, i;
        for (id in authors) {
          var sector = orgs[authors[id].org].sector;

          if (sector === "AC" && acInput ||
            sector === "GOV" && govInput ||
            sector === "IND" && indInput) {
            sortedAuthors.push({
              id: id,
              cc: authors[id].cc
            });
          }
        }

        sortedAuthors = sortedAuthors.sort(compareCoAuthors).slice(0, listLength);

        for (i = 0; i < sortedAuthors.length; ++i) {
          var author = sortedAuthors[i];
          filteredAuthors[author.id] = angular.copy(authors[author.id]);
        }

        for (id in papers) {
          var paper = papers[id];
          var indexes = [];
          // find authours not in filtered list
          for (i = 0; i < paper.authors.length; ++i) {
            var a = paper.authors[i];
            var found = false;

            for (var j = 0; j < sortedAuthors.length; ++j) {
              if (sortedAuthors[j].id === a) {
                found = true;
              }
            }

            if (!found) {
              indexes.push(i);
            }
          }
          // remove authors from authors list in paper
          for (i = indexes.length - 1; i >= 0 ; --i) {
            var indexToRemove = indexes[i];
            paper.authors.splice(indexToRemove, 1);
          }

          if (paper.authors.length === 0) {
            delete papers[id];
          }
        }

        authors = filteredAuthors;

        buildOrgAuthors();
        buildPaperDetails();
        buildSectors();

        generateVis();
      }

      function generateVis() {
        var index = 0;
        var currentSec = null;
        orgList = Object.keys(orgs).map(function(o) {
          return orgs[o];
        }).sort(function(a,b) {
          var secA = orgs[a.id].sector;
          var secB = orgs[b.id].sector;
          if (secA < secB) {
            return -1;
          } else if (secA > secB) {
            return 1;
          } else {
            if (a.id < b.id) {
              return -1;
            } else {
              return 1;
            }
          }
          return 0;
        }).map(function(v) {
          if (v.sector !== currentSec) {
            index = 0;
            currentSec = v.sector;
          }
          v.orgIndex = index++;
          return v;
        });

        secList = Object.keys(sectors).map(function(s) {
          var sec = sectors[s];
          sec.authorCount = 0;
          sec.orgs.forEach(function(org) {
            sec.authorCount += orgs[org].authors.length;
          });
          return sectors[s];
        }).sort(function(a,b) {
          if (a.id < b.id) {
            return -1;
          } else if (a.id > b.id) {
            return 1;
          }
          return 0;
        });

        Object.keys(papers).forEach(function(p) {
          var paper = papers[p];
          var auths = paper.authors;
          for (var i = 0; i < auths.length - 1; i++) {
            var a1 = auths[i];
            for (var j = i + 1; j < auths.length; j++) {
              var a2 = auths[j];
              linkages[a1] = linkages[a1] || {};
              linkages[a1][a2] = (linkages[a1][a2] || 0) + 1;

              linkages[a2] = linkages[a2] || {};
              linkages[a2][a1] = (linkages[a2][a1] || 0) + 1;
            }
          }
        });

        var root = {name: "", children: [], depth: 0};
        var csvData = [];

        index = 0;
        root.children = Object.keys(authors).map(function(n) {
          var a = authors[n];
          a.id = index++;
          a.parent = root;
          a.depth = 1;
          a.key = n;
          csvData.push([a.key, a.fn, a.sn, a.org, a.cc]);
          return authors[n];
        });
        var links = [];
        Object.keys(linkages).forEach(function(a1) {
          var coauths = linkages[a1];
          Object.keys(coauths).forEach(function(a2) {
            var src = authors[a1];
            var tgt = authors[a2];

            if (src && tgt) {
              links.push({source:src,target:tgt,value:coauths[a2]});
            }
          });
        });

        csv.setData(csvData);
        csv.setHeader(["id", "first name", "surname", "organisation", "coauthor count"]);
        csv.setName("co-authors");

        doIt(root, links);
      }

      function generateOrgPalette(secID, secIndex, endCol) {
        if (sectors[secID]) {
          var l = sectors[secID].orgs.length;
          var s = d3.scale.linear().domain([0,l]).interpolate(d3.interpolateRgb).range([d3.rgb(secColor(secID)).brighter(1),endCol]);
          return function(v) {
            if ( (v%2) === 0) {
              return s(Math.floor(v/2));
            } else {
              return s(Math.floor(l/2+v/2));
            }
          };
        }
      }

      function doIt(nodes, links) {
        nodes = cluster.nodes(nodes);
        var splines = bundle(links);

        var orgColor = {
          AC:  generateOrgPalette("AC", 0, "#8CA69E"),
          GOV: generateOrgPalette("GOV", 1, "#D0CC98"),
          IND: generateOrgPalette("IND", 2, "#D0BA98")
        };

        // LINK
        var link = wheel.selectAll("path.link")
          .data(links);

        // enter
        link.enter().append("svg:path")
            .attr("class", function(d) {
              return "link "+
              "link-author-" + d.source.key +" "+
              "link-author-" + d.target.key+" "+
              "link-org-"+d.source.org+" "+
              "link-org-"+d.target.org;
            })
            .attr("stroke-width", function(d) {
              return Math.max(1,Math.sqrt(d.value));
            })
            .attr("d", function() {
              var rand = Math.random();
              var i = splines.length * Math.floor(rand);
              return line(splines[i]);
            });

        // update
        link
          .transition()
            .duration(500)
            .attr("d", function(d, i) { return line(splines[i]); })
            .attr("class", function(d) {
              return "link "+
              "link-author-" + d.source.key +" "+
              "link-author-" + d.target.key+" "+
              "link-org-"+d.source.org+" "+
              "link-org-"+d.target.org;
            })
            .attr("stroke-width", function(d) {
              return Math.max(1,Math.sqrt(d.value));
            });

        // exit
        link.exit()
          .transition()
            .duration(500)
            .attr("d", function() {
              if (splines && splines.length > 0) {
                var rand = Math.random();
                var i = splines.length * Math.floor(rand);
                return line(splines[i]);
              }
            })
          .remove();

        function secArcTween(a) {
          var i = d3.interpolate(this._current, a);
          this._current = i(0);
          return function(t) {
            return secArc(i(t));
          };
        }

        function secArcKey(d) {
          if (d.data && d.data.id) {
            return d.data.id;
          }
        }

        // SECARC
        var secarc = wheel.selectAll("g.secarc")
          .data(secPie(secList), secArcKey);

        // enter
        var g = secarc.enter().append("g")
            .attr("class", "secarc");
        g.append("path")
            .attr("d", secArc)
            .style("stroke-width","2")
            .style("fill", function(d) {
              return secColor(d.data.id);
            })
            .each(function(d) { this._current = d; });
        g.append("text")
            .attr("transform", function(d) {return "translate(" + secArc.centroid(d) + ") rotate(" + angle(d) + ")";})
            .attr("dy", secLabelOffset)
            .style("text-anchor", "middle")
            .style("font-size", "12px")
            .style("fill", "#fff")
            .text(function(d) { return sectorNames[d.data.id]; });

        // update
        secarc.select("path")
          .transition()
            .duration(750)
            .attrTween("d", secArcTween);
        secarc.select("text")
          .transition()
            .duration(750)
            .attr("transform", function(d) {return "translate(" + secArc.centroid(d) + ") rotate(" + angle(d) + ")";})
            .attr("dy", secLabelOffset)
          .text(function(d) {
            if (d.value > 0) {
              return sectorNames[d.data.id];
            }
          });

        // exit
        secarc.exit()
            .remove();

        function orgArcTween(a) {
          var i = d3.interpolate(this._current, a);
          this._current = i(0);
          return function(t) {
            return orgArc(i(t));
          };
        }

        function orgArcKey(d) {
          return d.data.id;
        }

        // ORGARC
        var orgarc = wheel.selectAll("g.orgarc")
          .data(orgPie(orgList), orgArcKey);

        // enter
        g = orgarc.enter().append("g")
            .attr("class", "orgarc");
        g.append("path")
            .attr("d", orgArc)
            .style("stroke-width", 1)
            .style("fill", function(d) {
              var c = orgColor[d.data.sector](d.data.orgIndex);
              return c;
            })
            .each(function(d) { this._current = d; })
          .on("mouseover", function(d) { wheelMouseover("org", d.data.id, d.data.id); })
          .on("mouseout", function(d) { wheelMouseout("org", d.data.id, d.data.id); })
          .on("click", function(d) {
            var url = urls.scienceLibrary + "/organisation/" + d.data.id;
            window.location.href = url;
          });
        g.append("text")
            .attr("transform", function(d) {
              return "translate(" + orgArc.centroid(d) + ") rotate(" + angle(d) + ")";
            })
            .attr("dy", orgLabelOffset)
            .style("text-anchor", "middle")
            .style("font-size", "10px")
            .style("fill", "#fff")
            .style("pointer-events", "none")
            .text(function(d) {
              if (Math.abs(d.endAngle-d.startAngle) > 0.01) {
                return d.data.shortName;
              }
            });

        // update
        orgarc.select("path")
          .transition()
            .duration(750)
            .attrTween("d", orgArcTween);
        orgarc.select("text")
          .transition()
            .duration(750)
            .attr("transform", function(d) {
              return "translate(" + orgArc.centroid(d) + ") rotate(" + angle(d) + ")";
            })
            .attr("dy", orgLabelOffset)
            .text(function(d) {
              if (Math.abs(d.endAngle - d.startAngle) > 0.01) {
                return d.data.shortName;
              }
            });

        // exit
        orgarc.exit()
          .remove();

        // NODE
        var node = wheel.selectAll("g.node")
          .data(nodes.filter(function(n) {
            return !n.children;
          }),
          function(n) {
            return n.key;
          });

        // enter
        g = node.enter().append("g")
            .attr("class", "node")
            .attr("id", function(d) { return "node-" + d.key; })
            .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; });
        g.append("text")
            .attr("class",function(d) {
              if (d) {
                return "author "+
                "author-author-"+d.key+" "+
                "author-org-"+d.org;
              }
            })
            .attr("dx", function(d) { return d.x < 180 ? 8 : -8; })
            .attr("dy", ".31em")
            .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
            .attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; })
            .text(function(d) {
              if (d && d.fn) {
                var name = d.fn+" "+d.sn;
                if (name.length > 15) {
                  name = d.fn[0]+". "+d.sn;
                }
                if (name.length > 15) {
                  name = name.substring(0,15)+"...";
                }
                return name;
              }
            })
          .on("mouseover", function(d) { wheelMouseover("author", d.key); })
          .on("mouseout", function(d) { wheelMouseout("author", d.key); })
          .on("click", function(d) {
            var url = urls.scienceLibrary + "/author/" + d.key;
            window.location.href = url;
          });

        // update
        node
          .transition()
            .duration(750)
            .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; });
        node.select("text")
          .transition()
            .duration(750)
            .attr("dx", function(d) { return d.x < 180 ? 8 : -8; })
            .attr("dy", ".31em")
            .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
            .attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; })
            .text(function(d) {
              if (d && d.fn) {
                var name = d.fn+" "+d.sn;
                if (name.length > 15) {
                  name = d.fn[0]+". "+d.sn;
                }
                if (name.length > 15) {
                  name = name.substring(0,15)+"...";
                }
                return name;
              }
            });

        // exit
        node.exit()
          .remove();
      }

      function wheelMouseover(classPrefix, prop, org) {
        wheel.selectAll("path.link.link-" + classPrefix + "-" + prop)
        .classed("link-active", true)
        .each(function(d) {
          wheel.select("#node-" + d.source.key).classed("author-active", true);
          wheel.select("#node-" + d.target.key).classed("author-active", true);
        });
        if (org) {
          wheel.selectAll(".author-org-" + org).classed("author-org-active", true);
        }
      }

      function wheelMouseout(classPrefix, prop) {
        wheel.selectAll("path.link.link-" + classPrefix + "-" + prop)
        .classed("link-active", false)
        .each(function(d) {
          wheel.select("#node-" + d.source.key).classed("author-active", false).classed("author-org-active", false);
          wheel.select("#node-" + d.target.key).classed("author-active", false).classed("author-org-active", false);
        });
        wheel.selectAll(".author-org-active").classed("author-org-active", false);
      }
    }
  };
}]);
