/**
 * sw.js
 *
 * @author bigggge(me@haoduoyu.cc)
 * 2018/4/11.
 */

console.log('sw.js start');

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

