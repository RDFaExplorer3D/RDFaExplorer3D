/*global define, THREE, window, THREEJS, console, document, Layout, requestAnimationFrame, $*/

define(['objectSelection', 'label', 'requestAnimation', 'threeInteraction', 'js/app/ui', 'js/app/utils', 'js/app/config'], function (os, label, rA, tI, ui, utils, config) {
    "use strict";
    
	var visualization = {
		graph : {},
		ui : {},
		utils : {},
		scene : {},
		camera : {},
		renderer :  {},
		projector : {},
		objects : [],
		geometries : [],
		info_text : "",
		mouse : {x: 0, y: 0},
		INTERSECTED : null,
		
		/**
		 * Shows the RDF graph
		 */
		showRDFGraph : function (graph, ui) {
			this.graph = graph;
            this.graph.expandedNodes = [];
			this.ui = ui;
			this.utils = utils;
			this.drawExtractedGraph();
		},
		
		/**
		 * Draws the extracted graph
		 */
		drawExtractedGraph : function () {
			this.initThreeJS();
			this.createGraph();
			this.animate();
		},
		
		/**
		 * Iniitializes ThreeJS
		 */
		initThreeJS : function () {
			var availSize, canvas, interaction;
            
            availSize = utils.calculateAvailableSize();
			this.renderer = new THREE.WebGLRenderer({antialias: true});
			this.renderer.setSize(availSize.width - 50, availSize.height - 50);
			
			canvas = this.renderer.domElement;
			$(canvas).attr('id', 'graph-canvas');
			
			this.camera = new THREE.TrackballCamera({
				domElement: canvas,
				fov: 50,
				aspect: window.innerWidth / window.innerHeight,
				near: 1,
				far: 100000
			});
			this.camera.position.z = 5000;
			
			this.scene = new THREE.Scene();
			
			this.projector = new THREE.Projector();
						
			$('#main-dialog-canvas-container').append(canvas);
			
			this.addCanvasEventHandler(canvas);
			
			interaction = new THREEJS.Interaction(this.camera, canvas);
			
        },
			
        /**
         * Adds event listener to canvas element
         */
        addCanvasEventHandler : function (canvas) {
            var that, canvasClickCallback, canvasMouseMoveCallback;
            
            that = this;
            
            canvasClickCallback = function (event) {
                that.onCanvasClick(event);
            };
            
            $(canvas).on('click', canvasClickCallback);
            
            canvasMouseMoveCallback = function (event) {
                that.onCanvasMouseMove(event);
            };
            
            $(canvas).on('mousemove', canvasMouseMoveCallback);
            
        },
        
        /**
         * Canvas click event listener
         */
        onCanvasClick : function (event) {
            var that,
                id,
                node,
                expandedNodes;

            event.preventDefault();

            that = this;
            
            if (this.INTERSECTED && this.INTERSECTED.visible) {
                id = this.INTERSECTED.id;
                
                if (this.isNode(id)) {
                    node = this.graph.getNode(id);
                        
                    if (id === 0) {
                        if (node.data.expanded) {
                            that.collapseGraph(node, that.graph);
                        } else {
                            that.expandSubGraph(node, that.graph);
                        }
                    } else {
                
                        if (node.data.type === "resource") {
                            if (node.nodesTo.length > 0 && node.data.expanded) {
                                that.collapseSubGraph(node, that.graph);
                            } else if (node.nodesTo.length > 0 && !node.data.expanded) {
                                that.expandSubGraph(node, that.graph);
                            } else {
                                ui.createInfoDialogContent(true, node);
                                ui.showInfoDialog();
                            }
                        } else {
                            ui.createInfoDialogContent(false, node);
                            ui.showInfoDialog();
                        }
                    }
                }
            }
		},

		/**
		 * Checks if node with passed in id exists
		 * @param id
		 * @returns {boolean}
		 */
        isNode : function (id) {
            var value = false;
            
            $(this.graph.nodes).each(function (idx, elem) {
                if (elem.id === id) {
                    value = true;
                    return false;
                }
            });
            
            return value;
        },

		/**
		 * Collapses the graph
		 * @param node
		 * @param graph
		 */
        collapseGraph : function (node, graph) {
            var that = this;
            
            node.data.expanded = false;
            this.removeFromExpandedNodes(node, graph);
            
            $(node.nodesTo).each(function (idx, elem) {
                elem.data.showNode = false;
                elem.data.expanded = false;
                var edge = utils.findEdge(graph, node, elem);
                edge.data.showEdge = false;
                that.collapseAllSubGraph(elem, graph);
            });

        },

		/**
		 * Expands sub graph
		 * @param node
		 * @param graph
		 */
        expandSubGraph : function (node, graph) {
            this.addToExpandedNodes(node, graph);
            node.data.expanded = true;
            
            $(node.nodesTo).each(function (idx, elem) {
                elem.data.showNode = true;
                var edge = utils.findEdge(graph, node, node.nodesTo[idx]);
                edge.data.showEdge = true;
            });
        },

		/**
		 * Adds a node to expanded nodes array
		 * @param node
		 * @param graph
		 */
        addToExpandedNodes : function (node, graph) {
            var bool = false;
            $(graph.expandedNodes).each(function (idx, elem) {
                if (elem.id === node.id) {
                    bool = true;
                }
            });
            if (!bool) {
                graph.expandedNodes.push(node);
            }
        },

		/**
		 * Collapses a sub graph
		 * @param node
		 * @param graph
		 */
        collapseSubGraph : function (node, graph) {
            var that = this;
            
            this.removeFromExpandedNodes(node, graph);
            node.data.expanded = false;
            $(node.nodesTo).each(function (idx, elem) {
                elem.data.showNode = false;
                elem.data.expanded = false;
                var edge = utils.findEdge(graph, node, node.nodesTo[idx]);
                edge.data.showEdge = false;
            });
            
            $(graph.expandedNodes).each(function (idx, elem) {
                that.expandSubGraph(elem, that.graph);
            });
        },

		/**
		 * Removes a node from expanded nodes array
		 * @param node
		 * @param graph
		 */
        removeFromExpandedNodes : function (node, graph) {
            var i, length, index;
            
            length = Object.keys(graph.expandedNodes).length;
            for (i = length; i > 0; i -= 1) {
                index = i - 1;
                if (graph.expandedNodes[index].id === node.id) {
                    graph.expandedNodes.splice(index, 1);
                }
            }
        },

		/**
		 * Collapses al sub graphs
		 * @param node
		 * @param graph
		 */
        collapseAllSubGraph : function (node, graph) {
            node.data.expanded = false;
            
            $(node.nodesTo).each(function (idx, elem) {
                elem.data.showNode = false;
                elem.data.expanded = false;
                var edge = utils.findEdge(graph, node, node.nodesTo[idx]);
                edge.data.showEdge = false;
            });
        },
        
        /**
         * Canvas mouse move event handler
         */
        onCanvasMouseMove : function (event) {
            var availSize, offset, scrollTop;
            
            event.preventDefault();
            
            availSize = utils.calculateAvailableSize();
            offset = this.calculateDialogOffset();
            scrollTop = $(document).scrollTop();
            
            this.mouse.x = ((event.clientX - offset.left) / (availSize.width - 50)) * 2 - 1;
            this.mouse.y = -((event.clientY - offset.top + scrollTop) / (availSize.height - 50)) * 2 + 1;
        },
        
        /**
         * Returns dialog offset
         */
        calculateDialogOffset : function () {
            return $("#graph-canvas").offset();
        },
        
        /**
         * Draws graph and creates graph layout
         */
        createGraph : function () {
            var i;
            
            for (i = 0; i < this.graph.nodes.length; i += 1) {
                this.drawNode(this.graph.nodes[i]);
            }
            
            for (i = 0; i < this.graph.edges.length; i += 1) {
                this.drawEdge(this.graph.edges[i].source, this.graph.edges[i].target);
            }
            
            this.createLayout();
        },

        /**
         * Draws a node
         */
        drawNode : function (node) {
            var basicMaterial, wireframeMaterial, multiMaterial, draw_object, label_object, area;
            
            if (node.id === 0) {
                basicMaterial = new THREE.MeshBasicMaterial({ color: config.color_rootNode, opacity: 0.75 });
                wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, wireframeLinewidth: 0.5, opacity: 0.75 });
                multiMaterial = [basicMaterial, wireframeMaterial];
                draw_object = new THREE.Mesh(new THREE.SphereGeometry(200, 24, 12), multiMaterial);
            } else {
                basicMaterial = new THREE.MeshBasicMaterial({ color: config.color_nodes, opacity: 0.75 });
                wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, wireframeLinewidth: 0.5, opacity: 0.75 });
                multiMaterial = [basicMaterial, wireframeMaterial];
                
                if (node.data.type === 'resource') {
                    if (this.hasChildNodes(node)) {
                        draw_object = new THREE.Mesh(new THREE.SphereGeometry(100, 24, 12), multiMaterial);
                    } else {
                        draw_object = new THREE.Mesh(new THREE.SphereGeometry(100, 24, 12), basicMaterial);
                    }
                } else {
                    draw_object = new THREE.Mesh(new THREE.CubeGeometry(180, 180, 180), multiMaterial);
                }
            }
            
            if (node.data.title !== undefined) {
                label_object = new THREE.Label(node.data.title);
            } else {
                label_object = new THREE.Label(node.id);
            }

            node.data.label_object = label_object;
            this.scene.addObject(node.data.label_object);

            area = 5000;
            draw_object.position.x = Math.floor(Math.random() * (area + area + 1) - area);
            draw_object.position.y = Math.floor(Math.random() * (area + area + 1) - area);
            draw_object.position.z = Math.floor(Math.random() * (area + area + 1) - area);

            draw_object.id = node.id;
            node.data.draw_object = draw_object;
            node.position = draw_object.position;

            this.objects.push(node.data.draw_object);
            this.scene.addObject(node.data.draw_object);
        },
        
        /**
         * Checks if node has child nodes
         */
        hasChildNodes : function (node) {
            if (node.nodesTo.length === 0) {
                return false;
            }
            return true;
        },

        /**
         * Draws edge
         */
        drawEdge : function (sourceNode, targetNode) {
            var sourcePosition, targetPosition, middlepointPosition, edge, tmp_geo, material, line, middlepoint, label_object;
            
            sourcePosition = sourceNode.data.draw_object.position;
            targetPosition = targetNode.data.draw_object.position;
            middlepointPosition = utils.calculateMiddlepoint(sourcePosition, targetPosition);
            edge = utils.findEdge(this.graph, sourceNode, targetNode);

            tmp_geo = new THREE.Geometry();
            tmp_geo.vertices.push(new THREE.Vertex(sourcePosition));
            tmp_geo.vertices.push(new THREE.Vertex(targetPosition));
            tmp_geo.vertices.push(new THREE.Vertex(middlepointPosition));
            
            material = new THREE.LineBasicMaterial({color: 0xff0000, opacity: 1, linewidth: 1.5});

            line = new THREE.Line(tmp_geo, material, THREE.LinePieces);
            line.scale.x = line.scale.y = line.scale.z = 1;
            line.originalScale = 1;
            
            edge.data.lineID = line.id;
            
            middlepoint = this.addMiddlepoint(middlepointPosition);
            tmp_geo.middlepoint = middlepoint;

            if (edge.data.value !== undefined) {
                label_object = new THREE.Label(edge.data.value);
            } else {
                label_object = new THREE.Label("Edge from " + edge.source.id + " to " + edge.target.id);
                edge.data.value = "Edge from " + edge.source.id + " to " + edge.target.id;
                edge.data.showEdge = false;
            }

            edge.data.label_object = label_object;
            this.scene.addObject(edge.data.label_object);
            
            edge.data.middlepoint = middlepoint;
            edge.data.middlepoint.position = middlepoint.position;
            
            this.geometries.push(tmp_geo);
            this.objects.push(edge.data.middlepoint);
            this.scene.addObject(edge.data.middlepoint);
            this.scene.addObject(line);
        },

        /**
         * Adds middlepoint
         */
        addMiddlepoint : function (position) {
            var basicMaterial, middlepoint;
            
            basicMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, opacity: /*0.75*/0 });

            middlepoint = new THREE.Mesh(new THREE.SphereGeometry(30, 24, 12), basicMaterial);
            middlepoint.position.x = position.x;
            middlepoint.position.y = position.y;
            middlepoint.position.z = position.z;

            this.scene.addObject(middlepoint);

            return middlepoint;
        },

        /**
         * Creates fore directed layout
         */
        createLayout : function () {
            var layout_options = {};
            layout_options.width = 2000;
            layout_options.height = 2000;
            layout_options.iterations = 100000;
            layout_options.layout = "3d";

            this.graph.layout = new Layout.ForceDirected(this.graph, layout_options);
            this.graph.layout.init();

            this.info_text.nodes = "Nodes " + this.graph.nodes.length;
            this.info_text.edges = "Edges " + this.graph.edges.length;
        },

        /**
         * Animates scene
         */
        animate : function () {
            requestAnimationFrame(visualization.animate);

            visualization.render();
        },
        
        /**
         * Renders scene
         */
        render : function () {
            var that, i, middlepoint, length, node, label_object, edge, vector, ray, intersects;
            
            that = this;
            
            // Generate layout if not finished
            if (!this.graph.layout.finished) {
                this.info_text.calc = "<span style='color: red'>Calculating layout...</span>";
                this.graph.layout.generate();
            } else {
                this.info_text.calc = "";
            }
            
            $(this.graph.nodes)
                .each(function (idx, elem) {
                    if (!this.data.showNode) {
                        this.data.draw_object.visible = false;
                        this.data.label_object.visible = false;
                    } else {
                        this.data.draw_object.visible = true;
                        this.data.label_object.visible = true;
                    }
                });

            $(this.graph.edges)
                .each(function (idx, elem) {
                    var lineID;

                    if (elem.data.showEdge === false) {
                        this.data.label_object.visible = false;
                        lineID = this.data.lineID;
                        $(that.scene.children).each(function (idx, elem) {
                            if (this.id === lineID) {
                                this.visible = false;
                            }
                        });
                    } else {
                        this.data.label_object.visible = true;
                        lineID = this.data.lineID;
                        $(that.scene.children).each(function (idx, elem) {
                            if (this.id === lineID) {
                                this.visible = true;
                            }
                        });
                    }
                });

            // Update position of lines (edges) including labels
            for (i = 0; i < this.geometries.length; i += 1) {
                this.geometries[i].__dirtyVertices = true;

                middlepoint = utils.calculateMiddlepoint(this.geometries[i].vertices[0].position, this.geometries[i].vertices[1].position);

                this.geometries[i].middlepoint.position = middlepoint;
            }
            
            // Update position of labels (nodes)
            length = this.graph.nodes.length;
            for (i = 0; i < length; i += 1) {
                node = this.graph.nodes[i];
                
                if (node.data.showNode) {
                    if (node.data.label_object !== undefined) {
                        node.data.label_object.position.x = node.data.draw_object.position.x;
                        if (i === 0) {
                            node.data.label_object.position.y = node.data.draw_object.position.y - 300;
                        } else {
                            node.data.label_object.position.y = node.data.draw_object.position.y - 220;
                        }
                        node.data.label_object.position.z = node.data.draw_object.position.z;
                        node.data.label_object.lookAt(this.camera.position);
                    } else {
                        if (node.data.title !== undefined) {
                            label_object = new THREE.Label(node.data.title, node.data.draw_object);
                        } else {
                            label_object = new THREE.Label(node.id, node.data.draw_object);
                        }
                        node.data.label_object = label_object;
                        this.scene.addObject(node.data.label_object);
                    }
                }
            }

            // Update position of labels (edges)
            for (i = 0; i < this.graph.edges.length; i += 1) {
                edge = this.graph.edges[i];

                if (edge.data.label_object !== undefined) {
                    edge.data.label_object.position.x = edge.data.middlepoint.position.x;
                    edge.data.label_object.position.y = edge.data.middlepoint.position.y - 150;
                    edge.data.label_object.position.z = edge.data.middlepoint.position.z;
                    edge.data.label_object.lookAt(this.camera.position);
                }
                
            }

            // Find intersections
            vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 0.5);

            this.projector.unprojectVector(vector, this.camera);

            ray = new THREE.Ray(this.camera.position, vector.subSelf(this.camera.position).normalize());

            intersects = ray.intersectScene(this.scene);

            if (intersects.length > 0) {
                if (this.INTERSECTED !== intersects[0].object) {
                    if (this.INTERSECTED) {
                        this.INTERSECTED.materials[0].color.setHex(this.INTERSECTED.currentHex);
                    }

                    this.INTERSECTED = intersects[0].object;
                    this.INTERSECTED.currentHex = this.INTERSECTED.materials[0].color.getHex();
                    this.INTERSECTED.materials[0].color.setHex(0xff0000);
                }
            } else {
                if (this.INTERSECTED) {
                    this.INTERSECTED.materials[0].color.setHex(this.INTERSECTED.currentHex);
                }

                this.INTERSECTED = null;
            }

            this.renderer.render(this.scene, this.camera);
        } //End of render
        
    };
		
	return visualization;
	
});
