var App = Em.Application.create();

App.ApplicationView = Ember.View.extend({
  templateName: 'application',
  didInsertElement : function() {
    this.get("controller").drawGraph();
  }
});

App.ApplicationController = Ember.Controller.extend({
  algorithm : undefined,
  in_algorithm : undefined,

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
  isAlgo : function() {
    return this.get("in_algorithm");
  }.property("in_algorithm"),

  resetAlgorithm : function() {
    this.set("removed_nodes", []);
    this.set("in_algorith", false);
  }.observes("algorithm"),

  startAlgorithm : function() {
    this.set("in_algorithm", true);
  },
  stopAlgorithm : function() {
    this.set("in_algorithm", false);
  },
  chooseAlgorithmReverse: function() {
    this.set("algorithm", "reverse");
  },
  chooseAlgorithmSlyce: function() {
    this.set("algorithm", "slyce");
  },

  addNode : function(event) {
    var nodes = this.get("nodes");
    var links = this.get("links");
    var point = d3.mouse(event);
    var node = {x: point[0], y: point[1]};
    var n = nodes.push(node);

    // add links to any nearby nodes
    nodes.forEach(function(target) {
      var x = target.x - node.x;
      var y = target.y - node.y;
      if (Math.sqrt(x * x + y * y) < 100) {
          links.push({source: node, target: target});
      }
    });
    this.set("num_nodes", this.get("num_nodes") + 1);
    this.set("nodes", nodes);
    this.set("links", links);
  },

  forceTick : function() {
    var vis = this.get("vis");
    var removed_nodes = this.get("removed_nodes");
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
      .attr("y", function(d) { return d.y + 5; })
      .style("fill-opacity", function(d,i) {
        if($.inArray(i, removed_nodes) != -1) {
          return 0.2;
        }
        else {
          return 1;
        }
       });

    vis.selectAll("circle.node")
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .style("fill-opacity", function(d,i) {
        if($.inArray(i, removed_nodes) != -1) {
          return 0.1;
        }
        else {
          return 0.4;
        }
       })
  },

  redrawGraph : function() {
    var force = this.get("force");
    var vis = this.get("vis");
    var links = this.get("links");
    var removed_nodes = this.get("removed_nodes");
    var nodes = this.get("nodes");

    force.start();
    vis.selectAll("line.link").data(links)
    .enter().insert("line", "circle.node")
      .attr("class", "link")
      .style("fill", "black")

    vis.selectAll("circle.node")
      .data(nodes)
      .enter().insert("circle", "circle.cursor")
      .attr("class", "node")
      .attr("r", 15)
      
      .call(force.drag);

    vis.selectAll("text.node")
      .data(nodes)
    .enter().append("svg:text")
      .attr("class", "node")
      .text(function(d, i) { return i; })
      .style("fill","black")
      .style("font-size", function(d) { return "20px"; })
      .call(force.drag);
    this.forceTick();
  }.observes("algorithm", "num_nodes"),

  setCursor : function() {
    var vis = this.get("vis");
    var in_algorithm = this.get("in_algorithm");
    if(!in_algorithm) {
      var cursor = vis.append("circle")
      .attr("r", 100)
      .attr("transform", "translate(-100,-100)")
      .attr("class", "cursor");

      vis.on("mousemove", function() {
        cursor.attr("transform", "translate(" + d3.mouse(this) + ")");
      });
    }
    else {
      vis.selectAll("circle").remove();
    }
  }.observes("in_algorithm"),

  drawGraph : function() {
    var self = this;
    var width = 960;
    var height = 500;
    var fill = d3.scale.category20();
    var nodes = this.get("nodes");
    var links = this.get("links");
    var vis = this.get("vis");
    var force = this.get("force");

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

    force.on("tick", function() {
      self.forceTick();
    });

    vis.on("mousedown", function() {
      self.addNode(this);
    });

    this.set("nodes", nodes),
    this.set("links", links),
    this.set("vis", vis),
    this.set("force", force);
    this.set("in_algorithm", false)
    this.set("algorithm", "reverse")
  }
});

App.Router = Ember.Router.extend({
  enableLogging: true,
  root: Ember.Route.extend({
    chooseAlgorithmReverse : function(router) {
      router.get('applicationController').chooseAlgorithmReverse();
    },
    chooseAlgorithmSlyce : function(router) {
      router.get('applicationController').chooseAlgorithmSlyce();
    },
    startAlgorithm : function(router) {
      router.get('applicationController').startAlgorithm();
    },
    stopAlgorithm : function() {
      router.get('applicationController').stopAlgorithm();
    },
    index: Ember.Route.extend({
      route: '/',
    })
  })
});


App.initialize();