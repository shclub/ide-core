/**
 * Copyright Sung-tae Ryu, goormDev Team. All rights reserved.
 * Code licensed under the AGPL v3 License:
 * http://www.goorm.io/intro/License
 * email : contact@goorm.io
 *       : sungtae.ryu@goorm.io
 * project_name : goormIDE
 * version: 2.0.0
 **/

goorm.core.project.property.manager = {
	treeview: null,
	tabview: null,
	treeview_id: 'property_treeview',
	tabview_id: 'property_tabview',
	json: {},
	plugin_data: [],
	json_to_append: null, // current project's plugin node json
	is_init: false, // whether treeview is made or not

	convert_json_to_tree: function(parent, json) {
		var data = [];
		if (!$.isArray(json)) {
			json = [json];
		}
		json.map(function(obj) {
			// console.log(obj);
			if (!obj.id) {
				obj.id = obj.label;
			}
			var d = {};
			d.text = (obj.label !== '_NET')? obj.label : '.NET';
			d.id = parent + '/' + obj.id;
			d.type = 'file';
			d.parent = parent;
			d.icon = false;
			d.li_attr = {
				'id': obj.id,
				'path': d.id
			};
			d.a_attr = {
				'localization_key': obj.localization_key
			};
			data.push(d);
		});
		// console.log(data);
		return data;
	},

	append_data: function(parent, json) {
		var self = this;

		if (json.length) {
			this.json_to_append = json; // this will be used on fetch

			if (this.is_init && this.treeview) { // changing project
				this.treeview.tree.jstree('_append_json_data', parent, json);
			} else { // wait for loading treeview
				$(core).one('property_treeview_loaded', function() {
					self.treeview.tree.jstree('_append_json_data', parent, json);
				});
			}
		}
	},

	// create treeview structure
	create_treeview: function(json, change, _on_select) {
		var self = this;

		var on_select = function(e, node) {
			if (node.type === 'file' && !node.state.disabled) {
				var id = node.li_attr.id;
				var $tabview = $('#' + self.tabview_id);
				$tabview.find('.nav-tabs > li').hide();
				$tabview.find('.nav-tabs > li[target="' + id + '"]').show();
				$tabview.find('.nav-tabs > li[target="' + id + '"] > a').first().click();

				if (_on_select && typeof(_on_select) === 'function') {
					_on_select(node);
				}
			}
		};
		var project_root = [{
			text: json.core.label, // for localization
			state: {
				'opened': true
			},
			type: 'root',
			li_attr: {
				'path': 'Property',
				'folder_only': false
			},
			a_attr: {
				'localization_key': 'property'
			},
			parent: '#',
			icon: false,
			id: this.treeview_id + '/Property'
		}, {
			text: json.plugin.label,
			state: {
				'opened': true
			},
			type: 'root',
			li_attr: {
				'path': 'Plugin',
				'folder_only': false
			},
			a_attr: {
				'localization_key': 'plugin'
			},
			parent: '#',
			icon: false,
			id: this.treeview_id + '/Plugin'
		}];

		this.json.core = self.convert_json_to_tree('Property', json.core.child);
		// console.log(project_root);

		if (this.treeview) {
			this.treeview.destroy();
			this.treeview = null;
		}

		// Create treeview
		this.treeview = new goorm.core.utility.treeview('#' + this.treeview_id, {
			project_path: 'property',
			on_select: on_select,
			root_node: project_root,
			// wholerow: false,	// hidden: want to show wholerow
			sort: false,
			on_ready: function() {
				$(core).trigger(this.project_path + '_treeview_loaded');

				self.treeview.open_path('Property');
				self.treeview.open_path('Plugin');
			},
			fetch: function(path, callback) {
				if (path === 'Property') {
					// console.log(self.json.core);
					callback(self.json.core);
					// self.treeview.tree.jstree('redraw', true);
					// self.treeview.select_node('property_treeview/Property/System');
				} else if (path === 'Plugin') {
					if (self.is_init && self.json_to_append) { // property treeview is already made: append current project's plugin
						callback(self.json_to_append);
					} else { // property treeview isn't made yet: just append all plugins
						callback(self.plugin_data);
						self.is_init = true;
					}
				} else {
					callback(null);
				}
			}
		});
	},

	plugin: function() {
		this.plugin_name = null;
		this.xml = null;
		this.property = {};
	}
};
