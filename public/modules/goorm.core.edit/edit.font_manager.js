/**
 * Copyright Sung-tae Ryu, goormDev Team. All rights reserved.
 * Code licensed under the AGPL v3 License:
 * http://www.goorm.io/intro/License
 * email : contact@goorm.io
 *       : sungtae.ryu@goorm.io
 * project_name : goormIDE
 * version: 2.0.0
 **/

goorm.core.edit.font_manager = function() {
	this.max_font_size = 40;
	this.min_font_size = 11;
	this.font_size = 12;
	this.break_font_size = 11;
	this.target = null;
	this.__target = null;
	this.editor = null;
	this.now_zoom = 1;
	this.now_margin_top = -2;
	this.now_margin_left = -3;
	this.gutters_width = null;
	this.font_percent = 100;
	this.flag = null;
};

goorm.core.edit.font_manager.prototype = {

	font_family: 'inherit',

	init: function(parent) {
		var self = this;
		this.parent = parent;

		this.target = this.parent.target;
		this.__target = $(this.target);

		this.editor = this.parent.editor;
		this.gutters_width = parseFloat($('.CodeMirror-gutter', this.__target).css('width'));

		goorm.core.edit.font_manager.prototype.font_family = (core.preference['preference.editor.font_family']) ? core.preference['preference.editor.font_family'] : 'inherit';
		$('.CodeMirror-lines').css('font-family', this.font_family);

		$(core).on('on_preference_confirmed', function() {
			goorm.core.edit.font_manager.prototype.font_family = (core.preference['preference.editor.font_family']) ? core.preference['preference.editor.font_family'] : 'inherit';
			$('.CodeMirror-lines').css('font-family', self.font_family);
		});

		$('#font_size_bottom').on('show.bs.dropdown', function() {
			$(this).find('span.checked').remove();
			$(this).find('li > a[data-size="' + self.parent.font_size + '"]').prepend('<span class="checked glyphicon glyphicon-ok"></span>');
		}).on('shown.bs.dropdown', function() {
			var HEIGHT_OF_ITEM = 21;
			var scroll_top = (self.parent.font_size - self.min_font_size) * HEIGHT_OF_ITEM;
			$(this).find('ul.dropdown-menu').scrollTop(scroll_top);
		});

		$('#font_size_bottom .dropdown-menu a').on('click', function(e) {
			var current_size = parseInt($(this).data('size'), 10);

			self.parent.font_size = self.refresh(current_size);
			core.preference['preference.editor.font_size'] = self.parent.font_size.toString();
			core.dialog.preference.fill_dialog(core.preference, 'editor_setting_tab');

			$('#font_size_bottom ul.dropdown-menu').find('span.checked').remove();
			$(this).prepend('<span class="checked glyphicon glyphicon-ok"></span>');
		})
	},
	

	/* font size scaling */
	resize: function(delta) {
		var self = this;
		var __target = $(self.target);

		var resize_target = function(target, whichcss, default_value) {
			var target_cm = $(target, __target);
			if (!target_cm || !target_cm.css(whichcss)) {
				return null;
			}

			var vv = default_value;
			vv = parseInt(vv, 10);
			vv += parseInt(delta, 10);

			target_cm.css(whichcss, vv + 'px');
		};

		var resize_width = function(target, default_value) {
			var target_cm = $(target, __target);

			var vv = default_value;
			vv = parseInt(vv);
			vv += parseInt(delta, 10);

			target_cm.css('width', vv);
		};

		// image size scaling
		//
		var resize_background_image = function(target) {
			var container = $(self.target);
			var __target = container.find(target);

			self.now_zoom = 1 + (0.08928572 * delta); // average increasing rate

			if (__target.length !== 0) {
				if (~target.indexOf('modified')) {
					__target.css('zoom', self.now_zoom);
				} else {
					self.now_zoom = 1 + (0.05 * delta);
					self.now_margin_top = -2 + (0.1 * delta);
					self.now_margin_left = -3 + (0.1 * delta);

					__target.css('zoom', self.now_zoom).css('margin-top', self.now_margin_top + 'px').css('margin-left', self.now_margin_left + 'px');
				}
			}
		};

		var resize_timer = $.debounce(function() {
			self.user_cursor_resize(delta);
			//        var percent = (self.font_size * 100 / 11).toFixed(1);
			self.font_percent = (self.font_size * 100 / 12).toFixed(1);
			$('#font_size_bottom > button > span.value').text(self.parent.font_size + 'px ');
		}, 100);

		resize_target('.CodeMirror', 'font-size', 12);
		resize_target('.breakpoint', 'font-size', 12);
		resize_target('.bookmark', 'font-size', 12); //jeongmin: resize bookmark font

		resize_target('.CodeMirror-gutter-elt', 'height', 14);
		resize_target('.CodeMirror', 'line-height');
		$('.CodeMirror').css('line-height', parseFloat(self.parent.line_spacing / 10 + 1));

		resize_width('.CodeMirror-gutter.fold', 12);
		resize_width('.CodeMirror-gutter.breakpoint', 8);
		resize_width('.CodeMirror-gutter.bookmark', 12); //jeongmin: resize bookmark gutter

		resize_background_image('div.folding_icon_minus');
		resize_background_image('div.folding_icon');
		resize_background_image('div.bookmark_icon');
		resize_background_image('div.modified_line');

		resize_timer();

		// window.setTimeout(function() {
		//     self.user_cursor_resize(delta);
		//     //        var percent = (self.font_size * 100 / 11).toFixed(1);
		//     self.font_percent = (self.font_size * 100 / 12).toFixed(1);
		//     //        __target.parent().parent().find('span.zoom_percent').text(percent+'%');
		//     $("#goorm_bottom").find(".breadcrumb .zoom_percent").text(self.font_percent + "%");
		// }, 100);
	},

	user_cursor_resize: function() {
		var self = this;
		var container = $(self.target);
		var code_mirror = $('div.CodeMirror', container);
		var cursors = container.find('.user_cursor');

		var height = container.find('.CodeMirror-cursor').height();

		if (cursors.length > 0) {
			for (var i = 0; i < cursors.length; i++) {
				var cursor = cursors[i];
				var target_id = $(cursor).attr('class').split(' ')[0].replace('user_cursor', 'user'); // user_cursor_[ID]
				var $user_name = $('.' + target_id);

				var line = $(cursor).attr('line');
				var ch = $(cursor).attr('ch');

				var coords = self.editor.charCoords({
					line: line,
					ch: ch
				});

				var top = parseInt(coords.top, 10) - parseInt(code_mirror.offset().top, 10);
				var left = parseInt(coords.left, 10) - parseInt(code_mirror.offset().left, 10);

				//parseInt($(user_name).css('font-size').replace('px', ""), 10) + delta;

				//parseInt($(user_name).css('height').replace('px', ""), 10) + delta;

				$user_name.css('top', (top - 8) + 'px').css('left', (left + 5) + 'px').css('font-size', core.preference['preference.editor.font_size'] + 'px').css('height', height + 'px');
				$(cursor).css('top', (top) + 'px').css('left', (left) + 'px').css('height', height + 'px');
			}

		}
	},

	refresh: function(font_size) {
		var self = this;

		//var __target = $(self.target);

		if (!font_size) {
			font_size = self.font_size;
		}
		if (font_size < this.min_font_size) {
			font_size = this.min_font_size;
		}
		if (font_size > this.max_font_size) {
			font_size = this.max_font_size;
		}

		var delta = font_size - 12;

		self.font_size = font_size;
		self.resize(delta);
		self.editor.refresh();
		var window_manager = core.module.layout.workspace.window_manager;
		var active_window = window_manager.active_window;
		if (active_window > -1) {
			if (window_manager.window[active_window].editor) {
				CodeMirror.commands.showInCenter(window_manager.window[active_window].editor.editor);
			}
			
			// window_manager.window[active_window].editor.focus();
		}
		return self.font_size;
	},
};
