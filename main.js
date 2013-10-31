/*global document, require, console, window, alert*/

require.config({
	paths: {
        jqueryUI: "./js/libs/jQuery_UI/js/jquery-ui-1.9.2.custom.min",
		threejs: "./js/libs/Graph-Visualization/webgl-frameworks/Three_r44",
		objectSelection: "./js/libs/Graph-Visualization/utils/ObjectSelection",
		label: "./js/libs/Graph-Visualization/utils/Label",
		requestAnimation: "js/libs/Graph-Visualization/utils/requestAnimationFrame",
		threeInteraction: "./js/libs/Graph-Visualization/utils/threejs-interaction",
		graph: "./js/libs/Graph-Visualization/Graph",
		forceDirected: "./js/libs/Graph-Visualization/layouts/force-directed-layout"
	},
	shim: {
		'threejs': {exports: 'THREE'},
		'objectSelection': {
			deps: ['threejs'],
			exports: 'objectSelection'
		},
		'label': {
			deps: ['threejs'],
			exports: 'label'
		},
		'requestAnimation': {
			deps: ['threejs'],
			exports: 'requestAnimation'
		},
		'threeInteraction': {
			deps: ['threejs'],
			exports: 'threeInteraction'
		}
	}
});

require(['jquery', 'js/app/init', 'js/app/ui', 'js/app/extraction', 'js/app/visualization'],
		function ($, init, ui, extraction, visualization) {

        "use strict";
            
	    $(function () {
            var baseUrl, urls, graph, redundantEdges;
            
		    if (document.data._data_.tripleCount === 0) {
                alert("This site has no RDFa-Triples");
            } else {
                $(window).scroll(function () {
                    window.scrollTo(0, 0);
                });
		    	
                baseUrl = init.getBaseUrl();
                urls = init.getCSSUrls(baseUrl);
                init.attachCSS(urls);
                init.extendGraph();
		    	
                ui.init();
                
                graph = extraction.getRDFGraph();
                extraction.findExistingNodes();
                redundantEdges = extraction.findRedundantEdges();
                extraction.deleteRedundantEdges(redundantEdges);
		    	
                visualization.showRDFGraph(graph, ui);
		    	
                $('#main-dialog').dialog('open');
		    }
	    });
	});
