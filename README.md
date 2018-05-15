1 安装forever
sudo npm install forever -g

2 安装redis
sudo apt-get install redis-server

3 编译安装wificoind启动并同步完区块链
  host: 'localhost',
  port: 9665,
  user: 'test',
  pass: 'admin',
  timeout: 30000
以下配置的json调用可以正常使用
如修改了主链的用户名和密码需修改index.js里相应的参数。

4 git clone https://github.com/wificoin-project/wfc-candy/

cd wfc-candy

5 npm update

6 npm run start


