/**
 * Copyright Sung-tae Ryu, goormDev Team. All rights reserved.
 * Code licensed under the AGPL v3 License:
 * http://www.goorm.io/intro/License
 * email : contact@goorm.io
 *       : sungtae.ryu@goorm.io
 * project_name : goormIDE
 * version: 2.0.0
 **/

goorm.core.file._new.folder = {
	dialog: null,
	buttons: null,
	dialog_explorer: null,

	init: function() {
		var self = this;

		this.panel = $('#dlg_new_folder');

		var dst_name_check = function(dst_name) {
			// var strings = "{}[]()<>?|~`!@#$%^&*+\"' ";
			// for (var i = 0; i < strings.length; i++)
			// 	if (dst_name.indexOf(strings[i]) != -1) return false;
			if (core.module.file.test(dst_name)) {
				return false;
			} else {
				return true;
			}

			// if (dst_name.indexOf('..') > -1) return false; // jeongmin: prevent access higher directory

			// return true;
		};

		var handle_ok = function() {
			var localization = core.module.localization.msg;
			var data = self.dialog_explorer.get_data();

			if (data === false) {
				// when folder name has space(' '), get_data returns false
				alert.show(localization.alert_invalid_folder_name);
				return false;
			}

			if (data.path == '/') {
				alert.show(localization.alert_deny_make_folder_in_workspace_root);
				return;
			}

			if (!dst_name_check(data.name)) {
				alert.show(localization.alert_invalid_folder_name);
				return false;
			}

			if (data.path === '' || data.name === '') {
				alert.show(localization.alert_filename_empty);

				return false;
			}

			core._socket.once('/file/new_folder', function(result) {
				if (result.err_code === 0) {
					core.module.layout.project_explorer.treeview.refresh_node(data.path);
					core.module.layout.project_explorer.treeview.open_path(data.path);
				} else if (result.err_code === 1) {
					alert.show(localization.alert_file_permission);
				} else if (result.err_code === 10) {
					alert.show(localization.alert_invalide_query);
				} else if (result.err_code === 20) {
					alert.show(localization.alert_rename_exist_folder);
				} else if (result.err_code === 30) {
					alert.show(localization.alert_cannot_make_directory);
				} else {
					alert.show(localization.alert_unknown_error);
				}
			});
			core._socket.emit('/file/new_folder', {
				current_path: data.path,
				folder_name: data.name
			});

			self.panel.modal('hide');
		};

		this.dialog = new goorm.core.dialog();
		this.dialog.init({
			// localization_key: "title_new_folder",
			id: 'dlg_new_folder',
			handle_ok: handle_ok,
			help_url: 'http://help.goorm.io/ide#help_file_new_folder',
			success: null,
			show: $.proxy(this.after_show, this)
		});

		// enter key 'OK'
		this.panel.keydown(function(e) {
			switch (e.which) {
				case 13: // enter key
					$('#g_nfo_btn_ok').click();
					break;
				// case 27:
				// 	$("#g_nfo_btn_close").click();
				// 	break;
			}
		});

		this.dialog_explorer = new goorm.core.dialog.explorer('#folder_new', this);
		this.bind();
	},

	show: function() {
		this.dialog_explorer.init(false, true);
		this.panel.modal('show');
	},

	after_show: function() {
		$('#folder_new_dir_tree').find('.jstree-clicked').click();
		$('#folder_new_target_name').focus();
	},

	bind: function() {
		var self = this;
		var files = this.dialog_explorer.files;

		$('#g_nfo_btn_ok').keydown(function(e) {
			if (e.keyCode == 9) {
				$('#folder_new_dir_tree').find('.jstree-clicked').click();
			}
			e.preventDefault();
		});

		$(files).on('click', 'div.file_item', function() {
			self.filename = $(this).attr('filename');
			self.filetype = $(this).attr('filetype');
			self.filepath = $(this).attr('filepath');
		});
	},

	expand: function(tree_div, src) {
		var self = this;
		var nodes = src.split('/');

		var target_parent = '';
		var target_name = '';

		function get_node_by_path(node) {
			if (node.data.parent_label == target_parent && node.data.name == target_name) {
				return true;
			} else {
				return false;
			}
		}

		for (var i = 0; i < nodes.length; i++) {
			target_name = nodes[i];

			var target_node = self.dialog_explorer.treeview.getNodesBy(get_node_by_path);
			if (target_node) {
				target_node = target_node.pop();
				target_node.expand();
			}

			target_parent += nodes[i] + '/';
		}
	}
};
