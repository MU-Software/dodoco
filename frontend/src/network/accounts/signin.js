// From https://stackoverflow.com/a/40031979
function buf2hex(buffer) { // buffer is an ArrayBuffer
  return [...new Uint8Array(buffer)]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
}

// Generate random safe string
function generateRandomSecureToken(bytes) {
  var randArray = new Uint32Array(bytes);
  window.crypto.getRandomValues(randArray);
  return buf2hex(randArray);
}

var accessToken = '';
var csrfToken = generateRandomSecureToken(32);

function formToJson(formID){
  var formElement = document.getElementById(formID),
      inputElements = formElement.getElementsByTagName("input"),
      textareaElements = formElement.getElementsByTagName("textarea"),
      jsonObject = {};
  for(var i = 0; i < inputElements.length; i++){
    var inputElement = inputElements[i];
    if (inputElement.type != "submit") {
      jsonObject[inputElement.name] = inputElement.value;
    }
  }
  for(var i = 0; i < textareaElements.length; i++){
    var textareaElement = textareaElements[i];
    jsonObject[textareaElement.name] = textareaElement.value;
  }
  return JSON.stringify(jsonObject);
}

function dodoCoSignin(formID, isAuth=true) {
  var formElement = document.getElementById(formID);
  var formData = formToJson(formID);

  var xhr = new XMLHttpRequest();
  xhr.onload = () => {
    var resultConsoleLog = ''
    if (Math.floor(xhr.status / 100) === 2 && JSON.parse(xhr.response).success === true) {
      resultConsoleLog = 'SUCCESS!';
      if (isAuth) {
        response = JSON.parse(xhr.response);
        accessToken = response.data.user.access_token.token;
      }
    } else {
      resultConsoleLog = 'FAILED!';
    }
    resultConsoleLog += ' CODE = ' + xhr.status.toString();
    resultConsoleLog += '\r\nRESULT_DATA = ' + xhr.response;
    console.log(resultConsoleLog);
    window.location.href = 'http://' + window.location.host;
  }
  xhr.open('POST', formElement.action);
  xhr.setRequestHeader('X-Csrf-Token', csrfToken);
  if (accessToken) {
      xhr.setRequestHeader('Authorization', accessToken);
  }
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(formData);
}
