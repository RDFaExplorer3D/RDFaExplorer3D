/*

  Implements a RDF graph drawing with force-directed placement in 2D and 3D.
  
  It uses the force-directed-layout implemented in:
  https://github.com/davidpiegza/Graph-Visualization/blob/master/layouts/force-directed-layout.js
  
  Drawing is done with Three.js: http://github.com/mrdoob/three.js

  To use this drawing, include the graph-min.js file and create a RDF_Graph object:
  
  <!DOCTYPE html>
  <html>
    <head>
      <title>Graph Visualization</title>
      <script type="text/javascript" src="path/to/graph-min.js"></script>
    </head>
    <body onload="new Drawing.RDF_Graph({layout: '3d', showStats: true, showInfo: true})">
    </bod>
  </html>
  
  Parameters:
  options = {
    layout: "2d" or "3d"

    showStats: <bool>, displays FPS box
    showInfo: <bool>, displays some info on the graph and layout
              The info box is created as <div id="graph-info">, it must be
              styled and positioned with CSS.


    selection: <bool>, enables selection of nodes on mouse over (it displays some info
               when the showInfo flag is set)


    limit: <int>, maximum number of nodes
    
    numNodes: <int> - sets the number of nodes to create.
    numEdges: <int> - sets the maximum number of edges for a node. A node will have 
              1 to numEdges edges, this is set randomly.
  }
  

  Feel free to contribute a new drawing!

 */
 
var CanvasSize = CanvasSize || {};

/**
  *  Calculates size for the cavans object based
  *  on the size of the dialog.
  */
function calculateCanvasSize() {
	
	var padding_left_right = $('.ui-dialog-content').css('padding-left').replace(/[^-\d\.]/g, '');
	var padding_top_bottom = $('.ui-dialog-content').css('padding-top').replace(/[^-\d\.]/g, '');
	
	CanvasSize.width = $('#dialog').dialog('option', 'width') - 2* padding_left_right;
	CanvasSize.height = $('#dialog').dialog('option', 'height') - 2* padding_top_bottom - 55;

}

var Drawing = Drawing || {};

Drawing.RDF_Graph = function(options) {
  var options = options || {};
  
  this.layout = options.layout || "2d";
  this.layout_options = options.graphLayout || {};
  this.show_stats = options.showStats || false;
  this.show_info = options.showInfo || false;
  this.show_labels = options.showLabels || false;
  this.selection = options.selection || false;
  this.limit = options.limit || 10;
  this.nodes_count = options.numNodes || 20;
  this.edges_count = options.numEdges || 10;

  var camera, scene, renderer, interaction, geometry, object_selection;
  var stats;
  var info_text = {};
  var graph = new Graph({limit: options.limit});
  
  var geometries = [];
  
  var that=this;

  calculateCanvasSize();
  init();
  createGraph();
  animate();

  function init() {
    // Three.js initialization
    renderer = new THREE.WebGLRenderer({antialias: true});
    
	var id_attr = document.createAttribute("id");
    id_attr.nodeValue = "graph-canvas";
    renderer.domElement.setAttributeNode(id_attr);
    renderer.setSize( CanvasSize.width, CanvasSize.height );

    camera = new THREE.TrackballCamera({
      fov: 40, 
      aspect: CanvasSize.width / CanvasSize.height,
      near: 1,
      far: 1000000,
	  //screen: {width: CanvasSize.width, height: CanvasSize.height, offsetLeft: Offset.left, offsetTop: Offset.top},

      rotateSpeed: 0.5,
      zoomSpeed: 5.2,
      panSpeed: 1,

      noZoom: false,
      noPan: false,

      staticMoving: false,
      dynamicDampingFactor: 0.3,
      
      domElement: renderer.domElement,

      keys: [ 65, 83, 68 ]
    });
    camera.position.z = 5000;

    scene = new THREE.Scene();

    // Node geometry
    if(that.layout === "3d") {
      geometry = new THREE.SphereGeometry( 25, 25, 25 );
    } else {
      geometry = new THREE.SphereGeometry( 50, 50, 0 );
    }
    
    // Create node selection, if set
    if(that.selection) {
      object_selection = new THREE.ObjectSelection({
        domElement: renderer.domElement,
        selected: function(obj) {
          // display info
          if(obj != null) {
            info_text.select = "Object " + obj.id;
          } else {
            delete info_text.select;
          }
        },
        clicked: function(obj) {
        }
      });
    }

    document.body.appendChild( renderer.domElement );
  
    // Stats.js
    if(that.show_stats) {
      stats = new Stats();
      stats.domElement.style.position = 'absolute';
      stats.domElement.style.top = '0px';
      document.body.appendChild( stats.domElement );
    }

    // Create info box
    if(that.show_info) {
      var info = document.createElement("div");
	  info.style.position = 'absolute';
	  info.style.top = '0px';
	  info.style.left = '25%';
	  info.style.color = '#333';
	  info.style.padding = '5px 10px';

      var id_attr = document.createAttribute("id");
      id_attr.nodeValue = "graph-info";
      info.setAttributeNode(id_attr);
      document.body.appendChild( info );
    }
  }

  /**
   *  Creates a graph with random nodes and edges.
   *  Number of nodes and edges can be set with
   *  numNodes and numEdges.
   */
  function createGraph() {
	
	var myExtractedGraph = extractTriplesAndBuildGraph();
	
	graph.edges = myExtractedGraph.edges;	
	graph.nodeSet = myExtractedGraph.nodeSet;
	graph.nodes = myExtractedGraph.nodes;

	for (var i=0; i<graph.nodes.length; i++) {
	    drawNode(graph.nodes[i]);    
	}
	
	for (var i=0; i<graph.edges.length; i++) {
	    drawEdge(graph.edges[i].source, graph.edges[i].target);
	}
  
  
    that.layout_options.width = that.layout_options.width || 2000;
    that.layout_options.height = that.layout_options.height || 2000;
    that.layout_options.iterations = that.layout_options.iterations || 100000;
    that.layout_options.layout = that.layout_options.layout || that.layout;
    graph.layout = new Layout.ForceDirected(graph, that.layout_options);
    graph.layout.init();
    info_text.nodes = "Nodes " + graph.nodes.length;
    info_text.edges = "Edges " + graph.edges.length;
  }


  /**
   *  Create a node object and add it to the scene.
   */
  function drawNode(node) {
	if (node.data.type === 'resource') {
      var draw_object = new THREE.Mesh( geometry, [ new THREE.MeshBasicMaterial( {  color: 0x000000/*Math.random() * 0xffffff*/, opacity: 0.75 } ) ] );
	  console.log('Knotenform: Kugel');
    } else {
      var draw_object = new THREE.Mesh(new THREE.CubeGeometry(50,50,50), new THREE.MeshBasicMaterial({color: 0x000000, opacity: 0.75}));
      console.log('Knotenform: Würfel');
    }

    if(that.show_labels) {
      if(node.data.title != undefined) {
        var label_object = new THREE.Label(node.data.title);
      } else {
        var label_object = new THREE.Label(node.id);
      }
      node.data.label_object = label_object;
      scene.addObject( node.data.label_object );
    }

    var area = 5000;
    draw_object.position.x = Math.floor(Math.random() * (area + area + 1) - area);
    draw_object.position.y = Math.floor(Math.random() * (area + area + 1) - area);
    
    if(that.layout === "3d") {
      draw_object.position.z = Math.floor(Math.random() * (area + area + 1) - area);
    }

    draw_object.id = node.id;
    node.data.draw_object = draw_object;
    node.position = draw_object.position;
    scene.addObject( node.data.draw_object );
  }


  /**
   *  Create an edge object (line) and add it to the scene.
   */
  function drawEdge(source, target) {
      material = new THREE.LineBasicMaterial( { color: 0xff0000, opacity: 1, linewidth: 0.5 } );
      var tmp_geo = new THREE.Geometry();
    
	  tmp_geo.vertices.push(new THREE.Vertex(source.data.draw_object.position));     
      tmp_geo.vertices.push(new THREE.Vertex(target.data.draw_object.position));

      line = new THREE.Line( tmp_geo, material, THREE.LinePieces );
      line.scale.x = line.scale.y = line.scale.z = 1;
      line.originalScale = 1;
      
      geometries.push(tmp_geo);
      
      scene.addObject( line );
  }


  function animate() {
    requestAnimationFrame( animate );
    render();
    if(that.show_info) {
      printInfo();
    }
  }


  function render() {
    // Generate layout if not finished
    if(!graph.layout.finished) {
      info_text.calc = "<span style='color: red'>Calculating layout...</span>";
      graph.layout.generate();
    } else {
      info_text.calc = "";
    }

    // Update position of lines (edges)
    for(var i=0; i<geometries.length; i++) {
      geometries[i].__dirtyVertices = true;
    }


    // Show labels if set
    // It creates the labels when this options is set during visualization
    if(that.show_labels) {
      var length = graph.nodes.length;
      for(var i=0; i<length; i++) {
        var node = graph.nodes[i];
        if(node.data.label_object != undefined) {
          node.data.label_object.position.x = node.data.draw_object.position.x;
          node.data.label_object.position.y = node.data.draw_object.position.y - 100;
          node.data.label_object.position.z = node.data.draw_object.position.z;
          node.data.label_object.lookAt(camera.position);
        } else {
          if(node.data.title != undefined) {
            var label_object = new THREE.Label(node.data.title, node.data.draw_object);
          } else {
            var label_object = new THREE.Label(node.id, node.data.draw_object);
          }
          node.data.label_object = label_object;
          scene.addObject( node.data.label_object );
        }
      }
    } else {
      var length = graph.nodes.length;
      for(var i=0; i<length; i++) {
        var node = graph.nodes[i];
        if(node.data.label_object != undefined) {
          scene.removeObject( node.data.label_object );
          node.data.label_object = undefined;
        }
      }
    }

    // render selection
    if(that.selection) {
      object_selection.render(scene, camera);
    }

    // update stats
    if(that.show_stats) {
      stats.update();
    }
    
    // render scene
    renderer.render( scene, camera );
  }

  /**
   *  Prints info from the attribute info_text.
   */
  function printInfo(text) {
    var str = '';
    for(var index in info_text) {
      if(str != '' && info_text[index] != '') {
        str += " - ";
      }
      str += info_text[index];
    }
    document.getElementById("graph-info").innerHTML = str;
  }

  // Generate random number
  function randomFromTo(from, to) {
    return Math.floor(Math.random() * (to - from + 1) + from);
  }
  
  // Stop layout calculation
  this.stop_calculating = function() {
    graph.layout.stop_calculating();
  }

}
