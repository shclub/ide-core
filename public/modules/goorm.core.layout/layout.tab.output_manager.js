/**
 * Copyright Sung-tae Ryu, goormDev Team. All rights reserved.
 * Code licensed under the AGPL v3 License:
 * http://www.goorm.io/intro/License
 * email : contact@goorm.io
 *       : sungtae.ryu@goorm.io
 * project_name : goormIDE
 * version: 2.0.0
 **/

goorm.core.layout.tab.output_manager = {
	context: null,
	table: null,
	unloaded_data: [],

	

	load: function(context) {
		this.context = context;
		
		this.create();
	},

	create: function() {
		$('[id="' + this.context + '"]').addClass('output_tab user-select-available').html('<table cellpadding="0" cellspacing="0" border="0" class="display table table-hover table-condensed table-striped" id="' + this.context + '_table" ></table>');
		this.table = $('[id="' + this.context + '_table"]').dataTable({
			'aaData': [],
			'aoColumns': [{
				'mData': 'type',
				'sTitle': '<span localization_key="dictionary_type">' + core.module.localization.msg.dictionary_type + '</span>',
				'sWidth': '40px'
			}, {
				'mData': 'file',
				'sTitle': '<span localization_key="dictionary_file">' + core.module.localization.msg.dictionary_file + '</span>'
			}, {
				'mData': 'line',
				'sTitle': '<span localization_key="dictionary_line">' + core.module.localization.msg.dictionary_line + '</span>'
			}, {
				'mData': 'content',
				'sTitle': '<span localization_key="dictionary_content">' + core.module.localization.msg.dictionary_content + '</span>'
			}],
			'sDom': '<"H">Rrt',
			'paging': false,
			'iDisplayLength': -1,
			'oLanguage': {
				'sEmptyTable': '<span localization_key="output_tab_no_error">' + core.module.localization.msg.output_tab_no_error + '</span>'
			}
		});

		if (this.unloaded_data && Array.isArray(this.unloaded_data) && this.unloaded_data.length > 0) {
			this.push(this.unloaded_data);
		}
		//$('[id="' + this.context + '_table"]').dataTable().fnSettings().oLanguage.sEmptyTable = ;
		this.set_event();
	},

	set_event: function() {
		var self = this;

		if (this.context && this.table) {
			var is_dragging = false;

			$(document).on('click', '[id="' + this.context + '_table"] tbody td', function() {
				if (!is_dragging) {
					var aPos = self.table.fnGetPosition(this);
					var row = self.table.fnGetData(aPos[0]);

					var file = row.file.split('/');
					var line = row.line;
					line = parseInt(line, 10) - 1; // CodeMirror Start Line Number --> 0

					var filename = file.pop().trim();
					filename = filename.split(':')[0];
					var filepath = file.join('/') + '/';
					
					if (filename != '') {
						var w = core.module.layout.workspace.window_manager.get_window(filepath, filename);
						if (w) {
							w.activate();
							w.editor.editor.setCursor(line);
						} else {
							$(core).one(filepath + '/' + filename + '.window_loaded', function() {
								var __w = core.module.layout.workspace.window_manager.get_window(filepath, filename);
								__w.editor.editor.setCursor(line);
							});

							core.module.layout.workspace.window_manager.open(filepath, filename, filename.split('.').pop());
						}
					}
				} else {
					is_dragging = false;
				}
			});

			$(document).on('mousedown', '[id="' + this.context + '_table"] tbody td', function(e) {
				if (e.button == 2) {
					var parent = $(this).parent();
					var filepath = $(parent).children('td:nth-child(1)').text();
					var line = $(parent).children('td:nth-child(2)').text();
					var content = $(parent).children('td:nth-child(3)').text();

					
				} else if (e.button === 0) {
					is_dragging = false;
					$(document).on('mousemove.output', function() {
						is_dragging = true;
						$(document).unbind('mousemove.output');
					});
				}
			});
		}
	},

	parse: function(raw, type) {
		var data = [];
		var regex = null;

		if (type === 'cpp' || type === 'java') {
			data = [];
			regex = /(.*)\/([^:]*):(\d+):(\d+)?:?(.*)/; // jeongmin: add (.*) -> contents

			// Cut Build Fail
			//
			raw = raw.substring(0, raw.indexOf('Build Fail'));
			raw = raw.split('\n');
			// raw = raw.split(' ');

			var find_error = function(i, m) {
				if (/:(\d+):/.test(m)) {
					return true;
				} else {
					return false;
				}
			};

			var get_content = function(i, msg) { // msg: start of error contents
				// 1. extract only contents
				var m = msg.replace(/\s?\w* error: /, ''); // jeongraw[i]in: not only ' error: ', but also ' fatal error: '
				var before_add = m; // jeongmin: for reverting added string

				// 2. check any other error contents is there
				for (var j = i + 1; j < raw.length; j++) {
					if (find_error(j, raw[j])) { // jeongmin: next error -> Should be ended now
						break;
					} else if (raw[j].indexOf('^') > -1) { // jeongmin: error position -> No need to include to contents
						m = before_add; // jeongmin: before error position, there is error code. We don't need to include error code to contents. So revert contents.

						break;
					}

					before_add = m;
					m += ' ' + raw[j];
				}

				return m;
			};

			var shared = core.module.project.check_shared();
			var check_path = function(path) {
				var check = false;

				if (path) {
					if (shared && path === core.status.current_project_path) {
						check = true;
					} else if (!shared && path === core.status.current_project_name) {
						check = true;
					}
				}

				return check;
			};

			for (var i = 0; i < raw.length; i++) {
				if (find_error(i, raw[i])) {

					var match = raw[i].match(regex);
					//var content = match.pop()+": ";
					var filename = match[2];
					var line = match[3];
					var filepath = '';
					var temp_path = match[1].split('/');
					var is_path = false;
					var msg = match[5]; // jeongmin: start of error contents
					var error_type = match[5].split(':')[0].trim();

					for (var k = 0; k < temp_path.length; k++) {
						if (check_path(temp_path[k])) {
							is_path = true;
						}
						if (!temp_path[k] || !is_path) {
							continue;
						}
						if (temp_path[k] == filename) {
							return;
						}

						filepath += temp_path[k] + '/';
					}

					if (!shared) {
						filepath = filepath.replace(core.status.current_project_name, core.status.current_project_path);
					}

					var content = get_content(i, msg);

					data.push({
						'file': filepath + filename,
						'line': line,
						'content': content,
						'type': error_type
					});
				}
			}

			return data;
		} else if (type === '_net') {
			data = [];
			regex = /(.*)\/([^\(]*)\((\d+),(\d+)?\):?(.*)/; // jeongmin: add (.*) -> contents

			// Cut Build Fail
			//
			raw = raw.substring(0, raw.indexOf('Compilation failed'));
			raw = raw.split('\n');
			
			var find_error = function(i, m) {
				if (/(warning|error) CS(\d+):/.test(m)) {
					return true;
				} else {
					return false;
				}
			};

			var get_content = function(i, msg) { // msg: start of error contents
				// 1. extract only contents
				var m = msg.replace(/\s?[^:]*: /, '');
				var before_add = m; // jeongmin: for reverting added string

				// 2. check any other error contents is there
				for (var j = i + 1; j < raw.length; j++) {
					if (find_error(j, raw[j])) { // jeongmin: next error -> Should be ended now
						break;
					} else if (raw[j].indexOf('^') > -1) { // jeongmin: error position -> No need to include to contents
						m = before_add; // jeongmin: before error position, there is error code. We don't need to include error code to contents. So revert contents.

						break;
					}

					before_add = m;
					m += ' ' + raw[j];
				}

				return m;
			};

			var shared = core.module.project.check_shared();
			var check_path = function(path) {
				var check = false;

				if (path) {
					if (shared && path === core.status.current_project_path) {
						check = true;
					} else if (!shared && path === core.status.current_project_name) {
						check = true;
					}
				}

				return check;
			};

			for (var i = 0; i < raw.length; i++) {
				if (find_error(i, raw[i])) {
					var filename = '';
					var line = 0;
					var filepath = '';
					var temp_path = '';
					var is_path = false;
					var msg;
						
					var match = raw[i].match(regex);
					if (match) {
						filename = match[2];
						line = match[3];
						temp_path = match[1].split('/');
						msg = match[5]; // jeongmin: start of error contents
						error_type = match[5].split(':')[0].trim().split(' ')[0];
					} else { //compiler error
						var tmp = raw[i].split(':');
						msg = tmp[1].trim();
						error_type = tmp[0].trim().split(' ')[0];
					}

					for (var k = 0; k < temp_path.length; k++) {
						if (check_path(temp_path[k])) {
							is_path = true;
						}
						if (!temp_path[k] || !is_path) {
							continue;
						}
						if (temp_path[k] == filename) {
							return;
						}

						filepath += temp_path[k] + '/';
					}

					if (!shared) {
						filepath = filepath.replace(core.status.current_project_name, core.status.current_project_path);
					}

					var content = get_content(i, msg);

					data.push({
						'file': filepath + filename,
						'line': line,
						'content': content,
						'type': error_type
					});
				}
			}
			return data;
		} else {
			return data;
		}
	},

	push: function(data) {
		if (this.table) {
			var self = this;

			if (!Array.isArray(data)) {
				data = [data];
			}

			data.map(function(obj) {
				if (obj.type && obj.type.toLowerCase() === 'warning') {
					obj.type = '<span class="warn_color">Warning</span>';
					obj.content = '<i class="fa fa-exclamation-triangle fa-1 warn_color"></i> ' + obj.content;
					self.warn_count++;
				} else {
					obj.type = '<span class="err_color">Error</span>';
					obj.content = '<i class="fa fa-times-circle fa-1 err_color"></i> ' + obj.content;
					self.err_count++;
				}
			});

			this.table.fnAddData(data);
			this.unloaded_data = [];
		} else {
			this.unloaded_data = data;
		}
	},

	clear: function() {
		if (this.table) {
			this.table.fnClearTable();
		}
	}
};
