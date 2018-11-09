#!/usr/bin/env node

const http = require("http");
const querystring = require("querystring");
const readline = require("readline");
const fs = require("fs");

// 获取登录表单字段已经验证相关信息
function getForm() {
  return new Promise((resolve, reject) => {
    http.get("http://readfree.me/accounts/login/?next=/", res => {
      let html = "";
      res.on("data", chunk => {
        html += chunk;
      });

      res.on("end", () => {
        resolve({ formData: parseHtml(html), cookie: parseCookie(res) });
        // console.log(html);
      });
    });
  });
}
// 提交表单进行登录
function submitForm(formData, cookie) {
  const postData = querystring.stringify(formData);
  const options = {
    hostname: "readfree.me",
    port: 80,
    path: "/accounts/login/?next=/",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(postData),
      Cookie: cookie
    }
  };
  const req = http.request(options, res => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    res.setEncoding("utf8");
    let body = '';
    res.on("data", chunk => {
      body += chunk;
    });
    res.on("end", () => {
      console.log("No more data in response.");
      if (!body) {
        saveCookie(res);
        console.log('登录成功')
      }
      else {
        console.log(body);
      }
    });
  });

  req.on("error", e => {
    console.error(`problem with request: ${e.message}`);
  });

  // write data to request body
  req.write(postData);
  req.end();
}

// 通过cookie方式登录
function login(cookie) {
  const options = {
    hostname: "readfree.me",
    port: 80,
    path: "/",
    method: "GET",
    headers: {
      Cookie: cookie
    }
  };
  const req = http.request(options, res => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    res.setEncoding("utf8");
    let html = '';
    res.on("data", chunk => {
      html += chunk;
    });
    res.on("end", () => {
      // console.log("No more data in response.");
      if (!html) {
        console.log('登录失败，token过期....');
        clearCookie();
      }
      else {
        console.log('登录成功');
      }
    });
  });
  req.end();
}

function getDataFromTerminal(rl, formData) {
  return function(query, key) {
    return new Promise((resolve, reject) => {
      rl.question(query, input => {
        formData[key] = input;
        resolve();
      });
    });
  };
}

function getPersonInfo() {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    const formData = {};
    const input = getDataFromTerminal(rl, formData);
    input("Email: ", "email")
      .then(() => {
        return input("Password: ", "password");
      })
      .then(() => {
        return input("Captcha: ", "captcha_1");
      })
      .then(() => {
        console.log(formData);
        rl.close();
        resolve(formData);
      });
  });
}

function parseHtml(html) {
  const imgRegex = /<img src="([\w\/]+)"/;
  let matched = html.match(imgRegex);
  if (matched) {
    const p = "http://readfree.me" + matched[1];
    console.log("验证码地址(如果没有自动打开浏览器，其手动复制到浏览器打开)：", p);
    var c = require("child_process");
    c.exec("open " + p);
  }
  const res = {};
  const captRegex = /name=["'](\w+)["'] value=["'](\w+)["']/g;
  while ((matched = captRegex.exec(html))) {
    res[matched[1]] = matched[2];
  }
  return res;
}

function parseCookie(res) {
  const cookies = res.headers["set-cookie"];
  return cookies
    .map(cookie => {
      return cookie.split(";")[0];
    })
    .join(";");
}

// 将cookie保存在本地
function saveCookie(res) {
  const cookies = res.headers["set-cookie"];
  let timeStr = "";
  const cookieStr = cookies
    .map(cookie => {
      const temp = cookie.split(";");
      timeStr = temp[1];
      return temp[0];
    })
    .join(";");
  fs.writeFileSync(__dirname + "/cookie.txt", cookieStr);
}

function clearCookie() {
  fs.writeFileSync(__dirname + "/cookie.txt", '');
}

function getLocalCookie() {
  const p = __dirname + "/cookie.txt";
  if (fs.existsSync(p)) {
    const cookie = fs.readFileSync(p);
    return cookie.toString();
  }
  return false;
}

// 主流程，首先重本地获取cookie，如果没有cookie就需要先登录
// 如果有cookie就会自动登录
const cookieStr = getLocalCookie();
if (cookieStr) {
  login(cookieStr);
}
else {
  getForm().then(data => {
    console.log(data);
    getPersonInfo().then(formData => {
      submitForm(Object.assign(formData, data.formData), data.cookie);
    });
  });
}