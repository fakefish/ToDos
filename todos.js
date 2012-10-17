jQuery(function ($) {
	
	// 模型Todo定义，包括默认属性未完成和done和undone转变属性
	window.Todo = Backbone.Model.extend({
		defaults: {
			done: false
		},

		toggle: function () {
			this.save({done: !this.get("done")});
		}
	});
    // 创建Todo的列表模型
    // 模型原型为Todo，存储名为todos
    // 并添加过滤done的和未done的
	window.TodoList = Backbone.Collection.extend({
		model: Todo,
		localStorage: new Store("todos"),
		done: function () {
			// 过滤已经done了的
			return this.filter(function (todo) {
				return todo.get('done');
			});
		},

		remaining: function () {
			return this.without.apply(this, this.done());
		}
	});
	// 创建todo列表
	window.Todos = new TodoList;
	// 创建todo列表视图，模版为#item-template
	// 事件有切换状态，编辑，删除，回车键保存，关闭
	window.TodoView = Backbone.View.extend({
		tagName: "li",
		template:$("#item-template").template(),
		events: {
			// check类发生变化触发切换done和undone
			"change   .check"        : "toggleDone",
			// 双击li触发编辑
			"dblclick  .todo-content" : "edit",
			// 点击删除触发删除
			"click    .todo-destroy" : "destroy",
			// 键盘输入触发回车键保存
			"keypress .todo-input"   : "updateOnEnter",
			// 焦点离开触发关闭
			"blur     .todo-input"   : "close"
		},
		// 进行初始化
		initialize: function () {
			// 先绑定上下文（具体什么叫上下文至今还未明白TAT）
			_.bindAll(this, 'render', 'close', 'remove', 'edit');
			// 把change事件绑定到render函数，destroy事件同理
			this.model.bind('change', this.render);
			this.model.bind('destroy', this.remove);
		},
		// 把模版给予模型，创建UI
		render: function () {
			// 把之前缓存的this.template绑定到模型上，本来不清楚为什么要JSON化
			// 然后去JQ查了下tmpl的文档，后面一个参数是要JSON格式的
			var element = jQuery.tmpl(this.template, this.model.toJSON());
			$(this.el).html(element);
			// 并把input存入模型中
			this.input = this.$(".todo-input");
			return this;
		},
		// check类change触发的状态切换
		toggleDone: function () {
			this.model.toggle();
		},
		// 双击触发的编辑
		edit: function () {
			$(this.el).addClass("editing");
			this.input.focus();
		},
		// 焦点离开触发的关闭
		close: function () {
			// 先把input的值保存到模型中，并移除edit的UI
			this.model.save({content: this.input.val()});
			$(this.el).removeClass("editing");
		},
		// 用回车触发焦点离开，然后再触发关闭
		updateOnEnter: function (e) {
			if(e.keyCode == 13) e.target.blur();
		},
		// 移除（？貌似没用到）
		remove:function () {
			$(this.el).remove();
		},
		// 删除模型
		destroy: function () {
			this.model.destroy();
		}
	})
	// 这个视图是整体的视图（应该可以这么说）
	window.AppView = Backbone.View.extend({
		// DOM元素是整体
		el:$("#todoapp"),
		// 模型用的是stats-template
		statsTemplate: $("#stats-template").template(),
		// 事件
		events: {
			// 最上面的input输入触发回车键提交事件
			"keypress #new-todo"  : "createOnEnter",
			// 点击清除完成项目触发清除
			"click .todo-clear a" : "clearCompleted"
		},
		// 初始化
		initialize: function () {
			// 同样绑定上下文
			_.bindAll(this, 'addOne', 'addAll', 'render');
			// 缓存input
			this.input = this.$("#new-todo");
			// 绑定事件
			Todos.bind('add',     this.addOne);
			Todos.bind('refresh', this.addAll);
			Todos.bind('all',     this.render);
			// 取出模型？这个不知道
			Todos.fetch();
		},
		
		render: function () {
			// 缓存done的列表长度
			var done = Todos.done().length;
			// 
			var element = jQuery.tmpl(this.statsTemplate, {
				// 全部数量，其实没用到
				total:      Todos.length,
				// 已经完成数量
				done:       Todos.done().length,
				// 剩余未完成数量
				remaining:  Todos.remaining().length
			});
			// 应用模版，this指向window
			this.$('#todo-stats').html(element);
		},
		// 添加一个
		addOne: function (todo) {
			var view = new TodoView({model: todo});
			this.$("#todo-list").append(view.render().el);
		},
		// 添加全部
		addAll: function () {
			Todos.each(this.addOne);
		},
		// 输入框使用回车创建todo
		createOnEnter: function (e) {
			if(e.keyCode != 13) return;
			var value = this.input.val();
			if(!value) return;

			Todos.create({content: value});
			this.input.val('');
		},
		// 清除已经完成
		clearCompleted: function () {
			// 先查找所有满足条件的模型，然后删除
			_.each(Todos.done(), function (todo) {
				todo.destroy();
			})
			return false;
		}
	});
	// 新建视图
	window.App = new AppView;
});