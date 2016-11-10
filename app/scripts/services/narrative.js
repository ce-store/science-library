/* globals d3: true */
/* globals window: true */

var server = null;
var ceStore = null;
var ce = null;
var rels;

// Link dimensions
var link_width = 1.8;
var link_gap = 2;

var node_width = 10; // Set to panel_width later
var color = { AC: '#5596e6', IND: '#ff7f0e', GOV: '#2ca02c', Unknown: '#d62728'};//d3.scale.category10();
var raw_chart_width = 1200;

// Height of empty gaps between groups
// (Sparse groups and group ordering already
// provide a lot of whitespace though.)
var group_gap = 0;

// This is used for more than just text height.
var text_height = 8;

// If a name's x is smaller than this value * chart width,
// the name appears at the start of the chart, as
// opposed to appearing right before the first scene
// (the name doesn't make any sense).
var per_width = 0.3;

// The character's name appears before its first
// scene's x value by this many pixels
var name_shift = 10;

// True: Use a white background for names
var name_bg = true;

// True: Disregard actual scene duration and make
// all the scenes equal.
var equal_scenes = false;

// Between 0 and 1.
var curvature = 0.5;

// Longest name in pixels to make space at the beginning
// of the chart. Can calculate but this works okay.
var longest_name = 130;

// Map author index to id
var authorIndex = {};

// Set drag offset
var drag_offset = 0;

var scienceLibrary = null;

// Opacity
var opacity = {
  opaqueNodes: {
    'opacity': 1,
    'transition': 'opacity .25s ease-in-out',
    '-moz-transition': 'opacity .25s ease-in-out',
    '-webkit-transition': 'opacity .25s ease-in-out'
  },
  opaqueLinks: {
    'stroke-opacity': 0.9,
    'transition': 'opacity .25s ease-in-out',
    '-moz-transition': 'opacity .25s ease-in-out',
    '-webkit-transition': 'opacity .25s ease-in-out'
  },
  opaqueScene: {
    'opacity': 0.9,
    'transition': 'opacity .25s ease-in-out',
    '-moz-transition': 'opacity .25s ease-in-out',
    '-webkit-transition': 'opacity .25s ease-in-out'
  },
  translucentNodes: {
    'opacity': 0.1,
    'transition': 'opacity .25s ease-in-out',
    '-moz-transition': 'opacity .25s ease-in-out',
    '-webkit-transition': 'opacity .25s ease-in-out'
  },
  translucentLinks: {
    'stroke-opacity': 0.2,
    'transition': 'opacity .25s ease-in-out',
    '-moz-transition': 'opacity .25s ease-in-out',
    '-webkit-transition': 'opacity .25s ease-in-out'
  },
  translucentScene: {
    'opacity': 0.2,
    'transition': 'opacity .25s ease-in-out',
    '-moz-transition': 'opacity .25s ease-in-out',
    '-webkit-transition': 'opacity .25s ease-in-out'
  }
};



// True: When deciding on which group to put a scene in,
// if there's a tie, break the tie based on which
// groups the scenes from which the links are incoming
// are in
// False: Arbitrary
//var tie_breaker = false;
// Set for each comic separately

// d3 function
function get_path(link) {
  'use strict';
  var x0 = link.x0;
  var x1 = link.x1;
  var xi = d3.interpolateNumber(x0, x1);
  var x2 = xi(curvature);
  var x3 = xi(1 - curvature);
  var y0 = link.y0;
  var y1 = link.y1;

  return 'M' + x0 + ',' + y0 + 'C' + x2 + ',' + y0 + ' ' + x3 + ',' + y1 + ' ' + x1 + ',' + y1;
} // get_path


function Character_(name, id, group) {
  'use strict';
  this.name = name;
  this.id = id;
  this.group = group;
  this.group_ptr = null;
  this.first_scene = null;
  this.group_positions = {};
  this.group_name_positions = {};
} // Character_


function Link(from, to, group, char_id) {
  'use strict';
  // to and from are ids of scenes
  this.from = from;
  this.to = to;
  this.char_id = char_id;
  this.group = group; // Group number
  this.x0 = 0;
  this.y0 = -1;
  this.x1 = 0;
  this.y1 = -1;
  this.char_ptr = null; // TODO: Not used
} // Link


function SceneNode(chars, start, duration, id, paper) {
  'use strict';
  this.chars = chars; // List of characters in the Scene (ids)
  this.start = start; // Scene starts after this many panels
  this.duration = duration; // Scene lasts for this many panels
  this.id = id;
  this.paper = paper;

  this.char_ptrs = [];
  // Determined later
  this.x = 0;
  this.y = 0;

  this.width = node_width; // Same for all nodes
  this.height = 0; // Will be set later; proportional to link count

  this.in_links = [];
  this.out_links = [];

  this.name = '';

  this.has_char = function(id) {
    for (var i = 0; i < this.chars.length; i++) {
      if (id === this.chars[i]) {
        return true;
      }
    }
    return false;
  };
  this.char_node = false;
  this.first_scene = null; // Only defined for char_node true
  // Used when determining the y position of the name (i.e. the char_node)
  // Char nodes are divided into x-regions, and the names in each region
  // are sorted separately. This is the index of the x-region.
  // ... Actually, I'll just keep an array of the nodes in every region.
  //this.x_region = 0;

  this.median_group = null;
  // this.comic_name;

} // SceneNode

function generate_links(chars, scenes) {
  'use strict';
  var links = [];
  for (var i = 0; i < chars.length; i++) {
    // The scenes in which the character appears
    var char_scenes = [];
    var j;
    for (j = 0; j < scenes.length; j++) {
      if (scenes[j].has_char(chars[i].id)) {
        char_scenes[char_scenes.length] = scenes[j];
      } // if
    } // for


    char_scenes.sort(function(a, b) {
      return a.start - b.start;
    });
    chars[i].first_scene = char_scenes[0];
    for (j = 1; j < char_scenes.length; j++) {
      links[links.length] = new Link(char_scenes[j - 1], char_scenes[j],
        chars[i].group, chars[i].id);
      links[links.length - 1].char_ptr = chars[i];
      //console.log('char name = ' + chars[i].name + ', group = ' + chars[i].group);
      char_scenes[j - 1].out_links[char_scenes[j - 1].out_links.length] = links[links.length - 1];
      char_scenes[j].in_links[char_scenes[j].in_links.length] = links[links.length - 1];
      //console.log(char_scenes[j].in_links[char_scenes[j].in_links.length-1].y0);
    }
  } // for
  return links;
} // generate_links


function Group() {
  'use strict';
  this.min = -1;
  this.max = -1;
  this.id = -1;
  this.chars = [];
  this.first_scene_chars = []; // NOT USED?
  this.median_count = 0;
  this.biggest_scene = 0; // largest scene height. NOT USED
  this.all_chars = {};
  this.char_scenes = [];
  this.order = -1;
}


function sort_groups(groups_sorted, groups_desc, top, bottom) {
  'use strict';
  if (groups_desc.length === 2) {
    groups_sorted[bottom] = groups_desc[0];
    groups_sorted[top] = groups_desc[1];
    return;
  }
  if (top >= bottom) {
    if (groups_desc.length > 0) {
      groups_sorted[top] = groups_desc[0];
    }
    return;
  }

  var m = Math.floor((top + bottom) / 2);
  groups_sorted[m] = groups_desc[0];
  var t1 = top;
  var b1 = m - 1;
  var t2 = m + 1;
  var b2 = bottom;
  var g1 = [];
  var g2 = [];
  // TODO: make more efficient
  for (var i = 1; i < groups_desc.length; i++) {
    if (i % 2 === 0) {
      g1[g1.length] = groups_desc[i];
    } else {
      g2[g2.length] = groups_desc[i];
    }
  } // for
  sort_groups(groups_sorted, g1, t1, b1);
  sort_groups(groups_sorted, g2, t2, b2);
} // sort_groups


function define_groups(chars) {
  'use strict';
  var groups = [];
  chars.forEach(function(c) {
    // Put char in group
    var found_group = false;
    groups.forEach(function(g) {
      if (g.id === c.group) {
        found_group = true;
        g.chars[g.chars.length] = c;
        c.group_ptr = g;
      }
    });
    if (!found_group) {
      var g = new Group();
      g.id = c.group;
      g.chars[g.chars.length] = c;
      c.group_ptr = g;
      groups[groups.length] = g;
    }
  });
  return groups;
}


// TODO: Use the char_map to eliminate this
function find_group(chars, groups, char_id) {
  'use strict';
  // Find the char's group id
  var i;
  for (i = 0; i < chars.length; i++) {
    if (chars[i].id === char_id) {
      break;
    }
  } // for
  if (i === chars.length) {
    console.log('ERROR: char not found, id = ' + char_id);
  }

  // Find the corresponding group
  var j;
  for (j = 0; j < groups.length; j++) {
    if (chars[i] && groups[j]) {
      if (chars[i].group === groups[j].id) {
        break;
      }
    }
  }
  if (j === groups.length) {
    console.log('ERROR: groups not found.');
  }
  return j;
} // find_group


function find_median_groups(groups, scenes, chars, char_map, tie_breaker) {
  'use strict';
  scenes.forEach(function(scene) {
    if (!scene.char_node) {
      var group_count = [];
      var i;
      for (i = 0; i < groups.length; i++) {
        group_count[i] = 0;
      }
      var max_index = 0;

      scene.chars.forEach(function(c) {
        // TODO: Can just search group.chars
        var group_index = find_group(chars, groups, c);
        group_count[group_index] += 1;
        if ((!tie_breaker && group_count[group_index] >= group_count[max_index]) ||
          (group_count[group_index] > group_count[max_index])) {
          max_index = group_index;
        } else if (group_count[group_index] === group_count[max_index]) {
          // Tie-breaking
          var score1 = 0;
          var score2 = 0;
          for (i = 0; i < scene.in_links.length; i++) {
            if (scene.in_links[i].from.median_group !== null) {
              if (scene.in_links[i].from.median_group.id === groups[group_index].id) {
                score1 += 1;
              } else if (scene.in_links[i].from.median_group.id === groups[max_index].id) {
                score2 += 1;
              }
            } // if
          } // for
          for (i = 0; i < scene.out_links.length; i++) {
            if (scene.out_links[i].to.median_group !== null) {
              if (scene.out_links[i].to.median_group.id === groups[group_index].id) {
                score1 += 1;
              } else if (scene.out_links[i].to.median_group.id === groups[max_index].id) {
                score2 += 1;
              }
            } // if
          } // for
          if (score1 > score2) {
            max_index = group_index;
          }
        } // if
      }); // for each char in scene
      scene.median_group = groups[max_index];
      groups[max_index].median_count += 1;
      scene.chars.forEach(function(c) {
        // This just puts this character in the set
        // using sets to avoid duplicating characters
        groups[max_index].all_chars[c] = true;
      });
    }
  });

  // Convert all the group char sets to regular arrays
  groups.forEach(function(g) {
    var chars_list = [];
    for (var c in g.all_chars) {
      chars_list.push(char_map[c]);
    }
    g.all_chars = chars_list;
  });
}


function sort_groups_main(groups, center_sort) {
  'use strict';
  groups.sort(function(a, b) {
    return b.median_count - a.median_count;
  });

  var groups_cpy = [];
  var i;
  for (i = 0; i < groups.length; i++) {
    groups_cpy[i] = groups[i];
  }

  if (!center_sort) {
    if (groups.length > 0) { groups_cpy[0] = groups[0]; }
    if (groups.length > 1) { groups_cpy[groups.length - 1] = groups[1]; }
    if (groups.length > 2) {
      var groups_desc = [];
      for (i = 0; i < groups.length - 2; i++) {
        groups_desc[i] = groups[i + 2];
      }
      // groups_cpy is the one that gets sorted
      sort_groups(groups_cpy, groups_desc, 1, groups.length - 2);
    }
  } else {
    var center = Math.floor(groups.length / 2.0);
    groups_cpy[center] = groups[0];
    var groups_desc1 = [];
    for (i = 0; i < center; i++) {
      groups_desc1[i] = groups[i];
    }
    var groups_desc2 = [];
    for (i = center + 1; i < groups.length; i++) {
      groups_desc2[i - center - 1] = groups[i];
    }
    sort_groups(groups_cpy, groups_desc1, 0, center);
    sort_groups(groups_cpy, groups_desc2, center + 1, groups.length);
  }

  for (i = 0; i < groups_cpy.length; i++) {
    groups_cpy[i].order = i;
  }
  return groups_cpy;
} // sort_groups_main


// Called before link positions are determined
function add_char_scenes(chars, scenes, links, groups, panel_shift, comic_name) {
  'use strict';
  // Shit starting times for the rest of the scenes panel_shift panels to the left
  var char_scenes = [];
  scenes.forEach(function(scene) {
    if (!equal_scenes) {
      scene.start += panel_shift;
    }
  });

  // Set y values
  var cury = 0;
  groups.forEach(function(g) {
    var height = g.all_chars.length * text_height;
    g.min = cury;
    g.max = g.min + height;
    cury += height + group_gap;
  });

  for (var i = 0; i < chars.length; i++) {
    var s = new SceneNode([chars[i].id], [0], [1]);
    s.char_node = true;
    s.y = i * text_height;
    s.x = 0;
    s.width = 5;
    s.height = link_width;
    s.name = chars[i].name;
    s.chars[s.chars.length] = chars[i].id;
    s.id = scenes.length;
    s.comic_name = comic_name;
    if (chars[i].first_scene) {
      var l = new Link(s, chars[i].first_scene, chars[i].group, chars[i].id);
      l.char_ptr = chars[i];

      s.out_links[s.out_links.length] = l;
      chars[i].first_scene.in_links[chars[i].first_scene.in_links.length] = l;
      links[links.length] = l;
      s.first_scene = chars[i].first_scene;

      scenes[scenes.length] = s;
      char_scenes[char_scenes.length] = s;
      s.median_group = chars[i].first_scene.median_group;
    } // if
  } // for
  return char_scenes;
} // add_char_scenes


function calculate_node_positions(chars, scenes, total_panels, chart_width,
  chart_height, char_scenes, groups, panel_width,
  panel_shift, char_map) {
  'use strict';

  // Set the duration of the very last scene to something small
  // so that there isn't a lot of wasted space at the end
  /*
  scenes.sort(function(a, b) { return a.start - b.start; });
  var last = scenes[scenes.length-1];
  last.start = last.duration - 10;
  last.duration = 5;
  */

  scenes.forEach(function(scene) {
    if (!scene.char_node) {
      scene.height = Math.max(0, scene.chars.length * link_width + (scene.chars.length - 1) * link_gap);
      scene.width = panel_width * 3;

      // Average of chars meeting at the scene _in group_
      var sum1 = 0;
      var sum2 = 0;
      var den1 = 0;
      var den2 = 0;
      for (var i = 0; i < scene.chars.length; i++) {
        var c = char_map[scene.chars[i]];
        if (c) {
          var y = c.group_positions[scene.median_group.id];

          if (!y) {
            continue;
          }

          if (c.group.id === scene.median_group.id) {
            sum1 += y;
            den1 += 1;
          } else {
            sum2 += y;
            den2 += 1;
          }
        }
      }
      var avg;
      // If any non-median-group characters appear in the scene, use
      // the average of their positions in the median group
      if (den2 !== 0) {
        avg = sum2 / den2;
        // Otherwise, use the average of the group characters
      } else if (den1 !== 0) {
        avg = sum1 / den1;
      } else {
        console.log('ERROR: den1 and den2 are 0. Scene doesn\'t have characters?');
        avg = scene.median_group.min;
      }
      scene.y = avg - scene.height / 2.0;

      if (equal_scenes) {
        scene.x = scene.start;
      } else {
        scene.x = scene.start * panel_width;
      }
    }
  });

  char_scenes.forEach(function(scene) {
    if (scene.first_scene !== null) { // i.e. if it's a char scene node
      // Position char node right before the char's first scene
      if (scene.first_scene.x > per_width * raw_chart_width) {
        scene.x = scene.first_scene.x - name_shift;
      } else {
        scene.x = panel_shift * panel_width - name_shift;
      }
    }
  });
} // calculate_node_positions


// The positions of the nodes have to be set before this is called
// (The positions of the links are determined according to the positions
// of the nodes they link.)
function calculate_link_positions(scenes) {
  'use strict';
  // Sort by x
  // Because the sorting of the in_links will depend on where the link
  // is coming from, so that needs to be calculated first
  //scenes.sort(function(a, b) { return a.x - b.x; });

  // TODO:
  // Actually, sort the in_links such that the sum of the distances
  // between where a link is on the scene node and where its slot
  // is in the group are minimized

  scenes.forEach(function(scene) {
    // TODO: Sort the in_links here
    // Use sort by group for now
    scene.in_links.sort(function(a, b) {
      return a.char_ptr.group_ptr.order - b.char_ptr.group_ptr.order;
    });
    scene.out_links.sort(function(a, b) {
      return a.char_ptr.group_ptr.order - b.char_ptr.group_ptr.order;
    });

    // We can't calculate the y positions of the in links in the same
    // way we do the out links, because some links come in but don't go
    // out, and we need every link to go out the same position it came in
    // so we flag the unset positions.
    var i;
    for (i = 0; i < scene.out_links.length; i++) {
      scene.out_links[i].y0 = -1;
    }

    var j = 0;
    for (i = 0; i < scene.in_links.length; i++) {
      // These are links incoming to the node, so we're setting the
      // co-cordinates for the last point on the link path
      scene.in_links[i].y1 = scene.y + i * (link_width + link_gap) + link_width / 2.0;
      scene.in_links[i].x1 = scene.x + 0.5 * scene.width;

      if (j < scene.out_links.length && scene.out_links[j].char_id === scene.in_links[i].char_id) {
        scene.out_links[j].y0 = scene.in_links[i].y1;
        j++;
      }
    }

    for (i = 0; i < scene.out_links.length; i++) {
      if (scene.out_links[i].y0 === -1) {
        scene.out_links[i].y0 = scene.y + i * (link_width + link_gap) + link_width / 2.0;
      }
      scene.out_links[i].x0 = scene.x + 0.5 * scene.width;
    }
  });

} // calculate_link_positions

function styleLinkedAuthors(from, chars, focus, visited, iteration) {
  'use strict';
  if (!from.char_node) {
    d3.selectAll('[scene_id=\'' + from.id + '\'] .scene')
      .style({'opacity': 1});
  }

  if (!visited) {
    visited = [];
  }

  function addStyling(from, opacity) {
    // increase stroke width of connected links
    d3.selectAll('[charid=\'' + from.comic_name + '_' + from.chars[0] + '\']')
      .style({'stroke-opacity': opacity});

    // make connected authors opaque
    d3.selectAll('[scene_id=\'' + from.id + '\']')
      .style({'opacity': 1});
  }

  function setFuturePapers(to, chars, focus, futureVisitors) {
    if (futureVisitors.indexOf(to.id) < 0) {
      futureVisitors.push(to.id);
      if (!to.char_node) {
        d3.selectAll('[scene_id=\'' + to.id + '\'] .scene')
          .style({'opacity': 1});
      }

      for (var k = 0; k < to.out_links.length; ++k) {
        if (chars.indexOf(to.out_links[k].char_id) > -1) {
          var newTo = to.out_links[k].to;
          setFuturePapers(newTo, chars, focus, futureVisitors);
        }
      }
    }
  }

  if (visited.indexOf(from.id) > -1) {
    // visited
  } else {
    visited.push(from.id);

    if (from.in_links.length === 0) {
      if (focus) {
        addStyling(from, '1');
      } else {
        addStyling(from, '0.6');
      }
    } else {
      for (var i = 0; i < from.in_links.length; ++i) {
        if (chars.indexOf(from.in_links[i].char_id) > -1) {
          var newFrom = from.in_links[i].from;
          styleLinkedAuthors(newFrom, chars, focus, visited, true);
        }
      }
    }

    if (!iteration) {
      var futureVistors = [];
      setFuturePapers(from, chars, focus, futureVistors);
    }
  }
}

function draw_nodes(scenes, svg) {
  'use strict';
  function click(d) {
    var paper = d.paper;
    var url;

    if (paper) {
      url = scienceLibrary + '/paper/' + paper;
      window.location.href = url;
    } else {
      var character = d.chars[0];
      var characterName = authorIndex[character];

      url = scienceLibrary + '/collaboration?author=' + characterName + '&author=' + authorIndex[0];
      window.location.href = url;
    }
  }

  function mouseover(d) {
    d3.selectAll('.node_char')
      .style(opacity.translucentNodes);
    d3.selectAll('.scene')
      .style(opacity.translucentScene);
    d3.selectAll('.link')
      .style(opacity.translucentLinks);
    styleLinkedAuthors(d, d.chars, true);

    if (d.char_node !== true) {
      // Remove other titles (overlapping may cause this)
      d3.selectAll('[class=\'paper-title\']').remove();
      d3.selectAll('[class=\'paper-title-placeholder\']')
        .attr('class', 'hidden paper-title-placeholder');

      d3.select('#title-box')
        .append('text')
          .attr('class', 'paper-title')
          .text(d.title);
    }
  } // mouseover

  function mouseout(d) {
    d3.selectAll('.node_char')
      .style(opacity.opaqueNodes);
    d3.selectAll('.scene')
      .style(opacity.opaqueScene);
    d3.selectAll('.link')
      .style(opacity.opaqueLinks);
    styleLinkedAuthors(d, d.chars, false);

    // Remove all paper titles
    d3.selectAll('[class=\'paper-title\']').remove();
    d3.selectAll('[class=\'hidden paper-title-placeholder\']')
      .attr('class', 'paper-title-placeholder');
  }

  var node = svg.append('g').selectAll('.node')
    .data(scenes)
    .enter().append('g')
    .attr('class', 'node')
    .attr('class', function(d) {
      if (d.name) {
        return 'node node_char';
      } else {
        return 'node';
      }
    })
    .attr('transform', function(d) {
      return 'translate(' + d.x + ',' + d.y + ')';
    })
    .attr('scene_id', function(d) {
      return d.id;
    })
    .on('mouseover', mouseover)
    .on('mouseout', mouseout)
    .on('click', click);
    // .call(d3.behavior.drag()
    //   .origin(function(d) {
    //     return d;
    //   })
    //   .on('dragstart', function() {
    //     this.parentNode.appendChild(this);
    //   })
    //   .on('drag', dragmove));

  node.append('rect')
    .attr('width', function(d) {
      return d.width;
    })
    .attr('height', function(d) {
      return d.height;
    })
    .attr('class', 'scene')
    .style('fill', function(d) {
      if (d.paper) {
        var conceptNames = rels[d.paper].concept_names;
        var papers = ['#5596e6', '#00b299', '#7c56a5', '#f49c4e', '#cc3f40', '#94a3ab'];

        if (conceptNames.indexOf(ce.concepts.journalPaper) > -1) {
          return papers[0];
        } else if (conceptNames.indexOf(ce.concepts.externalConferencePaper) > -1) {
          return papers[1];
        } else if (conceptNames.indexOf(ce.concepts.patent) > -1) {
          return papers[2];
        } else if (conceptNames.indexOf(ce.concepts.internalConferencePaper) > -1) {
          return papers[3];
        } else if (conceptNames.indexOf(ce.concepts.technicalReport) > -1) {
          return papers[4];
        } else if (conceptNames.indexOf(ce.concepts.otherDocument) > -1) {
          return papers[5];
        }
      }

      return '#fff';
    })
    // .style('stroke', function(d) { return '#0f3a58'; })
    .append('title')
    .text(function(d) {
      return d.name;
    });

  // White background for the names
  if (name_bg) {
    node.append('rect')
      .filter(function(d) {
        return d.char_node;
      })
      .attr('x', function(d) {
        return -((d.name.length + 2) * 5);
      })
      .attr('y', function(d) {
        return -3;
      })
      .attr('width', function(d) {
        return (d.name.length + 1) * 5;
      })
      .attr('height', 7.5)
      .attr('transform', null)
      // .attr('fill', '#fff')
      .style('opacity', 0);
  }

  // TODO: Append something to show type of paper - too busy?
  // console.log(scenes);
  // node.append('circle')
  //  .attr('cx', 0)
  //  .attr('cy', 0)
  //  .attr('r', 5)
  //  .style('fill', color(5));

  node.append('text')
    .filter(function(d) {
      return d.char_node;
    })
    .attr('x', -6)
    .attr('y', function(d) {
      return 0;
    })
    .attr('dy', '.35em')
    .attr('text-anchor', 'end')
    .attr('transform', null)
    //.attr('background', '#fff')
    .text(function(d) {
      return d.name;
    })
    //.style('fill', '#000')
    //.style('stroke', '#fff')
    //.style('stroke-width', '0.5px')
    .filter(function(d) {
      return false;
      //return d.x < chart_width / 2;
    })
    .attr('x', function(d) {
      return 6 + d.width;
    })
    .attr('text-anchor', 'start');
} // draw_nodes


function draw_links(links, svg) {
  'use strict';
  function mouseover_cb(d) {
    d3.selectAll('.node_char')
      .style(opacity.translucentNodes);
    d3.selectAll('.scene')
      .style(opacity.translucentScene);
    d3.selectAll('.link')
      .style(opacity.translucentLinks);
    styleLinkedAuthors(d.from, [d.char_id], true);
  }

  function mouseout_cb(d) {
    d3.selectAll('.node_char')
      .style(opacity.opaqueNodes);
    d3.selectAll('.scene')
      .style(opacity.opaqueScene);
    d3.selectAll('.link')
      .style(opacity.opaqueLinks);
    styleLinkedAuthors(d.from, [d.char_id], false);
  }

  svg.append('g').selectAll('.link')
    .data(links)
    .enter().append('path')
    .attr('class', 'link')
    .attr('d', function(d) {
      return get_path(d);
    })
    .attr('from', function(d) {
      return d.from.comic_name + '_' + d.from.id;
    })
    .attr('to', function(d) {
      return d.to.comic_name + '_' + d.to.id;
    })
    .attr('charid', function(d) {
      return d.from.comic_name + '_' + d.char_id;
    })
    .style('stroke', function(d) {
      return d3.rgb(color[d.group]).toString();
    })
    .style('stroke-width', link_width)
    .style('stroke-opacity', '0.6')
    .style('stroke-linecap', 'round')
    .on('mouseover', mouseover_cb)
    .on('mouseout', mouseout_cb);
} // draw_links

function drawNarrativeChart(safe_name, tie_breaker, center_sort, collapse, data, svr, ces, sl, utils, defs) {
  'use strict';
  var vals = data.main_instance.property_values;
  rels = data.related_instances;
  var i = 0;

  var authorMap = {};

  scienceLibrary = sl;
  server = svr;
  ceStore = ces;
  ce = defs;

  // build character list
  var xchars = [];
  var types = {
    'AC': 0,
    'IND': 1,
    'GOV': 2
  };

//  var defOrg = rels[vals[ce.author.writesFor][0]];
  var employerType = utils.getIndustryFor(data.main_instance);

  var character = {
    name: vals[ce.author.fullName][0],
    id: 0,
    group: employerType
  };

  xchars.push(character);
  authorMap[data.main_instance._id] = character.id;
  authorIndex[character.id] = data.main_instance._id;

  if (vals[ce.author.coAuthorList]) {
    for (i = 0; i < vals[ce.author.coAuthorList].length; ++i) {
      var coAuthor = rels[vals[ce.author.coAuthorList][i]];
      var type = utils.getIndustryFor(coAuthor);

      var c = rels[vals[ce.author.coAuthorList][i]];
      var cName = c.property_values[ce.author.fullName] ? c.property_values[ce.author.fullName][0] : c._id;

      character = {
        name: cName,
        id: i + 1,
        group: type
      };

      xchars.push(character);
      authorMap[c._id] = character.id;
      authorIndex[character.id] = c._id;
    }
  }

  // build narrative
  var narrative = {
    scenes: []
  };

  var paperAndDates = [];

  if (vals[ce.author.documentList]) {
  for (i = 0; i < vals[ce.author.documentList].length; ++i) {
      if (rels[vals[ce.author.documentList][i]].property_values[ce.paper.finalDate]) {
        var paperDate = rels[vals[ce.author.documentList][i]].property_values[ce.paper.finalDate][0];
        var dateVals = rels[paperDate].property_values;
        var date;

        var year = dateVals[ce.date.year][0];
        var month = dateVals[ce.date.month] ? dateVals[ce.date.month][0] : 1;
        var day = dateVals[ce.date.day] ? dateVals[ce.date.day][0] : 1;

        //Javascript dates have month numbers starting at 0 but the
        //value from the ce-store has month numbers starting at 1
        --month;

        if (day) {
          date = new Date(year, month, day);
        }

        paperAndDates.push({
          date: date,
          paper: vals[ce.author.documentList][i],
          title: rels[vals[ce.author.documentList][i]].property_values[ce.paper.title][0]
        });
      }
    }
  }

  var sortDatesAsc = function (obj1, obj2) {
    var date1 = obj1.date;
    var date2 = obj2.date;

    if (date1 > date2) {
      return 1;
    } else if (date1 < date2) {
      return -1;
    } else {
      return 0;
    }
  };

  if (paperAndDates[0]) {
    paperAndDates.sort(sortDatesAsc);

    var offset = paperAndDates[0].date.getTime() / 1000000000;
    var nextTimestamp;

    for (i = 0; i < paperAndDates.length; ++i) {
      var currentTimestamp = paperAndDates[i].date.getTime() / 1000000000 - offset;
      if (paperAndDates[i + 1]) {
        nextTimestamp = paperAndDates[i + 1].date.getTime() / 1000000000 - offset;
      } else {
        nextTimestamp = currentTimestamp;
      }

      var scene = {
        chars: [],
        duration: nextTimestamp - currentTimestamp,
        start: currentTimestamp,
        paper: paperAndDates[i].paper,
        title: paperAndDates[i].title,
        id: i
      };

      var paperVals = rels[paperAndDates[i].paper].property_values;

      for (var j = 0; j < paperVals[ce.paper.authorList].length; ++j) {
        var authorVals = rels[paperVals[ce.paper.authorList][j]].property_values;
        var authorId = authorVals[ce.orderedAuthor.person];

        if (authorId) {
          scene.chars.push(authorMap[authorId]);
        }
      }

      narrative.scenes.push(scene);
    }

    // draw
    var margin = {
      top: 20,
      right: 100,
      bottom: 20,
      left: 1
    };
    var width = raw_chart_width - margin.left - margin.right;

    var jscenes = narrative.scenes;
    // This calculation is only relevant for equal_scenes = true
    var scene_width = (width - longest_name) / (jscenes.length + 1);

    var total_panels = 0;
    var scenes = [];
    for (i = 0; i < jscenes.length; i++) {
      var duration = parseInt(jscenes[i].duration, 10);
      var start;
      if (equal_scenes) {
        start = i * scene_width + longest_name;
      } else {
        start = parseInt(jscenes[i].start, 10);
      }

      var chars = jscenes[i].chars;
      //if (chars.length == 0) continue;
      scenes[scenes.length] = new SceneNode(jscenes[i].chars,
        start, duration,
        parseInt(jscenes[i].id, 10), jscenes[i].paper);
      scenes[scenes.length - 1].comic_name = safe_name;
      scenes[scenes.length - 1].title = jscenes[i].title;
      total_panels += duration;
    } // for

    if (scenes[0]) {
      scenes.sort(function(a, b) {
        return a.start - b.start;
      });
      total_panels -= scenes[scenes.length - 1].duration;
      scenes[scenes.length - 1].duration = 0;
    }

    // Make space at the leftmost end of the chart for character names
    //var total_panels = parseInt(j['panels']);
    var panel_width = Math.min((width - longest_name) / total_panels, 15);
    var panel_shift = Math.round(longest_name / panel_width);
    total_panels += panel_shift;
    panel_width = Math.min(width / total_panels, 15);

    // Calculate chart height based on the number of characters
    // TODO: Redo this calculation
    //var raw_chart_height = xchars.length*(link_width + link_gap + group_gap);// - (link_gap + group_gap);
    var raw_chart_height = 700;
    var height = raw_chart_height - margin.top - margin.bottom;

    // Drag & zoom
    var zoomed = function() {
      var x = d3.event.translate[0];
      var y = d3.event.translate[1] + drag_offset;
      container.attr('transform', 'translate(' + [x, y] + ')scale(' + d3.event.scale + ')');
    };

    var dragstarted = function() {
      d3.event.sourceEvent.stopPropagation();
      d3.select(this).classed('dragging', true);
    };

    var dragged = function(d) {
      d3.select(this)
        .attr('cx', d.x = d3.event.x)
        .attr('cy', d.y = d3.event.y);
    };

    var dragended = function(d) {
      d3.select(this).classed('dragging', false);
    };

    var zoom = d3.behavior.zoom()
        .scaleExtent([0, 10])
        .on('zoom', zoomed);

    var drag = d3.behavior.drag()
        .origin(function(d) { return d; })
        .on('dragstart', dragstarted)
        .on('drag', dragged)
        .on('dragend', dragended);

    var svg = d3.select('#narrative-chart').append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('class', 'chart')
        .attr('id', safe_name)
      .append('g')
        .call(zoom);

    var rect = svg.append('rect')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .attr('class', 'chart')
        .style('fill', 'none')
        .style('pointer-events', 'all');

    var container = svg.append('g')
        .attr('id', 'narrative-container')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')scale(1)');

    var charsArr = [];
    var char_map = []; // maps id to pointer
    for (i = 0; i < xchars.length; i++) {
      charsArr[charsArr.length] = new Character_(xchars[i].name, xchars[i].id, xchars[i].group);
      char_map[xchars[i].id] = charsArr[charsArr.length - 1];
    }

    var groups = define_groups(charsArr);
    find_median_groups(groups, scenes, charsArr, char_map, tie_breaker);
    groups = sort_groups_main(groups, center_sort);

    var links = generate_links(charsArr, scenes);
    var char_scenes = add_char_scenes(charsArr, scenes, links, groups, panel_shift, safe_name);


    // Determine the position of each character in each group
    // (if it ever appears in the scenes that appear in that
    // group)
    groups.forEach(function(g) {
      g.all_chars.sort(function(a, b) {
        return a.group_ptr.order - b.group_ptr.order;
      });
      var y = g.min;
      for (var i = 0; i < g.all_chars.length; i++) {
        if (g.all_chars[i]) {
          g.all_chars[i].group_positions[g.id] = y + i * (text_height);
        }
      }
    });

    calculate_node_positions(charsArr, scenes, total_panels,
      width, height, char_scenes, groups, panel_width,
      panel_shift, char_map);


    scenes.forEach(function(s) {
      if (!s.char_node) {
        var first_scenes = [];

        s.in_links.forEach(function(l) {
          if (l.from.char_node) {
            first_scenes[first_scenes.length] = l.from;
          }
        });

        for (var i = 0; i < first_scenes.length; i++) {
          first_scenes[i].y = s.y + s.height / 2.0 + i * text_height;
        }
      }
    });

    // Determining the y-positions of the names (i.e. the char scenes)
    // if the appear at the beginning of the chart
    char_scenes.forEach(function(cs) {

      var character = char_map[cs.chars[0]];
      if (character.first_scene.x < per_width * width) {
        // The median group of the first scene in which the character appears
        // We want the character's name to appear in that group
        var first_group = character.first_scene.median_group;
        cs.y = character.group_positions[first_group.id];
      }
    });

    calculate_link_positions(scenes, charsArr, groups, char_map);

    height = groups[groups.length - 1].max + group_gap * 5;
    raw_chart_height = height + margin.top + margin.bottom;

    draw_links(links, container);
    draw_nodes(scenes, container);

    // chart elements
    var narrativeChart = document.getElementById('narrative-chart');
    var narrativeContainer = document.getElementById('narrative-container');

    // axis
    var t1 = paperAndDates[0].date,
        t2 = paperAndDates[paperAndDates.length - 1].date,
        t0 = d3.time.month.offset(t1, -1),
        t3 = d3.time.month.offset(t2, +1);

    var containerWidth = narrativeContainer.getBoundingClientRect().width;
    var axisWidth;
    var rotateAxis = false;

    if (raw_chart_width > containerWidth) {
      axisWidth = containerWidth;
      rotateAxis = true;
    } else {
      axisWidth = raw_chart_width;
    }

    var x = d3.time.scale()
      .domain([t0, t3])
      .range([t0, t3].map(d3.time.scale()
        .domain([t1, t2])
        .range([0, axisWidth - 160])));

    var xAxis = d3.svg.axis()
      .scale(x)
      .orient('bottom')
      .tickFormat(d3.time.format('%b %Y'));

    var axisLabels = container.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(' + (longest_name + 20) + ',' + (height + margin.top) + ')')
      .call(xAxis)
    .selectAll('text')
      .attr('y', 6)
      .attr('x', 6)
      .style('text-anchor', 'start');

    if (rotateAxis) {
      axisLabels
        .attr('y', 0)
        .attr('x', 9)
        .attr('dy', '.35em')
        .attr('transform', 'rotate(90)');
    }

    // calculate scale
    var chartRect = narrativeChart.getBoundingClientRect();
    var containerRect = narrativeContainer.getBoundingClientRect();
    var containerRectWidth = containerRect.width;

    if (containerRectWidth < 200) {
      containerRectWidth = containerRectWidth * 2;
    }

    var scale = (chartRect.width - 140) / containerRectWidth;
    var chartHeight = chartRect.height - 100;
    var containerHeight = containerRect.height;

    if (scale < 1) {
      scale = chartHeight/containerHeight;

      if (scale > 1) {
        scale = 1;
      }
    }

    // apply scale
    container.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')scale(' + scale + ')');
    zoom.scale(scale);

    // adjust offset
    chartRect = narrativeChart.getBoundingClientRect();
    containerRect = narrativeContainer.getBoundingClientRect();

    chartHeight = chartRect.height;
    containerHeight = containerRect.height;

    if (containerHeight < chartHeight) {
      var diff = chartHeight - containerHeight;
      drag_offset = diff / 2;
    }

    var leftOffset = 0;
    if (containerRect.width < chartRect.width) {
      var leftDiff = chartRect.width - 140 - containerRect.width;
      leftOffset = leftDiff / 2;
    }

    container.attr('transform', 'translate(' + (margin.left + leftOffset) + ',' + (margin.top + drag_offset) + ')scale(' + scale + ')');

    var toggleListView = function() {
      var narrative = d3.select('#narrative-chart');
      var papers = d3.select('#papers-list');
      var toggle = d3.select('.toggle-button');

      if (narrative[0][0].getAttribute('class').indexOf('hidden') > -1) {
        narrative.attr('class', 'panel');
        papers.attr('class', 'hidden panel');
        toggle.text('List view');
      } else {
        narrative.attr('class', 'hidden panel');
        papers.attr('class', 'panel');
        toggle.text('Narrative view');
      }
    };

    // draw toggle
    var toggle = d3.select('#toggle-box').append('svg')
      .attr('id', 'toggle')
      .on('click', toggleListView);

    var g = toggle.append('g');

    g.append('text')
      .attr('class', 'toggle-button')
      .text('List view');

    // draw paper title box
    var titleBox = d3.select('#narrative-chart').append('svg')
      .attr('id', 'paper-title-box');

    g = titleBox.append('g')
      .attr('id', 'title-box')
      .attr('transform', 'translate(0, 10)');

    g.append('text')
      .attr('class', 'paper-title-placeholder')
      .text('Hover over a paper');

    // draw legend
    var legend = d3.select('#narrative-chart').append('svg')
      .attr('class', 'narrative-legend');

    var industryMap = {
      'IND': 'Industry',
      'AC':  'Academia',
      'GOV': 'Government'
    };

    i = 0;
    for (var t in types) {
      if (types.hasOwnProperty(t)) {
        g = legend.append('g');
        g.append('rect')
          .attr('fill', color[t])
          .attr('class', 'legend-key')
          .attr('transform', 'translate(' + 10 + ',' + (i * 15) + ')');
        g.append('text')
          .attr('transform', 'translate(' + 30 + ',' + (i * 15 + 8) + ')')
          .text(industryMap[t]);

        i++;
      }
    }
  }
}
