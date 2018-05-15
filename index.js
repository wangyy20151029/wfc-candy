var express = require('express');
var app = express();
var path = require('path');
var bitcoin = require('bitcoin');
var StringBuffer = require("stringbuffer");
var redism=require("redis");
//var candytimeout =86400;
var candytimeout =3600;
var maxcandy=1;
var maxcandyVal=2;
var serport=8089;
var client = new bitcoin.Client({
  host: 'localhost',
  port: 9665,
  user: 'test',
  pass: 'admin',
  timeout: 30000
});
/*
app.get('/', function(req, res) {
  res.send('getcandy');
});*/
app.use(express.static(path.resolve(__dirname, './dist')))

app.get('/', function(req, res) {
    const html = fs.readFileSync(path.resolve(__dirname, './dist/index.html'), 'utf-8')
    res.send(html)
})

app.get('/getcandy/:addr', function(req, res){
res.header('Access-Control-Allow-Origin', '*');
res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');

var wfcaddr = req.params.addr
client.validateAddress(wfcaddr,function(err, txid, resHeaders) {
if (err) return console.log(err);
var randomNum = Math.random()*maxcandyVal;
console.log('randomNum:', randomNum);
var txval=randomNum.toFixed(2);
console.log('txval:', txval);
if(txid.isvalid) {
console.log('wfc 地址正确:', txid.isvalid);
//检测此地址今日有无打过wfc
var redis = redism.createClient(6379,'localhost',{});   
redis.get([wfcaddr],function(error,val){
        if(val==null){
           console.log('此地址未打过WFC');
           client.getBalance('*', 6, function(err, balance, resHeaders) {
                 if (err) return console.log(err);
                 console.log('Balance:', balance);
                 //检测余额
                 if(balance>=txval){
                      console.log('余额足够');
                      redis.llen("txs:"+wfcaddr,function(err,len){
                            console.log("txs:"+wfcaddr+"="+len);
                            if(len<maxcandy){
		              client.sendToAddress(wfcaddr,txval,function(err, txid, resHeaders) {
		                 if (err) return console.log(err);
		                    console.log('redis.rpush txid:', txid);
		                    redis.rpush("txs:"+wfcaddr, txid+"-"+txval,function(error){
		                         console.log("err="+error);
		                    });
		                    console.log('redis.set :',wfcaddr);
			            redis.set([wfcaddr,txval,'EX',candytimeout],function(error){
		                         console.log("err="+error);
		                         redis.quit();
		                    });
                                    res.send('ok:' + '糖果发送成功');
		              });
                            }else{
                               res.send('error:领取总次数超过:'+maxcandy);
                               console.log("领取总次数超过:"+maxcandy);
                               redis.quit();
                            }
                      });
                 }else{
                      res.send('error:' + '余额不足');
                      console.log('余额不足');
                      redis.quit();
                 }
           });
        }else{

           console.log('此地址存在于redis，超时时限内已经打过WFC');
	    redis.llen("txs:"+wfcaddr,function(err,len){  
		console.log("len="+len);
 		console.log("err="+err);
	      if(!err){
		var last=len-1;
		if(len!=0){
		  redis.lrange("txs:"+wfcaddr, 0, -1, function (error, items) {
                  var all=0.0;
		  items.forEach(function (item,index) {
                   var strs=item.split('-');
	  	   console.log(strs[0]);
                   console.log(strs[1]);
                   all+=parseFloat(strs[1]);
	   	  if(index==last){ console.log("all candy wfc="+all);   redis.quit();
                       res.send('error:' + '此地址本日内已经打过WFC,总共发送糖果：'+all);
                    }
		  });
		});
		}
	       }else{
                 redis.quit();
         	  res.send('error:' + '此地址存在于redis，超时时限内已经打过WFC');
               }  
	    });
        }
});
//console.log('end sendToAddress');
}else{
console.log('wfc 地址错误:', txid.isvalid);
res.send('error:' + '地址错误');
}
});
});

var server = app.listen(serport, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('listening at http://%s:%s', host, port);
});
