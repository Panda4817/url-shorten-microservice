'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require("body-parser");
var dns = require('dns');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});

var shorturlSchema = new mongoose.Schema({
  main: String,
  short: Number,
});
var Shorturl = mongoose.model('Shorturl', shorturlSchema);

app.use(cors());

/** this project needs to parse POST bodies **/
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

// Function to get unique key
function uniqueKey() {
  return Math.floor(Math.random() * 1000)
}

app.post("/api/shorturl/new", function (req, res) {
  var url = req.body.url
  var regex = /^https?:\/\//;
  if (regex.test(url)) {
    var tempDnsUrl = url.slice(url.indexOf("//") + 2); 
    var slashIndex = tempDnsUrl.indexOf("/");
    var dnsUrl = slashIndex < 0 ? tempDnsUrl : tempDnsUrl.slice(0, slashIndex); 
    console.log("slashIndex: " + slashIndex);
    console.log("dnsUrl: " + dnsUrl);
    dns.lookup(dnsUrl, (err, address, family) => {
      if (err) {
        res.json({"error":"invalid URL"})
      } else {
        var data = Shorturl.findOne({main: url}).exec()
        data.then(function (doc) {
          console.log(doc)
          if (doc == null) {
            var n = uniqueKey()
            var shortenUrl = new Shorturl({main: url, short: n});
            shortenUrl.save();
            data = {main: url, short: n}
            console.log(data.main, data.short)
            res.json({"original_url":data.main,"short_url":data.short})
          } else {
            res.json({"original_url":doc.main,"short_url":doc.short})
          }
        })
        
      }
    });
  } else {
    res.json({"error":"invalid URL"})
  }
});

app.get("/api/shorturl/:short", function (req, res) {
  var num = parseInt(req.params.short)
  var su = Shorturl.findOne({short: num}).exec();
  su.then(function (doc) {
    console.log(doc)
    res.redirect(doc.main)
  });
})

app.listen(port, function () {
  console.log('Node.js listening ...');
});