/**
 * app.js
 *
 * @author bigggge(me@haoduoyu.cc)
 * 2018/4/11.
 */

let swRegistration = null;
let isSubscribed = false;
const applicationServerPublicKey = 'BMUa61NxQjbEn0sO_3NTJmRaKOngcPAZBTDtMy8d7IeOXVCbIQ5zDBsVXeFHCY3-KK64r1nXdPQTdnWQkuMY0KI';

// 判断 Service Worker 是否可用
if ('serviceWorker' in navigator && 'PushManager' in window) {
  window.addEventListener('load', function () {
    // 注册 Service Worker
    navigator.serviceWorker.register('./sw.js', {scope: '/'})
      .then(function (registration) {
        swRegistration = registration;
        initializeUI();
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

function initializeUI () {
  // Set the initial subscription value
  swRegistration.pushManager.getSubscription()
    .then(function (subscription) {
      isSubscribed = !(subscription === null);

      if (isSubscribed) {
        console.log('User IS subscribed.');
      } else {
        console.log('User is NOT subscribed.');
      }

    });

  subscribeUser();
}

function subscribeUser () {
  const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
  swRegistration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey
  })
    .then(function (subscription) {
      console.log('User is subscribed');

      updateSubscriptionOnServer(subscription);

      isSubscribed = true;

      // updateBtn();
    })
    .catch(function (err) {
      console.log('Failed to subscribe the user: ', err);
      // updateBtn();
    });
}

function updateSubscriptionOnServer (subscription) {
  // TODO: Send subscription to application server

  const subscriptionJson = document.querySelector('.js-subscription-json');
  const subscriptionDetails =
    document.querySelector('.js-subscription-details');

  if (subscription) {
    subscriptionJson.textContent = JSON.stringify(subscription);
    subscriptionDetails.classList.remove('is-invisible');
  } else {
    subscriptionDetails.classList.add('is-invisible');
  }
}

function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

$.ajax('/getData').done(function (res) {
  res.data.forEach(item => {
    $('#list').append(`<li>${item}</li>`);
  });
});