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
  unique_subgraph : true,
  slyce_root : -1,
  dfs_flag : 0,
  slyce_step_number : 0,
  expansion_set_stack : [],
  last_taken_stack : [],
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
    this.set("unique_subgraph", true);
    this.set("expansion_set_stack", []);
    this.set("last_taken_stack", [])
    $("#step_button").popover('hide');
  }.observes("algorithm"),

  startAlgorithm : function() {
    if(this.get("canStartAlgorithm")) {
      if(!this.get("in_algorithm")) {
        $("#step_button").popover('show');
        var num_nodes = this.get("num_nodes");
        this.set("num_enumerated", 0);
        this.set("traversed_subgraphs", [])
        this.set("in_algorithm", true);
        if(this.get("algorithm") == "reverse") {
          this.set("last_removed", num_nodes);
          this.addTraversedSubgraph();
        }
        if(this.get("algorithm") == "slyce") {
          this.set("slyce_root", -1);
          this.set("expansion_set_stack", []);
          this.set("slyce_step_number", 0);

          for(var i=0; i<num_nodes; i++) {
            this.removeFromGraph(i);
          }
        }
      }
    }
  },
  stopAlgorithm : function() {
    this.resetAlgorithm();
  },

  addToGraph: function(node) {
    var removed_nodes = this.get("removed_nodes");
    removed_nodes.splice( $.inArray(node, removed_nodes), 1 );
    this.set("removed_nodes", removed_nodes);
  },

  removeFromGraph: function(node) {
    var removed_nodes = this.get("removed_nodes");
    removed_nodes.push(node);
    this.set("removed_nodes", removed_nodes);
  },

  isRemoved: function(node) {
    var removed_nodes = this.get("removed_nodes");
    return ($.inArray(node, removed_nodes) != -1);
  },

  isConnectedDFS: function() {
    var num_nodes = this.get("num_nodes");
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
        if(!this.isRemoved(source) && !this.isRemoved(target)) {
          num_set[source] = num_set[source] < num_set[target] ? num_set[source] : num_set[target];
          num_set[target] = num_set[source];
          min_found = min_found < num_set[target] ? min_found : num_set[target];
        }
      }
    }
    for(var i=0; i<num_nodes; i++) {
      if(!this.isRemoved(i)) {
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

  slyceStateHTML: function() {
    var ret_str = "<h2>Slyce Root: " + this.get("slyce_root").toString() + "</h2>";
    ret_str += "<h2>Expansion Set Stack:</h2>";
    var expansion_set_stack = this.get("expansion_set_stack");
    var last_taken_stack = this.get("last_taken_stack");
    
    for(var i=0; i<expansion_set_stack.length; i++) {
      var expansion = expansion_set_stack[i];
      ret_str += "<h4>" + JSON.stringify(expansion) + "</h4>";
    }
    ret_str += "<h2>Last taken stack:</h2>";
    for(var i=0; i<last_taken_stack.length; i++) {
      expansion = expansion_set_stack[i];
      last_taken = last_taken_stack[i];
      ret_str += "<h4>[";
      for(var j=0; j<last_taken.length; j++) {
        ret_str += expansion[last_taken[j]];
        if(j+1!=last_taken.length) + ",";
      }
      ret_str += "]</h4>";
    }
    return new Handlebars.SafeString(ret_str);
  }.property("num_enumerated", "slyce_step_number"),

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
	      this.set("unique_subgraph", true);
        return;
      }
      else {
        removed_nodes.pop();
      }
    }
    this.set("unique_subgraph", false);
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

  addNeighbours: function(last_removed_nodes) {
    var num_nodes = this.get("num_nodes");
    var links = this.get("links");
    var slyce_root = this.get("slyce_root");
    var new_expansion_set = [];
    var is_neighbour_old;
    var is_neighbour_new;
    for(var i=slyce_root; i<num_nodes; i++) {
      if(this.isRemoved(i)) {
        is_neighbour_old = false;
        is_neighbour_new = false;
        var neighour_link;
        for(var j=0; j<links.length; j++) {
          var x, y;
          var ok_edge = false;
          if(links[j].source.index == i) {
            x = i;
            y = links[j].target.index;
            ok_edge = true;
          }
          if(links[j].target.index == i) {
            x = i;
            y = links[j].source.index;
            ok_edge = true;
          }
          
          if(ok_edge && x != y) {
            if($.inArray(y, last_removed_nodes) == -1) {
              is_neighbour_old = true;
            }
            if(!this.isRemoved(y)) {
              neighour_link = links[j];
              is_neighbour_new = true;
            } 
          }
        }
        if( (is_neighbour_old==false) && (is_neighbour_new==true) ) {
          new_expansion_set.push(i);
        }
      }
    }
    var expansion_set_stack = this.get("expansion_set_stack");
    expansion_set_stack.push(new_expansion_set);
    this.set("expansion_set_stack", expansion_set_stack);
    var last_taken_stack = this.get("last_taken_stack");
    last_taken_stack.push([]);
    this.set("last_taken_stack", last_taken_stack);
  },

  selectNextSlyceRoot: function() {
    var slyce_root = this.get("slyce_root");
    var num_nodes = this.get("num_nodes");
    var removed_nodes = this.get("removed_nodes");
    var expansion_set_stack = this.get("expansion_set_stack");
    var last_taken_stack = this.get("last_taken_stack");
    if(slyce_root == (num_nodes-1)) {
        this.set("step_description", "Algorithm have finished.");
    }
    else {
      var message = "Before this step subgraph was empty.";
      if(slyce_root == -1) {
        message += "We are starting the algorithm and setting a root to be 0.";
        slyce_root = 0;
      }
      else {
        message += "Last root was " + slyce_root.toString() + ". ";
        slyce_root += 1;
        message += "We are setting " + slyce_root.toString() + " as a new root.";
      }
      var last_removed_nodes = [];
      for(var i=0; i<removed_nodes.length; i++) {
        last_removed_nodes.push(removed_nodes[i]);
      }
      this.addToGraph(slyce_root);
      last_taken_stack.push([0]);
      expansion_set_stack.push([slyce_root]);
      this.set("slyce_root", slyce_root);

      
      this.set("last_taken_stack", last_taken_stack);
      this.set("expansion_set_stack", expansion_set_stack);
      this.addNeighbours(last_removed_nodes);
      
      
      message += "Expansion set is set of nodes, which are neighbours of a root, but have index higher than root. "
      message += "Expansion set: ";
        
      message += JSON.stringify(expansion_set_stack.last());
      this.set("step_description", message);

    }
  },
  tryRevertRoot: function() {
    last_taken_stack = this.get("last_taken_stack");
    expansion_set_stack = this.get("expansion_set_stack");
    if(expansion_set_stack.length == 1) {
      this.set("expansion_set_stack", []);
      this.set("last_taken_stack", []);
    }
  },

  revertLastExpansion: function() {
    var message = "There are no more nodes to expand. We are reverting last expansion. We are removing from graph: ";
    var last_taken_stack = this.get("last_taken_stack");
    var expansion_set_stack = this.get("expansion_set_stack");
    expansion_set_stack.pop();
    var last_taken = last_taken_stack.last();
    var last_expansion = expansion_set_stack.last();
    last_taken_stack.pop();
    var previous_taken = last_taken_stack.last();
    var previous_expansion = expansion_set_stack.last();
    for(var i=0; i<previous_taken.length; i++) {
      var reverted = previous_expansion[previous_taken[i]];
      this.removeFromGraph(reverted);
      message += reverted.toString();
    }
    message += ".";
    this.set("step_description", message);
    this.set("last_taken_stack",last_taken_stack);
    this.set("expansion_set_stack", expansion_set_stack);
    this.tryRevertRoot();
  },

  selectNextSubset: function() {
    var last_taken_stack = this.get("last_taken_stack");
    var expansion_set_stack = this.get("expansion_set_stack");
    var removed_nodes = this.get("removed_nodes");
    var last_taken = last_taken_stack.last();
    var last_expansion = expansion_set_stack.last();

    var message = "";
    message += "Expansion set is: " + JSON.stringify(last_expansion);
    message += ". Set, which we last expanded for this candidate set: ";
    for(var i=0; i<last_taken.length; i++) {
      message += last_expansion[last_taken[i]].toString();
      message += " ";
    }
    message += ". We are selecting next lexographicaly subset. "
    if(last_taken.length == 0) {
      last_taken.push(0);
      message += "We are getting first node for this expansion set. "
    }
    else {
      if(last_taken.last() == (last_expansion.length-1)) {
        last_taken.pop();
        last_taken[last_taken.length-1] += 1;
      }
      else {
        last_taken.push(last_taken.last()+1);
      }
      message += "We have taken next lecographixaly subset of expansion set."
    }
    message += ". This step subset is: ";

    var last_removed_nodes = [];
    for(var i=0; i<removed_nodes.length; i++) {
      last_removed_nodes.push(removed_nodes[i]);
    }

    for(var i=0; i<last_taken.length; i++) {
      var added_node = last_expansion[last_taken[i]];
      message += added_node.toString();
      this.addToGraph(added_node);
    }

    last_taken_stack[last_taken_stack.length-1] = last_taken;
    this.set("last_taken_stack", last_taken_stack);
    this.addNeighbours(last_removed_nodes);
    
    this.set("step_description", message);
  },

  tryExpandSubset: function() {
    var last_taken_stack = this.get("last_taken_stack");
    var expansion_set_stack = this.get("expansion_set_stack");
    var last_taken = last_taken_stack.last();
    var last_expansion = expansion_set_stack.last();
    var message = "";
    if(last_expansion.length == 0) {
      this.revertLastExpansion();
    }
    else {
      if((last_taken.length == 1) && (last_taken.last()+1 == last_expansion.length) ) {
        this.revertLastExpansion();
      }
      else {
        this.selectNextSubset();
        this.addTraversedSubgraph();
      }
    }
  },

  stepSlyceAlgorithm: function() {
    var taken_nodes = [];
    var num_nodes = this.get("num_nodes");
    var removed_nodes = this.get("removed_nodes");
    for(var i=0; i<num_nodes; i++) {
      if(!this.isRemoved(i))
        taken_nodes.push(i);
    }
    if(taken_nodes.length == 0) {
      this.selectNextSlyceRoot();
      this.addTraversedSubgraph();
    }
    else {
      this.tryExpandSubset();
    }
    this.set("slyce_step_number", this.get("slyce_step_number")+1);
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
    this.set("step_description", "We have started the SlyCE algorithm. We didn't select any nodes yet.");
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
    var color = "#000";
    if(this.get("unique_subgraph")) {
       color = "#1464F4";
    }
    var expansion_color="#FF0000";
    var self = this;
    vis.selectAll("line.link")
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; })
        .style("stroke-width", function(d, i) {
          if( self.isRemoved(d.source.index) ) {
            return 1;
          }
          if( self.isRemoved(d.target.index) ) {
            return 1;
          }
          else {
            return 5;
          }
        })
        .style("stroke", color)
        .style("stroke-opacity", 0.5);

    vis.selectAll("text.node")
      .attr("x", function(d) { return d.x - 5; })
      .attr("y", function(d) { return d.y + 5; })
      .style("fill-opacity", function(d,i) {
        if(self.isRemoved(i)) {
          return 0.2;
        }
        else {
          return 1;
        }
       });

    
    var expansion_set_stack = this.get("expansion_set_stack");
    var expansion_set = expansion_set_stack.last();
    vis.selectAll("circle.node")
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .style("fill-opacity", function(d,i) {
        if(self.isRemoved(i)) {
          return 0.2;
        }
        else {
          return 0.5;
        }
       })
      .style("fill", function(d,i) {
        if($.inArray(i, expansion_set) != -1) {
          return expansion_color;
        }
        else {
          return color;
        }
      })
  }.observes("step_description", "in_algorithm", "slyce_step_number"),

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
  }.observes("algorithm", "num_nodes", "unique_subgraph"),

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
