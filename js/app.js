var App = Em.Application.create();

if(!Array.prototype.last) {
    Array.prototype.last = function() {
        return this[this.length - 1];
    }
}

App.ApplicationView = Ember.View.extend({
  templateName: 'application',
  didInsertElement : function() {
    this.get("controller").drawGraph();
  }
});

App.ApplicationController = Ember.Controller.extend({
  algorithm : undefined,
  in_algorithm : undefined,
  step_description : undefined,
  cursor : undefined,
  force : undefined,
  nodes : [],
  links : [],
  vis : undefined,
  num_nodes: 0,
  removed_nodes: [],
  last_removed: 0,
  num_enumerated : 0,
  dfs_flag : 0,
  traversed_subgraphs : [],
  isReverse : function() {
    return (this.get("algorithm") == "reverse")
  }.property("algorithm"),
  isSlyce : function() {
    return (this.get("algorithm") == "slyce")
  }.property("algorithm"),
  isAlgo : function() {
    return this.get("in_algorithm");
  }.property("in_algorithm"),

  graphNotEmpty : function() {
    return this.get("num_nodes") > 0;
  }.property("num_nodes"),

  resetAlgorithm : function() {
    this.set("removed_nodes", []);
    this.set("in_algorithm", false);
    $("#step_button").popover('hide');
  }.observes("algorithm"),

  startAlgorithm : function() {
    if(this.get("canStartAlgorithm")) {
      if(!this.get("in_algorithm")) {
	$("#step_button").popover('show');

        var num_nodes = this.get("num_nodes");
        this.set("num_enumerated", 0);
        this.set("traversed_subgraphs", [])
        this.addTraversedSubgraph();
        this.set("last_removed", num_nodes);
        this.set("in_algorithm", true);
      }
    }
  },
  stopAlgorithm : function() {
    this.resetAlgorithm();
  },
  isConnectedDFS: function() {
    var num_nodes = this.get("num_nodes");
    var removed_nodes = this.get("removed_nodes");
    var links = this.get("links");
    var num_set = [];

    var min_found = this.get("num_nodes");

    for(var i=0; i<num_nodes; i++) {
      num_set.push(i);
    }
    for(var i=0; i<num_nodes; i++) {
      for(var j=0; j<links.length; j++) {
        var source = links[j].source.index;
        var target = links[j].target.index;
        if($.inArray(source, removed_nodes)==-1 && $.inArray(target, removed_nodes)==-1) {
          num_set[source] = num_set[source] < num_set[target] ? num_set[source] : num_set[target];
          num_set[target] = num_set[source];
          min_found = min_found < num_set[target] ? min_found : num_set[target];
        }
      }
    }
    for(var i=0; i<num_nodes; i++) {
      if($.inArray(i, removed_nodes) == -1) {
        if(num_set[i] != min_found) {
          return false;
        }
      }
    }
    return true;
  },
  isGraphConnected: function() {
    return this.isConnectedDFS();
  }.property("num_nodes", "num_enumerated", "dfs_flag"),
  canStartAlgorithm: function() {
    if(!this.get("graphNotEmpty"))
      return false;
    if(!this.get("isGraphConnected"))
      return false;
    return true;
  }.property("in_algorithm","isGraphConnected"),
  addTraversedSubgraph: function() {
    var subgraph = [];
    var removed = this.get("removed_nodes");
    var num_nodes = this.get("num_nodes");
    var traversed_subgraphs = this.get("traversed_subgraphs");
    var num_enumerated = this.get("num_enumerated");
    for(var i=0; i<num_nodes; i++) {
      if($.inArray(i, removed) == -1) {
        subgraph.push({
          'index': i
        });
      }
    }
    traversed_subgraphs.push({
      'subgraph': subgraph
    });
    this.set("traversed_subgraphs", traversed_subgraphs);
    this.set("num_enumerated", num_enumerated+1)
  },
  traversedHTML: function() {
    var traversed_subgraphs = this.get("traversed_subgraphs");
    var ret_str = "<h3> Traversed Subraphs: </h3>";
    for(var i=0; i<traversed_subgraphs.length; i++) {
      var subgraph = traversed_subgraphs[i].subgraph;
      ret_str += "<h4>";
      if(subgraph.length == 0) {
        ret_str += "Empty set"
      }
      for(var j=0; j<subgraph.length; j++) {
        ret_str += (subgraph[j].index).toString() + " ";
      }
      ret_str += "</h4>"
    }
    return new Handlebars.SafeString(ret_str);
  }.property("num_enumerated"),
  stackHTML: function() {
    var ret_str = "<h2>Stack: ";
    var removed_nodes = this.get("removed_nodes");
    var last_removed = this.get("last_removed");
    for(var i=0; i<removed_nodes.length; i++) {
      ret_str += removed_nodes[i].toString();
      ret_str += " ";
    }
    ret_str += "</h2>";
    ret_str += "<h3> Last removed: ";
    ret_str += last_removed.toString();
    ret_str += "</h3>";
    return new Handlebars.SafeString(ret_str);
  }.property("num_enumerated", "last_removed"),
  stepReverseAlgorithm: function() {
    var removed_nodes = this.get("removed_nodes");    
    var reverse_stack = this.get("reverse_stack");
    var iter_start = this.get("last_removed") - 1;
    for(var i=iter_start; i>=0; i--) {
      removed_nodes.push(i);
      this.set("dfs_flag", this.get("dfs_flag") + 1);
      if(this.isConnectedDFS()) {
        this.set("step_description", 
          "I have tried to remove nodes starting from " +
          iter_start.toString() +
          " iterating down to 0. First node, which after removal didn't " +
          "make graph disconnected was the node " +
          i.toString() +
          ", therefore I am removing this node. Next time, when I " +
          " will be back in this state I will start iteration from " +
          (i-1).toString()
        );
        this.addTraversedSubgraph();
        this.set("last_removed", i)
        this.set("removed_nodes", removed_nodes);
        return;
      }
      else {
        removed_nodes.pop();
      }
    }
    var step_description;
    if(iter_start < 0) {
      step_description = "There were no more nodes to iterate from this state. ";
    }
    else {
      step_description =
        "I iterated all nodes from " +
        iter_start.toString() +
        " down to 0. Sadly, removal of each one disconnected the graph. ";
    }
    if(removed_nodes.length == 0) {
      this.set("step_description", "Algorithm have finished.")
    }
    else {
      var removed = removed_nodes.last();
      removed_nodes.pop();
      step_description += "I am adding " + removed.toString() + " back to graph. " +
        "This will not generate new subgraph." +
        "In next step I will try removing nodes starting from " + (removed-1).toString()

      this.set("step_description", step_description);
      this.set("removed_nodes", removed_nodes);
      this.set("last_removed", removed);
    }
  },

  stepSlyceAlgorithm: function() {
    alert('slyce step!');
  },

  stepAlgorithm : function() {
    $("#step_button").popover('hide');	
    if(this.get("in_algorithm")) {
      if(this.get("isReverse")) {
        this.stepReverseAlgorithm();
      }
      if(this.get("isSlyce")) {
        this.stepSlyceAlgorithm();
      }
    }
  },
  chooseAlgorithmReverse: function() {
    this.set("algorithm", "reverse");
    this.set("step_description", 
      "We have started the reverse Search algorithm. First subgraph, which we are enumerating "+
      "is whole graph.");
  },
  chooseAlgorithmSlyce: function() {
    this.set("algorithm", "slyce");
    this.set("step_description", "We have started the SlyCE algorithm.");
  },

  addNode : function(event) {
    if(!this.get("in_algorithm")) {
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
    }
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
  }.observes("step_description", "in_algorithm"),

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
    var cursor = this.get("cursor");
    if(!in_algorithm) {
      if(!cursor) {
        cursor = vis.append("circle")
          .attr("r", 100)
          .attr("transform", "translate(-100,-100)")
          .attr("class", "cursor");

        vis.on("mousemove", function() {
          cursor.attr("transform", "translate(" + d3.mouse(this) + ")");
        });
        this.set("cursor", cursor)
      }
      else {
        cursor.attr("visibility", "visible")
      }
    }
    else {
      cursor.attr("visibility", "hidden")
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
    this.chooseAlgorithmReverse();
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
    stopAlgorithm : function(router) {
      router.get('applicationController').stopAlgorithm();
    },
    stepAlgorithm : function(router) {
      router.get('applicationController').stepAlgorithm();
    },
    index: Ember.Route.extend({
      route: '/',
    })
  })
});


App.initialize();
