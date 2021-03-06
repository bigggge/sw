## 先导技术

### 浏览器缓存

#### 强缓存

强缓存是利用Expires或者Cache-Control这两个http response header实现的，它们都用来表示资源在客户端缓存的有效期。


- 配置超长时间的本地缓存，节省带宽，提高性能
- 采用内容摘要作为缓存更新依据，精确的缓存控制
- 静态资源CDN部署，优化网络请求                        
- 非覆盖式发布  —— 平滑升级

#### 协商缓存

协商缓存是利用的是【Last-Modified，If-Modified-Since】和【ETag、If-None-Match】这两对Header来管理的。

### 应用缓存

为了在无网络下也能访问应用，HTML5 规范中设计了应用缓存（Application Cache）这么一个新的概念。通过它，我们可以做离线应用。然而，由于这个 API 的设计有太多的缺陷，被很多人吐槽，最终被废弃。

https://developer.mozilla.org/zh-CN/docs/Web/HTML/Using_the_application_cache

### CacheStorage 

用 JS 对缓存进行增删改查

### Web Workers

为了在进行高耗时 JS 运算时，UI 页面仍可用，那么就得另外开辟一个独立的 JS 线程来运行这些高耗时的 JS 代码，这就是 Web Workers。

Web Workers 采用的**消息传递模型**是一个很好的多线程编程模型，不仅简单易懂，同样也可以达到很高的性能。erlang/go 等也都是用类似的方式。

index.html

```html
<div style='width:100px;height:100px;background-color:red'></div>
<script>
  document.querySelector('div').onclick = function () {
    console.log('hello world');
  };

  var worker = new Worker('worker.js');
  worker.postMessage(40);
  worker.onmessage = function (event) {
    var data = event.data;
    console.log(data);
  };

  worker.onerror = function (event) {
    console.log(event.filename, event.lineno, event.message);
  };
</script>
```
worker.js

```javascript
self.onmessage = function (event) {
  var data = event.data;
  var ans = fibonacci(data);
  this.postMessage(ans);
};

function fibonacci (n) {
  return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);
}
```
## 注册 Service Worker

```javascript
// 判断 Service Worker 是否可用
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    // 注册 Service Worker
    navigator.serviceWorker.register('./sw.js', {scope: '/'})
      .then(function (registration) {
        if (registration.installing) {
          console.log('Service worker installing');
        } else if (registration.waiting) {
          console.log('Service worker installed');
        } else if (registration.active) {
          console.log('Service worker active');
        }
        console.log('注册成功');
      })
      .catch(function (err) {
        console.log('注册失败', err);
      });
  });
}
```


### 填充缓存

```javascript
// 监听 Service Worker 的 install 事件
this.addEventListener('install', function (event) {
  event.waitUntil(
    // 安装成功后操作 CacheStorage 缓存，使用之前需要先通过 caches.open() 打开对应缓存空间
    caches.open('my-test-cache-v3')
      .then(function (cache) {
        // 通过 cache 缓存对象的 addAll 方法添加 precache 缓存
        return cache.addAll([
          '/',
          '/index.html',
          '/picture.jpeg'
        ]);
      })
  );
});
```

### 自定义请求的响应

```javascript
this.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request)
      .then(function (response) {

        // 如果 Service Worker 有自己的返回，就直接返回，减少一次 http 请求
        if (response) {
          console.log(new Date(), 'fetch ', event.request.url, '有缓存，从缓存中取');
          return response;
        }

        console.log(new Date(), 'fetch ', event.request.url, '没有缓存，网络获取');
        // 如果 service worker 没有返回，那就直接请求远程服务
        var request = event.request.clone();
        return fetch(request).then(function (httpRes) {
          if (!httpRes || httpRes.status !== 200) {
            return httpRes;
          }
          // 请求成功则将请求缓存起来。
          var responseClone = httpRes.clone();
          caches.open('my-test-cache-v1').then(function (cache) {
            cache.put(event.request, responseClone);
          });

          return httpRes;
        });
      })
  );
});
```

### 更新 Service Worker

当安装发生的时候，前一个版本依然在响应请求，新的版本正在后台安装，我们调用了一个新的缓存 v2，所以前一个 v1 版本的缓存不会被扰乱。

当没有页面在使用当前的版本的时候，这个新的 service worker 就会激活并开始响应请求。

### 删除旧缓存

```javascript
this.addEventListener('activate', function (event) {
  var cacheWhitelist = ['v3'];

  // 删除旧缓存
  event.waitUntil(
    caches.keys().then(function (keyList) {
      return Promise.all(keyList.map(function (key) {
        if (cacheWhitelist.indexOf(key) === -1) {
          return caches.delete(key);
        }
      }));
    })
  );
});
```


### Service Worker 只是 Service Worker

Service Worker 只是一个常驻在浏览器中的 JS 线程，它本身做不了什么。它能做什么，全看跟哪些 API 搭配使用。

- 跟 Fetch 搭配，可以从浏览器层面拦截请求，做数据 mock
- 跟 Fetch 和 CacheStorage 搭配，可以做离线应用
- 跟 Push 和 Notification 搭配，可以做像 Native APP 那样的消息推送

假如把这些技术融合在一起，再加上 Manifest 等，就差不多成了 PWA 了。


### 接收推送消息

https://fed.renren.com/2017/10/08/service-worker-notification/

```javascript
this.addEventListener('push', function (event) {
  console.log(event);
  var title = '博客更新啦';
  var body = '点开看看吧';
  var icon = '/images/icon-192x192.png';
  var tag = 'simple-push-demo-notification-tag';
  var data = {
    url: location.origin
  };
  event.waitUntil(
    this.registration.showNotification(title, {
      body: body,
      icon: icon,
      tag: tag,
      data: data
    })
  );
});

this.addEventListener('notificationclick', function (event) {
  console.log('[Service Worker] Notification click Received.');

  let notification = event.notification;
  console.log(notification.data);
  notification.close();
  event.waitUntil(
    clients.openWindow(notification.data.url)
  );
});
```

