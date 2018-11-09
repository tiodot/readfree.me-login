命令行登录[http://readfree.me](http://readfree.me), 领签到币的目的。;

# 使用
1. 安装命令行
```
npm i readfree-login
```

2. 初始化登录, 命令执行，然后按照提示输入用户名、密码和验证码
```
rflogin
```

3. 登录之后会将登录信息保存在本地`__dirname + 'cookie.txt'`文件中

4. 执行crontab -e进行编辑，crontab 的格式可以参考 crontab 定时任务。比如我的设置就是:
```
0 8 * * * rflogin
```

5. 一般是一个月会过期一次，如果过期了，请重新执行：
```
rflogin
```

示意图：
![login.png](login.png)