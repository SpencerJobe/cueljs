/* 
-------------------------------------------------------------------------------

    ** LICENSE ** (MIT LICENSE)
    Copyright (c) 2014 Spencer Jobe
    http://cueljs.com

    Permission is hereby granted, free of charge, to any person obtaining
    a copy of this software and associated documentation files (the
    "Software"), to deal in the Software without restriction, including
    without limitation the rights to use, copy, modify, merge, publish,
    distribute, sublicense, and/or sell copies of the Software, and to
    permit persons to whom the Software is furnished to do so, subject to
    the following conditions:

    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
    LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
    OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
    WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

-------------------------------------------------------------------------------
*/

(function (namespace) {

	if(typeof String.prototype.trim !== "function") {
		String.prototype.trim = function() {
			return this.replace(/^\s+|\s+$/g, ''); 
		}
	}

	var addStyleTag = function (css) {
	    var head = document.head || document.getElementsByTagName("head")[0];
		var style = document.createElement("style");
		style.type = "text/css";
		if (style.styleSheet){
		  style.styleSheet.cssText = css;
		} else {
		  style.appendChild(document.createTextNode(css));
		}
		head.appendChild(style);
		return style;
	};

	var createListFromHtml = function (html) {
		html = html.trim();
		if (html.substring(0,15) == "<!--custom-html") {
			html = html.substring(15);
			html = html.substring(0,html.length-3);
		}
		var list = [];
		var token = "";
		var c = "";
		var quo = "";
		var p = 0;
		while ( p < html.length) {
			c = html.charAt(p);
			if (c === "<") {
				token = token.trim();
				if (token.length > 0) {
					list.push(token);
				}
				token = "<";
				while (true) {
					p += 1
					if (p >= html.length ) {
						list.push(token);
						break;
					} else {
						c = html.charAt(p);
						if (c === ">") {
							token += ">";
							token = token.toLowerCase();
							list.push(token);
							token = "";
							p += 1;
							break;
						} else if ( c === "\'" || c === "\"") {
							quo = c;
							token+= c;
							while (true) {
								p += 1;
								if (p>=html.length) {
									list.push(token);
									break;
								} else {
									c = html.charAt(p);
									if (c === quo) {
										token += c;
										break;
									} else {
										token += c;
									}
								}
							}
						} else {
							token += c;
						}
					}
				}
			} else {
				token += c
				p += 1
			}
		}
		token = token.trim();
		if (token.length > 0) {
			list.push(token);
		}
		return list;
	};
	var createAttributes = function (text) {
		var list = [];
		var p = 0;
		var c = "";
		var token = "";
		var quo = "";
		var attributes = {};
		while ( p < text.length) {
			c = text.charAt(p);
			if (c === " ") {
				if (token.length > 0) {
					list.push(token);
					token = "";
				}
				p += 1;
			} else if (c === "\'" || c === "\"") {
				if (token.length>0) {
					list.push(token);
					token = "";
				}
				quo=c;
				while(true) {
					p += 1;
					if (p >= text.length) {
						break;
					} else {
						c = text.charAt(p);
						if (c === quo) {
							list.push(token);
							token = "";
							p += 1;
							break;
						} else {
							token += c;
						}
					}
				}
			} else if ( c === "=") {
				list.push(token);
				token = "";
				list.push("=");
				p += 1;
			} else {
				token += c;
				p += 1;
			}
		}
		if (token.length > 0) {
			list.push(token);
			token = "";
		}
		for (var i = 0; i < list.length; i += 1) {
			if (i == list.length-1) {
				attributes[list[i]] = list[i];
			} else if (list[i+1] == "=") {
				attributes[list[i]] = list[i+2];
				i += 2;
			} else {
				attributes[list[i]] = list[i];
			}
		}
		return attributes;
	};
	var pos = 0
	var createTreeFromList = function (list,parentNode) {
		var tagName = "";
		var item = "";
		var nodeItem;
		var attributeText;
		while (pos < list.length) {
			item = list[pos];
			if (item == "</" + parentNode.name + ">") {
				pos += 1;
				return parentNode;
			} else if (item.charAt(0) == "<") {
				tagName = item.substring(1,item.lastIndexOf(">"));
				tagName += " ";
				tagName = tagName.substring(0,tagName.indexOf(" "));
				tagName = tagName.trim();
				if (item.indexOf(" ") >= 0) {
					attributeText = item.substring(item.indexOf(" "),item.lastIndexOf(">"));
				} else {
					attributeText = "";
				}
				pos += 1;
				nodeItem = new NodeItem(tagName,parentNode,attributeText);
				parentNode.childNodes.push(createTreeFromList(list,nodeItem));
			} else {
				pos += 2;
				parentNode.childNodes.push(item);
				return parentNode;
			}
		}
		return parentNode;
	};
	var NodeItem = function (name,parent,attributeText) {
		this.name = name;
		this.htmlElement; //defined later
		this.attributeText = attributeText || "";
		this.attributes = createAttributes(attributeText);
		this.parent = parent || undefined;
		this.childNodes = [];
	};
	NodeItem.prototype.byId = function (id) {
		var child;
		var subChild;
		for (var i = 0; i < this.childNodes.length; i += 1) {
			child = this.childNodes[i];
			if (typeof child === "string") {
				return undefined;
			} else if (child.attributes.id == id) {
				return child;
			} else { 
				if (child.byId !== undefined) {
					subChild = child.byId(id);
					if (subChild !== undefined) {
						return subChild;
					}
				}
			}
		}
		return undefined;
	};
	NodeItem.prototype.byTag = function (name) {
		var list = [];
		var subList = [];
		name = name.toLowerCase();
		for(var i = 0; i < this.childNodes.length; i += 1) {
			if (this.childNodes[i].name == name) {
				list.push(this.childNodes[i]);
			} 
			if (this.childNodes[i].byTag !== undefined) {
				subList = this.childNodes[i].byTag(name);
				for (var k = 0; k < subList.length; k += 1) {
					list.push(subList[k]);		
				}
			}
		}
		return list;
	};
	NodeItem.prototype.getOuterHTML = function () {
		var html = "<" + this.name + " " + this.attributeText + " >";
		html += this.getInnerHTML();
		html += "</" + this.name + ">";
		return html;
	};
	NodeItem.prototype.getInnerHTML = function () {
		var html = "";
		var child;
		for (var i = 0; i < this.childNodes.length; i += 1) {
			child = this.childNodes[i];
			if (child.name !== undefined) {
				html += "<" + child.name + " " + child.attributeText + " >";
				html += child.getInnerHTML();
				html += "</" + child.name + ">";
			} else {
				html += child;
			}
		}
		return html;
	};

	var cuel = {};
	var customElements = [];
	cuel.domTree = new NodeItem("dom",null,"");

	var CustomElement = function (customName,rootName,fnDef) {
		this.isCustom = true;
		this.customName = customName.toLowerCase();
		this.rootName = rootName;
		this.fnDef = fnDef;
	};
	
	cuel.getElementDefinition = function (name) {
		for (var i = 0; i < customElements.length; i += 1) {
			if(customElements[i].customName === name) {
				return customElements[i];
			}
		}
		return undefined;
	};
	
	cuel.defineElement = function (customName,rootName,fnDef) {					
		var newElement = new CustomElement(customName,rootName,fnDef);
		customElements.push(newElement);
	};
	
	cuel.byId = function (id) {
		return cuel.domTree.byId(id);
	};

	cuel.byTag = function (tag) {
		return cuel.domTree.byTag(tag);
	};

	cuel.render = function (tree,parentElement) {
		var elementDef;
		var newElement;
		var item;
		for (var i = 0; i < tree.childNodes.length; i += 1) {
			item = tree.childNodes[i];
			elementDef = cuel.getElementDefinition(item.name);
			if (elementDef !== undefined) {
				newElement = document.createElement(elementDef.rootName);
				elementDef.fnDef(item,newElement);
			} else {
				if (item.name === "script") {
					newElement = document.createElement(item.name);
					newElement.text = item.getInnerHTML();
				} else if (item.name === "style") {
					newElement = addStyleTag(item.getInnerHTML());
				} else {
					newElement = document.createElement("span");
					if (item.getOuterHTML !== undefined) {
						newElement.innerHTML = item.getOuterHTML();
					} else {
						newElement.innerHTML = item;
					}
				}
			}
			parentElement.appendChild(newElement);
			item.htmlElement = newElement;
		}
	};

	namespace.cuel = cuel;
	
	setTimeout(function() {
		var list = createListFromHtml(document.body.innerHTML);
		document.body.innerHTML = "";
		cuel.domTree = createTreeFromList(list,cuel.domTree);
		cuel.render(cuel.domTree,document.body);
	},12);

}(window));