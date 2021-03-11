document.addEventListener('DOMContentLoaded', function(event) {
  const btn = document.querySelector('button.get');
  btn.addEventListener('click', () => {
    document.querySelector('.get .status-code').innerText = 'loading...';
    document.querySelector('.get .headers').innerText = ''
     document.querySelector('.get .get-code').innerText = '';

    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/users');
    xhr.addEventListener('load', (res) => {
      const code = document.querySelector('.get .get-code');
      code.classList.remove('hidden');
      const data = JSON.parse(xhr.responseText);
      code.innerText = JSON.stringify(data, null, 4)
      document.querySelector('.get .status-code').innerText = xhr.status;
      document.querySelector('.get .headers').innerText = xhr.getAllResponseHeaders();
    });
    xhr.send();
  });
});
