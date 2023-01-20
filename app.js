var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');


var adminRouter = require('./routes/admin');
var userRouter = require('./routes/user');

var hbs=require('express-handlebars');
var app = express();
var fileupload=require('express-fileupload');
var bodyParser=require('body-parser')
var multer=require('multer')
var upload=multer({dest:'./public/product-images'});
var db=require('./config/connection');
var session=require('express-session')

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs.engine({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout',partialsDir:__dirname+'/views/partials',runtimeOptions:{allowProtoMethodsByDefault:true,allowProtoPropertiesByDefault:true}}))

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended:true}));
app.use(cookieParser());
//app.use(upload.single('Image')); 
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileupload());
app.use(session({secret:'Key',cookie:{maxAge:600000}}))


// support parsing of application/json type post data
app.use(bodyParser.json());


//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({extended:true}));
db.connect((err)=>{
  if (err) {
    console.log("error"+err);
  }
  else{
    console.log("database conected");
  }
  })

app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
