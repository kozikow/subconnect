var App = Em.Application.create();

App.ApplicationView = Ember.View.extend({
  templateName: 'application',
  didInsertElement : function() {
    this.get("controller").drawGraph();
  }
});
App.ApplicationController = Ember.Controller.extend({
  algorithm : "reverse",

  force : undefined,
  nodes : [],
  links : [],
  vis : undefined,
  num_nodes : 0,
  removed_nodes : [0, 2, 3],
  isReverse : function() {
    return (this.get("algorithm") == "reverse")
  }.property("algorithm"),
  isSlyce : function() {
    return (this.get("algorithm") == "slyce")
  }.property("algorithm"),

  resetAlgorithms : function() {
    this.set("removed_nodes", []);
  }.observes("algorithm"),

  chooseAlgorithmReverse: function() {
    this.set("algorithm", "reverse");
  },
  chooseAlgorithmSlyce: function() {
    this.set("algorithm", "slyce");
  },

  add_node : function(event) {
    var nodes = this.get("nodes"),
        links = this.get("links"),
        point = d3.mouse(event),
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
    this.set("num_nodes", this.get("num_nodes") + 1);
    this.set("nodes", nodes);
    this.set("links", links);
  },

  restart : function() {
    var force = this.get("force"),
        vis = this.get("vis"),
        links = this.get("links"),
        removed_nodes = this.get("removed_nodes"),
        nodes = this.get("nodes");
    force.start();
    vis.selectAll("line.link").data(links)
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
  }.observes("algorithm", "num_nodes"),

  drawGraph : function() {
    var self = this,
        width = 960,
        height = 500,
        fill = d3.scale.category20(),
        nodes = this.get("nodes"),
        links = this.get("links"),
        vis = this.get("vis"),
        force = this.get("force");

    vis = d3.select("#chart").append("svg")
      .attr("width", width)
      .attr("height", height);

    vis.append("rect")
      .attr("width", width)
      .attr("height", height);

    force = d3.layout.force()
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
      self.add_node(this);
    });

    this.set("nodes", nodes),
    this.set("links", links),
    this.set("vis", vis),
    this.set("force", force);
  }
});

App.Router = Ember.Router.extend({
	enableLogging: true,
  	root: Ember.Route.extend({
      chooseAlgorithmReverse : function(router, context) {
        router.get('applicationController').chooseAlgorithmReverse();
      },
      chooseAlgorithmSlyce : function(router, context) {
        router.get('applicationController').chooseAlgorithmSlyce();
      },
    	index: Ember.Route.extend({
    		route: '/',
    	})
  	})
});


App.initialize();