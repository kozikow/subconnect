num_nodes = 0;
removed_nodes = [0, 2, 3];
choose_algorithm = "reverse";
long_alg_name = {
  'reverse' : 'Reverse search',
  'slyce' : 'SlyCE'
}

chooseAlgorithm = function(algname) {
  chosen_algorithm = algname;
  $("#reverse_button").removeClass("active")
  $("#slyce_button").removeClass("active")
  $("#" + algname+"_button").addClass("active")
};

var width = 960,
    height = 500,
    fill = d3.scale.category20(),
    nodes = [],
    links = [];

var vis = d3.select("#chart").append("svg")
    .attr("width", width)
    .attr("height", height)

vis.append("rect")
    .attr("width", width)
    .attr("height", height);

var force = d3.layout.force()
    .distance(100)
    .charge(-400)
    .nodes(nodes)
    .links(links)
    .size([width, height]);

var cursor = vis.append("circle")
    .attr("r", 100)
    .attr("transform", "translate(-100,-100)")
    .attr("class", "cursor");

force.on("tick", function() {
  vis.selectAll("line.link")
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; })
      .style("stroke-width", function(d, i) {
        if( ($.inArray(d.source.index, removed_nodes) != -1) ) {
          return 1;
        }
        if( ($.inArray(d.target.index, removed_nodes) != -1) ) {
          return 1;
        }
        else {
          return 5;
        }
      });

  vis.selectAll("text.node")
      .attr("x", function(d) { return d.x - 5; })
      .attr("y", function(d) { return d.y + 5; });

  vis.selectAll("circle.node")
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
});

vis.on("mousemove", function() {
  cursor.attr("transform", "translate(" + d3.mouse(this) + ")");
});

vis.on("mousedown", function() {
  var point = d3.mouse(this),
      node = {x: point[0], y: point[1]},
      n = nodes.push(node);

  // add links to any nearby nodes
  nodes.forEach(function(target) {
    var x = target.x - node.x,
        y = target.y - node.y;
    if (Math.sqrt(x * x + y * y) < 100) {
      links.push({source: node, target: target});
    }
  });
  num_nodes += 1;
  restart();
});

restart();

function restart() {
  force.start();

  vis.selectAll("line.link")
      .data(links)
    .enter().insert("line", "circle.node")
      .attr("class", "link")
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; })
      .style("fill", "black")
      .style("stroke-width", function(d, i) {
        if( ($.inArray(d.source.index, removed_nodes) != -1) ) {
          return 1;
        }
        if( ($.inArray(d.target.index, removed_nodes) != -1) ) {
          return 1;
        }
        else {
          return 5;
        }
      })

  vis.selectAll("circle.node")
      .data(nodes)
    .enter().insert("circle", "circle.cursor")
      .attr("class", "node")
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .attr("r", 15)
      .style("fill-opacity", function(d,i) {
        if($.inArray(i, removed_nodes) != -1) {
          return 0.1;
        }
        else {
          return 0.4;
        }
       })
      .call(force.drag);

  vis.selectAll("text.node")
      .data(nodes)
    .enter().append("svg:text")
      .attr("class", "node")
      .attr("x", function(d) { return d.x - 5; })
      .attr("y", function(d) { return d.y + 5; })
      .text(function(d, i) { return i; })
      .style("fill","black")
      .style("font-size", function(d) { return "20px"; })
      .style("fill-opacity", function(d,i) {
        if($.inArray(i, removed_nodes) != -1) {
          return 0.2;
        }
        else {
          return 1;
        }
       })
      .call(force.drag);
}