$(document).ready(function(){

// LINK

var Link = Backbone.Model.extend({
});

var LinkView = Backbone.View.extend({

	events: {
		'click .close': 'delete',
		'click .hits': 'showHits'
	},

	template: _.template($('#link-template').html()),

	render: function(event){
		$(this.el).html(this.template(this.model.toJSON()));
		return this;
	},

	delete: function(event){
		var r = confirm("Are you sure you want to delete the link with shortId: " + this.model.attributes.shortlink_id + "?");
		if (r == true){
			$.ajax({
				type: "DELETE",
				url: "v1/shortlink/" + this.model.attributes.shortlink_id,
				success: function(response){
					if(response.error){
						$('#error').html(response.error);
						$('#error').show(0.5);
						$('#success').hide(0.5);
						$('#warning').hide(0.5);
					} else{
						$('#success').hide(0.5);
						$('#warning').hide(0.5);
						$('#error').hide(0.5);
						$('#deletedLink').html(response.result);
						$('#deleted').show(0.5);
						linkCollection.fetch({ success: function(){
							linkCollectionView = new LinkCollectionView({collection: linkCollection});
							$('#link-collection').html(linkCollectionView.render());
						}});
					}
				}
			});

  		}
	},

	showHits: function(event){
		var context = this;
		$.ajax({
			type: "GET",
			url: "v1/shortlink/" + this.model.attributes.shortlink_id + "/hits",
			success: function(data){
				var encodedUri = encodeURI("data:text/csv;charset=utf-8," + context.convertToCsv(data));
				var link = document.createElement("a");
				link.setAttribute("href", encodedUri);
				link.setAttribute("download", context.model.attributes.shortlink_id + ".csv");
				link.click();
			}
		})
	},

	convertToCsv: function(json){
		var array = json;
		var str = '';
		var line = '';

		for(var index in array[0]){
			line += index + ',';
		}

		line = line.slice(0, -1);
		str += line + '\r\n';

		for (var i = 0; i < array.length; i++){
			var line = '';
			for(var index in array[i]){
				line += array[i][index] + ',';
			}

			line = line.slice(0, -1);
			str += line + '\r\n';
		}
		return str;
	}
});

var LinkCollection = Backbone.Collection.extend({
	model: Link,

	url: "/v1/shortlink",

	parse: function(data){
		return data;
	}
});

var LinkCollectionView = Backbone.View.extend({
	initialize: function(){
		//this.collection.bind("reset", this.render, this);
		this.originalCollection = new LinkCollection(this.collection.models);
		urlFormView.shortIdArray = [];
		_.each(this.collection.models, function(model){
			urlFormView.shortIdArray.push(model.get('shortlink_id'));
		})
	},

	render: function(event){
		var fragment = document.createDocumentFragment();
		for(var i = 0; i < this.collection.models.length; i++){
			fragment.appendChild(new LinkView({model: this.collection.models[i]}).render().el);
		}
		return fragment;
	}
});

// URL FORM

var UrlForm = Backbone.Model.extend({

});

var UrlFormView = Backbone.View.extend({
	el: $('#url-form'),

	events: {
		'click #use-custom': 'toggleCustomURL',
		'click #clear': 'clearFields',
		'submit': 'submitURL',
		'keyup #custom-id': 'checkCustomId'
	},

	initialize: function(){
	},

	toggleCustomURL: function(event){
		if($(event.currentTarget).is(':checked')) {
			$('#custom-id-inputs').show();
		} else {
			$('#custom-id-inputs').hide();
		}
	},

	clearFields: function(event){
		$('#url-to-shorten').val('');
		$("#custom-id").val('');
		this.checkCustomId();
	},

	checkCustomId: function(event){
		var customId = $("#custom-id").val();
		if(customId == ''){
			$("#availability").text("Cannot be empty.")
			$("#availability").removeClass("text-success");
			$("#availability").addClass("text-danger");
		} else if(_.contains(this.shortIdArray, customId)){
			$("#availability").text("Unavailable.")
			$("#availability").removeClass("text-success");
			$("#availability").addClass("text-danger");
		} else {
			$("#availability").text("Available!");
			$("#availability").removeClass("text-danger");
			$("#availability").addClass("text-success");
		}
	},

	submitURL: function(event){
		var url = $('#url-to-shorten').val(); 
		var customId = $("#custom-id").val();
		var newLink = {};
		newLink.url = url;
		newLink.username = user;
		if($('#use-custom').is(':checked')) newLink.customId = customId;
		$.post("v1/shortlink", newLink, function(response){
				if(response.warning){
					$('#warning').html(response.warning);
					$('#warning').show(0.5);
				}
				if(response.error){
					$('#error').html(response.error);
					$('#error').show(0.5);
					$('#success').hide(0.5);
					$('#warning').hide(0.5);
				} else{
					if(!response.warning) $('#warning').hide(0.5);
					$('#error').hide(0.5);
					$('#newLink').html("<a target='_blank' href='" + response.result + "'>" + response.result + "</a>");
					$('#success').show(0.5);
					urlFormView.clearFields();
					linkCollection.fetch({ success: function(){
						linkCollectionView = new LinkCollectionView({collection: linkCollection});
						$('#link-collection').html(linkCollectionView.render());
					}});
				}
		});	
		return false;
	}
});

// SEARCH FORM

var SearchForm = Backbone.Model.extend({});

var SearchFormView = Backbone.View.extend({
	el: "#search-form",

	events: {
		"keyup #search-form-input" : "search",
		"click #search-form-select-options": "changeSearch",
		"click #search-form-sort-options": "changeSort"
	},

	initialize: function(){
		this.searchType = "url";
		this.sortType = "created_date";
	},

	search: function(event){
		var sortType = this.sortType;
		var query = $("#search-form-input").val();
		var filtered = _.filter(linkCollectionView.originalCollection.models, function(model){
			return model.get(this.searchType).indexOf(query) !== -1;
		}, this)
		linkCollectionView.collection.models = filtered;
		linkCollectionView.collection.comparator = function(link) {
			return -link.get(sortType);
		}
		linkCollectionView.collection.sort();
		$('#link-collection').html(linkCollectionView.render());
	},

	changeSearch: function(event){
		this.searchText = $(event.target).text();
		this.searchType = $(event.target).data("search");
		$("#search-form-select").html(this.searchText + " <span class='caret'>");
		this.search();

	},

	changeSort: function(event){
		this.sortType = $(event.target).data("sort");
		this.search();
	}
});

// INITIALIZE APP
	console.log(user);
	var urlFormView = new UrlFormView();
	if(!data){
		var linkCollection = new LinkCollection();
		$('#link-collection').text(message);
	} else {
		var linkCollection = new LinkCollection(data);
		var linkCollectionView = new LinkCollectionView({collection: linkCollection});
		$('#link-collection').html(linkCollectionView.render());
	}
		var searchFormView = new SearchFormView();
});
