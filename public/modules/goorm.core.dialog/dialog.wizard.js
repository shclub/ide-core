/**
 * Copyright Sung-tae Ryu, goormDev Team. All rights reserved.
 * Code licensed under the AGPL v3 License:
 * http://www.goorm.io/intro/License
 * email : contact@goorm.io
 *       : sungtae.ryu@goorm.io
 * project_name : goormIDE
 * version: 2.0.0
 **/

goorm.core.dialog.wizard = function() {

};

goorm.core.dialog.wizard.prototype = {
	init: function(option) {
		var self = this;

		this.step = 1;

		this.id = option.id;
		this.previous = option.previous;
		this.next = option.next;
		this.show = option.show; //jeongmin: define show function
		this.success = option.success; //jeongmin: forward success function
		this.help_url = option.help_url;
		
		this.panel = $('#' + self.id);
		
		var goorm_dialog_container = this.panel;

		goorm_dialog_container.draggable({});
		// 		goorm_dialog_container.css("overflow", "hidden");

		goorm_dialog_container.on('shown.bs.modal', this.show); //jeongmin: when the modal has been made visible to the user, specify this (go to project._new.js)
		goorm_dialog_container.on('show.bs.modal', function() { // jeongmin: event should be binded to only one element, not .modal

			$(this).css('display', 'block');
			var $dialog = $(this).find('.modal-dialog');
			var offset_height = (($(window).height() - $dialog.height()) / 2);
			var offset_width = (($(window).width() - $dialog.width()) / 2);
			$(this).css('top', offset_height - 30).css('left', offset_width);

			core.init_input_validation($(this).find('.has-feedback')); // clear validator as initial state
		});

		var handle_next = function() {
			if (!self.next()) {
				return false;
			}

			if (self.step < self.total_step) {
				self.show_previous_button(true);

				goorm_dialog_container.find('.wizard_step[step="' + self.step + '"]').hide();
				if (goorm_dialog_container.find('.wizard_step[step="' + self.step + '"]')) {
					self.step++;
					goorm_dialog_container.find('.wizard_step[step="' + self.step + '"]').show();
					if (self.step == self.total_step) {
						self.show_next_button(false);
					}
				}
			}
		};

		var handle_prev = function() {
			if (self.previous) {
				self.previous();
			}

			if (1 < self.step) {
				self.show_next_button(true);
				goorm_dialog_container.find('.wizard_step[step="' + self.step + '"]').hide();
				self.step--;

				if (self.step == 1) {
					self.show_previous_button(false);
				}

				goorm_dialog_container.find('.wizard_step[step="' + self.step + '"]').show();
			}
		};

		$(document).on('keydown', 'return', function() {
			if (confirmation.panel === null || confirmation.panel === undefined) {
				confirmation.panel = {};
				confirmation.panel.cfg = {};
				confirmation.panel.cfg.config = {};
				confirmation.panel.cfg.config.visible = {};
				confirmation.panel.cfg.config.visible.value = false;
			}

			if (self.buttons && self.panel.cfg.config.visible.value && !core.status.keydown && !alert.panel.cfg.config.visible.value && !notice.panel.cfg.config.visible.value && !confirmation.panel.cfg.config.visible.value) {
				$(self.buttons).each(function() {
					if (this.isDefault) {
						this.hide = function() {};
						this.handler();

						core.status.keydown = true;
					}
				});
			}
		});

		if (this.help_url) {
			this.insert_help_url(this.help_url);
		}
		
		if (typeof self.success == 'function') {
			self.success();
		}

		var __buttons = $('#' + this.id).find('.modal-footer button.btn');
		__buttons[0].onclick = handle_prev;
		__buttons[1].onclick = handle_next;
		__buttons[2].onclick = option.handle_cancel;
		__buttons[3].onclick = option.handle_ok;

		core.dialog.loaded_count++;

		self.show_previous_button(false);

		core.input_validation(goorm_dialog_container); // bind validator on input
		
		return this;
	},

	show_previous_button: function(show) {
		/* TODO : this part need to be changed way for modifying class */
		if (show) {
			$('#g_np_btn_previous').show(); //jeongmin: show previous button
		} else {
			$('#g_np_btn_previous').hide(); //jeongmin: hide previous button
		}
	},

	show_next_button: function(show) {
		if (show) {
			$('#g_np_btn_next').show(); //jeongmin: show next button
		} else {
			$('#g_np_btn_next').hide(); //jeongmin: hide next button
		}
	},

	set_start: function(option) { // option: showing buttons or not
		var self = this;
		self.step = 1;
		$('#' + self.id).find('.wizard_step').each(function(i) {
			$(this).hide();
			if (i === 0) {
				$(this).show();
			}
		});

		var next_button = option ? ((option.next_button !== undefined) ? option.next_button : true) : true;

		self.show_previous_button(false);
		self.show_next_button(next_button);
	},
	
	insert_help_url: function (url) {
		if (this.panel.find('.close').length) {
			this.panel.find('.close').after('<a class="question glyphicon glyphicon-question-sign" href="' + url + '" target="_blank"></a>');
		}
	},
	
	change_help_url: function (url) {
		if (this.panel.find('.question').length) {
			this.help_url = url;
			
			this.panel.find('.question').attr('href', url);
		}
	}	
};
