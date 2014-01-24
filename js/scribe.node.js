(function(Scribe) {
	"use strict";

	var debug = Scribe.debug;
	
	var xmlns = "http://www.w3.org/2000/svg";

	var attributes = {
		'viewBox': setAttr,
		'class': setAttr,
		'x': setAttr,
		'y': setAttr,
		'x1': setAttr,
		'y1': setAttr,
		'x2': setAttr,
		'y2': setAttr,
		'd': setAttr,
		'width': setAttr,
		'height': setAttr,
		'href': setAttrBaseVal,
		'translate': setTransform,
		'scale': setTransform,
		'rotate': setTransform,
		'text': textContent
	};

	var transforms = {
		'translate': 'setTranslate',
		'scale': 'setScale',
		'rotate': 'setRotate'
	};

	var transformTypes = {
		'translate': 'SVG_TRANSFORM_TRANSLATE',
		'scale': 'SVG_TRANSFORM_SCALE',
		'rotate': 'SVG_TRANSFORM_ROTATE'
	};
	
	// SVG functions
	
	function setAttrBaseVal(svg, node, attr, value) {
		node[attr].baseVal = value;
	}
	
	function setAttr(svg, node, attr, value) {
		node.setAttributeNS(null, attr, value);
	}
	
	function textContent(svg, node, attr, value) {
		node.textContent = value;
	}
	
	function getTransform(node, attr) {
		var l = node.transform.baseVal.numberOfItems;
		var transform;
		
		while (l--) {
			transform = node.transform.baseVal.getItem(l);
			
			if (transform.type === transform[transformTypes[attr]]) {
				return transform;
			}
		}
	}
	
	function setTransform(svg, node, attr, value) {
		var transform = getTransform(node, attr);
		
		if (!transform) {
			transform = svg.createSVGTransform();
			node.transform.baseVal.appendItem(transform);
		}
		
		transform[transforms[attr]].apply(transform, value);
	}
	
	function Node(svg, tag, obj) {
		var node = document.createElementNS(xmlns, tag);
		var attr;
		
		for (attr in obj) {
			attributes[attr](svg, node, attr, obj[attr]);
		}
		
		return node;
	}
	
	function SVG(obj) {
		var svg = document.createElementNS(xmlns, 'svg');
		var attr;
		var viewBox = '0 0 ' + obj.size + ' ' + Math.floor(obj.size * obj.height / obj.width);
		
		for (attr in obj) {
			if (attr === 'size') { continue; }
			attributes[attr](svg, node, attr, obj[attr]);
		}
		
		return svg;
	}
	
	// Object constructor
	
	Scribe.Node = Node;
	Scribe.SVG = SVG;
})(Scribe);