/*global define, location, console, event, mouse, canvas_width, canvas_height, canvas*/

define(['jquery', 'jqueryUI', 'js/app/utils'], function ($, jQueryUI, utils) {
    "use strict";
	
	var ui  = {

		/**
		 * Initializes the user interface
		 */
		init : function () {
			this.initMainDialog();
			this.initInfoDialog();
		},

		/**
		 * Initializes the main dialog
		 */
		initMainDialog : function () {
			var size = utils.calculateAvailableSize();
			this.createDialog("main-dialog", "RDFGraphExplorer3D", size, false);
			$("#main-dialog").hide();
			this.createMainDialogContent();
			this.addMainDialogEventHandlers();
		},
		
		/**
		 * Creates the main dialog
		 */
		createDialog : function (id, title, size, autoOpen) {
			$('<div id="' + id + '"></div>')
                .dialog({
                    autoOpen: autoOpen,
                    resizable: false,
                    modal: true,
                    width: size.width,
                    minHeight: size.height,
                    title: title
                });
		},
        
		/**
		 * Creates the main dialog content
		 */
		createMainDialogContent : function () {
			this.createCanvasContainer();
			this.createDialogMenu();
		},
		
		/**
		 * Creates the canvas container
		 */
		createCanvasContainer : function () {
			var htmlStr = '<div id="main-dialog-canvas-container">'
				+ '</div>';
			
			$(htmlStr).appendTo('#main-dialog');
		},
		
		/**
		 * Creates the menu
		 */
		createDialogMenu : function () {
			
			var htmlStr = '<div id="info-msg">Rotate: Press left mouse button and ' + 
                'move<br>Zoom: Press key S and move mouse<br>' +
                'Drag: Press key D and move mouse</div>' +
                '<div id="main-dialog-menu">' +
				'<p id="btn-info-msg">Show Control Info</p>' +
				'</div>';
                
			$(htmlStr).appendTo('#main-dialog');
            $("#info-msg").hide();
		},
		
		/**
		 * Adds event handlers to main dialog
		 */
		addMainDialogEventHandlers : function () {
			var that, mainDialogCloseCallback, showInfoMsgCallback;
                        
            that = this;
			
			mainDialogCloseCallback = function () {
				that.onMainDialogClose();
			};
			
			$('#main-dialog').on('dialogclose', mainDialogCloseCallback);
			
			showInfoMsgCallback = function () {
				that.onClickShowInfoMsg();
			};
			
			$('#btn-info-msg').click(showInfoMsgCallback);
		},
		
		/**
		 * Main dialog close event handler
		 */
		onMainDialogClose : function () {
			location.reload();
		},
		
		/**
		 * Show graph event handler
		 */
		onClickShowInfoMsg : function () {
            console.log("...")
			$('#info-msg').toggle();
		},
		
		/**
		 * Initializes the info dialog
		 */
		initInfoDialog : function () {
			var size = utils.calculateAvailableSize();
			this.createDialog("info-dialog", "InfoDialogTitle", size, false);
			this.addInfoDialogEventHandlers();
		},
		
		/**
		 * Adds event handler to info dialog
		 */
		addInfoDialogEventHandlers : function () {
			var that, infoDialogCloseCallback;
            
            that = this;
			
			infoDialogCloseCallback = function () {
				that.onInfoDialogClose();
			};
			
			$('#info-dialog').on('dialogclose', infoDialogCloseCallback);
		},
		
		/**
		 * Close info dialog event handler
		 */
		onInfoDialogClose : function () {
            $('#info-dialog').empty();
		},
		
		/**
		 * Creates info dialog content
		 */
		createInfoDialogContent : function (isResource, node) {
            var url, extension, contentType;

			this.setInfoDialogTitle(node);
			
			if (isResource) {
				url = node.data.value;
				extension = this.getExtension(url);
				contentType = this.getContentType(extension);
				this.showResourceValue(contentType, url);
			} else {
				this.showLiteralValue(node.data.value);
			}
		},
		
		/**
		 * Set title of info dialog
		 */
		setInfoDialogTitle : function (node) {
			var newTitle = "Node " + node.id + ": " + node.data.value;
			$('#info-dialog').dialog('option', 'title', newTitle);
		},

		/**
		 * Returns file extension of url
		 * @param url
		 * @returns {*}
		 */
		getExtension : function (url) {
            var splittedURL, filename;
            
			splittedURL = url.split("/");
            filename = splittedURL.splice(-1)[0].split(".")[1];

			return filename;
		},
		
		/**
		 * Return content type by file extension
		 */
		getContentType : function (extension) {
            var contentType;
            
			switch (extension) {
            case "mp4":
                contentType = "video/mp4";
                break;
            case "webm":
                contentType = "video/webm";
                break;
            case "ogv":
                contentType = "video/ogg";
                break;
            case "mp3":
                contentType = "audio/mpeg";
                break;
            case "ogg":
                contentType = "audio/ogg";
                break;
            case "jpeg":
                contentType = "image/jpeg";
                break;
            case "jpg":
                contentType = "image/jpeg";
                break;
            case "JPG":
                contentType = "image/jpeg";
                break;
            case "png":
                contentType = "image/png";
                break;
            case "svg":
                contentType = "image/svg+xml";
                break;
            case "html":
                contentType = "text/html";
                break;
            case "pdf":
                contentType = "application/pdf";
                break;
            default:
                contentType = "unknown";
			}
			
			return contentType;
		},
		
		/**
		 * Shows resource value depending on content type
		 */
		showResourceValue : function (contentType, url) {
			switch (contentType) {
            case "video/mp4":
                this.playVideo("video/mp4", url);
                break;
            case "video/webm":
                this.playVideo("video/webm", url);
                break;
            case "video/ogg":
                this.playVideo("video/ogg", url);
                break;
            case "audio/mpeg":
                this.playAudio("audio/mpeg", url);
                break;
            case "audio/ogg":
                this.playAudio("audio/ogg", url);
                break;
            case "image/jpeg":
                this.showContentInIFrame(url);
                break;
            case "image/png":
                this.showContentInIFrame(url);
                break;
            case "image/svg+xml":
                this.showContentInIFrame(url);
                break;
            case "text/html":
                this.showContentInIFrame(url);
                break;
            case "application/pdf":
                this.showContentInIFrame(url);
                break;
            default:
                this.showContentInIFrame(url);
            }

		},

		/**
		 * Plays a video file
		 * @param type
		 * @param url
		 */
		playVideo : function (type, url) {
			$("#info-dialog").html('<div id="video-container"></div>');

			$('<video width="768" height="576" autoplay controls>If you see this message, your browser does not support the video tag.</video>')
                .append('<source src="' + url + '" type="' + type + '" />')
                .appendTo($("#video-container"));
		},

		/**
		 * Plays an audio file
		 * @param type
		 * @param url
		 */
		playAudio : function (type, url) {
			$("#info-dialog").html('<div id="audio-container"></div>');
			
			$('<audio autoplay controls>Your browser does not support the audio tag.</audio>')
				.append('<source src="' + url + '" type="' + type + '">')
				.appendTo($('#audio-container'));
		},

		/**
		 * Shows content in an IFrame
		 * @param url
		 */
		showContentInIFrame : function (url) {
            var size, width, height, str;
            
			size = utils.calculateAvailableSize();
			width = (size.width * 0.95);
			height = (size.height * 0.95);
			str = '<div id="iframe-container">' + '<iframe src="' + url + '" id="info-dialog-iframe" width="' +
				width + '" height="' + height + '" frameborder="0"></iframe></div>';
			$(str).appendTo("#info-dialog");
		},

		/**
		 * Shows literal value
		 * @param value
		 */
		showLiteralValue : function (value) {
			var htmlStr = '<div id="node-value">' + value + '</div>';
			$(htmlStr).appendTo("#info-dialog");
		},
				
		/**
		 * Mouse move event handler
		 */
		onCanvasMouseMove : function () {
			event.preventDefault();
            
			var offset = this.calculateDialogOffset();
			
			mouse.x = ((event.clientX - offset.left) / canvas_width) * 2 - 1;
			mouse.y = -((event.clientY - offset.top - 50) / canvas_height) * 2 + 1;
		},
		
		/**
		 * Returns dialog offset
		 */
		calculateDialogOffset : function () {
			return $(canvas).offset();
		},
		
		/**
		 * Shows info dialog
		 */
		showInfoDialog : function () {
			$('#info-dialog').dialog("open");
		}
	};
	
	return ui;
	
});
