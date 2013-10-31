/*global define, Graph, document, console, Node, Edge, $*/

define(['graph', 'forceDirected', 'js/app/config', 'js/app/utils'], function (graph, force, config, utils) {
	"use strict";
    
    var extraction = {
		graph : new Graph(),

		/**
		 * Extracts the RDFa triples from the website and builds
		 * the graph with the given structure in libs/Graph-Visualization/Graph.js
		 */
		extractGraph : function () {
		    var i, j, k, subjects, projections, rootNode, subjectID, subject, subjectNode, properties,
		        objectID, property, objects, objectNode;
			
		    subjects = document.data.getSubjects();
			projections = this.getProjections(subjects);
		
			rootNode = this.createRootNode();
			this.graph.addNode(rootNode);
			
			for (i = 0; i < projections.length; i += 1) {
				subjectID = this.calculateSubjectID(i);
				subject = this.getSubject(projections, i);
				
				subjectNode = this.createSubjectNode(subjectID, subjects, i);
				this.graph.addNode(subjectNode);
		        
				this.addEdgeBetweenRootNodeAndSubjectNode(rootNode, subjectNode, subjectID);
		
				properties = this.getProperties(projections, i);
		
				for (j = 0; j < properties.length; j += 1) {
		            objectID = this.calculateObjectID(subjectID, j);
				
					property = properties[j];
					objects = this.getObjects(subject, property);
											
					for (k = 0; k < objects.length; k += 1) {
						objectID = this.incrementObjectID(k, objectID);
						
						objectNode = this.createObjectNode(objectID, objects, k);
						this.graph.addNode(objectNode);
						
						this.addEdgeBetweenSubjectNodeAndObjectNode(subjectNode, objectNode, property);
					}
				}
			}
		
		},

		/**
		 * Returns projections of all given subjects
		 * @param subjects
		 * @returns {Array}
		 */
		getProjections : function (subjects) {
			var projections = [], i;
		
			for (i = 0; i < subjects.length; i += 1) {
				projections.push(document.data.getProjection(subjects[i]));
			}
			
			return projections;
		},

		/**
		 * Creates and returns rootNode element
		 * @returns {Node}
		 */
		createRootNode : function () {
			var rootNode = new Node(0);
			
			rootNode.data.type = "resource";
			rootNode.data.value = document.URL;
			rootNode.data.title = document.URL;
			rootNode.data.showNode = true;
			rootNode.data.expanded = false;
			
			return rootNode;
		},

		/**
		 * Returns subject id
		 * @param index
		 * @returns {number}
		 */
		calculateSubjectID : function (index) {
			return index + 1;
		},

		/**
		 * Returns subject from indexed projection
		 * @param projections
		 * @param index
		 * @returns {*}
		 */
		getSubject : function (projections, index) {
			return projections[index].getSubject();
		},

		/**
		 * Creates and returns subject node
		 * @param subjectID
		 * @param subjects
		 * @param index
		 * @returns {Node}
		 */
		createSubjectNode : function (subjectID, subjects, index) {
			var subjectNode = new Node(subjectID);
			
			subjectNode.data.type = "resource";
			subjectNode.data.value = subjects[index];
			subjectNode.data.title = subjects[index];
			subjectNode.data.expanded = false;
			subjectNode.data.showNode = false;
			subjectNode.data.expanded = false;
			
			return subjectNode;
		},

		/**
		 * Adds edge between rootNode and subject node
		 * @param rootNode
		 * @param subjectNode
		 * @param subjectID
		 */
		addEdgeBetweenRootNodeAndSubjectNode : function (rootNode, subjectNode, subjectID) {
			var edge = new Edge(rootNode, subjectNode);
			
			edge.data.value = "Resource" + subjectID;
			
			if (!rootNode.data.showNode || !subjectNode.data.showNode) {
				edge.data.showEdge = false;
			} else {
				edge.data.showEdge = true;
			}
			
			if (rootNode.addConnectedTo(subjectNode) === true) {
			    this.graph.edges.push(edge);
			}
		},

		/**
		 * Returns properties by index
		 * @param projections
		 * @param index
		 * @returns {*}
		 */
		getProperties : function (projections, index) {
			return projections[index].getProperties();
		},

		/**
		 * Returns object id
		 * @param subjectID
		 * @param index
		 * @returns {number}
		 */
		calculateObjectID : function (subjectID, index) {
			return 1000 * subjectID + (index * 10);
		},

		/**
		 * Returns objects
		 * @param subject
		 * @param property
		 * @returns {*}
		 */
		getObjects : function (subject, property) {
			return document.data.getValues(subject, property);
		},

		/**
		 * Increments object id
		 * @param index
		 * @param objectID
		 * @returns {*}
		 */
		incrementObjectID : function (index, objectID) {
			if (index !== 0) {
				objectID += 1;
			}
			
			return objectID;
		},

		/**
		 * Creates object id
		 * @param objectID
		 * @param objects
		 * @param index
		 * @returns {Node}
		 */
		createObjectNode : function (objectID, objects, index) {
			var objectNode = new Node(objectID);
			
			objectNode.data.type = utils.isURL(objects[index]) ? "resource" : "literal";
			objectNode.data.value = objects[index];
			objectNode.data.title = objects[index];
			objectNode.data.showNode = false;
			objectNode.data.expanded = false;
			
			return objectNode;
		},

		/**
		 * Adds edge between subject node and object node
		 * @param subjectNode
		 * @param objectNode
		 * @param property
		 */
		addEdgeBetweenSubjectNodeAndObjectNode : function (subjectNode, objectNode, property) {
			var edge = new Edge(subjectNode, objectNode);

			edge.data.value = property;
			
			if (!subjectNode.data.showNode || !objectNode.data.showNode) {
				edge.data.showEdge = false;
			} else {
				edge.data.showEdge = true;
			}
			
			if (subjectNode.addConnectedTo(objectNode) === true) {
			    this.graph.edges.push(edge);
			}
			
		},

		/**
		 * Finds existing nodes and mark them as deprecated
		 */
		findExistingNodes : function () {
		    var i, j, currentSource, currentTarget, currentTargetValue, currentTargetId, node;
		    
			for (i = 0; i < this.graph.edges.length; i += 1) {
				currentSource = this.graph.edges[i].source;
				currentTarget = this.graph.edges[i].target;
				currentTargetValue = this.graph.edges[i].target.data.value;
				currentTargetId = this.graph.edges[i].target.id;
				
				for (j = 0; j < this.graph.nodes.length; j += 1) {
                    if (currentTarget > 999 && this.graph.nodes[j].data.value === currentTargetValue) {
						if (this.graph.nodeSet[currentTargetId].id > this.graph.nodes[j].id) {
							this.changeEdge(currentSource, currentTarget, this.graph.nodes[j], i);
							this.changeSourceNode(currentSource, this.graph.nodes[j]);

							this.removeFromNodes(currentTarget);
							this.removeFromNodesTo(currentSource, currentTarget);
							currentTarget.data.deprecated = true;
						}
		            }
				}
			}
			
			for (i = 0; i < this.graph.nodes.length; i += 1) {
				node = this.graph.nodes[i];
				if (node.data.deprecated) {
					delete this.graph.nodeSet[node.id];
					i -= 1;
				}
			}
		},

		/**
		 * Changes target of an edge
		 * @param source
		 * @param oldTarget
		 * @param newTarget
		 * @param index
		 */
		changeEdge : function (source, oldTarget, newTarget, index) {
			var edge = new Edge(source, newTarget);
			
			edge.data.showEdge = this.graph.edges[index].data.showEdge;
			edge.data.value = this.graph.edges[index].data.value;

			this.graph.edges.splice(index, 1, edge);
		},

		/**
		 * Pushes a new target node to nodeTo array of source node
		 * @param source
		 * @param newTarget
		 */
		changeSourceNode : function (source, newTarget) {
			source.nodesTo.push(newTarget);
		},

		/**
		 * Returns an array with redundant edges
		 * @returns {Array}
		 */
		findRedundantEdges : function () {
			var that, redundantEdges;
		    
		    that = this;
			redundantEdges = [];
			
		    $(this.graph.edges).each(function (idx, elem) {
		        var source, target, first;
		        
				source = elem.source.id;
				target = elem.target.id;
				first = true;
			
				$(that.graph.edges).each(function (idx, elem) {
					if (source === elem.source.id && target === elem.target.id) {
						if (first) {
							first = false;
						} else {
							if (typeof elem.data.deprecated !== "undefined") {
								elem.data.deprecated = true;
								redundantEdges.push(idx);
							} else {
								elem.data.deprecated = false;
							}
						}
					}
				});
			});
			
			return redundantEdges;
		},

		/**
		 * Deletes redundant edges
		 * @param redundantEdges
		 */
		deleteRedundantEdges: function (redundantEdges) {
			var that, i, length, edge;
		    
		    that = this;

			for (i = redundantEdges.length; i > 0; i -= 1) {
				length = that.graph.edges.length - 1;
				while (length > 0) {
					edge = that.graph.edges[length];

					if (typeof edge.data.deprecated !== "undefined" && edge.data.deprecated) {
						that.graph.edges.splice(length, 1);
					}
            
		            length -= 1;
				}

			}
		},

		/**
		 * Removes a node from nodes array inside the graph object
		 * @param node
		 */
		removeFromNodes : function (node) {
		    var i;
			for (i = 0; i < this.graph.nodes.length; i += 1) {
				if (this.graph.nodes[i] === node) {
					this.graph.nodes.splice(i, 1);
				}
			}
		},

		/**
		 * Removes a target node from notesTo array of a source node
		 * @param sourceNode
		 * @param targetNode
		 */
		removeFromNodesTo : function (sourceNode, targetNode) {
			var i;
		    
		    for (i = 0; i < sourceNode.nodesTo.length; i += 1) {
				if (sourceNode.nodesTo[i] === targetNode) {
					sourceNode.nodesTo.splice(i, 1);
				}
			}
		},

		/**
		 * Returns extracted graph
		 * @returns {*}
		 */
		getRDFGraph : function () {
			this.extractGraph();
			return this.graph;
		}
	};
	
	return extraction;

});