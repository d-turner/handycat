// this module sets up the environment for HandyCAT
// the values that you must provide here depend upon which components you are using

var handyCATconfig = angular.module('config', []);

// the concordancer URL
var concordancerURL = 'http://127.0.0.1:8899/concordancer';
handyCATconfig.constant('concordancerURL', concordancerURL);

// the levenshtaligner URL
var levenshtalignerURL = 'http://127.0.0.1:5000/levenshtalign';
handyCATconfig.constant('levenshtalignerURL', levenshtalignerURL);

//'http://localhost:8899/concordancer?lang=en&query=this is a test'
//http://127.0.0.1:5000/levenshtalign/<str1>/<str2>'