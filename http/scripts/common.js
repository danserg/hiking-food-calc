/**
 * Created by Serhii_Kotyk on 11/25/13.
 */
var EVENT_PREFIX = 'e_';

/**
 * Builds HTML node by a tag name and with certain attributes
 *
 * @param tag tag name
 * @param attributes attributes as a Map
 * @returns {null} if no tag handled
 */
function buildElement(tag, attributes){
    if (!tag){
        throw new DOMException("Can't create element " + tag);
    }

    switch(typeof(tag)){
        case 'string':
            return buildByTag(tag, attributes);
            break;
        case 'object':
            return buildComplexElement(tag);
            break;
        default:
            throw new DOMException("Can't create element " + tag);
    }

    function buildByTag(tag, attributes){
        if (attributes){
            var atTag = attributes['_tag'];
            if(!atTag){
                attributes['_tag'] = tag;
            }

            return buildComplexElement(attributes);
        }else{
            return document.createElement(tag);
        }
    }
}

/**
 * Builds a DOM element attribute by attribute.
 * Tag of element is handled as a '_tag' property of attributes object
 *
 * @param {Object} attributes
 * @returns {Element} DOM element
 */
function buildComplexElement(attributes){
    if (attributes instanceof Array){//if array

        var templatesArray = attributes,
            children = new Array();

        for(var i = 0; i < templatesArray.length; i++){
            children.push(buildElement(templatesArray[i]));
        }

        if (children.length > 0){
            var containerDiv = buildElement('div');
            for(var i = 0; i < children.length; i++){
                containerDiv.appendChild(children[i]);
            }
            return containerDiv;
        }

    }else if(attributes != undefined && attributes != null){//if object

        var tag = attributes['_tag'];

        //if tag is null or not a string
        if (!tag || typeof (tag) !== 'string'){
            throw new Error("Can't build element with tag name " + tag);
        }

        var element = document.createElement(tag);


        if (attributes)
        //for each attribute assign it to element
            for(var key in attributes){
                var attributeName = key,
                    attributeValue = attributes[key];

                if (attributeName.indexOf(EVENT_PREFIX) === 0 //starts with "e_"
                    && typeof(attributeValue) === 'function'){ //and value is function
                    var realAttribute = attributeName.replace(EVENT_PREFIX, '');
                    element[realAttribute] = attributeValue;
                }else if (attributeValue instanceof Node){
                    element.appendChild(attributeValue);
                }else if(attributeName === '_tag'){
                    if (tag !== attributeValue){
                        return buildElement(attributeValue, attributes);
                    }else{
                        continue;
                    }
                }else if (attributeName === 'innerText'){
                    element.appendChild(document.createTextNode(attributeValue));
                }else if(typeof attributeValue === 'object'){
                    element.appendChild(buildElement(attributeValue));
                }else{
                    element.setAttribute(attributeName, attributeValue);
                }
            }

        return element;
    }
}

function extend(parent, child){
    if (parent && child
        && 'function' === typeof(parent)
        && 'function' === typeof(child)){

        child.prototype = new parent();
    }
}

/**
 * Returns freezed value getter of variable, like iterator in a loop
 * @param value
 */
function FreezedValueGetter(value){
    return function(){return value};
}

/**
 *
 * Creates a function in global scope which when called
 * creates object
 * if parent is defined
 *          as a new instance of parent
 * else
 *          as empty object
 * then creates a new object using
 * constructor method and copies references to properties of that new object
 * as properties of new previously created object.
 *
 * As a result a new object is created with copies of properties and functions
 * of parent object if it exists and copies of properties and functions
 * of object created by a constructor = truly merged-by-override object
 *
 * The gotten function can be called as a cosntructor of an object e.g.
 *
 * EXAMPLE:
 *
 *      Class('A', function(){this.name = 'John'})
 *
 *      new A() -> {name: 'John'}
 *
 *      Class('B', function(this.surname = 'Doe'), 'A')
 *
 *      new B() -> {name: 'John', surname: 'Doe'}
 *
 *
 *  Each time you use new ClassName() it is guaranteed that you
 *  will recieve a completely new Object with no scope conflicts
 *
 *
 * @param {String} name class name
 * @param {Function} construct cunstructor of a class
 * @param {String/Function} parent parent of class (BETTER FUNCTION)
 * @constructor
 */
function Class(name, construct, parent){
    if ('string' === typeof(name)
        && 'function' === typeof(construct)){

        if ('string' === typeof parent){
            parent = Class.getByName(parent);
        }

        //now parent is a function

        Class[name] = function(){
            var parentInstance = null;

            //instantiate object as a parent
            if (parent){
                parentInstance = new parent();
            }

            //override all parent fields with child fields
            var extender = new construct();

            if (parentInstance)
            for(var key in parentInstance){
                this[key] = parentInstance[key];
            }

            for(var key in extender){
                this[key] = extender[key];
            }

        };

        //if parent is defined
        if('function' === typeof parent){
            Class[name].prototype = new parent();
        }

        window[name] = Class[name];

    }else{
        throw new Error("Class should have name and cosntructor. " + JSON.stringify({
            name: name,
            constructor: construct,
            parent: parent
        }));
    }
}

Class.getByName = function(name){
    return Class[name] || window[name];
}

Function.setFunction = function(name, functionBody){
    eval.call(this, 'var ' + name + ' = ' + functionBody);
};

Function.getByName = function(name){
    return eval(name);
};