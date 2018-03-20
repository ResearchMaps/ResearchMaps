var express = require('express')
	, http = require('http')
	, path = require('path')
	, cons = require('consolidate')
	, DBconfig = require('./config/DBconfig.json')
	, graphExperiment = require('./controllers/graphExperiment.js')
	, paper = require('./controllers/paper.js')
    , ArticleController = require('./controllers/article-controller.js')
	, neurolaxTerm = require('./controllers/NeurolaxTerm.js')
	, validate = require('./controllers/validate.js')
	, admin = require('./controllers/Admin.js')
	, fs = require('fs')
	, dust = require('dustjs-linkedin')
	, helpers = require('dustjs-helpers')
	, importData = require('./controllers/import.js')
	, captcha = require('captcha')
	, user = require('./controllers/User.js')
	, DB = require('./models/DBobject.js')
	, graphDB = DB.graphDB;


if (process.argv[2] === "import")
	importData.xlsxImport();
else if(process.argv[2] === "dump")
	graphDB.dumpToCSV();

var app = express();
app.engine('dust', cons.dust);

app.configure(function(){
	app.set('view engine', 'dust');
	app.set('views', __dirname + '/public/templates');
	app.use(express.favicon(__dirname + '/public/images/ResearchMapsLogo.ico'));
	app.use(express.logger('dev'));
	app.use(express.compress());
	app.use(express.static(__dirname + '/public', {redirect: false}));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser('your secret here'));
	app.use(express.session());
	app.use(captcha({ url: '/captcha.jpg', color:'#0064cd', background: 'rgb(20,30,200)' })); // captcha params
	app.use(app.router);
});
if(process.argv[2] === 'fix')
	admin.controller.fixBrokenPasswords();

var compileAndLoad = function(data,name){
	var compiled = dust.compile(data,name);
	dust.loadSource(compiled);
};

var readAndCompile = function(name){
	var data = fs.readFileSync("public/templates/" + name + ".dust","utf8");
	compileAndLoad(data,name);
};

var templates = fs.readdirSync('public/templates');

templates.forEach(function(file){
	console.log(file);
	if (file===".DS_Store"){
		return;
	}
	readAndCompile(file.split('.dust')[0]);
});

app.configure('development', function(){
	app.use(express.errorHandler());
});

app.get('/login',function(request,response){
	if(request.session.username)
		response.redirect('/map');
	else
		dust.render('login',{},function(err, html) {
			response.send(html);
		});
});

app.get('/deletePaper',validate.authorize,paper.controller.deletePaper);

app.post('/login',validate.authenticate);

app.get('/logout',validate.authorize,validate.logout);

app.get('/',
	function(request,response,next){
		if(request.session.username)
			next();
		else{
			dust.render('home',{},function(err,html){
				if(err)
					response.send(err);
				else
					response.send(html);
			});
		}

	},
	function(request,response){
		response.redirect('/map');
	}
);

app.get('/signup',function(request,response){
	dust.render('requestaccount',
		{
			hidden:"true",
			notLoggedIn:request.session.username?false:true
		},function(err,html){
		console.log(err);
		response.send(html);
	});
});

app.get('/help',validate.authorize,function(request,response){
	dust.render('help',{},function(err,html){
		console.log(err);
		response.send(html);
	});
});

app.get('/glossary',validate.authorize,function(request,response){
	dust.render('glossary',{},function(err,html){
		console.log(err);
		response.send(html);
	});
});

app.get('/about',function(request,response){
	dust.render('about',{},function(err,html){
		console.log(err);
		response.send(html);
	});
});

app.get('/howtomakemap',validate.authorize,function(request,response){
	dust.render('howtomakemap',{},function(err,html){
		console.log(err);
		response.send(html);
	});
});

app.get('/howtosearchmap',validate.authorize,function(request,response){
	dust.render('howtosearchmap',{},function(err,html){
		console.log(err);
		response.send(html);
	});
});

app.get('/newestfeatures',validate.authorize,function(request,response){
	dust.render('newestfeatures',{},function(err,html){
		console.log(err);
		response.send(html);
	});
});

//app.get('/videos',validate.authorize,function(request,response){
//	dust.render('videos',{},function(err,html){
//		console.log(err);
//		response.send(html);
//	});
//});

app.get('/contact',validate.authorize,function(request,response){
	dust.render('contact',{},function(err,html){
		console.log(err);
		response.send(html);
	});
});

app.post('/contact',validate.authorize,admin.controller.contact);

app.post('/signup', admin.controller.createUser);

app.get('/users',validate.authorizeEditor,admin.controller.getAllUsers);

app.patch('/user',validate.authorize,admin.controller.approveUser);

app.get('/forgotPassword',user.controller.forgotPassword);

app.get('/checkPassword',user.controller.checkPassword);

app.put('/updatePassword/:uuid',user.controller.updatePassword);

app.get('/update/:uuid',user.controller.fetchUpdateHTML);

app.put('/user',validate.authorize,user.controller.confirmAndUpdatePassword);

app.get('/test',graphExperiment.controller.getExperiments);

app.get('/paper/:uuid/experiment/all/new',validate.authorize,graphExperiment.controller.graphNew);

app.get('/paper/:uuid/experiment/all',validate.authorize,graphExperiment.controller.graph);

app.post('/paper/:uuid/experiment',validate.authorize,graphExperiment.controller.addExperiment.bind(graphExperiment.controller));

app.delete('/experiment/:uuid',validate.authorize,graphExperiment.controller.deleteExperiment);

app.put('/experiment/:uuid',validate.authorize,graphExperiment.controller.editExperiment);

app.post('/experiment/highlight',validate.authorize,graphExperiment.controller.highlightExperiment);

app.get('/myMap',validate.authorize,neurolaxTerm.controller.search);

app.get('/map',validate.authorize,neurolaxTerm.controller.map);

app.get('/neurolaxAutocomplete',validate.authorize,neurolaxTerm.controller.autocomplete);

app.get('/mapAutocomplete',validate.authorize,neurolaxTerm.controller.mapAutocomplete);

app.get('/myArticles',validate.authorize,paper.controller.getAllPapers);

app.post('/paper',validate.authorize,paper.controller.addPaper);

app.get('/autocomplete',validate.authorize,paper.controller.autocompletePubMed);

app.get('/article/private',validate.authorize,ArticleController.private);

app.get('/article/update',validate.authorize,ArticleController.update);

app.get('/article/delete',validate.authorize,ArticleController.delete);

app.get('/article',validate.authorize,paper.controller.autocomplete);

app.get('/pubSearch',validate.authorize,ArticleController.pubSearch)

var PORT = process.env.PORT || 8000;
http.createServer(app).listen(PORT);

console.log("Express server listening on port " + PORT);