function dodoCoSignOut() {
  var xhr = new XMLHttpRequest();
  xhr.onload = () => { window.location.href = 'http://' + window.location.host; }
  xhr.open('POST', 'https://dodoco.mudev.cc/api/dev/account/signout');
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify({ signout: 'true' }));
}
