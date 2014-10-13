/**
 * Copyright Sung-tae Ryu, goormDev Team. All rights reserved.
 * Code licensed under the AGPL v3 License:
 * http://www.goorm.io/intro/License
 * email : contact@goorm.io
 *       : sungtae.ryu@goorm.io
 * project_name : goormIDE
 * version: 2.0.0
 **/

goorm.core.project.property = {
	dialog: null,
	tabview: null,
	treeview: null,
	buttons: null,
	manager: null,
	property: null,
	property_default: null,
	plugin: null,
	firstShow: true,

	init: function() {
		var self = this;

		this.manager = goorm.core.project.property.manager;

		this.property = {};

		this.init_dialog();

		$(core).on("on_project_open", function() {
			self.firstShow = true;
			$('#property_treeview span').first().click(); // Init Project Propery...
			// var plugin_run = core.module.plugin_manager.plugins["goorm.plugin." + core.status.current_project_type].run;
			// goorm.core.project.clickRun = plugin_run ? plugin_run : function(){};
			self.load_property(core.status.current_project_path, function(contents) {
				if (core.property.type) {
					switch (core.property.type) {
						case 'python':
						case 'web':
						case 'nodejs':
						case 'php':
						case 'go':
						case 'ruby':
							$('[action="build_project"]').css('display', 'none');
							$('[action="build_clean"]').css('display', 'none');
							$('[action="help_about_private_url"]').show();
							break;
						case 'dev':
							$('[action="build_project"]').css('display', 'none');
							$('[action="build_clean"]').css('display', 'none');
							$('[action="help_about_private_url"]').hide();
							break;
						default:
							$('[action="build_project"]').css('display', '');
							$('[action="build_clean"]').css('display', '');
							$('[action="help_about_private_url"]').hide();
							break;
					}
				}

				self.property.plugins || (self.property.plugins = {});
				if (contents) {
					var plugin_name = contents.type.toLowerCase();
					var plugins = [];
					self.manager.plugin_data.map(function(plugin) {
						if (plugin.li_attr.id.toLowerCase() == plugin_name) {
							for (var name in core.preference.plugins) {
								if (self.property.plugins[name] === undefined && name.split(".").pop() == plugin_name) {
									self.property.plugins[name] = core.preference.plugins[name];
								}
							}
							plugins.push(plugin);
						} else {
							// hide plugin root
						}
					});
					self.manager.append_data(self.manager.treeview_id + "/Plugin", plugins);


					// var node = self.manager.treeview.getNodeByProperty("html", "<span localization_key='plugin'>Plugin</span>");
					// var last_node;

					// last_node && last_node.prev().removeClass("ygtvtn").addClass("ygtvln");

					self.fill_dialog(self.property);
					self.property_default = $.extend(true, {}, self.property);

					if (core.module.plugin_manager.plugins[plugin_name] && core.module.plugin_manager.plugins[plugin_name].compiler_list_up)
						core.module.plugin_manager.plugins[plugin_name].compiler_list_up($("#project_" + contents.type.toLowerCase() + "_tab").find("select[name='plugin." + contents.type.toLowerCase() + ".compiler_type']"));

					$(core).trigger("property_set_complete"); //jeongmin: when project is created with scm repository, prevent to checkout before project is created completely.

					// Check Project Property Option
					//
					// depreciated option - save and build --heeje
					// if (!contents.building_after_save_option) { // default: checked
					// 	$('#save_and_build_checker').css('visibility', 'hidden');
					// }
				}
			});

			//output tab empty fix
			if ($('#goorm_inner_layout_bottom>.tab-content .active').length <= 0) {
				$('#gLayoutTab_Debug').click();
			}

		});
	},

	show: function() {
		if (core.status.current_project_path !== "") {
			if (this.firstShow) {
				$("#property_tabview .nav > *").hide();
				$("#property_tabview .nav li").first().show()
				this.firstShow = false;
			}

			this.panel.modal('show');
		} else {
			var result = {
				result: false,
				code: 5
			};
			core.module.project.display_error_message(result, 'alert');
		}
	},

	refresh_toolbox: function() {

	},
	save_property: function(path, property, callback) {

		property.description = property.description.replace(/&(lt|gt);/g, function(strMatch, p1) {
			return (p1 == "lt") ? "<" : ">";
		});
		property.description = property.description.replace(/<\/?[^>]+(>|$)/g, "");

		core.socket.once("/project/set_property", function(data) {
			if (data.err_code === 0) {
				$.extend(true, core.workspace[path], property);
				callback && callback();
			} else {
				alert.show(data.message);
			}
		});

		core.socket.emit("/project/set_property", {
			project_path: path,
			data: JSON.stringify(property)
		});
	},

	// save current property(core.property) to goorm.manifest
	save: function(callback) {
		var path = core.status.current_project_path,
			property = core.property;

		this.save_property(path, property, callback);
	},

	apply: function() {
		if (core.property.type == 'dev') {
			var previous_property = $.extend(true, {}, core.property);
		}

		if (core.property.type == 'web') {
			if ($('#web_run_index').val() == "") {
				$('#web_run_index').val("index.html");
			}
		}

		this.read_dialog(core.property);

		if (core.property.type == 'dev') {
			if (core.property.plugins["goorm.plugin.dev"]['plugin.dev.plugin_name'] != previous_property.plugins["goorm.plugin.dev"]['plugin.dev.plugin_name'])
				$(core).trigger("on_property_confirmed", previous_property);
		}
	},

	restore_default: function() {
		this.fill_dialog(this.property_default);
	},

	read_dialog: function(property) {
		var target = "#property_tabview";

		var targets = $(target).children('div').children();

		var key = null;
		$.each(targets, function(index) {
			var target_index = $(targets[index]);

			if (target_index.attr('plugin') == 'null') {
				key = property;
			} else {
				key = property.plugins[target_index.attr('plugin')];

				if (key === undefined) return;
			}

			target_index.find("input").each(function() {
				if ($(this).attr("name") !== undefined) {
					

					var value;
					if ($(this).attr("type") == "checkbox") {
						value = $(this).prop("checked");
					} else if ($(this).attr("type") == "radio") {
						if ($(this).prop("checked") == true) {
							value = $(this).val();
						} else return;
					} else {
						value = $(this).val();
					}
					key[$(this).attr("name")] = value;
				}
			});

			target_index.find("textarea").each(function() {
				if ($(this).attr("name") !== undefined) {
					key[$(this).attr("name")] = $(this).val();
				}
			});

			target_index.find("select").each(function() {
				if ($(this).attr("name") !== undefined) {
					key[$(this).attr("name")] = $(this).children("option:selected").val();
				}
			});
		});
	},

	fill_dialog: function(property) {
		var target = "#property_tabview";

		var targets = $(target).children('div').children();

		var key = null;

		$.each(targets, function(index) {
			var target_index = $(targets[index]);

			var plugin_name = target_index.attr('plugin');
			if (target_index.attr('plugin') == 'null') {
				key = property;
			} else {
				key = property.plugins[plugin_name];
				if (key === undefined) return;
			}

			target_index.find("input").each(function() {
				if (key[$(this).attr("name")] !== undefined && key[$(this).attr("name")] !== null) {
					

					if ($(this).attr("type") == "checkbox") {
						if (key[$(this).attr("name")] == "true" || key[$(this).attr("name")] === true) {
							$(this).iCheck("check");
						} else {
							$(this).iCheck("uncheck");
						}

						$(this).iCheck("update");
					} else if ($(this).attr("type") == "radio") {
						if (key[$(this).attr("name")] == $(this).val())
						// $(this).prop("checked", true);
							$(this).iCheck("check"); //jeongmin: radio button is changed to iCheck
					} else {
						

						$(this).val(key[$(this).attr("name")]);
					}
				} else if ($(this).attr("type") == "text") { //jeongmin: if null property -> set blank (only text)
					$(this).val("");
				}
			});
			target_index.find("textarea").each(function() {
				if (key[$(this).attr("name")] !== undefined && key[$(this).attr("name")] !== null) {
					$(this).val(key[$(this).attr("name")]);
				}
			});
			target_index.find("select").each(function() {
				if (key[$(this).attr("name")] !== undefined && key[$(this).attr("name")] !== null) {
					$(this).children("option[value='" + key[$(this).attr("name")] + "']").attr("selected", "true");
					$(this).val(key[$(this).attr("name")]);
				}
			});
		});
	},

	load_property: function(path, callback) {
		var self = this;

		core.socket.once("/project/get_property", function(data) {
			if (data.err_code === 0) {
				////// get scm property //////
				// if (data.contents) {
				// 	////// finding this project information //////
				// 	core.socket.once('/scm/get', function(_data) {
				// 		////// set scm property //////
				// 		if (_data) { // only when this project has scm repository
				// 			data.contents.scm_URL = _data.URL,
				// 			data.contents.scm_auth = _data.auth,
				// 			data.contents.scm_id = _data.id,
				// 			data.contents.scm_path = _data.path,
				// 			data.contents.scm_pw = _data.pw,
				// 			data.contents.scm_type = _data.type
				// 		}

				// 		callback && callback(data.contents);
				// 	});
				// 	core.socket.emit('/scm/get', {
				// 		project_path: path,
				// 		author_id: data.contents.author
				// 	});
				// } else { // deletion of project
				self.property = data.contents || {};
				core.property = self.property;
				callback && callback(data.contents);
				// }
			} else {
				
				alert.show(data.message);
			}
		});

		core.socket.emit("/project/get_property", {
			project_path: path
		});
	},

	get_property: function(options) {
		var project_path = (options.project_path) ? options.project_path : core.status.current_project_path;
		var project_type = (options.project_type) ? options.project_type : core.status.current_project_type;
		var plugin = options.plugin || false;

		var data = null;

		if (core.workspace[project_path]) {
			data = core.workspace[project_path];

			if (plugin) {
				data = core.workspace[project_path].plugins['goorm.plugin.' + project_type]
			}
		}

		return data;
	},

	set_before: function() {
		var self = this;

		$("#property_tabview").find("input").each(function() {
			if (self.property[$(this).attr("name")] !== undefined && self.property[$(this).attr("name")] !== null) {
				if ($(this).attr("type") === "checkbox") {
					if (self.property[$(this).attr("name")].toString() === "true") {
						// $(this).prop("checked", true);
						$(this).iCheck("check");
					} else {
						// $(this).prop("checked", false);
						$(this).iCheck("uncheck");
					}
				} else {
					$(this).val(self.property[$(this).attr("name")]);
				}
			}
		});
		$("#property_tabview").find("textarea").each(function() {
			if (self.property[$(this).attr("name")] !== undefined && self.property[$(this).attr("name")] !== null) {
				$(this).val(self.property[$(this).attr("name")]);
			}
		});
		$("#property_tabview").find("select").each(function() {
			if (self.property[$(this).attr("name")] !== undefined && self.property[$(this).attr("name")] !== null) {
				$(this).children("option[value = " + self.property[$(this).attr("name")] + "]").attr("selected", "true");
				$(this).val(self.property[$(this).attr("name")]);
			}
		});
	},

	init_dialog: function() {
		var self = this;

		this.panel = $("#dlg_project_property");


		// Handler for OK button
		var handle_ok = function(panel) {
			self.apply();
			self.save(function() {
				core.module.layout.project_explorer.refresh();
			});

			self.panel.modal('hide');

			self.fill_dialog(core.property);
		};

		var handle_cancel = function() {
			self.set_before();

			self.panel.modal('hide');
		};

		var set_dialog_button = function() {
			// set Apply, restore_default Button
			$("#property_tabview").find(".apply").click(function() {
				self.apply();
			}).each(function(i) {
				$(this).attr("id", "property_applyBt_" + i);
			});

			$("#property_tabview").find(".restore_default").click(function() {
				self.restore_default();
			}).each(function(i) {
				$(this).attr("id", "property_restore_defaultBt_" + i);
			});
		};

		var load_plugin_tree = function() {
			var plugin_node = null,
				plugin_list = core.module.plugin_manager.list,
				plugin_count = plugin_list.length,
				tree_data = [];

			var get_plugin_data = function(plugin_name) {
				var json_string = external_json.plugins[plugin_name]['tree.json'];
				var json = null;
				if (json_string) {
					json = JSON.parse(json_string);
				}
				if (!json) {
					console.log(plugin_name, 'Project Plugin Load Fail');
				}
				if (json.property) {
					var data = self.manager.convert_json_to_tree("Plugin", json.property);
					return data;
				} else return [];
			};

			// load plugin tree.json
			$.each(core.module.plugin_manager.list, function(index, plugin) {
				var plugin_name = plugin.name;
				tree_data = $.merge(tree_data, get_plugin_data(plugin_name));
			});

			self.manager.plugin_data = tree_data;
			set_dialog_button();
		};

		this.dialog = new goorm.core.dialog();
		this.dialog.init({
			// localization_key: "title_project_property",
			id: "dlg_project_property",
			handle_ok: handle_ok,
			handle_cancel: handle_cancel,
			success: function() {
				var json = JSON.parse(external_json['public']['configs']['dialogs']['goorm.core.project']['tree.json']);

				// load plugin tree
				load_plugin_tree();

				// construct basic tree structure
				self.manager.create_treeview(json);
			}
		});


	}
};