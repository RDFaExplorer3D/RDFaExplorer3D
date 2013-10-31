/*global define, console, window*/
define([], function () {
    "use strict";

	var utils = {
						
		/**
		 * Checks if an Object is a URL
		 */
		isURL : function (str) {
			if ((str.indexOf("http://") !== -1) || (str.indexOf("_:") !== -1)) {
				return true;
			} else {
				return false;
			}
		},

		/**
		 * Returns a point in the middle of an edge
		 * @param sourcePosition
		 * @param targetPosition
		 * @returns {{}}
		 */
		calculateMiddlepoint : function (sourcePosition, targetPosition) {
			var middlepoint, sourceX, sourceY, sourceZ, targetX, targetY, targetZ, diffX, diffY, diffZ, halfDiffX, halfDiffY, halfDiffZ;

			middlepoint = {};

			sourceX = sourcePosition.x;
			sourceY = sourcePosition.y;
			sourceZ = sourcePosition.z;

			targetX = targetPosition.x;
			targetY = targetPosition.y;
			targetZ = targetPosition.z;

			diffX = targetX - sourceX;
			diffY = targetY - sourceY;
			diffZ = targetZ - sourceZ;

			halfDiffX = diffX / 2;
			halfDiffY = diffY / 2;
			halfDiffZ = diffZ / 2;

			middlepoint.x = targetX - halfDiffX;
			middlepoint.y = targetY - halfDiffY;
			middlepoint.z = targetZ - halfDiffZ;

			return middlepoint;
		},

		/**
		 * Finds an edge with a passed in source node and target node
		 * @param graph
		 * @param sourceNode
		 * @param targetNode
		 * @returns {*}
		 */
		findEdge : function (graph, sourceNode, targetNode) {
			var edges, i;

			edges = graph.edges;

			for (i = 0; i < edges.length; i += 1) {
				if (edges[i].source === sourceNode && edges[i].target === targetNode) {
					return edges[i];
				}
			}
		},

		/**
		 * Return 75% of the available screen size
		 * @returns {{}}
		 */
		calculateAvailableSize : function () {
			var size = {};
			size.width = window.screen.availWidth * 0.75;
			size.height = window.screen.availHeight * 0.75;
			return size;
		}

	};

	return utils;

});
