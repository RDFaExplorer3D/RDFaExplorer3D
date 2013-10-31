/*global define, document, Graph, console*/

define(['jquery'], function ($) {
	"use strict";
    
	var init = {

		/**
		 * Returns base url
		 * @returns {XML|string|void}
		 */
        getBaseUrl : function () {
            var scripts, src;
            
            scripts = document.getElementsByTagName("script");
            src = scripts[scripts.length - 1].src;
        	
            return src.split("/require-jquery.j")[0].replace(".", "");
        },

		/**
		 * Returns path to css files
		 * @param baseUrl
		 * @returns {Array}
		 */
        getCSSUrls : function (baseUrl) {
            var urls = [
                baseUrl + '/js/libs/jQuery_UI/css/smoothness/jquery-ui-1.9.2.custom.min.css',
                baseUrl + '/css/main.css'
            ];
        	
            return urls;
        },

		/**
		 * Attaches css files
		 * @param urls
		 */
        attachCSS : function (urls) {
            var i;
            for (i = 0; i < urls.length; i += 1) {
                $('head').append('<link rel="stylesheet" type="text/css" href="' + urls[i] + '">');
            }

        },

		/**
		 * Extends Graph.js to get a Edge by source and target node
		 */
        extendGraph : function () {
            var i;
 
            Graph.prototype.getEdge = function (source, target) {
                for (i = 0; i < this.edges.length; i += 1) {
                    if (this.edges[i].source === source && this.edges[i].target === target) {
                        return this.edges[i];
                    }
                }
            };
        }
	};
	
	return init;
	
});
