jQuery(document).ready(function($) {

var quickTags;
quickTags = {
	type : 'quickTags',
	taxonomy : 'post_tag',
	add_div : null,

	init : function(){
		var that = this;
		$.extend(this, (quickTagsArgs || {}));
//		this.tag_href_base = 'upload.php?taxonomy='+this.taxonomy+'&term=';
		this.add_div = (
			$('<div/>', {css:{position:'absolute',display:'none'}}).append(
			$('<input/>', {type:'hidden','class':'the-tags'})).append(
			$('<input/>', {'class':'newtag form-input-tip',type:'text',autocomplete:'off',size:'16'})).append(
			$('<input/>', {'class':'button tagadd',type:'button',value:this.add_label}))
		).appendTo('body');

		$('.tags').each( function() {
			quickTags.initTagLinks(this);
		});

		$(document).mouseup(function (e){
			var container = that.add_div;
			if (!container.is(e.target) && container.has(e.target).length === 0)
				container.hide();
		});
 
//		this.cornerError = CornerMessage.init({
//			class: 'alert-danger'
//		});
		this.cornerError = wpMessage.init({
			class: 'error'
		});
//		this.cornerError.show('This is a test update message. Updated!!!');
	},

	initTagLinks : function(el){
		var postId = $(el).closest('tr').attr('id'),
			links = $('>a', el),
			tags = this.getTags(links);

		this.wrapTags(tags, $(el), postId);
	},

	getTags : function(links){
		var that = this,
			out = [];
		$.each(links, function(){
			var a = $(this);
			out.push({slug: a.attr('href').replace(that.tag_href_base, ''), name: a.text()});
		});
		return out;
	},

	wrapTags : function(tags, cont, id){
		var that = this,
			xbutton, pbutton;
		cont.empty();
		$.each(tags, function(){
			var ele = this,
				span = $('<span>');
			span.append($('<a/>', {href:that.tag_href_base+ele.slug, text:ele.name}));

			xbutton = $( '<a class="tgbutton del">X</a>' );
			xbutton.click( function(){
				$.post(ajaxurl,
					{action: that.type, id: id, method: 'delete', term: ele.slug},
					that.returnAfterDelete.bind(that, this)
				);
			});
			span.prepend('&nbsp;').prepend( xbutton );

			cont.append(span);
		});

		this.addPlusLink(cont, id);

		cont.attr('data_tags', JSON.stringify(tags));

	},
	addPlusLink : function(cont, id){
		var that = this,
			pbutton = $( '<a class="tgbutton pls">&plus;</a>' );
		pbutton.click( function(e){
			that.add_div.css({
        top: e.pageY,
        left: e.pageX
      }).show().blur()
			.find('.the-tags').each(function() {
				var obj = JSON.parse(cont.attr('data_tags')),
					tag_names = [];
				$.each(obj, function(){
					tag_names.push( this.name );
				});
				$(this).val(tag_names.join(',')).attr('name',id);

			}).end()
			.find('.newtag').focus().unbind().blur(function() {
				if ( '' === this.value )
					$(this).parent().siblings('.taghint').css('visibility', '');
			}).focus(function(){
				$(this).parent().siblings('.taghint').css('visibility', 'hidden');
			}).keyup(function(e){
				if ( 13 == e.which ) {
					that.flushTags( $(this).closest('div'), cont );
					return false;
				}
			}).keypress(function(e){
				if ( 13 == e.which ) {
					e.preventDefault();
					return false;
				}
			}).each(function(){
				$(this).suggest( ajaxurl + '?action=ajax-tag-search&tax=' + that.taxonomy, { delay: 500, minchars: 2, multiple: true, multipleSep: quickTagsArgs.comma + ' ' } );
			}).end()
			.find('.tagadd').unbind().click(function(){
				that.flushTags( $(this).closest('div'), cont );
			});
		});

		cont.append($('<span>').prepend( pbutton ));
	},

	flushTags : function(el, cont) {
		var tagsval, newtags, text,
			that = this,
			tags = $('.the-tags', el),
			newtag = $('input.newtag', el),
			comma = quickTagsArgs.comma;

		text = newtag.val();
		newtag.val('');
		tagsval = tags.val();
		newtags = tagsval ? tagsval + comma + text : text;

		newtags = this.clean( newtags );
		newtags = this.array_unique_noempty( newtags.split(comma) ).join(comma);

		$.post(ajaxurl,
			{action: that.type, id: tags.attr('name'), method: 'add', terms: newtags},
			that.returnAfterAdd.bind(that, el, cont)
		);

		return false;
	},

	clean : function(tags) {
		var comma = quickTagsArgs.comma;
		if ( ',' !== comma )
			tags = tags.replace(new RegExp(comma, 'g'), ',');
		tags = tags.replace(/\s*,\s*/g, ',').replace(/,+/g, ',').replace(/[,\s]+$/, '').replace(/^[,\s]+/, '');
		if ( ',' !== comma )
			tags = tags.replace(/,/g, comma);
		return tags;
	},

	returnAfterDelete : function(el, json){
		//console.log(arguments)
		var that = this,
			obj = JSON.parse(json);
		if(obj.success){
			var td = $(el).closest('td'),
				tags = obj.terms,
				id = td.closest('tr').attr('id');
			this.wrapTags(tags, td, id);
		}
		else
			if(obj.msg) that.cornerError.show(obj.msg);

	},

	returnAfterAdd : function(add_div, td, json){
		//console.log(arguments, this)
		var that = this,
			obj = JSON.parse(json);
		if(obj.success){
			var tags = obj.terms,
				id = td.closest('tr').attr('id');
			this.wrapTags(tags, td, id);
			add_div.css({display:'none'});
		}
		else
			if(obj.msg) that.cornerError.show(obj.msg);

	},

	// return an array with any duplicate, whitespace or values removed
	array_unique_noempty : function (a) {
		var out = [];
		jQuery.each( a, function(key, val) {
			val = jQuery.trim(val);
			if ( val && jQuery.inArray(val, out) == -1 )
				out.push(val);
			} );
		return out;
	}
};

//var CornerMessage = (function() {
//	"use strict";
//	var elem,
//		hideHandler,
//		that = {};
//	that.defaults = {
//		selector: null,
//		class: 'alert-info',
//		fadeInDelay: 0,
//		fadeOutDelay: 4000
//	};
//	that.init = function(options) {
//		options = $.extend(that.defaults, options);
//		elem = ((options.selector) ? $(options.selector) : ($('<div/>',{'class':'bb-alert alert alert-info', css:{display:'none'}}).append($('<span/>'))).appendTo('body'));
//		if(options.class) elem.removeClass('alert-info').addClass(options.class);
//		that.options = options;
//		return that;
//	};
//	that.show = function(text) {
//		clearTimeout(hideHandler);
//		elem.find("span").html(text);
//		elem.delay(that.options.fadeInDelay).fadeIn().delay(that.options.fadeOutDelay).fadeOut();
//	};
//	return that;
//}());
var wpMessage = (function() {
	"use strict";
	var elem,
		hideHandler,
		that = {};
	that.defaults = {
		selector: null,
		class: 'updated',
		fadeInDelay: 0,
		fadeOutDelay: 4000
	};
	that.init = function(options) {
		options = $.extend(that.defaults, options);
		elem = ((options.selector) ? $(options.selector) : ($('<div/>', {'class':'quickTags'}).append($('<p/>'))).insertAfter($('div.wrap h2:first')));
//		elem = ((options.selector) ? $(options.selector) : ($('<div/>', {'class':'inline',css:{position:'fixed',display:'none'}}).append($('<p/>'))).insertAfter($('div.tablenav.top')));
		if(options.class) elem.removeClass('updated').addClass(options.class);
		that.options = options;
		return that;
	};
	that.show = function(text) {
		clearTimeout(hideHandler);
		elem.find("p").html(text);
		elem.delay(that.options.fadeInDelay).fadeIn().delay(that.options.fadeOutDelay).fadeOut();
	};
	return that;
}());

quickTags.init();

//$(document).mouseup(function (e){
//	if(!quickTags.add_div && e.button==0){
//		quickTags.init();
//	}
//});
});